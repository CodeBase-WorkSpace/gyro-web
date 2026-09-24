import assert from "node:assert/strict";
import test from "node:test";

import { recordVisibleCoachImpression } from "../lib/nutrition-coach/impressions";

test("visible Coach impressions use a same-origin request without refreshing the route", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let method = "";
  let keepalive = false;
  let body = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    method = init?.method ?? "";
    keepalive = init?.keepalive ?? false;
    body = String(init?.body ?? "");
    return new Response(null, { status: 204 }) as Response;
  };

  try {
    assert.equal(
      await recordVisibleCoachImpression("CALORIE_ADHERENCE"),
      true,
    );
    assert.equal(requestedUrl, "/api/coach/impressions");
    assert.equal(method, "POST");
    assert.equal(keepalive, true);
    assert.deepEqual(JSON.parse(body), {
      impressionId: "CALORIE_ADHERENCE",
    });
  } finally {
    global.fetch = originalFetch;
  }
});
