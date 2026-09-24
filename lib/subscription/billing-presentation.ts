import type {CurrentSubscription} from "@/lib/api/subscription";
import type {SubscriptionState, SubscriptionTier} from "@/lib/subscription/entitlements";

export type BillingAccessKind = "FREE" | "TRIAL" | "PAID";
export type BillingPurchaseContext = "NEW" | "TRIAL_EXTENSION" | "RENEWAL";

export function billingAccessKind(
  entitlement: SubscriptionState,
  lifecycle: CurrentSubscription | null,
): BillingAccessKind {
  if (entitlement.trial?.active) return "TRIAL";
  if (
    entitlement.tier === "ADVANCED" &&
    lifecycle &&
    ["ACTIVE", "GRACE_PERIOD", "CANCELED"].includes(lifecycle.status)
  ) {
    return "PAID";
  }
  return "FREE";
}

export function billingPurchaseContext(
  entitlement: SubscriptionState,
  planTier: SubscriptionTier,
  current: boolean,
): BillingPurchaseContext {
  if (planTier !== "ADVANCED" || !current) return "NEW";
  if (entitlement.trial?.active) return "TRIAL_EXTENSION";
  return "RENEWAL";
}
