import {apiGet, apiPost} from "./client";

export type AdminSubscriptionPrice = {id: number; planId: number; billingPeriodDays: number; baseAmount: number; discountPercent: number; amount: number; currency: string; badge: string | null; active: boolean; scheduled: boolean; validFrom: string; validUntil: string | null; internalNotes: string | null; expectedPredecessorId: number | null; activationConflictedAt: string | null; activationConflictReason: string | null; version: number};
export type AdminPricePlan = {id: number; code: string; name: string; free: boolean; active: boolean; prices: AdminSubscriptionPrice[]};
export type PriceImpact = {activeSubscriptions: number; openInvoices: number; pendingPaymentAttempts: number; activePromotions: number};
export type PriceMutation = {created: AdminSubscriptionPrice; retired: AdminSubscriptionPrice | null};
export type CreatePricePayload = {planId: number; billingPeriodDays: number; baseAmount: number; discountPercent: number; currency: string; badge: string | null; validFrom: string; internalNotes: string | null; expectedCurrentPriceId: number | null};
export const getAdminPricePlans = (token: string) => apiGet<AdminPricePlan[]>("/admin/subscription-prices/plans", token);
export const getAdminPriceImpact = (token: string, id: number) => apiGet<PriceImpact>(`/admin/subscription-prices/${id}/impact`, token);
export const createAdminPrice = (token: string, payload: CreatePricePayload) => apiPost<PriceMutation>("/admin/subscription-prices", payload, {accessToken: token});
export const deactivateAdminPrice = (token: string, id: number, reason: string) => apiPost<AdminSubscriptionPrice>(`/admin/subscription-prices/${id}/deactivate`, {reason}, {accessToken: token});

export function formatToman(amountInRials: number) {
  return `${Math.round(amountInRials / 10).toLocaleString("fa-IR")} تومان`;
}

export function calculateCatalogAmount(baseAmount: number, discountPercent: number) {
  return Math.round((baseAmount * (100 - discountPercent) / 100 + Number.EPSILON) * 100) / 100;
}

export const durationLabel = (days: number) => days === 30 ? "ماهانه" : days === 90 ? "سه‌ماهه" : days === 365 ? "سالانه" : `${days.toLocaleString("fa-IR")} روزه`;
