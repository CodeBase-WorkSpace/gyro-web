import assert from "node:assert/strict";
import test from "node:test";

import type {CurrentSubscription} from "../lib/api/subscription";
import {
  billingAccessKind,
  billingPurchaseContext,
} from "../lib/subscription/billing-presentation";
import type {SubscriptionState} from "../lib/subscription/entitlements";

const activeLifecycle: CurrentSubscription = {
  status: "ACTIVE",
  planCode: "ADVANCED",
  periodEnd: "2026-08-31T12:00:00Z",
  cancelAtPeriodEnd: false,
  nextAction: "NONE",
};

function advancedState(trialActive: boolean): SubscriptionState {
  return {
    tier: "ADVANCED",
    entitlements: ["premium_schedules"],
    source: "backend",
    status: "ACTIVE",
    currentPeriodEnd: activeLifecycle.periodEnd,
    trial: {
      active: trialActive,
      eligible: false,
      expiresAt: "2026-07-31T12:00:00Z",
    },
  };
}

test("billing distinguishes an active trial from a purchased subscription", () => {
  assert.equal(billingAccessKind(advancedState(true), activeLifecycle), "TRIAL");
  assert.equal(billingAccessKind(advancedState(false), activeLifecycle), "PAID");
});

test("an Advanced purchase during trial is presented as an extension", () => {
  assert.equal(
    billingPurchaseContext(advancedState(true), "ADVANCED", true),
    "TRIAL_EXTENSION",
  );
  assert.equal(
    billingPurchaseContext(advancedState(false), "ADVANCED", true),
    "RENEWAL",
  );
});
