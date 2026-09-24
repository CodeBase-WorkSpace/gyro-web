import assert from "node:assert/strict";
import test from "node:test";

import { parseEntitlement } from "../lib/api/entitlement";
import {
  demoSubscriptionState,
  subscriptionStateFromEntitlement,
} from "../lib/subscription/entitlements";
import { trialBannerState } from "../lib/subscription/trial";

const NOW = new Date("2026-07-17T12:00:00Z");

function stateWithTrial(
  trial: { active: boolean; eligible: boolean; expiresAt: string | null } | null,
  tier: "FREE" | "ADVANCED" = trial?.active ? "ADVANCED" : "FREE",
) {
  return {
    ...demoSubscriptionState(tier),
    trial,
  };
}

test("active trial with more than three days shows the countdown", () => {
  const state = trialBannerState(
    stateWithTrial({ active: true, eligible: false, expiresAt: "2026-07-27T12:00:00Z" }),
    NOW,
  );
  assert.deepEqual(state, { kind: "countdown", daysLeft: 10 });
});

test("last three days switch to the ending notice", () => {
  const state = trialBannerState(
    stateWithTrial({ active: true, eligible: false, expiresAt: "2026-07-19T11:00:00Z" }),
    NOW,
  );
  assert.deepEqual(state, { kind: "ending", daysLeft: 2 });
});

test("eligible free user gets the claim banner", () => {
  const state = trialBannerState(
    stateWithTrial({ active: false, eligible: true, expiresAt: null }, "FREE"),
    NOW,
  );
  assert.deepEqual(state, { kind: "claim" });
});

test("no banner without trial info, after expiry, or for paid users", () => {
  assert.equal(trialBannerState(stateWithTrial(null), NOW), null);
  assert.equal(
    trialBannerState(
      stateWithTrial({ active: true, eligible: false, expiresAt: "2026-07-17T11:00:00Z" }),
      NOW,
    ),
    null,
  );
  assert.equal(
    trialBannerState(
      stateWithTrial({ active: false, eligible: false, expiresAt: "2026-07-01T00:00:00Z" }, "ADVANCED"),
      NOW,
    ),
    null,
  );
});

test("entitlement parsing carries the trial payload through to the subscription state", () => {
  const dto = parseEntitlement({
    planKey: "ADVANCED",
    status: "ACTIVE",
    features: ["premium_schedules"],
    currentPeriodEnd: "2026-07-31T00:00:00Z",
    gracePeriodEnd: null,
    cancelAtPeriodEnd: false,
    supportReasonCode: null,
    source: "MANUAL_GRANT",
    trial: { active: true, eligible: false, expiresAt: "2026-07-31T00:00:00Z" },
  });

  const state = subscriptionStateFromEntitlement(dto);
  assert.deepEqual(state.trial, {
    active: true,
    eligible: false,
    expiresAt: "2026-07-31T00:00:00Z",
  });
});

test("entitlement parsing tolerates responses without a trial field", () => {
  const dto = parseEntitlement({
    planKey: "FREE",
    status: "FREE",
    features: [],
    currentPeriodEnd: null,
    gracePeriodEnd: null,
    cancelAtPeriodEnd: false,
    supportReasonCode: null,
    source: "FREE",
  });

  assert.equal(dto.trial, null);
});
