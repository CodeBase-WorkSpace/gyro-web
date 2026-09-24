import type { SubscriptionState } from "@/lib/subscription/entitlements";

const DAY_MS = 86_400_000;
const ENDING_SOON_DAYS = 3;

export type TrialBannerState =
  | { kind: "countdown"; daysLeft: number }
  | { kind: "ending"; daysLeft: number }
  | { kind: "claim" }
  | null;

/**
 * Which trial banner (if any) the dashboard should show.
 * - active trial with > 3 days left: a light countdown;
 * - active trial in its last 3 days (or last hours): the what-you-lose notice;
 * - eligible existing free user: the claim CTA;
 * - everyone else: nothing.
 */
export function trialBannerState(
  subscription: SubscriptionState,
  now: Date = new Date(),
): TrialBannerState {
  const trial = subscription.trial;
  if (!trial) return null;

  if (trial.active && trial.expiresAt) {
    const expires = Date.parse(trial.expiresAt);
    if (Number.isNaN(expires) || expires <= now.getTime()) return null;
    const daysLeft = Math.max(1, Math.ceil((expires - now.getTime()) / DAY_MS));
    return daysLeft <= ENDING_SOON_DAYS
      ? { kind: "ending", daysLeft }
      : { kind: "countdown", daysLeft };
  }

  if (trial.eligible && subscription.tier === "FREE") {
    return { kind: "claim" };
  }

  return null;
}

/** User-facing summary of what lapses with the ADVANCED plan. */
export const TRIAL_LAPSE_FEATURES = [
  "برنامه‌ریزی هفتگی و روزهای تمرین/استراحت",
  "تحلیل‌های پیشرفته پیشرفت",
  "غذاها و وعده‌های سفارشی نامحدود",
  "برنامه‌ریزی وعده‌های روزهای آینده",
  "خروجی گرفتن از داده‌ها",
] as const;
