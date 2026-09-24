import {apiGet, apiPost} from "./client";

export type CurrentSubscription = {
  status: "NONE" | "ACTIVE" | "GRACE_PERIOD" | "CANCELED" | "EXPIRED" | "BILLED_BLOCKED";
  planCode?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  gracePeriodEnd?: string | null;
  graceReason?: "RENEWAL_OVERDUE" | null;
  nextAction: "RENEW" | "RESTORE" | "NONE";
};

export const getCurrentSubscription = (accessToken: string) => apiGet<CurrentSubscription>("/billing/me/subscription", accessToken);
export const cancelSubscription = (accessToken: string) => apiPost<CurrentSubscription>("/billing/me/subscription/cancel", undefined, {accessToken});
export const restoreSubscription = (accessToken: string) => apiPost<CurrentSubscription>("/billing/me/subscription/restore", undefined, {accessToken});
