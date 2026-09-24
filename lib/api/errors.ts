import type {ApiErrorResponse, ApiFieldErrorMap} from "./types";
import {formatPersianDayLabel} from "../format";

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly fieldErrors?: ApiFieldErrorMap,
    readonly requestId?: string,
    readonly metadata?: Record<string, string>,
    readonly reasonCode?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export function toFieldErrorMap(error?: ApiErrorResponse): ApiFieldErrorMap | undefined {
  if (!error?.fieldErrors?.length) return undefined;

  return Object.fromEntries(
    error.fieldErrors.map((fieldError) => [
      fieldError.field,
      fieldError.errorMessage
    ])
  );
}

export function localizedApiErrorMessage(
  error: Pick<ApiClientError, "code" | "message" | "metadata">,
  locale = "fa-IR",
) {
  const isEnglish = locale.toLowerCase().startsWith("en");
  switch (error.code) {
    case "FUTURE_DATE_LIMIT": {
      const maximumDate = error.metadata?.maximumDate;
      if (isEnglish) {
        return maximumDate
          ? `This date is view-only on the free plan. You can write through ${formatLocalizedDate(maximumDate, locale)}.`
          : "This date is view-only on the free plan.";
      }
      return maximumDate
        ? `این تاریخ در پلن رایگان فقط برای مشاهده است. ثبت اطلاعات تا ${formatLocalizedDate(maximumDate, locale)} امکان‌پذیر است.`
        : "این تاریخ در پلن رایگان فقط برای مشاهده است.";
    }
    case "SUBSCRIPTION_REQUIRED":
      return isEnglish ? "An active subscription is required for this action." : "برای این عملیات اشتراک فعال لازم است.";
    case "FEATURE_DISABLED":
      return isEnglish ? "This feature is temporarily unavailable." : "این قابلیت موقتاً در دسترس نیست.";
    case "GRACE_PERIOD":
      return isEnglish ? "Payment recovery is required before using this feature." : "برای استفاده از این قابلیت، بازیابی پرداخت لازم است.";
    case "SUBSCRIPTION_EXPIRED":
      return isEnglish ? "Your subscription has expired." : "اشتراک شما منقضی شده است.";
    case "BILLED_BLOCKED":
      return isEnglish ? "Billing is blocked for this account." : "پرداخت حساب شما مسدود است.";
    default:
      return error.message;
  }
}

function formatLocalizedDate(value: string, locale: string) {
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  if (!locale.toLowerCase().startsWith("fa")) {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(date);
  }
  return formatPersianDayLabel(date);
}
