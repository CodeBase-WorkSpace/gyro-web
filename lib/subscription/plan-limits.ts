export type PlanLimitKind = "custom_foods" | "custom_meals";

export type PlanLimitNotice = {
  kind: PlanLimitKind;
  featureKey: string;
  limitValue: number;
  title: string;
  description: string;
  actionHref: string;
};

export const freePlanLimits = {
  customFoods: 2,
  customMeals: 2,
  /** Mirrors the API's FREE_FUTURE_DIARY_DAYS (application.yaml default: 3). */
  mealPlanningDaysAhead: 3,
} as const;

export function planLimitNoticeFromMetadata(
  metadata?: Record<string, string>,
): PlanLimitNotice | undefined {
  if (metadata?.supportReasonCode !== "PLAN_LIMIT_REACHED") return undefined;

  const kind = metadata.limitName === "custom_meals" ? "custom_meals" : "custom_foods";
  const limitValue = Number.parseInt(metadata.limitValue ?? "", 10);
  const safeLimitValue = Number.isFinite(limitValue)
    ? limitValue
    : kind === "custom_meals"
      ? freePlanLimits.customMeals
      : freePlanLimits.customFoods;

  return {
    kind,
    featureKey: metadata.featureKey ?? "higher_limits",
    limitValue: safeLimitValue,
    title: kind === "custom_meals"
      ? "سقف وعده‌های سفارشی پلن رایگان پر شده است."
      : "سقف غذاهای سفارشی پلن رایگان پر شده است.",
    description: kind === "custom_meals"
      ? `در پلن رایگان تا ${safeLimitValue.toLocaleString("fa-IR")} وعده یا دستور سفارشی فعال می‌ماند. برای ساخت مورد بعدی، طرح پیشرفته را فعال کنید.`
      : `در پلن رایگان تا ${safeLimitValue.toLocaleString("fa-IR")} غذای سفارشی فعال می‌ماند. برای ساخت مورد بعدی، طرح پیشرفته را فعال کنید.`,
    actionHref: metadata.recoveryPath ?? "/profile/billing?status=plan_limit",
  };
}
