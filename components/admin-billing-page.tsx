"use client";

import {ReceiptTextIcon, SearchIcon} from "lucide-react";
import type {FormEvent} from "react";
import {useEffect, useState, useTransition} from "react";

import {PaymentAttemptAccordion} from "@/components/admin-panel/payment-attempt-accordion";
import {AppTopBar} from "@/components/design-system/app-top-bar";
import {MetricTile} from "@/components/design-system/metric-tile";
import {Button} from "@/components/ui/button";
import {Field, FieldGroup, FieldLabel} from "@/components/ui/field";
import {FormSelect} from "@/components/ui/form-select";
import {Input} from "@/components/ui/input";
import {Spinner} from "@/components/ui/spinner";
import type {AdminBillingInvoiceDetail, AdminBillingSnapshot, AdminLifecycleSnapshot} from "@/lib/api/admin";
import {
  formatBillingHistoryDate,
  formatBillingHistoryMoney,
  invoiceStatusView
} from "@/lib/subscription/billing-history";
import {toPersianDigits} from "@/lib/format";

export function AdminBillingPageView({
                                       snapshot,
                                       snapshotFailed,
                                       detail,
                                       detailFailed,
                                       search,
                                       lifecycle,
                                     }: {
  snapshot: AdminBillingSnapshot | null;
  snapshotFailed: boolean;
  detail: AdminBillingInvoiceDetail | null;
  detailFailed: boolean;
  search: { query?: string; status?: string; invoiceId?: string };
  lifecycle: AdminLifecycleSnapshot | null;
}) {
  const [currentSnapshot, setCurrentSnapshot] = useState(snapshot);
  const [currentSnapshotFailed, setCurrentSnapshotFailed] = useState(snapshotFailed);
  const [query, setQuery] = useState(search.query ?? "");
  const [status, setStatus] = useState(search.status ?? "");
  const [appliedSearch, setAppliedSearch] = useState(search);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, startSearchTransition] = useTransition();

  useEffect(() => {
    setCurrentSnapshot(snapshot);
    setCurrentSnapshotFailed(snapshotFailed);
    setQuery(search.query ?? "");
    setStatus(search.status ?? "");
    setAppliedSearch(search);
  }, [search, snapshot, snapshotFailed]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch(query, status);
  }

  function clearSearch() {
    setQuery("");
    setStatus("");
    runSearch("", "");
  }

  function runSearch(nextQuery: string, nextStatus: string) {
    setSearchError(null);
    startSearchTransition(async () => {
      try {
        const nextSearch = normalizedSearch(nextQuery, nextStatus);
        const response = await fetch(adminBillingSearchUrl(nextSearch), {
          method: "GET",
          headers: {Accept: "application/json"},
        });
        if (!response.ok) throw new Error(`Admin billing search failed with ${response.status}`);

        const nextSnapshot = await response.json() as AdminBillingSnapshot;
        setCurrentSnapshot(nextSnapshot);
        setCurrentSnapshotFailed(false);
        setAppliedSearch(nextSearch);
        syncSearchUrl(nextSearch);
      } catch (error) {
        console.warn("event=admin_billing_client_search outcome=failure", error);
        setSearchError("جستجوی صورتحساب انجام نشد. دوباره تلاش کنید.");
      }
    });
  }

  const metrics = currentSnapshot ? [
    {
      label: "صورتحساب باز",
      value: currentSnapshot.counts.openInvoices,
      helper: "در انتظار پرداخت یا بررسی",
      tone: "warn" as const
    },
    {
      label: "صورتحساب پرداخت‌شده",
      value: currentSnapshot.counts.paidInvoices,
      helper: "فعال‌شده بعد از تأیید",
      tone: "good" as const
    },
    {
      label: "تلاش در انتظار",
      value: currentSnapshot.counts.pendingAttempts,
      helper: "PENDING و VERIFY_PENDING",
      tone: "quiet" as const
    },
    {
      label: "تلاش ناموفق",
      value: currentSnapshot.counts.failedAttempts,
      helper: "نیازمند پیگیری پشتیبانی",
      tone: "warn" as const
    },
  ] : [];

  return (
    <main id="main-content"
          className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">
      <AppTopBar
        title="صورتحساب و پرداخت‌ها"
        description="جستجوی پشتیبانی، شناسه‌های امن و خط زمانی صورتحساب"
        backLink={{href: "/admin", label: "بازگشت به پنل ادمین"}}
        showDateControl={false}
        showMobileDateAction={false}
      />

      {currentSnapshotFailed ? (
        <p
          className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-bold text-destructive">
          داده‌های صورتحساب از backend دریافت نشد.
        </p>
      ) : null}

      {metrics.length ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="شاخص‌های صورتحساب">
          {metrics.map((metric) => (
            <MetricTile key={metric.label} {...metric} value={toPersianDigits(metric.value)}
                        helper={toPersianDigits(metric.helper)}/>
          ))}
        </section>
      ) : null}

      {lifecycle ? <section className="rounded-3xl border bg-card/90 p-4 shadow-sm"><SectionHeader eyebrow="چرخه اشتراک و outbox" title="عملیات چرخه" icon={<ReceiptTextIcon className="size-4"/>}/><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricTile label="Outbox در انتظار" value={toPersianDigits(lifecycle.outboxByStatus.PENDING ?? 0)} helper={`قدیمی‌ترین: ${toPersianDigits(lifecycle.oldestPendingOutboxAgeSeconds)} ثانیه`} tone="warn"/><MetricTile label="رویداد ناموفق" value={toPersianDigits(lifecycle.outboxByStatus.FAILED ?? 0)} helper="نیازمند تعمیر دستی" tone="warn"/><MetricTile label="انقضای عقب‌افتاده" value={toPersianDigits(lifecycle.overdueExpiry)} helper="دوره یا مهلت grace" tone="quiet"/><MetricTile label="یادآوری ۲۴ ساعت" value={toPersianDigits(lifecycle.remindersLast24h)} helper="فقط ثبت شده" tone="good"/></div>{lifecycle.failedEvents.length ? <div className="mt-4 grid gap-2">{lifecycle.failedEvents.map((event) => <p key={event.id} className="rounded-xl border p-3 text-xs font-bold">{event.eventType} · تلاش {event.retryCount} · {event.lastError || "خطای ثبت‌نشده"}</p>)}</div> : null}</section> : null}

      <section className="rounded-3xl border bg-card/90 p-4 shadow-sm sm:p-5" aria-label="جستجوی پرداخت">
        <SectionHeader eyebrow="پشتیبانی پرداخت" title="جستجوی صورتحساب" icon={<SearchIcon className="size-4"/>}/>
        <form className="grid gap-4" onSubmit={submitSearch}>
          <FieldGroup className="md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="admin-search-query">پرداخت، کاربر، صورتحساب، ایمیل یا شماره تماس</FieldLabel>
              <Input id="admin-search-query" name="query" type="search" value={query} maxLength={128}
                     onChange={(event) => setQuery(event.currentTarget.value)}/>
            </Field>
            <Field>
              <FieldLabel htmlFor="admin-payment-status">وضعیت تلاش پرداخت</FieldLabel>
              <FormSelect
                id="admin-payment-status"
                value={status || "all"}
                options={billingStatusOptions}
                className="h-10 rounded-md font-bold"
                onValueChange={(value) => setStatus(value === "all" ? "" : value)}
              />
            </Field>
          </FieldGroup>
          <div className="flex flex-wrap justify-end gap-2">
            {query || status || appliedSearch.invoiceId ? (
              <Button type="button" variant="outline" className="h-11 rounded-full font-black"
                      disabled={isSearching} onClick={clearSearch}>پاک‌کردن فیلترها</Button>
            ) : null}
            <Button className="h-11 rounded-full font-black" type="submit" disabled={isSearching}>
              {isSearching ? <Spinner data-icon="inline-start"/> : null}{isSearching ? "در حال جستجو" : "جستجو"}
            </Button>
          </div>
          {searchError ? <p role="alert" className="text-sm font-bold text-destructive">{searchError}</p> : null}
        </form>
      </section>

      <section className="rounded-3xl border bg-card/90 p-4 shadow-sm sm:p-5" aria-label="نتایج پرداخت">
        <SectionHeader
          eyebrow="تلاش‌های پرداخت"
          title={appliedSearch.query || appliedSearch.status ? "نتایج جستجو" : "پرداخت‌های اخیر"}
          icon={<ReceiptTextIcon className="size-4"/>}
        />
        {currentSnapshot?.recentAttempts.length ? (
          <div className="grid gap-2">
            {currentSnapshot.recentAttempts.map((attempt) => (
              <PaymentAttemptAccordion key={attempt.paymentAttemptId} attempt={attempt}/>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed p-5 text-sm font-bold text-muted-foreground">نتیجه‌ای پیدا
            نشد.</p>
        )}
      </section>

      {appliedSearch.invoiceId ? (
        <AdminInvoiceTimeline detail={detail} failed={detailFailed}/>
      ) : null}
    </main>
  );
}

function syncSearchUrl(search: { query?: string; status?: string }) {
  const params = new URLSearchParams();
  if (search.query) params.set("query", search.query);
  if (search.status) params.set("status", search.status);
  const queryString = params.toString();
  window.history.replaceState(null, "", queryString ? `/admin/billing?${queryString}` : "/admin/billing");
}

function adminBillingSearchUrl(search: { query?: string; status?: string }) {
  const params = new URLSearchParams();
  if (search.query) params.set("query", search.query);
  if (search.status) params.set("status", search.status);
  const queryString = params.toString();
  return queryString ? `/api/admin/billing/search?${queryString}` : "/api/admin/billing/search";
}

function normalizedSearch(query: string, status: string) {
  const normalizedQuery = query.trim().slice(0, 128);
  const normalizedStatus = status.trim().slice(0, 32);
  return {
    query: normalizedQuery || undefined,
    status: normalizedStatus || undefined,
  };
}

const billingStatusOptions = [
  {value: "all", label: "همه وضعیت‌ها"},
  {value: "PENDING", label: "در انتظار"},
  {value: "VERIFY_PENDING", label: "در انتظار تأیید"},
  {value: "VERIFIED", label: "تأییدشده"},
  {value: "FAILED", label: "ناموفق"},
  {value: "CREATE_FAILED", label: "خطای ساخت پرداخت"},
  {value: "CANCELLED", label: "لغوشده"},
] as const;

function AdminInvoiceTimeline({detail, failed}: { detail: AdminBillingInvoiceDetail | null; failed: boolean }) {
  if (failed || !detail) {
    return (
      <section
        className="rounded-3xl border border-destructive/40 bg-destructive/10 p-5 text-sm font-bold text-destructive">
        جزئیات صورتحساب پیدا نشد یا قابل دریافت نیست.
      </section>
    );
  }

  const status = invoiceStatusView(detail.invoice.status, detail.invoice.latestPayment?.status);
  return (
    <section className="grid gap-4 rounded-3xl border bg-card/90 p-4 shadow-sm sm:p-5"
             aria-labelledby="admin-invoice-detail-title">
      <SectionHeader eyebrow="خط زمانی امن" title="جزئیات صورتحساب" icon={<ReceiptTextIcon className="size-4"/>}/>
      <div className="grid gap-2 text-sm font-bold sm:grid-cols-2 lg:grid-cols-4">
        <Datum label="کاربر" value={detail.user.userId}/>
        <Datum label="ایمیل" value={detail.user.email ?? "ثبت نشده"}/>
        <Datum label="شماره تماس" value={detail.user.phoneNumber ?? "ثبت نشده"}/>
        <Datum label="وضعیت صورتحساب" value={status.label}/>
        <Datum label="مبلغ"
               value={formatBillingHistoryMoney(detail.invoice.amountAfterDiscount, detail.invoice.currency)}/>
        <Datum label="کد تخفیف" value={detail.invoice.promotionCode ?? "ندارد"}/>
        <Datum label="روش ثبت" value={detail.invoice.manual ? "دستی" : "آنلاین"}/>
        <Datum label="دوره"
               value={`${formatBillingHistoryDate(detail.invoice.periodStart)} تا ${formatBillingHistoryDate(detail.invoice.periodEnd)}`}/>
      </div>

      <Timeline title="تلاش‌ها و رویدادهای پرداخت">
        {detail.paymentAttempts.length ? detail.paymentAttempts.flatMap((attempt) => [
          <TimelineItem
            key={attempt.paymentAttemptId}
            title={`${attempt.provider} · ${attempt.status}`}
            date={attempt.updatedAt}
            detail={`attempt ${attempt.paymentAttemptId} · request ${attempt.providerRequestId ?? "ندارد"} · ref ${attempt.providerRefId ?? "ندارد"}`}
          />,
          ...attempt.events.map((event, index) => (
            <TimelineItem
              key={`${attempt.paymentAttemptId}-${event.eventType}-${index}`}
              title={event.eventType}
              date={event.createdAt}
              detail={event.safeSummary ?? "خلاصه امن ثبت نشده"}
            />
          )),
        ]) : <EmptyTimeline/>}
      </Timeline>

      <Timeline title="رویدادهای چرخه اشتراک">
        {detail.subscriptionEvents.length ? detail.subscriptionEvents.map((event, index) => (
          <TimelineItem
            key={`${event.transitionType}-${index}`}
            title={`${event.transitionType} · ${event.sourceType}`}
            date={event.createdAt}
            detail={`${event.statusBefore ?? "بدون وضعیت"} ← ${event.statusAfter ?? "بدون وضعیت"}${event.reason ? ` · ${event.reason}` : ""}`}
          />
        )) : <EmptyTimeline/>}
      </Timeline>
    </section>
  );
}

function SectionHeader({eyebrow, title, icon}: { eyebrow: string; title: string; icon: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div><p className="text-xs font-black text-primary">{eyebrow}</p><h2
        className="mt-1 text-xl font-black">{title}</h2></div>
      <span className="text-primary">{icon}</span>
    </div>
  );
}

function Datum({label, value}: { label: string; value: string }) {
  return <span className="min-w-0 rounded-xl border bg-background/50 px-3 py-2"><small
    className="block text-muted-foreground">{label}</small><bdi className="mt-1 block break-words">{value}</bdi></span>;
}

function Timeline({title, children}: { title: string; children: React.ReactNode }) {
  return <div><h3 className="mb-2 text-sm font-black">{title}</h3>
    <div className="grid gap-2">{children}</div>
  </div>;
}

function TimelineItem({title, date, detail}: { title: string; date: string; detail: string }) {
  return (
    <article className="grid gap-1 rounded-2xl border bg-background/45 p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0"><strong className="text-sm font-black">{title}</strong><code
        className="mt-1 block overflow-x-auto text-xs leading-6 text-muted-foreground">{detail}</code></div>
      <time className="text-xs font-bold text-muted-foreground">{formatBillingHistoryDate(date)}</time>
    </article>
  );
}

function EmptyTimeline() {
  return <p className="rounded-2xl border border-dashed p-4 text-xs font-bold text-muted-foreground">رویدادی ثبت نشده
    است.</p>;
}
