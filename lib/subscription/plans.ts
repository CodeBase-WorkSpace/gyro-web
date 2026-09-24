import type {Entitlement, SubscriptionState, SubscriptionTier} from "./entitlements";
import type {SubscriptionCatalogDto, SubscriptionCatalogPlanDto} from "../api/subscription-catalog";
import {freePlanLimits} from "./plan-limits";

export type PlanFeature = {
  label: string;
  included: boolean;
  key?: string;
};

export type PlanLimit = {
  label: string;
  value: string;
};

export type PlanPrice = {
  id: number;
  billingPeriodDays: number;
  baseAmount: number;
  discountPercent: number;
  amount: number;
  currency: string;
  badge: string | null;
};

export function formatMoney(amount: number, currency: string): string {
  const tomans = currency.toUpperCase() === "IRR" ? amount / 10 : amount;
  return `${tomans.toLocaleString("fa-IR")} تومان`;
}

export type SubscriptionPlan = {
  tier: SubscriptionTier;
  code: "free" | "advanced";
  name: string;
  localizedName: string;
  locale: string | null;
  eyebrow: string;
  summary: string;
  billingCopy: string;
  cta: string;
  featured: boolean;
  prices: PlanPrice[];
  features: PlanFeature[];
  catalogFeatures: PlanFeature[];
  limits: PlanLimit[];
  entitlements: Entitlement[];
};

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    tier: "FREE",
    code: "free",
    name: "Free",
    localizedName: "رایگان",
    locale: null,
    eyebrow: "برای شروع و ثبت روزانه",
    summary: "ثبت غذا، تکرار وعده‌ها و گزارش‌های پایه را بدون پرداخت نگه دار.",
    billingCopy: "طرح رایگان برای پیگیری روزانه فعال است و برای شروع کافی می‌ماند.",
    cta: "شروع رایگان",
    featured: false,
    prices: [],
    catalogFeatures: [],
    entitlements: [],
    limits: [
      {label: "برنامه‌ریزی آینده", value: `تا ${freePlanLimits.mealPlanningDaysAhead.toLocaleString("fa-IR")} روز`},
      {label: "غذاهای سفارشی", value: `تا ${freePlanLimits.customFoods.toLocaleString("fa-IR")} مورد`},
      {label: "وعده‌ها و دستورهای سفارشی", value: `تا ${freePlanLimits.customMeals.toLocaleString("fa-IR")} مورد`},
    ],
    features: [
      {label: "ثبت نامحدود غذا", included: true},
      {label: "کپی و تکرار وعده‌ها", included: true},
      {label: "ویرایش ثبت‌های قبلی دفترچه غذا", included: true},
      {
        label: `برنامه‌ریزی غذا تا ${freePlanLimits.mealPlanningDaysAhead.toLocaleString("fa-IR")} روز آینده`,
        included: true,
      },
      {label: "تا ۲ غذای سفارشی", included: true},
      {label: "تا ۲ وعده یا دستور سفارشی", included: true},
      {label: "محاسبه‌گر پایه کالری", included: true},
      {label: "محاسبه‌گر پایه ماکرو", included: true},
      {label: "اهداف تغذیه پایه", included: true},
      {label: "داشبورد روزانه", included: true},
      {label: "پیشرفت هفتگی", included: true},
      {label: "ردیابی وزن", included: true},
    ],
  },
  {
    tier: "ADVANCED",
    code: "advanced",
    name: "Advanced",
    localizedName: "پیشرفته",
    locale: null,
    eyebrow: "برای برنامه‌ریزی دقیق‌تر",
    summary: "گزارش‌های عمیق‌تر، برنامه‌ریزی پیشرفته و خروجی داده را فعال کن.",
    billingCopy:
      "طرح پیشرفته برای وقتی است که می‌خواهی روندت را دقیق‌تر ببینی و برنامه‌ات را شخصی‌تر تنظیم کنی.",
    cta: "فعال‌سازی پریمیوم",
    featured: true,
    prices: [],
    catalogFeatures: [],
    entitlements: [
      "ADVANCED_NUTRITION_DESIGNER",
      "MACRO_STRATEGY_PRESETS",
      "WEEKLY_CALORIE_PLANNING",
      "TRAINING_REST_DAY_TARGETS",
      "REFEED_STRATEGY",
      "MEAL_DISTRIBUTION_DESIGNER",
    ],
    limits: [
      {label: "غذاهای سفارشی", value: "نامحدود"},
      {label: "وعده‌ها و دستورهای سفارشی", value: "نامحدود"},
      {label: "برنامه‌ریزی وعده", value: "نامحدود"},
    ],
    features: [
      {label: "غذاهای سفارشی نامحدود", included: true},
      {label: "وعده‌ها و دستورهای سفارشی نامحدود", included: true},
      {label: "برنامه‌ریزی وعده نامحدود", included: true},
      {label: "ویزارد هدف پیشرفته", included: true},
      {label: "برنامه‌ریزی شخصی کالری و ماکرو", included: true},
      {label: "زمان‌بندی وعده و توزیع کالری", included: true},
      {label: "تغذیه روز تمرین و روز استراحت", included: true},
      {label: "برنامه‌ریزی refeed و diet-break", included: true},
      {label: "چند پروفایل تغذیه برای کات، بالک و نگهداری", included: true},
      {label: "تحلیل‌ها و گزارش‌های پیشرفته", included: true},
      {label: "بینش ثبات تغذیه", included: true},
      {label: "بینش پایبندی به هدف", included: true},
      {label: "تحلیل زمان‌بندی وعده و الگوی خوردن", included: true},
      {label: "بینش روند وزن و plateau", included: true},
      {label: "خروجی داده CSV/JSON", included: true},
    ],
  },
];

export function planForTier(tier: SubscriptionTier) {
  return subscriptionPlans.find((plan) => plan.tier === tier) ?? subscriptionPlans[0];
}

export function currentPlanFromSubscription(subscription: SubscriptionState) {
  return planForTier(subscription.tier);
}

export function plansWithCatalog(catalog: SubscriptionCatalogDto | null | undefined) {
  if (!catalog) {
    return subscriptionPlans;
  }

  const plansByCode = new Map(catalog.plans.map((plan) => [plan.code, plan]));
  return subscriptionPlans.map((plan) => {
    const catalogPlan = plansByCode.get(plan.tier);
    if (!catalogPlan) {
      return plan;
    }

    return {
      ...plan,
      name: catalogPlan.name,
      localizedName: catalogPlan.displayName,
      locale: catalogPlan.locale,
      summary: catalogPlanSummary(catalogPlan.shortDescription, plan.summary),
      prices: catalogPlan.prices.map(toPlanPrice),
      catalogFeatures: catalogPlan.features.map((feature) => ({
        label: feature.description,
        included: feature.enabled,
        key: feature.key,
      })),
    };
  });
}

function catalogPlanSummary(
  catalogSummary: string | null,
  fallback: string,
) {
  return (catalogSummary ?? fallback).replaceAll("صادرات داده", "خروجی داده");
}

export function planForTierFromPlans(
  plans: SubscriptionPlan[],
  tier: SubscriptionTier,
) {
  return plans.find((plan) => plan.tier === tier) ?? plans[0];
}

export function formatPlanPrice(price: PlanPrice) {
  if (price.currency === "IRR") {
    return `${new Intl.NumberFormat("fa-IR").format(price.amount / 10)} تومان`;
  }

  return `${new Intl.NumberFormat("fa-IR").format(price.amount)} ${price.currency}`;
}

export function catalogPricePresentation(price: PlanPrice) {
  const discounted = price.discountPercent > 0 && price.baseAmount > price.amount;
  return {
    discounted,
    basePrice: discounted ? formatMoney(price.baseAmount, price.currency) : null,
    finalPrice: formatMoney(price.amount, price.currency),
    discountLabel: discounted
      ? `${new Intl.NumberFormat("fa-IR", {maximumFractionDigits: 2}).format(price.discountPercent)}٪ تخفیف`
      : null,
  };
}

export function defaultDisplayPrice(prices: PlanPrice[]) {
  return prices.find((price) => price.badge === "RECOMMENDED") ?? prices[0] ?? null;
}

export function billingPeriodLabel(days: number) {
  switch (days) {
    case 30:
      return "ماهانه";
    case 90:
      return "سه‌ماهه";
    case 365:
      return "سالانه";
    default:
      return `${new Intl.NumberFormat("fa-IR").format(days)} روزه`;
  }
}

function toPlanPrice(price: SubscriptionCatalogPlanDto["prices"][number]): PlanPrice {
  return {
    id: price.id,
    billingPeriodDays: price.billingPeriodDays,
    baseAmount: price.baseAmount,
    discountPercent: price.discountPercent,
    amount: price.amount,
    currency: price.currency,
    badge: price.badge,
  };
}
