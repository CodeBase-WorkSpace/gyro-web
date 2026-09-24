import Link from "next/link";
import {CircleAlertIcon, FileClockIcon, ReceiptTextIcon} from "lucide-react";

import {buttonVariants} from "@/components/ui/button";
import type {BillingHistoryResponse} from "@/lib/api/billing-history";
import {
  billingHistoryAction,
  billingHistoryOlderPageHref,
  formatBillingHistoryDate,
  formatBillingHistoryMoney,
  invoiceStatusView,
} from "@/lib/subscription/billing-history";

export function BillingHistorySection({
                                        history,
                                        failed,
                                        paginated = false,
                                      }: {
  history: BillingHistoryResponse | null;
  failed: boolean;
  paginated?: boolean;
}) {
  const olderPageHref = history ? billingHistoryOlderPageHref(history) : null;
  return (
    <section className="rounded-3xl border bg-card/90 p-4 shadow-sm sm:p-5" aria-labelledby="billing-history-title">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black text-primary">سوابق مالی</p>
          <h2 id="billing-history-title" className="mt-1 text-xl font-black">صورتحساب‌ها و پرداخت‌ها</h2>
          <p className="mt-1 text-sm font-medium leading-7 text-muted-foreground">
            وضعیت پرداخت، دوره اشتراک و شناسه لازم برای پیگیری پشتیبانی
          </p>
        </div>
        <ReceiptTextIcon className="size-5 shrink-0 text-primary" aria-hidden="true"/>
      </div>

      {failed ? (
        <div
          className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-bold leading-7 text-destructive">
          <CircleAlertIcon className="mt-1 size-4 shrink-0" aria-hidden="true"/>
          سوابق صورتحساب دریافت نشد. کمی بعد دوباره تلاش کنید یا شناسه درخواست خطا را برای پشتیبانی بفرستید.
        </div>
      ) : history?.invoices.length ? (
        <div className="grid gap-3">
          {history.invoices.map((invoice) => {
            const status = invoiceStatusView(invoice.status, invoice.latestPayment?.status);
            const action = billingHistoryAction(invoice);
            const discounted = invoice.amountAfterDiscount < invoice.amountDue;
            return (
              <article key={invoice.invoiceId} className="grid gap-4 rounded-2xl border bg-background/45 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <strong className="text-base font-black">اشتراک {invoice.planCode}</strong>
                    <p className="mt-1 text-xs font-bold text-muted-foreground">
                      {formatBillingHistoryDate(invoice.periodStart)} تا {formatBillingHistoryDate(invoice.periodEnd)}
                    </p>
                  </div>
                  <span className={statusTone(status.tone)}>{status.label}</span>
                </div>

                <div className="grid gap-2 text-sm font-bold sm:grid-cols-2 lg:grid-cols-4">
                  <HistoryDatum label="مبلغ پرداختی"
                                value={formatBillingHistoryMoney(invoice.amountAfterDiscount, invoice.currency)}/>
                  <HistoryDatum label="تاریخ صدور" value={formatBillingHistoryDate(invoice.createdAt)}/>
                  <HistoryDatum label="روش ثبت" value={invoice.manual ? "ثبت دستی تأییدشده" : "پرداخت آنلاین"}/>
                  <HistoryDatum label="کد تخفیف" value={invoice.promotionCode ?? "ندارد"}/>
                </div>

                {discounted ? (
                  <p className="text-xs font-bold text-muted-foreground">
                    مبلغ اولیه {formatBillingHistoryMoney(invoice.amountDue, invoice.currency)} بوده است.
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 text-xs font-bold leading-6 text-muted-foreground">
                    {invoice.latestPayment?.supportReference ? (
                      <p>
                        شناسه پیگیری پشتیبانی: <bdi
                        className="break-all text-foreground">{invoice.latestPayment.supportReference}</bdi>
                      </p>
                    ) : (
                      <p>برای این صورتحساب هنوز تلاش پرداختی ثبت نشده است.</p>
                    )}
                  </div>
                  {action ? (
                    <Link href={action.href}
                          className={buttonVariants({variant: "outline", className: "h-10 rounded-full font-black"})}>
                      {action.label}
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : paginated ? (
        <div
          className="grid place-items-center gap-2 rounded-2xl border border-dashed bg-background/45 p-8 text-center">
          <FileClockIcon className="size-8 text-muted-foreground" aria-hidden="true"/>
          <strong className="text-sm font-black">صورتحساب قدیمی‌تری وجود ندارد</strong>
          <p className="max-w-md text-xs font-bold leading-6 text-muted-foreground">
            به انتهای سوابق صورتحساب رسیده‌اید.
          </p>
        </div>
      ) : (
        <div
          className="grid place-items-center gap-2 rounded-2xl border border-dashed bg-background/45 p-8 text-center">
          <FileClockIcon className="size-8 text-muted-foreground" aria-hidden="true"/>
          <strong className="text-sm font-black">هنوز صورتحسابی ندارید</strong>
          <p className="max-w-md text-xs font-bold leading-6 text-muted-foreground">
            بعد از شروع پرداخت یا ثبت یک دوره اشتراک، سوابق آن اینجا نمایش داده می‌شود.
          </p>
        </div>
      )}

      {!failed && (olderPageHref || paginated) ? (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {olderPageHref ? (
            <Link
              href={olderPageHref}
              className={buttonVariants({variant: "outline", className: "h-10 rounded-full font-black"})}
            >
              نمایش صورتحساب‌های قدیمی‌تر
            </Link>
          ) : null}
          {paginated ? (
            <Link
              href="/profile/billing#billing-history-title"
              className={buttonVariants({variant: "ghost", className: "h-10 rounded-full font-black"})}
            >
              بازگشت به جدیدترین صورتحساب‌ها
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function HistoryDatum({label, value}: { label: string; value: string }) {
  return (
    <span className="rounded-xl border bg-card/70 px-3 py-2">
      <span className="block text-[0.65rem] text-muted-foreground">{label}</span>
      <span className="mt-1 block text-foreground">{value}</span>
    </span>
  );
}

function statusTone(tone: "good" | "pending" | "danger" | "quiet") {
  const base = "inline-flex h-8 items-center rounded-full px-3 text-xs font-black";
  if (tone === "good") return `${base} bg-primary/10 text-primary`;
  if (tone === "danger") return `${base} bg-destructive/10 text-destructive`;
  if (tone === "pending") return `${base} bg-amber-500/10 text-amber-700 dark:text-amber-300`;
  return `${base} bg-muted text-muted-foreground`;
}
