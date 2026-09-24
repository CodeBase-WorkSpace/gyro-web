import {
  canUseEntitlement,
  type Entitlement,
  type SubscriptionState,
  type SubscriptionTier,
} from "./entitlements";

export type LockedFeatureReasonCode =
  | "FEATURE_FLAG_OFF"
  | "SUBSCRIPTION_MISSING"
  | "SUBSCRIPTION_EXPIRED"
  | "PAYMENT_PAST_DUE"
  | "PLAN_LIMIT_REACHED"
  | "ACCOUNT_BILLING_BLOCKED";

export type RecoveryAction = {
  label: string;
  href?: string;
  disabled?: boolean;
};

export type LockedFeatureState = {
  featureName: string;
  requiredTier: SubscriptionTier;
  requiredTierLabel: string;
  reasonCode: LockedFeatureReasonCode;
  title: string;
  description: string;
  recoveryAction: RecoveryAction;
  supportRequestId?: string;
};

export type PremiumFeatureKey =
  | "ADVANCED_GOAL_PLANNING"
  | "ADVANCED_DIET_MODES"
  | "DEEP_PROGRESS_ANALYTICS"
  | "DATA_EXPORT"
  | "BATCH_IMPORTS"
  | "COACH_FEATURES"
  | "AI_PLANNING";

export const premiumFeatureCatalog: Record<PremiumFeatureKey, string> = {
  ADVANCED_GOAL_PLANNING: "برنامه‌ریزی پیشرفته هدف",
  ADVANCED_DIET_MODES: "حالت‌های رژیم پیشرفته",
  DEEP_PROGRESS_ANALYTICS: "تحلیل عمیق پیشرفت",
  DATA_EXPORT: "خروجی داده",
  BATCH_IMPORTS: "ورود گروهی داده",
  COACH_FEATURES: "قابلیت‌های آماده مربی",
  AI_PLANNING: "برنامه‌ریزی هوشمند آینده",
};

const requiredTierLabels: Record<SubscriptionTier, string> = {
  FREE: "رایگان",
  ADVANCED: "پیشرفته",
};

type LockedFeatureStateInput = {
  featureName: string;
  requiredTier?: SubscriptionTier;
  reasonCode: LockedFeatureReasonCode;
  recoveryAction?: RecoveryAction;
  supportRequestId?: string;
};

export function lockedFeatureState({
                                     featureName,
                                     requiredTier = "ADVANCED",
                                     reasonCode,
                                     recoveryAction,
                                     supportRequestId,
                                   }: LockedFeatureStateInput): LockedFeatureState {
  const defaults = lockReasonDefaults(reasonCode);

  return {
    featureName,
    requiredTier,
    requiredTierLabel: requiredTierLabels[requiredTier],
    reasonCode,
    title: defaults.title(featureName),
    description: defaults.description,
    recoveryAction: recoveryAction ?? defaults.recoveryAction,
    supportRequestId,
  };
}

export function premiumRouteAccess({
                                     subscription,
                                     entitlement,
                                     featureName,
                                     reasonCode = "SUBSCRIPTION_MISSING",
  supportRequestId,
                                   }: {
  subscription: SubscriptionState;
  entitlement: Entitlement;
  featureName: string;
  reasonCode?: LockedFeatureReasonCode;
  supportRequestId?: string;
}):
  | { blocked: false; state: null }
  | { blocked: true; state: LockedFeatureState } {
  if (subscription.premiumGatingDisabled || canUseEntitlement(subscription, entitlement)) {
    return {blocked: false, state: null};
  }

  return {
    blocked: true,
    state: lockedFeatureState({
      featureName,
      reasonCode,
      supportRequestId,
    }),
  };
}

function lockReasonDefaults(reasonCode: LockedFeatureReasonCode) {
  switch (reasonCode) {
    case "FEATURE_FLAG_OFF":
      return {
        title: (featureName: string) => `${featureName} فعلا غیرفعال است.`,
        description:
          "این قابلیت برای عرضه کنترل‌شده بسته شده و بدون تغییر اطلاعات فعلی دوباره فعال می‌شود.",
        recoveryAction: {
          label: "فعلا در دسترس نیست",
          disabled: true,
        },
      };
    case "SUBSCRIPTION_EXPIRED":
      return {
        title: (featureName: string) => `دسترسی ${featureName} منقضی شده است.`,
        description:
          "مسیرهای رایگان امن باقی می‌مانند؛ برای ذخیره یا استفاده دوباره از قابلیت پیشرفته باید اشتراک بازیابی شود.",
        recoveryAction: {
          label: "مشاهده وضعیت اشتراک",
          href: "/profile/billing?status=expired",
        },
      };
    case "PAYMENT_PAST_DUE":
      return {
        title: (featureName: string) => `${featureName} به پرداخت ناموفق وابسته است.`,
        description:
          "پس از اتصال پرداخت، بازیابی کارت یا پرداخت دوباره از همین مسیر انجام می‌شود.",
        recoveryAction: {
          label: "مشاهده وضعیت پرداخت",
          href: "/profile/billing?status=past_due",
        },
      };
    case "PLAN_LIMIT_REACHED":
      return {
        title: (featureName: string) => `سقف پلن برای ${featureName} پر شده است.`,
        description:
          "اطلاعات فعلی حفظ می‌شود؛ برای ادامه باید محدودیت پلن برداشته شود یا داده‌های قبلی مدیریت شوند.",
        recoveryAction: {
          label: "دیدن محدودیت‌های پلن",
          href: "/profile/billing?status=empty",
        },
      };
    case "ACCOUNT_BILLING_BLOCKED":
      return {
        title: (featureName: string) => `${featureName} به دلیل وضعیت حساب مسدود است.`,
        description:
          "این حالت نیاز به بررسی حساب دارد. جزئیات فنی فقط برای پشتیبانی نمایش داده می‌شود.",
        recoveryAction: {
          label: "تماس با پشتیبانی",
          disabled: true,
        },
      };
    case "SUBSCRIPTION_MISSING":
    default:
      return {
        title: (featureName: string) => `${featureName} در پلن پیشرفته فعال می‌شود.`,
        description:
          "مسیر رایگان همچنان قابل استفاده است و اطلاعات واردشده از بین نمی‌رود.",
        recoveryAction: {
          label: "مشاهده پلن‌ها",
          href: "/profile/billing?status=empty",
        },
      };
  }
}
