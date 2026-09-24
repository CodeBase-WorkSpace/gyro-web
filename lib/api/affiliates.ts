import {apiGet, apiPost, apiPut} from "./client";

export type Affiliate = {id: string; displayName: string; status: "ACTIVE" | "INACTIVE"; code: string; discountPercentage: number; commissionPercentage: number; linkedUserId: string | null; applicablePlanId: number | null; applicablePriceId: number | null; startsAt: string; endsAt: string | null; maxRedemptions: number | null; internalNotes: string | null; version: number; successfulCustomers: number; customerPaidAmount: number; earnedAmount: number};
export type AffiliatePage = {content: Affiliate[]; page: number; size: number; totalElements: number; totalPages: number};
export type AffiliateSummary = {status: "ACTIVE" | "INACTIVE"; code: string; discountPercentage: number; commissionPercentage: number; successfulCustomerCount: number; totalCustomerPaidAmount: number; totalEarnedAmount: number; currentMonthCustomerCount: number; currentMonthCustomerPaidAmount: number; currentMonthEarnedAmount: number; currency: string};
export type AffiliateEarnings = {granularity: "daily" | "monthly"; from: string; to: string; buckets: {period: string; successfulCustomerCount: number; customerPaidAmount: number; earnedAmount: number; currency: string}[]};
export type AffiliateAvailability = {available: boolean};

export const getAdminAffiliates = (token: string) => apiGet<AffiliatePage>("/admin/affiliates?page=0&size=100", token);
export const createAdminAffiliate = (token: string, body: unknown) => apiPost<Affiliate>("/admin/affiliates", body, {accessToken: token});
export const updateAdminAffiliate = (token: string, id: string, body: unknown) => apiPut<Affiliate>(`/admin/affiliates/${id}`, body, {accessToken: token});
export const setAdminAffiliateActive = (token: string, id: string, active: boolean) => apiPost<Affiliate>(`/admin/affiliates/${id}/${active ? "activate" : "deactivate"}`, undefined, {accessToken: token});
export const assignAdminAffiliateAccount = (token: string, id: string, userId: string | null) => apiPut<Affiliate>(`/admin/affiliates/${id}/account`, {userId}, {accessToken: token});
export const getAffiliateSummary = (token: string) => apiGet<AffiliateSummary>("/me/affiliate/summary", token);
export const getAffiliateAvailability = (token: string) => apiGet<AffiliateAvailability>("/me/affiliate/availability", token);
export const getAffiliateEarnings = (token: string, from: string, to: string) => apiGet<AffiliateEarnings>(`/me/affiliate/earnings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&granularity=monthly`, token);
