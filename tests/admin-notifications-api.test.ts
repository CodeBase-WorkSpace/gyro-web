import assert from "node:assert/strict";
import test from "node:test";

import {sendAdminAnnouncement} from "../lib/api/admin-notifications";

process.env.API_BASE_URL ??= "http://localhost:8080/api/v1";
const originalFetch = global.fetch;

test("admin announcement can target one selected user with custom content", async () => {
  const calls: Array<{url: string; init?: RequestInit}> = [];
  global.fetch = (async (url, init) => {
    calls.push({url: String(url), init});
    return new Response(JSON.stringify({
      announcementId: "44dd87ba-23c3-4f77-a694-25f915d1eca1",
      recipientsTargeted: 1,
      intentsCreated: 1,
      intentsExisting: 0,
      failures: 0,
      telegramQueued: false,
      telegramAlreadyQueued: false,
    }), {status: 200});
  }) as typeof fetch;

  try {
    await sendAdminAnnouncement("token", {
      announcementId: "44dd87ba-23c3-4f77-a694-25f915d1eca1",
      title: "عنوان دلخواه",
      body: "متن دلخواه",
      targets: {webPush: true, telegramChannel: false},
      recipientUserId: "20b3ca16-d147-4921-a4f1-b35ea698a190",
    });

    assert.match(calls[0].url, /\/admin\/notifications\/announcements$/);
    assert.equal(calls[0].init?.method, "POST");
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
      announcementId: "44dd87ba-23c3-4f77-a694-25f915d1eca1",
      title: "عنوان دلخواه",
      body: "متن دلخواه",
      targets: {webPush: true, telegramChannel: false},
      recipientUserId: "20b3ca16-d147-4921-a4f1-b35ea698a190",
    });
    assert.equal(new Headers(calls[0].init?.headers).get("Authorization"), "Bearer token");
  } finally {
    global.fetch = originalFetch;
  }
});
