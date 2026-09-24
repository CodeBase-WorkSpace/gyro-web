"use client";

import {useMemo, useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {createPriceAction, previewPriceImpactAction,} from "@/app/_actions/admin-subscription-prices";
import {Button} from "@/components/ui/button";
import {AppTopBar} from "@/components/design-system/app-top-bar";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,} from "@/components/ui/sheet";
import {
  type AdminPricePlan,
  type AdminSubscriptionPrice,
  calculateCatalogAmount,
  durationLabel,
  formatToman,
  type PriceImpact,
} from "@/lib/api/admin-subscription-prices";

const durations = [30, 90, 365] as const;

export function SubscriptionPriceManager({
                                           plans,
                                         }: {
  plans: AdminPricePlan[];
}) {
  const paidPlans = useMemo(
    () => plans.filter((plan) => !plan.free),
    [plans],
  );
  const [selection, setSelection] = useState<{
    plan: AdminPricePlan;
    days: number;
    current: AdminSubscriptionPrice | null;
  } | null>(null);
  const [historySelection, setHistorySelection] = useState<{
    plan: AdminPricePlan;
    days: number;
  } | null>(null);
  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 pb-28 sm:p-8 lg:pb-10"
    >
      <AppTopBar
        title="مدیریت قیمت اشتراک"
        description="مدیریت نسخه‌های قیمت بدون تغییر سابقه پرداخت "
        backLink={{href: "/admin", label: "بازگشت به پنل ادمین"}}
        showDateControl={false}
        showMobileDateAction={false}
      />

      <div className="grid gap-5">
        {paidPlans.map((plan) => (
          <section
            key={plan.id}
            className="rounded-3xl border bg-card p-4"
          >
            <h2 className="mb-3 text-lg font-black">
              پلن {plan.name}
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              {durations.map((days) => {
                const current =
                  plan.prices.find(
                    (price) =>
                      price.billingPeriodDays === days &&
                      price.active,
                  ) ?? null;
                const scheduled = plan.prices.find(
                  (price) =>
                    price.billingPeriodDays === days &&
                    price.scheduled,
                );
                return (
                  <article
                    key={days}
                    className="rounded-2xl border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-black">
                        {durationLabel(days)}
                      </h3>
                      <span className="text-xs font-bold text-muted-foreground">
												{current
                          ? "فعال"
                          : "بدون قیمت فعال"}
											</span>
                    </div>
                    <p className="mt-3 text-xl font-black">
                      {current
                        ? formatToman(current.amount)
                        : "—"}
                    </p>
                    {current?.discountPercent ? (
                      <p className="mt-1 text-xs font-bold text-primary">
                        پایه {formatToman(current.baseAmount)} · {current.discountPercent.toLocaleString("fa-IR")}٪ تخفیف دائمی
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {current?.badge ?? "بدون نشان"}
                    </p>
                    {scheduled ? (
                      <p className="mt-2 rounded-lg bg-primary/10 p-2 text-xs font-bold">
                        قیمت زمان‌بندی‌شده:{" "}
                        {formatToman(scheduled.amount)} از پایه {formatToman(scheduled.baseAmount)} با {scheduled.discountPercent.toLocaleString("fa-IR")}٪ تخفیف
                      </p>
                    ) : null}
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          setSelection({
                            plan,
                            days,
                            current,
                          })
                        }
                      >
                        تغییر قیمت
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setHistorySelection({
                            plan,
                            days,
                          })
                        }
                      >
                        تاریخچه
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <Sheet
        open={selection !== null}
        onOpenChange={(open) => {
          if (!open) setSelection(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="inset-y-0 mx-auto h-svh max-h-svh w-full max-w-xl gap-3 rounded-none p-4 sm:p-5"
          dir="rtl"
        >
          <SheetHeader className="shrink-0 gap-1 pl-10">
            <SheetTitle>ساخت نسخه جدید قیمت</SheetTitle>
            <SheetDescription>
              قیمت قبلی بازنویسی نمی‌شود. مشترکان فعلی قیمت تاریخی
              قفل‌شده خود را نگه می‌دارند و قیمت جدید فقط برای
              پرداخت‌های تازه پس از فعال‌سازی است.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea
            className="min-h-0 flex-1"
            viewportClassName="pb-[max(1rem,env(safe-area-inset-bottom))] pe-2"
          >
            {selection ? (
              <PriceDialog
                selection={selection}
                onDone={() => setSelection(null)}
              />
            ) : null}
          </ScrollArea>
        </SheetContent>
      </Sheet>
      <Sheet
        open={historySelection !== null}
        onOpenChange={(open) => {
          if (!open) setHistorySelection(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="inset-y-0 mx-auto h-svh max-h-svh w-full max-w-2xl gap-3 rounded-none p-4 sm:p-5"
          dir="rtl"
        >
          <SheetHeader className="shrink-0 gap-1 pl-10">
            <SheetTitle>تاریخچه قیمت</SheetTitle>
            <SheetDescription>
              {historySelection
                ? `${historySelection.plan.name} · ${durationLabel(historySelection.days)}`
                : "نسخه‌های قیمت"}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea
            className="min-h-0 flex-1"
            viewportClassName="pb-[max(1rem,env(safe-area-inset-bottom))] pe-2"
          >
            {historySelection ? (
              <PriceHistory
                plan={historySelection.plan}
                days={historySelection.days}
              />
            ) : null}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </main>
  );
}

function PriceHistory({plan, days}: { plan: AdminPricePlan; days: number }) {
  const prices = plan.prices
    .filter((price) => price.billingPeriodDays === days)
    .toSorted(
      (left, right) =>
        new Date(right.validFrom).getTime() -
        new Date(left.validFrom).getTime(),
    );
  if (!prices.length)
    return (
      <p className="rounded-2xl border border-dashed p-5 text-sm font-bold text-muted-foreground">
        نسخه قیمتی برای این دوره ثبت نشده است.
      </p>
    );
  return (
    <div className="grid gap-3">
      {prices.map((price) => (
        <article
          key={price.id}
          className="grid gap-2 rounded-2xl border bg-card p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <strong>{formatToman(price.amount)}</strong>
            <span className="text-xs font-bold text-muted-foreground">
							{price.active
                ? "فعال"
                : price.scheduled
                  ? "زمان‌بندی‌شده"
                  : "تاریخی"}
						</span>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            قیمت پایه: {formatToman(price.baseAmount)} · تخفیف دائمی: {price.discountPercent.toLocaleString("fa-IR")}٪
          </p>
          <p className="text-xs font-semibold text-muted-foreground">
            شروع:{" "}
            {new Date(price.validFrom).toLocaleString("fa-IR")}
          </p>
          {price.validUntil ? (
            <p className="text-xs font-semibold text-muted-foreground">
              پایان:{" "}
              {new Date(price.validUntil).toLocaleString("fa-IR")}
            </p>
          ) : null}
          {price.badge ? (
            <p className="text-xs font-semibold">
              نشان: {price.badge}
            </p>
          ) : null}
          {price.internalNotes ? (
            <p className="text-xs font-semibold">
              یادداشت: {price.internalNotes}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function PriceDialog({
                       selection,
                       onDone,
                     }: {
  selection: {
    plan: AdminPricePlan;
    days: number;
    current: AdminSubscriptionPrice | null;
  };
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [baseAmountToman, setBaseAmountToman] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [validFrom, setValidFrom] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [impact, setImpact] = useState<PriceImpact | null>(null);
  const [error, setError] = useState("");
  const baseAmountRials = Number(baseAmountToman) * 10;
  const discount = Number(discountPercent);
  const payablePreview = Number.isFinite(baseAmountRials) && baseAmountRials > 0 && Number.isFinite(discount) && discount >= 0 && discount < 100
    ? calculateCatalogAmount(baseAmountRials, discount)
    : null;
  const preview = () =>
    startTransition(async () => {
      if (!selection.current) {
        setImpact({
          activeSubscriptions: 0,
          openInvoices: 0,
          pendingPaymentAttempts: 0,
          activePromotions: 0,
        });
        return;
      }
      const result = await previewPriceImpactAction(selection.current.id);
      if (result.ok) setImpact(result.impact);
      else setError(result.message);
    });
  const save = () => {
    const activation = validFrom ? new Date(validFrom) : new Date();
    if (!Number.isFinite(baseAmountRials) || baseAmountRials <= 0) {
      setError("قیمت پایه معتبر به تومان وارد کنید.");
      return;
    }
    if (!Number.isFinite(discount) || discount < 0 || discount >= 100) {
      setError("درصد تخفیف باید از صفر تا کمتر از صد باشد.");
      return;
    }
    if (Number.isNaN(activation.getTime())) {
      setError("زمان فعال‌سازی معتبر نیست.");
      return;
    }
    if (!impact) {
      setError("پیش از ذخیره، اثر تغییر را بررسی کنید.");
      return;
    }
    if (confirmText.toLowerCase().trim() !== "confirm") {
      setError("عبارت تأیید را کامل وارد کنید.");
      return;
    }
    startTransition(async () => {
      const result = await createPriceAction({
        planId: selection.plan.id,
        billingPeriodDays: selection.days,
        baseAmount: baseAmountRials,
        discountPercent: discount,
        currency: "IRR",
        badge: selection.current?.badge ?? null,
        validFrom: activation.toISOString(),
        internalNotes: notes || null,
        expectedCurrentPriceId: selection.current?.id ?? null,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onDone();
      router.refresh();
    });
  };
  return (
    <div className="grid gap-4 text-sm">
      <div className="rounded-xl bg-muted/50 p-3 font-semibold">
        دوره انتخابی: <strong>{durationLabel(selection.days)}</strong>.
        انتخاب ۳۰، ۹۰ و ۳۶۵ روز به‌ترتیب قیمت ماهانه، سه‌ماهه و سالانه
        را مشخص می‌کند.
      </div>
      <label className="grid gap-1 font-bold">
        قیمت پایه (تومان)
        <input
          type="number"
          min="1"
          step="0.1"
          value={baseAmountToman}
          onChange={(e) => setBaseAmountToman(e.target.value)}
          className="h-11 rounded-xl border bg-background px-3"
        />
      </label>
      <label className="grid gap-1 font-bold">
        تخفیف دائمی کاتالوگ (درصد)
        <input
          type="number"
          min="0"
          max="99.99"
          step="0.01"
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
          className="h-11 rounded-xl border bg-background px-3"
        />
      </label>
      <div className="rounded-xl border bg-primary/5 p-3" aria-live="polite">
        <p className="text-xs font-bold text-muted-foreground">مبلغ نهایی قابل پرداخت</p>
        <p className="mt-1 text-xl font-black text-primary">
          {payablePreview === null ? "—" : formatToman(payablePreview)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          این پیش‌نمایش برای نمایش است؛ مبلغ نهایی هنگام ذخیره دوباره در سرور محاسبه می‌شود.
        </p>
      </div>
      <label className="grid gap-1 font-bold">
        زمان فعال‌سازی
        <input
          type="datetime-local"
          value={validFrom}
          onChange={(e) => setValidFrom(e.target.value)}
          className="h-11 rounded-xl border bg-background px-3"
        />
      </label>
      <label className="grid gap-1 font-bold">
        یادداشت داخلی
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="h-11 rounded-xl border bg-background px-3"
        />
      </label>
      <Button variant="outline" disabled={pending} onClick={preview}>
        بررسی اثر تغییر
      </Button>
      {impact ? (
        <div className="rounded-xl border p-3 leading-7">
          <p>
            اشتراک فعال با قیمت تاریخی:{" "}
            {impact.activeSubscriptions.toLocaleString("fa-IR")}
          </p>
          <p>
            فاکتور باز:{" "}
            {impact.openInvoices.toLocaleString("fa-IR")}
          </p>
          <p>
            پرداخت در انتظار:{" "}
            {impact.pendingPaymentAttempts.toLocaleString("fa-IR")}
          </p>
          <p>
            پروموشن مرتبط:{" "}
            {impact.activePromotions.toLocaleString("fa-IR")}
          </p>
        </div>
      ) : null}
      <label className="grid gap-1 font-bold">
        برای ادامه بنویسید: Confirm
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="h-11 rounded-xl border bg-background px-3"
        />
      </label>
      {error ? (
        <p role="alert" className="font-bold text-destructive">
          {error}
        </p>
      ) : null}
      <Button disabled={pending} onClick={save}>
        {pending ? "در حال ثبت…" : "ساخت نسخه جدید"}
      </Button>
    </div>
  );
}
