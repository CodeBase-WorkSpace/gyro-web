import {apiGet, apiPost, apiPut} from "./client";

export type AdminPromotion = {id: number; code: string; type: string; value: number; applicablePlanId: number | null; applicableSubscriptionPriceId: number | null; startsAt: string; endsAt: string | null; maxRedemptions: number | null; perUserRedemptionLimit: number; active: boolean; internalNotes: string | null; version: number; counts?: Record<string, number>};
export type AdminPromotionPage = {items: AdminPromotion[]; page: number; size: number; totalItems: number; totalPages: number};
export type AdminPromotionPayload = Omit<AdminPromotion, "id" | "version" | "counts"> & {expectedVersion?: number};
export function getAdminPromotions(token: string, page = 0) { return apiGet<AdminPromotionPage>(`/admin/promotions?page=${page}&size=20`, token); }
export function getAdminPromotion(token: string, id: string) { return apiGet<AdminPromotion>(`/admin/promotions/${id}`, token); }
export function createAdminPromotion(token: string, payload: AdminPromotionPayload) { return apiPost<AdminPromotion>("/admin/promotions", payload, {accessToken: token}); }
export function updateAdminPromotion(token: string, id: number, payload: AdminPromotionPayload) { return apiPut<AdminPromotion>(`/admin/promotions/${id}`, payload, {accessToken: token}); }
export function archiveAdminPromotion(token: string, id: number, expectedVersion: number) { return apiPost<void>(`/admin/promotions/${id}/archive`, {expectedVersion}, {accessToken: token}); }
