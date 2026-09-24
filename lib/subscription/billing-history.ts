import type {BillingHistoryResponse, BillingInvoiceSummary} from "@/lib/api/billing-history";

export type BillingHistoryStatusView = {
  label: string;
  tone: "good" | "pending" | "danger" | "quiet";
};

export function invoiceStatusView(status: string, paymentStatus?: string | null): BillingHistoryStatusView {
  if (status === "PAID") return {label: "پرداخت‌شده", tone: "good"};
  if (status === "REFUNDED") return {label: "بازپرداخت‌شده", tone: "quiet"};
  if (status === "VOID") return {label: "لغوشده", tone: "quiet"};
  if (paymentStatus === "VERIFY_PENDING" || paymentStatus === "PENDING") {
    return {label: "در حال تأیید پرداخت", tone: "pending"};
  }
  if (paymentStatus === "FAILED" || paymentStatus === "CREATE_FAILED" || paymentStatus === "CANCELLED") {
    return {label: "پرداخت ناموفق", tone: "danger"};
  }
  return {label: "در انتظار پرداخت", tone: "pending"};
}

export function billingHistoryAction(invoice: BillingInvoiceSummary): { label: string; href: string } | null {
  if (invoice.latestPayment?.status === "VERIFY_PENDING" || invoice.latestPayment?.status === "PENDING") return null;
  if (invoice.status === "PAID") return {label: "تمدید اشتراک", href: "#plans"};
  if (invoice.status === "OPEN") return {label: "تلاش دوباره", href: "#plans"};
  return {label: "خرید اشتراک", href: "#plans"};
}

export function billingHistoryOlderPageHref(history: BillingHistoryResponse): string | null {
  if (!history.hasMore || !history.nextBeforeCreatedAt || !history.nextBeforeInvoiceId) return null;
  const params = new URLSearchParams({
    historyBeforeCreatedAt: history.nextBeforeCreatedAt,
    historyBeforeInvoiceId: history.nextBeforeInvoiceId,
  });
  return `/profile/billing?${params.toString()}#billing-history-title`;
}

export function formatBillingHistoryMoney(amount: number, currency: string): string {
  if (currency === "IRR") return `${new Intl.NumberFormat("fa-IR").format(amount / 10)} تومان`;
  return `${new Intl.NumberFormat("fa-IR").format(amount)} ${currency}`;
}

export function formatBillingHistoryDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "تاریخ نامعتبر";
  return new Intl.DateTimeFormat("fa-IR", {dateStyle: "medium", timeZone: "Asia/Tehran"}).format(date);
}
