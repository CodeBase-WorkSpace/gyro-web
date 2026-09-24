export type AccountRecoveryCode =
  | "ACCOUNT_STOPPED"
  | "ACCOUNT_BANNED"
  | "PAYMENT_PAST_DUE"
  | "SUBSCRIPTION_EXPIRED"
  | "PROVIDER_UNAVAILABLE"
  | "FEATURE_TEMPORARILY_DISABLED";

export type AccountRecoveryKind = "recoverable" | "hard_block" | "temporary";

export type AccountRecoveryAction = {
  label: string;
  href?: string;
  disabled?: boolean;
};

export type AccountRecoveryView = {
  code: AccountRecoveryCode;
  label: string;
  title: string;
  description: string;
  kind: AccountRecoveryKind;
  primaryAction: AccountRecoveryAction;
  secondaryAction: AccountRecoveryAction;
  safeActions: string[];
  supportPath: string;
};

export type AccountRecoveryViewWithRequest = AccountRecoveryView & {
  requestId: string | null;
};

const accountRecoveryViews: Record<AccountRecoveryCode, AccountRecoveryView> = {
  ACCOUNT_STOPPED: {
    code: "ACCOUNT_STOPPED",
    label: "حساب متوقف",
    title: "حساب فعلا متوقف شده است.",
    description:
      "تا پایان بررسی، ثبت یا تغییر داده‌های حساس بسته می‌ماند. مشاهده داده‌های قبلی و خروجی گرفتن، در صورت اجازه سیاست حساب، باید امن و در دسترس بماند.",
    kind: "hard_block",
    primaryAction: {
      label: "تماس با پشتیبانی",
      href: "/contact",
    },
    secondaryAction: {
      label: "بازگشت به داشبورد فقط‌خواندنی",
      href: "/dashboard",
    },
    safeActions: [
      "مشاهده داده‌های ثبت‌شده قبلی",
      "خروجی گرفتن از داده‌ها در صورت مجاز بودن سیاست حساب",
      "مشاهده وضعیت اشتراک بدون اجرای عملیات پرداخت",
    ],
    supportPath: "پشتیبانی حساب",
  },
  ACCOUNT_BANNED: {
    code: "ACCOUNT_BANNED",
    label: "حساب مسدود",
    title: "این حساب امکان استفاده از Gyro را ندارد.",
    description:
      "این وضعیت یک بلوک سخت است و با پرداخت یا تغییر پلن رفع نمی‌شود. فقط مسیر پشتیبانی و درخواست بازبینی نمایش داده می‌شود.",
    kind: "hard_block",
    primaryAction: {
      label: "درخواست بازبینی",
      href: "/contact",
    },
    secondaryAction: {
      label: "خروج از حساب",
      href: "/logout",
    },
    safeActions: [
      "نمایش مسیر پشتیبانی",
      "نمایش شناسه پیگیری",
      "جلوگیری از اجرای عملیات نوشتن یا پرداخت",
    ],
    supportPath: "بازبینی حساب",
  },
  PAYMENT_PAST_DUE: {
    code: "PAYMENT_PAST_DUE",
    label: "پرداخت عقب‌افتاده",
    title: "پرداخت اشتراک نیاز به رسیدگی دارد.",
    description:
      "قابلیت‌های پیشرفته تا بازیابی پرداخت بسته می‌شوند، اما مسیرهای رایگان مثل مشاهده دفترچه غذا و ثبت‌های پایه نباید از دسترس خارج شوند.",
    kind: "recoverable",
    primaryAction: {
      label: "مشاهده وضعیت پرداخت",
      href: "/profile/billing?status=past_due",
    },
    secondaryAction: {
      label: "ادامه با قابلیت‌های رایگان",
      href: "/dashboard",
    },
    safeActions: [
      "مشاهده دفترچه غذا و پیشرفت ثبت‌شده",
      "ادامه استفاده از قابلیت‌های رایگان",
      "حفظ فرم‌ها و ورودی‌های تکمیل‌شده تا بعد از بازیابی پرداخت",
    ],
    supportPath: "پشتیبانی پرداخت",
  },
  SUBSCRIPTION_EXPIRED: {
    code: "SUBSCRIPTION_EXPIRED",
    label: "اشتراک منقضی",
    title: "اشتراک پیشرفته منقضی شده است.",
    description:
      "داده‌های قبلی حفظ می‌شوند و مسیرهای رایگان باز می‌مانند. قابلیت‌های پیشرفته پس از بازیابی یا ارتقای اشتراک دوباره فعال می‌شوند.",
    kind: "recoverable",
    primaryAction: {
      label: "مشاهده پلن‌ها",
      href: "/profile/billing?status=expired",
    },
    secondaryAction: {
      label: "ادامه با پلن رایگان",
      href: "/dashboard",
    },
    safeActions: [
      "مشاهده برنامه‌ها و گزارش‌های قبلی",
      "ادامه ثبت غذای روزانه در محدوده پلن رایگان",
      "خروجی گرفتن از داده‌ها وقتی مجاز باشد",
    ],
    supportPath: "پشتیبانی اشتراک",
  },
  PROVIDER_UNAVAILABLE: {
    code: "PROVIDER_UNAVAILABLE",
    label: "اختلال پرداخت",
    title: "سرویس پرداخت فعلا در دسترس نیست.",
    description:
      "این وضعیت موقت است و نباید به عنوان خطای حساب نمایش داده شود. کاربر می‌تواند بعدا دوباره تلاش کند یا فعلا به مسیرهای رایگان برگردد.",
    kind: "temporary",
    primaryAction: {
      label: "تلاش دوباره از صورتحساب",
      href: "/profile/billing?status=provider_unavailable",
    },
    secondaryAction: {
      label: "بازگشت به داشبورد",
      href: "/dashboard",
    },
    safeActions: [
      "ادامه استفاده از قابلیت‌های رایگان",
      "عدم تکرار خودکار عملیات پرداخت",
      "نمایش شناسه پیگیری برای پشتیبانی",
    ],
    supportPath: "پشتیبانی پرداخت",
  },
  FEATURE_TEMPORARILY_DISABLED: {
    code: "FEATURE_TEMPORARILY_DISABLED",
    label: "قابلیت موقتا غیرفعال",
    title: "این قابلیت فعلا برای عرضه کنترل‌شده بسته است.",
    description:
      "این حالت خطای پرداخت یا حساب نیست. داده‌های قبلی حفظ می‌شوند و بعد از فعال شدن دوباره قابلیت، بدون تغییر قرارداد UI قابل استفاده می‌مانند.",
    kind: "temporary",
    primaryAction: {
      label: "بازگشت به مسیرهای فعال",
      href: "/dashboard",
    },
    secondaryAction: {
      label: "مشاهده صورتحساب",
      href: "/profile/billing?status=feature_temporarily_disabled",
    },
    safeActions: [
      "حفظ ورودی‌های تکمیل‌شده",
      "بازگشت به قابلیت‌های فعال فعلی",
      "عدم نمایش خطای generic یا داخلی",
    ],
    supportPath: "پشتیبانی محصول",
  },
};

export function parseAccountRecoveryCode(value?: string | null): AccountRecoveryCode | null {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) return null;

  if (normalized === "PAST_DUE") return "PAYMENT_PAST_DUE";
  if (normalized === "EXPIRED") return "SUBSCRIPTION_EXPIRED";
  if (normalized === "FEATURE_DISABLED") return "FEATURE_TEMPORARILY_DISABLED";

  return normalized in accountRecoveryViews
    ? (normalized as AccountRecoveryCode)
    : null;
}

export function accountRecoveryView(
  value?: string | null,
  requestId?: string | null,
): AccountRecoveryViewWithRequest | null {
  const code = parseAccountRecoveryCode(value);
  if (!code) return null;

  return {
    ...accountRecoveryViews[code],
    requestId: normalizeRequestId(requestId),
  };
}

export function accountRecoveryViewForApiError(
  code?: string | null,
  requestId?: string | null,
): AccountRecoveryViewWithRequest | null {
  switch (code) {
    case "ACCOUNT_STOPPED":
    case "ACCOUNT_SUSPENDED":
      return accountRecoveryView("ACCOUNT_STOPPED", requestId);
    case "ACCOUNT_BANNED":
      return accountRecoveryView("ACCOUNT_BANNED", requestId);
    case "PAYMENT_PAST_DUE":
      return accountRecoveryView("PAYMENT_PAST_DUE", requestId);
    case "SUBSCRIPTION_EXPIRED":
      return accountRecoveryView("SUBSCRIPTION_EXPIRED", requestId);
    case "BILLING_PROVIDER_UNAVAILABLE":
      return accountRecoveryView("PROVIDER_UNAVAILABLE", requestId);
    case "FEATURE_TEMPORARILY_DISABLED":
    case "FEATURE_DISABLED":
      return accountRecoveryView("FEATURE_TEMPORARILY_DISABLED", requestId);
    default:
      return null;
  }
}

function normalizeRequestId(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
