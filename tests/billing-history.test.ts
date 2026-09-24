import assert from "node:assert/strict";
import test from "node:test";

import type {BillingInvoiceSummary} from "../lib/api/billing-history";
import {
  billingHistoryAction,
  billingHistoryOlderPageHref,
  formatBillingHistoryMoney,
  invoiceStatusView,
} from "../lib/subscription/billing-history";

const invoice: BillingInvoiceSummary = {
  invoiceId: "invoice-1",
  planCode: "ADVANCED",
  periodStart: "2026-07-10T00:00:00Z",
  periodEnd: "2026-08-09T00:00:00Z",
  amountDue: 3_000_000,
  amountAfterDiscount: 2_400_000,
  currency: "IRR",
  status: "OPEN",
  promotionCode: "OFF20",
  manual: false,
  createdAt: "2026-07-10T00:00:00Z",
  updatedAt: "2026-07-10T00:00:00Z",
  latestPayment: null,
};

test("maps pending verification before generic open invoice state", () => {
  assert.deepEqual(invoiceStatusView("OPEN", "VERIFY_PENDING"), {label: "در حال تأیید پرداخت", tone: "pending"});
});

test("does not offer duplicate payment while verification is pending", () => {
  assert.equal(billingHistoryAction({
    ...invoice, latestPayment: {
      status: "VERIFY_PENDING",
      updatedAt: invoice.updatedAt,
      supportReference: "request-1",
    }
  }), null);
});

test("offers retry for failed open invoice and renewal for paid invoice", () => {
  assert.deepEqual(billingHistoryAction(invoice), {label: "تلاش دوباره", href: "#plans"});
  assert.deepEqual(billingHistoryAction({...invoice, status: "PAID"}), {label: "تمدید اشتراک", href: "#plans"});
});

test("formats Iranian rial amounts as toman", () => {
  assert.equal(formatBillingHistoryMoney(2_400_000, "IRR"), "۲۴۰٬۰۰۰ تومان");
});

test("builds an older-page link only when the backend reports more invoices", () => {
  assert.equal(
    billingHistoryOlderPageHref({
      invoices: [invoice],
      hasMore: true,
      nextBeforeCreatedAt: "2026-07-10T00:00:00Z",
      nextBeforeInvoiceId: "0b9260cf-49cb-4a51-bb62-92d2e2a28a1a",
    }),
    "/profile/billing?historyBeforeCreatedAt=2026-07-10T00%3A00%3A00Z&historyBeforeInvoiceId=0b9260cf-49cb-4a51-bb62-92d2e2a28a1a#billing-history-title",
  );
  assert.equal(billingHistoryOlderPageHref({invoices: [invoice], hasMore: false}), null);
});
