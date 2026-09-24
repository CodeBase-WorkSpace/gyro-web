import assert from "node:assert/strict";
import test from "node:test";

import {applicationServerKeysMatch, registerPushSubscriptionWithRecovery} from "../lib/push-subscription";

test("matches the browser subscription application-server key", () => {
  const expected = Uint8Array.from([4, 10, 20, 30]);

  assert.equal(applicationServerKeysMatch(expected.buffer, expected), true);
});

test("rejects a subscription created with a different VAPID public key", () => {
  const expected = Uint8Array.from([4, 10, 20, 30]);
  const previous = Uint8Array.from([4, 10, 20, 31]);

  assert.equal(applicationServerKeysMatch(previous.buffer, expected), false);
});

test("rejects subscriptions whose application-server key is unavailable", () => {
  assert.equal(applicationServerKeysMatch(null, Uint8Array.from([4, 10, 20, 30])), false);
});

test("accepts a subscription persisted before the Server Action response fails", async () => {
  await registerPushSubscriptionWithRecovery(
    async () => { throw new Error("Server Action response failed"); },
    async () => true,
    "Push activation failed",
  );
});

test("accepts a subscription persisted before the Server Action returns an error", async () => {
  await registerPushSubscriptionWithRecovery(
    async () => ({error: "Activation failed"}),
    async () => true,
    "Push activation failed",
  );
});

test("preserves the registration error when the subscription was not persisted", async () => {
  await assert.rejects(
    registerPushSubscriptionWithRecovery(
      async () => { throw new Error("Server Action response failed"); },
      async () => false,
      "Push activation failed",
    ),
    /Server Action response failed/,
  );
});
