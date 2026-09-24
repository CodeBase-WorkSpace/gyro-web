"use client";

import {useState} from "react";
import {ChevronDownIcon} from "lucide-react";
import Link from "next/link";

import type {AdminPaymentAttemptSummary} from "@/lib/api/admin";

export function PaymentAttemptAccordion({attempt}: { attempt: AdminPaymentAttemptSummary }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="overflow-hidden rounded-2xl border bg-background/45">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-4 text-start transition-colors hover:bg-muted/40"
      >
        <div className="min-w-0">
          <strong className="text-sm font-black text-foreground">
            {attempt.attemptStatus}
          </strong>
          <p className="mt-1 text-xs font-bold leading-6 text-muted-foreground">
            {formatAdminLocalDateTime(attempt.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={statusTone(attempt.attemptStatus)}
          >
            {attempt.attemptStatus}
          </span>
          <ChevronDownIcon
            className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open ? (
        <div className="grid gap-3 border-t bg-card/40 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold leading-6 text-muted-foreground">
                {formatAdminMoney(attempt.amount, attempt.currency)} · invoice {attempt.invoiceStatus}
                {attempt.subscriptionStatus ? ` · subscription ${attempt.subscriptionStatus}` : ""}
              </p>
            </div>
            <span
              className="inline-flex h-8 items-center rounded-full border bg-background/70 px-3 text-xs font-black text-foreground">
              {attempt.reversible ? "قابل برگشت" : "غیرقابل برگشت"}
            </span>
          </div>
          <div className="grid gap-2 text-xs font-bold text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
            <AdminReference label="کاربر" value={attempt.userId}/>
            <AdminReference label="ایمیل" value={attempt.email ?? "ثبت نشده"}/>
            <AdminReference label="شماره تماس" value={attempt.phoneNumber ?? "ثبت نشده"}/>
            <AdminReference label="صورتحساب" value={attempt.invoiceId}/>
            <AdminReference label="تلاش پرداخت" value={attempt.paymentAttemptId}/>
            <AdminReference label="اشتراک" value={attempt.subscriptionId ?? "ندارد"}/>
            <AdminReference label="PayPing code" value={attempt.providerCode ?? "ثبت نشده"}/>
            <AdminReference label="PayPing refId" value={attempt.providerRefId ?? "ثبت نشده"}/>
            <AdminReference label="clientRefId" value={attempt.clientRefId}/>
            <AdminReference label="requestId" value={attempt.providerRequestId ?? "ثبت نشده"}/>
            <AdminReference label="زمان پرداخت" value={formatAdminLocalDateTime(attempt.createdAt)}/>
            <AdminReference label="آخرین بروزرسانی" value={formatAdminLocalDateTime(attempt.updatedAt)}/>
            <AdminReference label="زمان گزارش provider"
                            value={attempt.latestEventAt ? formatAdminLocalDateTime(attempt.latestEventAt) : "ثبت نشده"}/>
          </div>
          <div className="flex justify-end">
            <Link
              href={`/admin/billing?invoiceId=${encodeURIComponent(attempt.invoiceId)}`}
              className="inline-flex h-9 items-center rounded-full border bg-background px-3 text-xs font-black text-foreground transition-colors hover:bg-muted"
            >
              مشاهده خط زمانی صورتحساب
            </Link>
          </div>
          <div className="rounded-2xl border bg-card/70 p-3 text-xs font-bold leading-6 text-muted-foreground">
            <span className="text-foreground">آخرین رویداد: </span>
            {attempt.latestEventType ?? "ثبت نشده"}
            {attempt.latestEventAt ? (
              <span className="me-2 text-muted-foreground">
                {formatAdminLocalDateTime(attempt.latestEventAt)}
              </span>
            ) : null}
            {attempt.latestSafeSummary ? (
              <code
                className="mt-2 block overflow-x-auto rounded-xl bg-muted px-3 py-2 text-[0.7rem] leading-5 text-muted-foreground">
                {attempt.latestSafeSummary}
              </code>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function AdminReference({label, value}: { label: string; value: string }) {
  return (
    <span className="min-w-0 rounded-xl border bg-card/70 px-3 py-2">
      <span className="block text-[0.65rem] text-muted-foreground">{label}</span>
      <bdi className="block truncate text-foreground" title={value}>{value}</bdi>
    </span>
  );
}

function statusTone(status: string): string {
  switch (status) {
    case "VERIFIED":
      return "inline-flex h-7 items-center rounded-full bg-primary/10 px-2.5 text-xs font-black text-primary";
    case "FAILED":
    case "CANCELLED":
      return "inline-flex h-7 items-center rounded-full bg-destructive/10 px-2.5 text-xs font-black text-destructive";
    case "PENDING":
    case "VERIFY_PENDING":
      return "inline-flex h-7 items-center rounded-full bg-muted px-2.5 text-xs font-black text-muted-foreground";
    default:
      return "inline-flex h-7 items-center rounded-full border bg-background/70 px-2.5 text-xs font-black text-foreground";
  }
}

function formatAdminMoney(amount: number, currency: string) {
  if (currency === "IRR") {
    return `${new Intl.NumberFormat("fa-IR").format(amount / 10)} تومان`;
  }
  return `${new Intl.NumberFormat("fa-IR").format(amount)} ${currency}`;
}

function formatAdminLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "زمان نامعتبر";

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  }).format(date);
}
