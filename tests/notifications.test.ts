import test from "node:test";
import assert from "node:assert/strict";

import {confirmTelegramLink, createTelegramLink, getNotificationPreferences, getTelegramStatus, getWebPushStatus, sendTelegramTest, unlinkTelegram, unsubscribeAllWebPushDevices, unsubscribeFromWebPush, updateNotificationPreferences} from "../lib/api/notifications";

process.env.API_BASE_URL ??= "http://localhost:8080/api/v1";
const originalFetch = global.fetch;

test("notification preferences use the authenticated preferences endpoints", async () => {
  const calls: Array<{url: string; init?: RequestInit}> = [];
  global.fetch = (async (url, init) => {
    calls.push({url: String(url), init});
    return new Response(JSON.stringify({timezone: "Asia/Tehran", quietHoursStart: "22:00", quietHoursEnd: "08:00", categories: [], eligibility: {emailEligible: false, smsEligible: false}}), {status: 200});
  }) as typeof fetch;

  try {
    await getNotificationPreferences("token");
    await updateNotificationPreferences("token", {quietHoursStart: "22:00", quietHoursEnd: "08:00", categories: [{category: "OPTIONAL_BILLING", enabled: false}]});

    assert.match(calls[0].url, /\/notifications\/preferences$/);
    assert.equal(calls[0].init?.method, "GET");
    assert.equal(calls[1].init?.method, "PUT");
    assert.equal(calls[1].init?.headers && new Headers(calls[1].init.headers).get("Authorization"), "Bearer token");
  } finally {
    global.fetch = originalFetch;
  }
});

test("current browser Push status sends the endpoint in a protected request body", async () => {
  const calls: Array<{url: string; init?: RequestInit}> = [];
  global.fetch = (async (url, init) => {
    calls.push({url: String(url), init});
    return new Response(JSON.stringify({enabled: true, publicKeyAvailable: true, hasActiveSubscription: true, activeSubscriptionCount: 2}), {status: 200});
  }) as typeof fetch;

  try {
    await getWebPushStatus("token", "https://push.example.test/current");

    assert.match(calls[0].url, /\/notifications\/push-subscriptions\/status\/current$/);
    assert.equal(calls[0].init?.method, "POST");
    assert.equal(calls[0].init?.body, JSON.stringify({endpoint: "https://push.example.test/current"}));
  } finally {
    global.fetch = originalFetch;
  }
});

test("Push disable scopes the default operation to the current browser endpoint", async () => {
  const calls: Array<{url: string; init?: RequestInit}> = [];
  global.fetch = (async (url, init) => {
    calls.push({url: String(url), init});
    return new Response(null, {status: 204});
  }) as typeof fetch;

  try {
    await unsubscribeFromWebPush("token", "https://push.example.test/current");
    await unsubscribeAllWebPushDevices("token");

    assert.match(calls[0].url, /\/notifications\/push-subscriptions\/revoke$/);
    assert.equal(calls[0].init?.method, "POST");
    assert.equal(calls[0].init?.body, JSON.stringify({endpoint: "https://push.example.test/current"}));
    assert.match(calls[1].url, /\/notifications\/push-subscriptions\/all$/);
    assert.equal(calls[1].init?.method, "DELETE");
  } finally {
    global.fetch = originalFetch;
  }
});

test("Telegram linking uses authenticated link status test and unlink endpoints", async () => {
  const calls: Array<{url: string; init?: RequestInit}> = [];
  global.fetch = (async (url, init) => {
    calls.push({url: String(url), init});
    if (String(url).endsWith("/status")) return new Response(JSON.stringify({enabled: true, state: "UNLINKED", linkedAt: null, pendingUntil: null}), {status: 200});
    if (init?.method === "DELETE") return new Response(null, {status: 204});
    if (String(url).endsWith("/link")) return new Response(JSON.stringify({url: "https://t.me/gyro_bot?start=link"}), {status: 200});
    if (String(url).endsWith("/link/confirm")) return new Response(JSON.stringify({state: "LINKED"}), {status: 200});
    return new Response(JSON.stringify({intentId: "intent-id", created: true}), {status: 202});
  }) as typeof fetch;

  try {
    await getTelegramStatus("token");
    await createTelegramLink("token");
    await confirmTelegramLink("token", "ABCD-EFGH");
    await sendTelegramTest("token");
    await unlinkTelegram("token");

    assert.deepEqual(calls.map(({url, init}) => [new URL(url).pathname, init?.method]), [
      ["/api/v1/notifications/telegram/status", "GET"],
      ["/api/v1/notifications/telegram/link", "POST"],
      ["/api/v1/notifications/telegram/link/confirm", "POST"],
      ["/api/v1/notifications/telegram/test", "POST"],
      ["/api/v1/notifications/telegram/link", "DELETE"],
    ]);
    assert.equal(calls[2].init?.body, JSON.stringify({code: "ABCD-EFGH"}));
    assert(calls.every(({init}) => new Headers(init?.headers).get("Authorization") === "Bearer token"));
  } finally {
    global.fetch = originalFetch;
  }
});
