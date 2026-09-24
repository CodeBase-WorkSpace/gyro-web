"use server";
import {revalidatePath} from "next/cache";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {archiveAdminPromotion, createAdminPromotion, updateAdminPromotion, type AdminPromotionPayload} from "@/lib/api/admin-promotions";
import {ApiClientError} from "@/lib/api/errors";
export async function saveAdminPromotionAction(payload: AdminPromotionPayload, id?: number) { try { const promotion = await authenticatedServerRequest(token => id ? updateAdminPromotion(token, id, payload) : createAdminPromotion(token, payload), {nextPath: "/admin/promotions", retryPolicy: "never"}); revalidatePath("/admin/promotions"); if (id) revalidatePath(`/admin/promotions/${id}`); return {ok: true as const, promotion}; } catch (error) { return {ok: false as const, message: promotionErrorMessage(error, "ذخیره کد تخفیف انجام نشد.")}; } }
export async function archiveAdminPromotionAction(id: number, expectedVersion: number) { try { await authenticatedServerRequest(token => archiveAdminPromotion(token, id, expectedVersion), {nextPath: `/admin/promotions/${id}`, retryPolicy: "never"}); revalidatePath("/admin/promotions"); return {ok: true as const}; } catch (error) { return {ok: false as const, message: promotionErrorMessage(error, "بایگانی کد تخفیف انجام نشد.")}; } }

function promotionErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof ApiClientError)) return fallback;
  switch (error.reasonCode ?? error.code) {
    case "promotion_plan_mismatch": return "پلن انتخاب‌شده وجود ندارد یا فعال نیست.";
    case "promotion_invalid_window": return "پایان اعتبار باید بعد از شروع اعتبار باشد.";
    case "promotion_invalid_value": return "تنظیمات کد تخفیف معتبر نیست.";
    case "promotion_code_conflict": return "این کد تخفیف قبلاً ثبت شده است.";
    case "promotion_version_conflict": return "این کد در صفحه دیگری تغییر کرده است. صفحه را تازه‌سازی و دوباره تلاش کن.";
    case "promotion_immutable_field": return "کد و نوع اثر پس از ساخت قابل تغییر نیستند.";
    default: return error.message || fallback;
  }
}
