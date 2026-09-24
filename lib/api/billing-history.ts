import {apiGet} from "./client";

export type BillingHistoryResponse = {
  invoices: BillingInvoiceSummary[];
  hasMore: boolean;
  nextBeforeCreatedAt?: string | null;
  nextBeforeInvoiceId?: string | null;
};

export type BillingHistoryCursor = {
  beforeCreatedAt: string;
  beforeInvoiceId: string;
};

export type BillingInvoiceSummary = {
  invoiceId: string;
  planCode: string;
  periodStart: string;
  periodEnd: string;
  amountDue: number;
  amountAfterDiscount: number;
  currency: string;
  status: string;
  promotionCode: string | null;
  manual: boolean;
  createdAt: string;
  updatedAt: string;
  latestPayment: {
    status: string;
    updatedAt: string;
    supportReference: string;
  } | null;
};

export function getBillingHistory(accessToken: string, limit = 20, before?: BillingHistoryCursor) {
  const boundedLimit = Math.max(1, Math.min(limit, 50));
  const params = new URLSearchParams({limit: String(boundedLimit)});
  if (before) {
    params.set("beforeCreatedAt", before.beforeCreatedAt);
    params.set("beforeInvoiceId", before.beforeInvoiceId);
  }
  return apiGet<BillingHistoryResponse>(`/billing/me/history?${params.toString()}`, accessToken);
}
