const STARTUP_RECOVERY_CACHE = "gyro-startup-recovery-v1";
const STARTUP_RECOVERY_PAGE = "/pwa-recovery.html";
const RUNTIME_CACHE_VERSION = "gyro-runtime-v1";
const STATIC_CACHE = `${RUNTIME_CACHE_VERSION}-static`;
const PUBLIC_PAGE_CACHE = `${RUNTIME_CACHE_VERSION}-public-pages`;
const PUBLIC_PAGE_CACHE_LIMIT = 30;
const NAVIGATION_TIMEOUT_MS = 15_000;
const PUBLIC_PAGE_PATHS = new Set([
    "/",
    "/contact",
    "/privacy",
    "/terms",
    "/fa",
    "/fa/app",
    "/fa/app/calorie-counter",
    "/fa/app/calorie-counter-iphone",
    "/fa/app/food-diary",
    "/fa/app/macro-tracker",
    "/fa/app/persian-calorie-counter",
    "/fa/guides",
    "/fa/guides/calorie-deficit",
    "/fa/guides/how-to-count-calories",
    "/fa/guides/track-persian-foods",
    "/fa/guides/what-are-macros",
    "/fa/guides/what-is-bmr",
    "/fa/tools",
    "/fa/tools/bmr-calculator",
    "/fa/tools/calorie-calculator",
    "/fa/tools/macro-calculator",
    "/fa/tools/tdee-calculator",
]);

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(STARTUP_RECOVERY_CACHE)
            .then((cache) => cache.add(STARTUP_RECOVERY_PAGE))
    );
});

self.addEventListener("message", (event) => {
    if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
    if (event.data === "gyro:clear-page-cache") {
        event.waitUntil(caches.delete(PUBLIC_PAGE_CACHE));
    }
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => Promise.all(
                cacheNames
                    .filter((cacheName) => (
                        cacheName.startsWith("gyro-startup-recovery-") && cacheName !== STARTUP_RECOVERY_CACHE
                    ) || (
                        cacheName.startsWith("gyro-runtime-") && !cacheName.startsWith(RUNTIME_CACHE_VERSION)
                    ))
                    .map((cacheName) => caches.delete(cacheName)),
            ))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    if (event.request.mode === "navigate") {
        if (url.pathname === "/logout") {
            event.waitUntil(caches.delete(PUBLIC_PAGE_CACHE));
        }
        event.respondWith(loadNavigation(event.request));
        return;
    }

    if (isImmutableAsset(url.pathname)) {
        event.respondWith(cacheFirst(event.request));
    }
});

self.addEventListener("push", (event) => {
    let payload = {title: "جیرو", body: "یک یادآوری جدید داری.", url: "/dashboard", tag: undefined};
    try {
        const parsed = event.data ? JSON.parse(event.data.text()) : undefined;
        if (parsed && typeof parsed === "object") payload = {...payload, ...parsed};
    } catch {
        // Malformed provider payloads must still produce a user-visible notification.
    }
    const url = allowlistedUrl(payload.url);
    const options = {
        body: typeof payload.body === "string" ? payload.body : "یک یادآوری جدید داری.",
        tag: typeof payload.tag === "string" ? payload.tag : undefined,
        icon: "/icons/pwa/icon-192.png",
        badge: "/icons/pwa/icon-192.png",
        data: {url},
    };
    event.waitUntil(self.registration.showNotification(
        typeof payload.title === "string" ? payload.title : "جیرو",
        options,
    ).catch(() => self.registration.showNotification(
        typeof payload.title === "string" ? payload.title : "جیرو",
        {body: options.body, data: {url}},
    )));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const target = new URL(allowlistedUrl(event.notification.data?.url), self.location.origin).href;
    event.waitUntil((async () => {
        const windows = await clients.matchAll({type: "window", includeUncontrolled: true});
        const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
        if (existing) {
            if (existing.url !== target) await existing.navigate(target);
            return existing.focus();
        }
        return clients.openWindow(target);
    })());
});

async function loadNavigation(request) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NAVIGATION_TIMEOUT_MS);

    try {
        const response = await fetch(request, {signal: controller.signal});
        const url = new URL(request.url);
        if (isPublicPage(url.pathname) && canCachePage(response)) {
            const cache = await caches.open(PUBLIC_PAGE_CACHE);
            await cache.put(request, response.clone());
            await trimCache(cache, PUBLIC_PAGE_CACHE_LIMIT);
        }
        return response;
    } catch {
        const url = new URL(request.url);
        if (isPublicPage(url.pathname)) {
            const cache = await caches.open(PUBLIC_PAGE_CACHE);
            const cached = await cache.match(request);
            if (cached) return cached;
        }
        return await recoveryPage();
    } finally {
        clearTimeout(timeout);
    }
}

async function cacheFirst(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
}

function isImmutableAsset(pathname) {
    return pathname.startsWith("/_next/static/") || pathname.startsWith("/fonts/");
}

function isPublicPage(pathname) {
    return PUBLIC_PAGE_PATHS.has(pathname);
}

function canCachePage(response) {
    if (!response.ok || response.type === "opaque") return false;
    const cacheControl = response.headers.get("Cache-Control")?.toLowerCase() ?? "";
    return !cacheControl.includes("no-store") && !cacheControl.includes("private");
}

async function trimCache(cache, limit) {
    const keys = await cache.keys();
    await Promise.all(keys.slice(0, Math.max(0, keys.length - limit)).map((key) => cache.delete(key)));
}

function allowlistedUrl(value) {
    if (typeof value !== "string" || !value.startsWith("/")) return "/dashboard";
    const path = value.split("?", 1)[0];
    if (path === "/dashboard" || path === "/profile/notifications" || path === "/diary") return value;
    return "/dashboard";
}

async function recoveryPage() {
    const cache = await caches.open(STARTUP_RECOVERY_CACHE);
    return (await cache.match(STARTUP_RECOVERY_PAGE))
        ?? new Response("The app could not be loaded. Please try again.", {status: 503});
}
