import type {SubscriptionState} from "./entitlements";

export type BillingStatusCode =
  | "FREE"
  | "ACTIVE"
  | "TRIALING"
  | "CANCELED"
  | "EXPIRED"
  | "PAST_DUE"
  | "BACKEND_ERROR"
  | "PROVIDER_UNAVAILABLE"
  | "PAYMENT_ACTION_FAILED"
  | "EMPTY";

export type BillingStatusView = {
  code: BillingStatusCode;
  label: string;
  title: string;
  description: string;
  actionLabel: string;
  actionEnabled: boolean;
};

const billingStatusViews: Record<BillingStatusCode, BillingStatusView> = {
  FREE: {
    code: "FREE",
    label: "پلن رایگان",
    title: "حساب شما روی پلن رایگان است.",
    description:
      "ثبت غذا، داشبورد روزانه، مرور هفتگی و ردیابی وزن فعال هستند. قابلیت‌های پیشرفته تا زمان اتصال پرداخت قفل می‌مانند.",
    actionLabel: "ارتقا بعد از اتصال پرداخت فعال می‌شود",
    actionEnabled: false,
  },
  ACTIVE: {
    code: "ACTIVE",
    label: "فعال",
    title: "پلن پیشرفته برای این حساب فعال است.",
    description:
      "قابلیت‌های برنامه‌ریزی پیشرفته و تحلیل‌های عمیق‌تر برای این حساب در دسترس هستند.",
    actionLabel: "مدیریت پرداخت بعد از اتصال provider فعال می‌شود",
    actionEnabled: false,
  },
  TRIALING: {
    code: "TRIALING",
    label: "دوره آزمایشی",
    title: "دوره آزمایشی پیشرفته فعال است.",
    description:
      "در صورت فعال شدن trial در بک‌اند، تاریخ پایان و وضعیت تمدید در همین صفحه نمایش داده می‌شود.",
    actionLabel: "مدیریت trial هنوز فعال نیست",
    actionEnabled: false,
  },
  CANCELED: {
    code: "CANCELED",
    label: "لغوشده",
    title: "تمدید اشتراک لغو شده است.",
    description:
      "تا زمانی که بک‌اند تاریخ پایان دسترسی را برگرداند، این صفحه فقط وضعیت نمایشی را نشان می‌دهد.",
    actionLabel: "ازسرگیری بعد از اتصال پرداخت فعال می‌شود",
    actionEnabled: false,
  },
  EXPIRED: {
    code: "EXPIRED",
    label: "منقضی",
    title: "اشتراک پیشرفته منقضی شده است.",
    description:
      "مسیرهای رایگان امن باقی می‌مانند و قابلیت‌های پیشرفته تا بازیابی اشتراک قفل می‌شوند.",
    actionLabel: "بازیابی اشتراک هنوز فعال نیست",
    actionEnabled: false,
  },
  PAST_DUE: {
    code: "PAST_DUE",
    label: "پرداخت ناموفق",
    title: "پرداخت اشتراک نیاز به رسیدگی دارد.",
    description:
      "پس از اتصال provider، لینک پرداخت مجدد یا مدیریت کارت در همین بخش فعال می‌شود.",
    actionLabel: "پرداخت مجدد هنوز فعال نیست",
    actionEnabled: false,
  },
  BACKEND_ERROR: {
    code: "BACKEND_ERROR",
    label: "خطای بک‌اند",
    title: "وضعیت اشتراک از بک‌اند خوانده نشد.",
    description:
      "در این حالت صفحه باید مسیرهای امن رایگان را باز نگه دارد و جزئیات پیگیری را ثانویه نمایش دهد.",
    actionLabel: "تلاش دوباره بعد از پایداری API",
    actionEnabled: false,
  },
  PROVIDER_UNAVAILABLE: {
    code: "PROVIDER_UNAVAILABLE",
    label: "provider در دسترس نیست",
    title: "سرویس پرداخت فعلا در دسترس نیست.",
    description:
      "این وضعیت برای خطای موقت provider رزرو شده و نباید مسیرهای رایگان را مسدود کند.",
    actionLabel: "تلاش دوباره بعدا",
    actionEnabled: false,
  },
  PAYMENT_ACTION_FAILED: {
    code: "PAYMENT_ACTION_FAILED",
    label: "عملیات ناموفق",
    title: "عملیات پرداخت انجام نشد.",
    description:
      "وقتی provider خطای عملیاتی برگرداند، پیام بازیابی و شناسه پیگیری در همین صفحه نمایش داده می‌شود.",
    actionLabel: "تکرار عملیات هنوز فعال نیست",
    actionEnabled: false,
  },
  EMPTY: {
    code: "EMPTY",
    label: "بدون اشتراک پولی",
    title: "اشتراک پولی فعالی برای این حساب ثبت نشده است.",
    description:
      "این حالت برای پاسخ خالی بک‌اند یا نبود رکورد اشتراک استفاده می‌شود.",
    actionLabel: "ارتقا بعد از اتصال پرداخت فعال می‌شود",
    actionEnabled: false,
  },
};

export function parseBillingStatusCode(value?: string | null): BillingStatusCode | null {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) return null;

  return normalized in billingStatusViews
    ? (normalized as BillingStatusCode)
    : null;
}

export function billingStatusForSubscription(
  subscription: SubscriptionState,
  override?: string | null,
): BillingStatusView {
  const overrideCode = parseBillingStatusCode(override);
  if (overrideCode) return billingStatusViews[overrideCode];

  switch (subscription.status) {
    case "ACTIVE":
    case "ADMIN_OVERRIDE":
      return billingStatusViews.ACTIVE;
    case "GRACE_PERIOD":
      return billingStatusViews.PAST_DUE;
    case "EXPIRED":
      return billingStatusViews.EXPIRED;
    case "CANCELED":
      return billingStatusViews.CANCELED;
    case "BILLED_BLOCKED":
      return billingStatusViews.PAYMENT_ACTION_FAILED;
    case "FREE":
    default:
      return subscription.tier === "ADVANCED"
        ? billingStatusViews.ACTIVE
        : billingStatusViews.FREE;
  }
}

export function billingStatusFromApiError(code?: string | null): BillingStatusView {
  switch (code) {
    case "SUBSCRIPTION_REQUIRED":
      return billingStatusViews.EMPTY;
    case "SUBSCRIPTION_EXPIRED":
      return billingStatusViews.EXPIRED;
    case "PAYMENT_PAST_DUE":
    case "GRACE_PERIOD":
      return billingStatusViews.PAST_DUE;
    case "BILLING_PROVIDER_UNAVAILABLE":
      return billingStatusViews.PROVIDER_UNAVAILABLE;
    case "BILLED_BLOCKED":
    case "BILLING_BLOCKED":
      return billingStatusViews.PAYMENT_ACTION_FAILED;
    case "PAYMENT_ACTION_FAILED":
      return billingStatusViews.PAYMENT_ACTION_FAILED;
    default:
      return billingStatusViews.BACKEND_ERROR;
  }
}
