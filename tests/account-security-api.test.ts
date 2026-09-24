import assert from "node:assert/strict";
import test from "node:test";

import {
  changePassword,
  confirmSecurityStepUp,
  removePassword,
  setPassword,
  startSecurityStepUp,
} from "../lib/auth/api";

process.env.API_BASE_URL ??= "http://localhost:8080/api/v1";

type CapturedRequest = {
  url: string;
  method?: string;
  authorization: string | null;
  body: unknown;
};

async function capture(run: () => Promise<unknown>): Promise<CapturedRequest> {
  const originalFetch = global.fetch;
  let captured: CapturedRequest | undefined;

  global.fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    captured = {
      url: String(input),
      method: init?.method,
      authorization: headers.get("Authorization"),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    return new Response(null, { status: 204, headers: { "X-Request-Id": "req-1" } }) as Response;
  };

  try {
    await run();
  } finally {
    global.fetch = originalFetch;
  }

  assert.ok(captured, "expected a request to be made");
  return captured;
}

test("setPassword POSTs the new password with a bearer token", async () => {
  const request = await capture(() => setPassword("access-token", "Password123"));
  assert.equal(request.method, "POST");
  assert.match(request.url, /\/users\/me\/password$/);
  assert.equal(request.authorization, "Bearer access-token");
  assert.deepEqual(request.body, { newPassword: "Password123" });
});

test("changePassword PUTs current and new password", async () => {
  const request = await capture(() =>
    changePassword("access-token", { currentPassword: "OldPass123", newPassword: "Password123" })
  );
  assert.equal(request.method, "PUT");
  assert.match(request.url, /\/users\/me\/password$/);
  assert.deepEqual(request.body, { currentPassword: "OldPass123", newPassword: "Password123" });
});

test("removePassword DELETEs the password", async () => {
  const request = await capture(() => removePassword("access-token"));
  assert.equal(request.method, "DELETE");
  assert.match(request.url, /\/users\/me\/password$/);
});

test("security step-up start and confirm hit the step-up endpoints", async () => {
  const startRequest = await capture(() => startSecurityStepUp("access-token"));
  assert.equal(startRequest.method, "POST");
  assert.match(startRequest.url, /\/users\/me\/security\/step-up\/start$/);

  const confirmRequest = await capture(() => confirmSecurityStepUp("access-token", "123456"));
  assert.equal(confirmRequest.method, "POST");
  assert.match(confirmRequest.url, /\/users\/me\/security\/step-up\/confirm$/);
  assert.deepEqual(confirmRequest.body, { code: "123456" });
});
