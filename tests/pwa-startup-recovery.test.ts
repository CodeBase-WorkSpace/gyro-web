import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const serviceWorkerSource = readFileSync(path.resolve(process.cwd(), "public/sw.js"), "utf8");
const recoveryPage = readFileSync(path.resolve(process.cwd(), "public/pwa-recovery.html"), "utf8");
const pushBrowserSource = readFileSync(path.resolve(process.cwd(), "lib/push-browser.ts"), "utf8");
const registrationSource = readFileSync(path.resolve(process.cwd(), "components/pwa/service-worker-registration.tsx"), "utf8");

type Listener = (event: {data?: unknown; request?: Request; respondWith?: (response: Promise<Response>) => void; waitUntil?: (work: Promise<unknown>) => void}) => void;

function loadWorker(fetchImplementation: typeof fetch) {
  const listeners = new Map<string, Listener>();
  const cacheEntries = new Map<string, Map<string, Response>>();
  const deletedCaches: string[] = [];
  const cacheKey = (request: Request | string) => typeof request === "string" ? request : request.url;
  const caches = {
    open: async (name: string) => {
      const entries = cacheEntries.get(name) ?? new Map<string, Response>();
      cacheEntries.set(name, entries);
      return {
        add: async (url: string) => entries.set(url, new Response("recovery")),
        put: async (request: Request | string, response: Response) => entries.set(cacheKey(request), response),
        match: async (request: Request | string) => entries.get(cacheKey(request)),
        keys: async () => [...entries.keys()].map((url) => new Request(url.startsWith("http") ? url : `https://app.gyro.test${url}`)),
        delete: async (request: Request | string) => entries.delete(cacheKey(request)),
      };
    },
    keys: async () => [
      "gyro-startup-recovery-v0",
      "gyro-startup-recovery-v1",
      "gyro-runtime-v0-public-pages",
      "gyro-runtime-v1-static",
      "unrelated-cache",
    ],
    delete: async (name: string) => {
      deletedCaches.push(name);
      cacheEntries.delete(name);
      return true;
    },
  };
  const self = {
    addEventListener: (name: string, listener: Listener) => listeners.set(name, listener),
    skipWaiting: async () => undefined,
    clients: {claim: async () => undefined},
    location: {origin: "https://app.gyro.test"},
  };
  vm.runInNewContext(serviceWorkerSource, {
    AbortController,
    Promise,
    Response,
    Request,
    URL,
    caches,
    clearTimeout,
    fetch: fetchImplementation,
    self,
    setTimeout,
  });

  return {cacheEntries, deletedCaches, listeners};
}

async function install(worker: ReturnType<typeof loadWorker>) {
  let work: Promise<unknown> | undefined;
  worker.listeners.get("install")?.({waitUntil: (pending) => { work = pending; }});
  await work;
}

async function navigationResponse(worker: ReturnType<typeof loadWorker>, pathname = "/dashboard") {
  let response: Promise<Response> | undefined;
  let work: Promise<unknown> | undefined;
  worker.listeners.get("fetch")?.({
    request: {
      method: "GET",
      mode: "navigate",
      url: `https://app.gyro.test${pathname}`,
    } as Request,
    respondWith: (pending) => { response = pending; },
    waitUntil: (pending) => { work = pending; },
  });
  await work;
  return response;
}

test("service worker caches only the startup recovery page during installation", async () => {
  const worker = loadWorker(async () => new Response("online"));

  await install(worker);

  const entries = worker.cacheEntries.get("gyro-startup-recovery-v1");
  assert.equal((await entries?.get("/pwa-recovery.html")?.text()), "recovery");
  assert.equal(entries?.size, 1);
  assert.equal(worker.cacheEntries.size, 1);
});

test("service worker waits for an explicit update action before replacing an active worker", () => {
  assert.doesNotMatch(serviceWorkerSource, /\.then\(\(\) => self\.skipWaiting\(\)\)/);
  assert.match(serviceWorkerSource, /self\.addEventListener\("message"/);
  assert.match(serviceWorkerSource, /event\.data\?\.type === "SKIP_WAITING"/);
});

test("development removes stale Gyro service workers and caches before reloading", () => {
  assert.match(registrationSource, /process\.env\.NODE_ENV !== "production"/);
  assert.match(registrationSource, /removeDevelopmentServiceWorkers/);
  assert.match(registrationSource, /navigator\.serviceWorker\.getRegistrations\(\)/);
  assert.match(registrationSource, /registration\.unregister\(\)/);
  assert.match(registrationSource, /GYRO_CACHE_PREFIXES/);
  assert.match(registrationSource, /window\.location\.reload\(\)/);
});

test("the app activates a waiting worker only after an explicit update action", () => {
  assert.match(registrationSource, /registration\.waiting/);
  assert.match(registrationSource, /waitingWorker\.postMessage\(\{type: "SKIP_WAITING"\}\)/);
  assert.match(registrationSource, /serviceWorker\.addEventListener\("controllerchange"/);
  assert.match(registrationSource, /shouldReloadAfterActivation\.current = true/);
});

test("service worker passes successful navigations through the network", async () => {
  const online = new Response("online", {status: 200});
  const worker = loadWorker(async () => online);

  const response = await navigationResponse(worker);

  assert.equal(response, online);
});

test("service worker falls back to the cached recovery page when navigation fails", async () => {
  const worker = loadWorker(async () => { throw new Error("network unavailable"); });
  await install(worker);

  const response = await navigationResponse(worker);

  assert.equal(await response?.text(), "recovery");
});

test("service worker caches only allowlisted public pages for offline navigation", async () => {
  const worker = loadWorker(async () => new Response("public page", {status: 200}));

  await navigationResponse(worker, "/privacy");
  const publicCache = worker.cacheEntries.get("gyro-runtime-v1-public-pages");

  assert.equal(await publicCache?.get("https://app.gyro.test/privacy")?.text(), "public page");
});

test("service worker never stores authenticated pages", async () => {
  const worker = loadWorker(async () => new Response("private page", {status: 200}));

  await navigationResponse(worker, "/dashboard");

  assert.equal(worker.cacheEntries.get("gyro-runtime-v1-public-pages"), undefined);
});

test("service worker does not cache future protected-looking Persian routes", async () => {
  const worker = loadWorker(async () => new Response("localized profile", {status: 200}));

  await navigationResponse(worker, "/fa/profile");

  assert.equal(worker.cacheEntries.get("gyro-runtime-v1-public-pages"), undefined);
});

test("service worker clears the public page cache when logout is requested", async () => {
  const worker = loadWorker(async () => new Response("online", {status: 200}));
  await navigationResponse(worker, "/privacy");
  assert.ok(worker.cacheEntries.has("gyro-runtime-v1-public-pages"));

  await navigationResponse(worker, "/logout");

  assert.equal(worker.cacheEntries.has("gyro-runtime-v1-public-pages"), false);
  assert.ok(worker.deletedCaches.includes("gyro-runtime-v1-public-pages"));
});

test("service worker serves a cached public page when its network request fails", async () => {
  let online = true;
  const worker = loadWorker(async () => {
    if (!online) throw new Error("network unavailable");
    return new Response("cached privacy page", {status: 200});
  });
  await navigationResponse(worker, "/privacy");
  online = false;

  const response = await navigationResponse(worker, "/privacy");

  assert.equal(await response?.text(), "cached privacy page");
});

test("service worker respects private and no-store response directives", async () => {
  for (const cacheControl of ["private", "no-store"]) {
    const worker = loadWorker(async () => new Response("sensitive", {
      status: 200,
      headers: {"Cache-Control": cacheControl},
    }));

    await navigationResponse(worker, "/privacy");

    assert.equal(worker.cacheEntries.get("gyro-runtime-v1-public-pages"), undefined);
  }
});

test("service worker removes only older Gyro cache versions on activation", async () => {
  const worker = loadWorker(async () => new Response("online"));
  let work: Promise<unknown> | undefined;
  worker.listeners.get("activate")?.({waitUntil: (pending) => { work = pending; }});
  await work;

  assert.deepEqual(worker.deletedCaches, ["gyro-startup-recovery-v0", "gyro-runtime-v0-public-pages"]);
});

test("recovery page uses bounded retries before revealing manual retry", () => {
  assert.match(recoveryPage, /const delays = \[1500, 3000, 6000\]/);
  assert.match(recoveryPage, /previousAttempts < delays\.length/);
  assert.match(recoveryPage, /retryButton\.style\.display = "block"/);
});

test("startup worker also owns push events so notification setup cannot replace it", () => {
  assert.match(serviceWorkerSource, /self\.addEventListener\("push"/);
  assert.match(serviceWorkerSource, /self\.addEventListener\("notificationclick"/);
  assert.match(pushBrowserSource, /register\("\/sw\.js"/);
  assert.match(pushBrowserSource, /subscription\.options\.applicationServerKey/);
  assert.match(pushBrowserSource, /applicationServerKeysMatch/);
  assert.doesNotMatch(pushBrowserSource, /notification-sw\.js/);
});
