export type SubscriptionTier = "FREE" | "ADVANCED";

export type Entitlement =
  | "premium_schedules"
  | "advanced_analytics"
  | "data_export"
  | "future_meal_planning"
  | "higher_limits"
  | "goal_recalibration"
  | "ADVANCED_NUTRITION_DESIGNER"
  | "MACRO_STRATEGY_PRESETS"
  | "WEEKLY_CALORIE_PLANNING"
  | "TRAINING_REST_DAY_TARGETS"
  | "REFEED_STRATEGY"
  | "MEAL_DISTRIBUTION_DESIGNER";

export type TrialState = {
  active: boolean;
  eligible: boolean;
  expiresAt: string | null;
};

export type SubscriptionState = {
  tier: SubscriptionTier;
  entitlements: Entitlement[];
  source: "demo" | "backend";
  premiumGatingDisabled?: boolean;
  status?: EntitlementStatus;
  currentPeriodEnd?: string | null;
  gracePeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  supportReasonCode?: string | null;
  trial?: TrialState | null;
};

const advancedEntitlements: Entitlement[] = [
  "premium_schedules",
  "advanced_analytics",
  "data_export",
  "future_meal_planning",
  "higher_limits",
  "goal_recalibration",
  "ADVANCED_NUTRITION_DESIGNER",
  "MACRO_STRATEGY_PRESETS",
  "WEEKLY_CALORIE_PLANNING",
  "TRAINING_REST_DAY_TARGETS",
  "REFEED_STRATEGY",
  "MEAL_DISTRIBUTION_DESIGNER",
];

const backendEntitlements: Entitlement[] = [
  "premium_schedules",
  "advanced_analytics",
  "data_export",
  "future_meal_planning",
  "higher_limits",
  "goal_recalibration",
];

const premiumScheduleEntitlements: Entitlement[] = [
  "ADVANCED_NUTRITION_DESIGNER",
  "MACRO_STRATEGY_PRESETS",
  "WEEKLY_CALORIE_PLANNING",
  "TRAINING_REST_DAY_TARGETS",
  "REFEED_STRATEGY",
  "MEAL_DISTRIBUTION_DESIGNER",
];

export type EntitlementStatus =
  | "FREE"
  | "ACTIVE"
  | "GRACE_PERIOD"
  | "EXPIRED"
  | "CANCELED"
  | "BILLED_BLOCKED"
  | "ADMIN_OVERRIDE";

export function entitlementsForTier(tier: SubscriptionTier): Entitlement[] {
  return tier === "ADVANCED" ? advancedEntitlements : [];
}

export function canUseEntitlement(
  subscription: SubscriptionState,
  entitlement: Entitlement,
) {
  return subscription.premiumGatingDisabled === true || subscription.entitlements.includes(entitlement);
}

export function demoSubscriptionState(
  tier: SubscriptionTier = "FREE",
): SubscriptionState {
  return {
    tier,
    entitlements: entitlementsForTier(tier),
    source: "demo",
    status: tier === "ADVANCED" ? "ACTIVE" : "FREE",
    premiumGatingDisabled: false,
  };
}

export function parseSubscriptionTier(value?: string | null): SubscriptionTier {
  const normalizedValue = value?.toUpperCase();
  return normalizedValue === "ADVANCED" || normalizedValue === "PREMIUM"
    ? "ADVANCED"
    : "FREE";
}

export function subscriptionStateFromEntitlement(
  entitlement: {
    planKey: string;
    status: EntitlementStatus;
    features: string[];
    currentPeriodEnd: string | null;
    gracePeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    supportReasonCode: string | null;
    premiumGatingDisabled?: boolean;
    trial?: TrialState | null;
  },
): SubscriptionState {
  const tier = parseSubscriptionTier(entitlement.planKey);
  const grantedBackendEntitlements = entitlement.features.filter(isBackendEntitlement);
  const activeAdvanced =
    tier === "ADVANCED" &&
    ["ACTIVE", "GRACE_PERIOD", "ADMIN_OVERRIDE"].includes(entitlement.status);
  const entitlements = activeAdvanced
    ? Array.from(
        new Set([
          ...grantedBackendEntitlements,
          ...(grantedBackendEntitlements.includes("premium_schedules")
            ? premiumScheduleEntitlements
            : []),
        ]),
      )
    : [];

  return {
    tier,
    entitlements,
    source: "backend",
    status: entitlement.status,
    currentPeriodEnd: entitlement.currentPeriodEnd,
    gracePeriodEnd: entitlement.gracePeriodEnd,
    cancelAtPeriodEnd: entitlement.cancelAtPeriodEnd,
    supportReasonCode: entitlement.supportReasonCode,
    premiumGatingDisabled: entitlement.premiumGatingDisabled,
    trial: entitlement.trial ?? null,
  };
}

function isBackendEntitlement(value: string): value is Entitlement {
  return backendEntitlements.includes(value as Entitlement);
}
