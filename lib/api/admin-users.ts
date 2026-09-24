import {apiGet, apiPost} from "./client";

export type AdminUserSummaryDto = {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  role: string;
  status: string;
  emailVerificationStatus: string;
  phoneVerificationStatus: string;
  subscriptionStatus: string | null;
  promotionRedemptions: number;
  createdAt: string;
};

export type AdminUsersPageDto = {
  items: AdminUserSummaryDto[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export type AdminUserIdentityDto = {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  timezone: string | null;
  locale: string | null;
  role: string;
  status: string;
  emailVerificationStatus: string;
  phoneVerificationStatus: string;
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string | null;
};

export type AdminUserDetailDto = {
  identity: AdminUserIdentityDto;
  hasProfile: boolean;
  health: {
    nutritionPlans: number;
    planSchedules: number;
    weightEntries: number;
    dailyScores: number;
  };
  foodAndDiary: {
    diaryDays: number;
    diaryEntries: number;
    meals: number;
    mealItems: number;
    customFoods: number;
    foodFavorites: number;
    recentFoods: number;
  };
  authentication: {
    activeSessions: number;
    totalSessions: number;
  };
  billing: {
    subscriptions: number;
    invoices: number;
    paymentAttempts: number;
    manualGrants: number;
    promotionRedemptions: number;
    currentSubscriptionStatus: string | null;
    currentSubscription: {
      planCode: string;
      planName: string;
      status: string;
      periodStart: string;
      periodEnd: string | null;
      gracePeriodEnd: string | null;
      cancelAtPeriodEnd: boolean;
    } | null;
  };
  auditAndOperations: {
    auditEvents: number;
    deletionOperations: number;
  };
};

export type AdminDeletionPlanEntryDto = {
  domain: string;
  action: string;
  records: number;
};

export type AdminUserDeletionPreviewDto = {
  operationId: string;
  confirmationToken: string;
  expiresAt: string;
  target: AdminUserIdentityDto;
  confirmationValue: string;
  deletePlan: AdminDeletionPlanEntryDto[];
  retainPlan: AdminDeletionPlanEntryDto[];
};

export type AdminUserDeletionResultDto = {
  operationId: string;
  targetUserId: string;
  status: string;
  deletedCounts: Record<string, number>;
  retainedCounts: Record<string, number>;
  completedAt: string | null;
};

export type AdminManualGrantDto = {
  id: string; userId: string; planId: number; durationDays: number | null;
  periodStart: string | null; expiresAt: string | null; reason: string; reasonNote: string | null;
  grantedBy: string; promotionCode: string | null; revokedAt: string | null; revokedBy: string | null; revokeReason: string | null; createdAt: string;
};
export type AdminGrantPlanDto = {id: number; code: string; name: string};
export type EntitlementDto = {status: string; source: string; features: string[]};

export type AdminUsersSearch = {
  query?: string;
  role?: string;
  status?: string;
  page?: number;
};

export async function getAdminUsers(accessToken: string, search: AdminUsersSearch = {}) {
  const params = new URLSearchParams({size: "20", page: String(search.page ?? 0)});
  if (search.query) params.set("query", search.query);
  if (search.role) params.set("role", search.role);
  if (search.status) params.set("status", search.status);
  return apiGet<AdminUsersPageDto>(`/admin/users?${params.toString()}`, accessToken);
}

export function getAdminUserDetail(accessToken: string, userId: string) {
  return apiGet<AdminUserDetailDto>(`/admin/users/${encodeURIComponent(userId)}`, accessToken);
}

export function previewAdminUserDeletion(accessToken: string, userId: string) {
  return apiPost<AdminUserDeletionPreviewDto>(
    `/admin/users/${encodeURIComponent(userId)}/deletion-preview`,
    undefined,
    {accessToken},
  );
}

export function confirmAdminUserDeletion(
  accessToken: string,
  userId: string,
  body: {operationId: string; confirmationToken: string; confirmation: string; reason: string},
) {
  return apiPost<AdminUserDeletionResultDto>(
    `/admin/users/${encodeURIComponent(userId)}/delete`,
    body,
    {accessToken},
  );
}

export function getAdminUserGrants(accessToken: string, userId: string) {
  return apiGet<AdminManualGrantDto[]>(`/admin/grants/user/${encodeURIComponent(userId)}`, accessToken);
}
export function getAdminGrantPlans(accessToken: string) { return apiGet<AdminGrantPlanDto[]>("/admin/grants/plans", accessToken); }
export function getAdminUserEntitlement(accessToken: string, userId: string) { return apiGet<EntitlementDto>(`/admin/users/${encodeURIComponent(userId)}/entitlement`, accessToken); }
export function createAdminGrant(accessToken: string, body: {userId: string; planId: number; durationDays: number; reason: string; reasonNote: string}) {
  return apiPost<AdminManualGrantDto>("/admin/grants", body, {accessToken});
}
export function extendAdminGrant(accessToken: string, grantId: string, body: {additionalDays: number; reason: string}) {
  return apiPost<AdminManualGrantDto>(`/admin/grants/${encodeURIComponent(grantId)}/extend`, body, {accessToken});
}
export function revokeAdminGrant(accessToken: string, grantId: string, reason: string) {
  return apiPost<void>(`/admin/grants/${encodeURIComponent(grantId)}/revoke`, {reason}, {accessToken});
}
export function recalculateAdminEntitlement(accessToken: string, userId: string, reason: string) {
  return apiPost<EntitlementDto>(`/admin/grants/user/${encodeURIComponent(userId)}/recalculate-entitlement`, {reason}, {accessToken});
}
