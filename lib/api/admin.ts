import {apiGet} from "./client";

export type AdminReadinessArea = {
  key: string;
  owner: "backend" | "frontend" | "mobile" | "platform";
  readiness: number;
  status: string;
};

export type AdminBillingSnapshot = {
  counts: {
    openInvoices: number;
    paidInvoices: number;
    pendingAttempts: number;
    failedAttempts: number;
  };
  recentAttempts: AdminPaymentAttemptSummary[];
};

export type AdminPaymentAttemptSummary = {
  paymentAttemptId: string;
  invoiceId: string;
  userId: string;
  email: string | null;
  phoneNumber: string | null;
  subscriptionId: string | null;
  provider: string;
  clientRefId: string;
  providerCode: string | null;
  providerRefId: string | null;
  providerRequestId: string | null;
  attemptStatus: string;
  invoiceStatus: string;
  subscriptionStatus: string | null;
  amount: number;
  currency: string;
  reversible: boolean;
  createdAt: string;
  updatedAt: string;
  latestEventType: string | null;
  latestEventAt: string | null;
  latestSafeSummary: string | null;
};

export type AdminBillingSearch = {
  query?: string;
  status?: string;
  limit?: number;
};
export type AdminLifecycleSnapshot = { subscriptionsByStatus: Record<string, number>; outboxByStatus: Record<string, number>; overdueExpiry: number; overdueGraceExit: number; oldestPendingOutboxAgeSeconds: number; staleAttemptsLast24h: number; remindersLast24h: number; failedEvents: Array<{id: number; eventType: string; retryCount: number; lastError: string; createdAt: string}> };

export type AdminBillingInvoiceDetail = {
  invoice: import("./billing-history").BillingInvoiceSummary;
  user: {
    userId: string;
    email: string | null;
    phoneNumber: string | null;
  };
  paymentAttempts: Array<{
    paymentAttemptId: string;
    provider: string;
    clientRefId: string;
    providerCode: string | null;
    providerRefId: string | null;
    providerRequestId: string | null;
    status: string;
    amount: number;
    currency: string;
    reversible: boolean;
    createdAt: string;
    updatedAt: string;
    events: Array<{ eventType: string; safeSummary: string | null; createdAt: string }>;
  }>;
  subscriptionEvents: Array<{
    transitionType: string;
    sourceType: string;
    statusBefore: string | null;
    statusAfter: string | null;
    reason: string | null;
    createdAt: string;
  }>;
};

export async function getAdminBillingSnapshot(accessToken: string, search: AdminBillingSearch = {}) {
  const params = new URLSearchParams({limit: String(search.limit ?? 20)});
  if (search.query) params.set("query", search.query);
  if (search.status) params.set("status", search.status);
  return apiGet<AdminBillingSnapshot>(`/admin/billing?${params.toString()}`, accessToken);
}

export function getAdminBillingInvoice(accessToken: string, invoiceId: string) {
  return apiGet<AdminBillingInvoiceDetail>(`/admin/billing/invoices/${encodeURIComponent(invoiceId)}`, accessToken);
}
export const getAdminBillingLifecycle = (accessToken: string) => apiGet<AdminLifecycleSnapshot>("/admin/billing/lifecycle", accessToken);
