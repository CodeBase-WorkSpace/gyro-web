import assert from "node:assert/strict";
import test from "node:test";

import {demoSubscriptionState} from "../lib/subscription/entitlements";
import {
  lockedFeatureState,
  premiumFeatureCatalog,
  premiumRouteAccess,
  type LockedFeatureReasonCode,
} from "../lib/subscription/locked-feature-state";

test("locked feature state maps every required reason to a recovery action", () => {
  const reasonCodes: LockedFeatureReasonCode[] = [
    "FEATURE_FLAG_OFF",
    "SUBSCRIPTION_MISSING",
    "SUBSCRIPTION_EXPIRED",
    "PAYMENT_PAST_DUE",
    "PLAN_LIMIT_REACHED",
    "ACCOUNT_BILLING_BLOCKED",
  ];

  for (const reasonCode of reasonCodes) {
    const state = lockedFeatureState({
      featureName: "تحلیل عمیق پیشرفت",
      reasonCode,
      supportRequestId: reasonCode === "ACCOUNT_BILLING_BLOCKED" ? "req-123" : undefined,
    });

    assert.equal(state.requiredTier, "ADVANCED");
    assert.equal(state.requiredTierLabel, "پیشرفته");
    assert.equal(state.reasonCode, reasonCode);
    assert.equal(state.title.includes("تحلیل عمیق پیشرفت"), true);
    assert.equal(Boolean(state.recoveryAction.label), true);
  }
});

test("premium feature catalog includes planned locked surfaces", () => {
  assert.equal(premiumFeatureCatalog.ADVANCED_GOAL_PLANNING, "برنامه‌ریزی پیشرفته هدف");
  assert.equal(premiumFeatureCatalog.ADVANCED_DIET_MODES, "حالت‌های رژیم پیشرفته");
  assert.equal(premiumFeatureCatalog.DEEP_PROGRESS_ANALYTICS, "تحلیل عمیق پیشرفت");
  assert.equal(premiumFeatureCatalog.DATA_EXPORT, "خروجی داده");
  assert.equal(premiumFeatureCatalog.BATCH_IMPORTS, "ورود گروهی داده");
  assert.equal(premiumFeatureCatalog.COACH_FEATURES, "قابلیت‌های آماده مربی");
  assert.equal(premiumFeatureCatalog.AI_PLANNING, "برنامه‌ریزی هوشمند آینده");
});

test("premium route access blocks free users before premium data loading", () => {
  const access = premiumRouteAccess({
    subscription: demoSubscriptionState("FREE"),
    entitlement: "ADVANCED_NUTRITION_DESIGNER",
    featureName: "برنامه‌ریزی پیشرفته هدف",
  });

  assert.equal(access.blocked, true);
  assert.equal(access.state?.reasonCode, "SUBSCRIPTION_MISSING");
});

test("premium route access allows entitled users", () => {
  const access = premiumRouteAccess({
    subscription: demoSubscriptionState("ADVANCED"),
    entitlement: "ADVANCED_NUTRITION_DESIGNER",
    featureName: "برنامه‌ریزی پیشرفته هدف",
  });

  assert.equal(access.blocked, false);
  assert.equal(access.state, null);
});
