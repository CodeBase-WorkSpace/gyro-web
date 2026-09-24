"use server";

import {revalidatePath} from "next/cache";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {createAdminPrice, deactivateAdminPrice, getAdminPriceImpact, type CreatePricePayload} from "@/lib/api/admin-subscription-prices";

export async function previewPriceImpactAction(id: number) { try { return {ok: true as const, impact: await authenticatedServerRequest(token => getAdminPriceImpact(token, id), {nextPath: "/admin/subscription-prices", retryPolicy: "idempotent"})}; } catch { return {ok: false as const, message: "پیش‌نمایش اثر در دسترس نیست. دوباره تلاش کنید."}; } }
export async function createPriceAction(payload: CreatePricePayload) { try { const result = await authenticatedServerRequest(token => createAdminPrice(token, payload), {nextPath: "/admin/subscription-prices", retryPolicy: "never"}); revalidatePath("/admin/subscription-prices"); return {ok: true as const, result}; } catch { return {ok: false as const, message: "قیمت ذخیره نشد. فهرست را تازه کنید و دوباره تلاش کنید."}; } }
export async function deactivatePriceAction(id: number, reason: string) { try { await authenticatedServerRequest(token => deactivateAdminPrice(token, id, reason), {nextPath: "/admin/subscription-prices", retryPolicy: "never"}); revalidatePath("/admin/subscription-prices"); return {ok: true as const}; } catch { return {ok: false as const, message: "غیرفعال‌سازی انجام نشد؛ ابتدا جایگزین امن بسازید."}; } }
