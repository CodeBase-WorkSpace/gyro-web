import assert from "node:assert/strict";
import test from "node:test";

import { completeRegistrationVerification } from "../lib/auth/registration";
import { SIGNUP_ONBOARDING_PATH } from "../lib/onboarding";
import type { AuthResponse } from "../lib/auth/types";

test("successful registration persists the session before entering dashboard onboarding", async () => {
  const events: string[] = [];
  const auth = {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    tokenType: "Bearer",
    accessExpiresInSeconds: 900,
  } satisfies AuthResponse;

  const destination = await completeRegistrationVerification(
    { phoneNumber: "09123456789", code: "123456" },
    {
      verify: async () => {
        events.push("verified");
        return auth;
      },
      persistSession: async (result) => {
        assert.equal(result, auth);
        events.push("session-persisted");
      },
    },
  );

  assert.deepEqual(events, ["verified", "session-persisted"]);
  assert.equal(destination, SIGNUP_ONBOARDING_PATH);
});

test("failed registration verification does not persist a session", async () => {
  let sessionPersisted = false;

  await assert.rejects(
    completeRegistrationVerification(
      { email: "user@example.com", code: "000000" },
      {
        verify: async () => {
          throw new Error("invalid code");
        },
        persistSession: async () => {
          sessionPersisted = true;
        },
      },
    ),
    /invalid code/,
  );

  assert.equal(sessionPersisted, false);
});
