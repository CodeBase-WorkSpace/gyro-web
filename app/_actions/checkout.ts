"use server";

import {randomUUID} from "crypto";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";

import {ApiClientError} from "@/lib/api/errors";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {
  initiateCheckout,
  type CheckoutResponse,
  type PromotionValidationResponse,
  validatePromotionCode,
  redeemPromotion,
} from "@/lib/api/checkout";

export type CheckoutActionState = {
  status: "idle" | "loading" | "success" | "error";
  error?: string;
  gatewayUrl?: string;
  requestId?: string;
};

export type PromotionValidationActionState = {
  status: "idle" | "success" | "error";
  error?: string;
  message?: string;
  validation?: PromotionValidationResponse;
  requestId?: string;
};

export async function checkoutAction(
  _prevState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const priceId = Number(formData.get("priceId"));
  const promotionCode = normalizePromotionCode(formData.get("promotionCode"));

  if (!priceId || !Number.isFinite(priceId)) {
    return {status: "error", error: "شناسه قیمت نامعتبر است"};
  }

  // Generate a unique idempotency key for this checkout attempt
  const idempotencyKey = randomUUID();

  try {
    const response: CheckoutResponse = await authenticatedServerRequest(
      (accessToken) =>
        initiateCheckout(accessToken, priceId, promotionCode || undefined, idempotencyKey),
      {nextPath: "/profile/billing", retryPolicy: "idempotent"},
    );

    if (response.status === "SUCCESS" && response.gatewayUrl) {
      redirect(response.gatewayUrl);
    }

    return {
      status: "error",
      error: response.failureReason || "خطا در ایجاد پرداخت",
      requestId: response.requestId,
    };
  } catch (error) {
    if (error instanceof ApiClientError) {
      return {
        status: "error",
        error: promotionErrorMessage(error),
        requestId: error.requestId,
      };
    }

    // Next.js redirect throws an error that we should re-throw
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }

    return {status: "error", error: "خطا در ارتباط با سرور"};
  }
}

export async function validatePromotionAction(
  _prevState: PromotionValidationActionState,
  formData: FormData,
): Promise<PromotionValidationActionState> {
  const priceId = Number(formData.get("priceId"));
  const promotionCode = normalizePromotionCode(formData.get("promotionCodeDraft"));

  if (!priceId || !Number.isFinite(priceId)) {
    return {status: "error", error: "ابتدا یک دوره اشتراک معتبر انتخاب کن."};
  }

  if (!promotionCode) {
    return {status: "error", error: "کد تخفیف را وارد کن."};
  }

  try {
    const validation = await authenticatedServerRequest(
      (accessToken) => validatePromotionCode(accessToken, priceId, promotionCode),
      {nextPath: "/profile/billing", retryPolicy: "idempotent"},
    );

    return {
      status: "success",
      message: "کد تخفیف معتبر است.",
      validation,
    };
  } catch (error) {
    if (error instanceof ApiClientError) {
      return {
        status: "error",
        error: promotionErrorMessage(error),
        requestId: error.requestId,
      };
    }

    return {status: "error", error: "خطا در بررسی کد تخفیف. دوباره تلاش کن."};
  }
}

function normalizePromotionCode(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function promotionErrorMessage(error: ApiClientError) {
  switch (error.reasonCode) {
    case "promotion_required":
      return "کد تخفیف را وارد کن.";
    case "promotion_unknown":
      return "این کد تخفیف پیدا نشد.";
    case "promotion_inactive":
      return "این کد تخفیف فعال نیست.";
    case "promotion_not_started":
      return "این کد تخفیف هنوز فعال نشده است.";
    case "promotion_expired":
      return "مهلت استفاده از این کد تخفیف تمام شده است.";
    case "promotion_plan_mismatch":
      return "این کد برای دوره انتخاب‌شده معتبر نیست.";
    case "promotion_limit_reached":
      return "ظرفیت استفاده از این کد تکمیل شده است.";
    case "promotion_user_limit_reached":
      return "قبلا از این کد تخفیف استفاده کرده‌ای.";
    case "promotion_unsupported_type":
      return "این کد برای پرداخت آنلاین پشتیبانی نمی‌شود.";
    case "promotion_not_self_redeemable":
      return "این کد برای فعال‌سازی رایگان نیست.";
    case "promotion_free_checkout_unsupported":
      return "این کد مبلغ پرداخت را به صفر می‌رساند و قابل استفاده نیست.";
    case "affiliate_inactive":
      return "این کد همکاری در حال حاضر فعال نیست.";
    case "affiliate_existing_paying_customer":
      return "این کد فقط برای اولین پرداخت موفق قابل استفاده است.";
    case "affiliate_self_referral":
      return "نمی‌توانی از کد همکاری حساب خودت استفاده کنی.";
    case "RATE_LIMIT_EXCEEDED":
      return "تعداد تلاش‌ها زیاد است؛ چند دقیقه بعد دوباره امتحان کن.";
    default:
      return error.message || "کد تخفیف معتبر نیست.";
  }
}

export async function redeemPromotionAction(_previous: PromotionValidationActionState, formData: FormData): Promise<PromotionValidationActionState> {
  const promotionCode = normalizePromotionCode(formData.get("promotionCode"));
  if (!promotionCode) return {status: "error", error: "کد تخفیف را وارد کن."};
  try {
    const result = await authenticatedServerRequest((token) => redeemPromotion(token, promotionCode, randomUUID()), {nextPath: "/profile/billing", retryPolicy: "never"});
    revalidatePath("/profile/billing");
    return {status: "success", message: `${result.freeDays.toLocaleString("fa-IR")} روز دسترسی رایگان فعال شد.`};
  } catch (error) {
    if (error instanceof ApiClientError) return {status: "error", error: promotionErrorMessage(error), requestId: error.requestId};
    return {status: "error", error: "فعال‌سازی رایگان انجام نشد."};
  }
}
