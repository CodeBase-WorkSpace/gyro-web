"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";

import {archiveAdminPromotionAction, saveAdminPromotionAction} from "@/app/_actions/admin-promotions";
import {DropdownDatePicker} from "@/components/progress/dropdown-date-picker";
import {Button} from "@/components/ui/button";
import {FormSelect} from "@/components/ui/form-select";
import type {AdminGrantPlanDto} from "@/lib/api/admin-users";
import type {AdminPromotion} from "@/lib/api/admin-promotions";
import {durationLabel, type AdminPricePlan} from "@/lib/api/admin-subscription-prices";

const promotionTypes = [
  {value: "PERCENTAGE_DISCOUNT", label: "درصد تخفیف", hint: "مثال: مقدار ۲۰ یعنی ۲۰٪ تخفیف."},
  {value: "FIXED_DISCOUNT", label: "مبلغ ثابت", hint: "از مبلغ پرداخت کم می‌شود و نمی‌تواند پرداخت را رایگان کند."},
  {value: "FREE_DAYS", label: "روز هدیه", hint: "مبلغ پرداخت تغییر نمی‌کند؛ این تعداد روز به دوره اضافه می‌شود."},
  {value: "TRIAL_EXTENSION", label: "تمدید دوره", hint: "دوره اشتراک را به تعداد روز مشخص‌شده افزایش می‌دهد."},
  {value: "EARLY_SUPPORTER_ACCESS", label: "دسترسی حامی اولیه", hint: "بدون پرداخت، یک گرنت ثبت‌شده و قابل ممیزی ایجاد می‌کند."},
] as const;

type PromotionEditorProps = {
  plans: AdminGrantPlanDto[];
  pricePlans: AdminPricePlan[];
  promotion?: AdminPromotion;
  embedded?: boolean;
  onSaved?: () => void;
};

export function PromotionEditor({plans, pricePlans, promotion, embedded = false, onSaved}: PromotionEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => ({
    code: promotion?.code ?? "",
    type: promotion?.type ?? "PERCENTAGE_DISCOUNT",
    value: String(promotion?.value ?? ""),
    applicablePlanId: promotion?.applicablePlanId?.toString() ?? "",
    applicableSubscriptionPriceId: promotion?.applicableSubscriptionPriceId?.toString() ?? "",
    startsAt: toLocalDateTimeValue(promotion?.startsAt ?? new Date()),
    endsAt: promotion?.endsAt ? toLocalDateTimeValue(promotion.endsAt) : "",
    maxRedemptions: promotion?.maxRedemptions?.toString() ?? "",
    perUserRedemptionLimit: String(promotion?.perUserRedemptionLimit ?? 1),
    active: promotion?.active ?? true,
    internalNotes: promotion?.internalNotes ?? "",
  }));
  const selectedType = promotionTypes.find((item) => item.value === form.type) ?? promotionTypes[0];
  const set = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({...current, [key]: value}));
  const changeType = (type: string) => setForm((current) => ({
    ...current,
    type,
    value: current.value && Number(current.value) > 0 ? current.value : type === "PERCENTAGE_DISCOUNT" ? "10" : "30",
  }));

  const save = () => {
    const value = Number(form.value);
    const planId = form.applicablePlanId ? Number(form.applicablePlanId) : null;
    const priceId = form.applicableSubscriptionPriceId ? Number(form.applicableSubscriptionPriceId) : null;
    const maxRedemptions = form.maxRedemptions ? Number(form.maxRedemptions) : null;
    const perUserLimit = Number(form.perUserRedemptionLimit);
    const startsAt = parseLocalDateTime(form.startsAt);
    const endsAt = form.endsAt ? parseLocalDateTime(form.endsAt) : null;

    if (!form.code.trim()) { setError("کد تخفیف را وارد کن."); return; }
    if (!Number.isFinite(value) || value <= 0) { setError("مقدار باید یک عدد بزرگ‌تر از صفر باشد."); return; }
    if (form.type === "PERCENTAGE_DISCOUNT" && value >= 100) { setError("درصد تخفیف باید کمتر از ۱۰۰ باشد."); return; }
    if (form.type === "EARLY_SUPPORTER_ACCESS" && (!planId || !Number.isInteger(value))) { setError("برای دسترسی حامی اولیه، پلن و تعداد روز صحیح را انتخاب کن."); return; }
    if (planId !== null && !plans.some((plan) => plan.id === planId)) { setError("یک پلن فعال از فهرست انتخاب کن."); return; }
    if (!startsAt) { setError("تاریخ و ساعت شروع معتبر را وارد کن."); return; }
    if (form.endsAt && !endsAt) { setError("تاریخ و ساعت پایان معتبر را وارد کن."); return; }
    if (endsAt && endsAt <= startsAt) { setError("پایان اعتبار باید بعد از شروع اعتبار باشد."); return; }
    if (maxRedemptions !== null && (!Number.isInteger(maxRedemptions) || maxRedemptions < 1)) { setError("سقف استفاده کل باید یک عدد صحیح مثبت باشد."); return; }
    if (!Number.isInteger(perUserLimit) || perUserLimit < 1) { setError("سقف هر کاربر باید یک عدد صحیح مثبت باشد."); return; }

    setError("");
    startTransition(async () => {
      const result = await saveAdminPromotionAction({
        code: form.code,
        type: form.type,
        value,
        applicablePlanId: planId,
        applicableSubscriptionPriceId: priceId,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt?.toISOString() ?? null,
        maxRedemptions,
        perUserRedemptionLimit: perUserLimit,
        active: form.active,
        internalNotes: form.internalNotes || null,
        expectedVersion: promotion?.version,
      }, promotion?.id);
      if (!result.ok) { setError(result.message); return; }
      if (onSaved) { onSaved(); router.refresh(); return; }
      router.push(`/admin/promotions/${result.promotion.id}`);
    });
  };

  const archive = () => startTransition(async () => {
    if (!promotion || !confirm("کد بایگانی شود؟ استفاده‌های جدید از آن متوقف می‌شود.")) return;
    const result = await archiveAdminPromotionAction(promotion.id, promotion.version);
    if (!result.ok) { setError(result.message); return; }
    router.push("/admin/promotions");
  });
  const valueLabel = form.type === "EARLY_SUPPORTER_ACCESS" ? "مدت دسترسی (روز)" : form.type === "FREE_DAYS" || form.type === "TRIAL_EXTENSION" ? "تعداد روز هدیه" : form.type === "PERCENTAGE_DISCOUNT" ? "درصد تخفیف" : "مبلغ تخفیف";

  return (
    <section className={embedded ? "grid gap-4" : "mx-auto grid max-w-3xl gap-4 p-4 sm:p-8"}>
      {!embedded ? <div><p className="text-sm font-black text-primary">مدیریت اشتراک</p><h1 className="text-2xl font-black">ویرایش کد تخفیف</h1></div> : null}
      {error ? <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="کد" hint="برای نمونه SUMMER20. بعد از ساخت قابل تغییر نیست."><input disabled={!!promotion} value={form.code} onChange={(event) => set("code", event.target.value.toUpperCase())} className="h-10 rounded-xl border bg-background px-3 font-mono text-sm" autoComplete="off"/></Field>
        <Field label="نوع اثر" hint={selectedType.hint}><FormSelect disabled={!!promotion} value={form.type}
                                                                    options={promotionTypes.map(({
                                                                                                   value,
                                                                                                   label
                                                                                                 }) => ({
                                                                      value,
                                                                      label
                                                                    }))} onValueChange={changeType}/></Field>
        <Field label={valueLabel} hint={form.type === "EARLY_SUPPORTER_ACCESS" ? "مثال: ۳۰ یعنی ۳۰ روز دسترسی رایگان. صفر معتبر نیست." : form.type === "PERCENTAGE_DISCOUNT" ? "عددی بزرگ‌تر از صفر و کمتر از ۱۰۰ وارد کن." : "عددی بزرگ‌تر از صفر وارد کن."}><input type="number" min="1" step={form.type === "PERCENTAGE_DISCOUNT" || form.type === "FIXED_DISCOUNT" ? "0.01" : "1"} inputMode="decimal" value={form.value} onChange={(event) => set("value", event.target.value)} className="h-10 rounded-xl border bg-background px-3"/></Field>
        <Field label={form.type === "EARLY_SUPPORTER_ACCESS" ? "پلن (الزامی)" : "پلن (اختیاری)"}
               hint="در صورت انتخاب، کد فقط برای همین پلن قابل استفاده است."><FormSelect value={form.applicablePlanId}
                                                                                         options={[{
                                                                                           value: "all",
                                                                                           label: "همه پلن‌ها"
                                                                                         }, ...plans.map((plan) => ({
                                                                                           value: String(plan.id),
                                                                                           label: `${plan.name} (${plan.code})`
                                                                                         }))]}
                                                                                         onValueChange={(value) => set("applicablePlanId", value === "all" ? "" : value)}/></Field>
        <Field label="دوره قیمت"
               hint="برای محدود کردن کد به دوره ماهانه، سه‌ماهه یا سالانه یک گزینه را انتخاب کنید."><FormSelect
          disabled={!form.applicablePlanId} value={form.applicableSubscriptionPriceId} options={[{
          value: "all",
          label: "همه دوره‌های این پلن"
        }, ...(pricePlans.find(plan => String(plan.id) === form.applicablePlanId)?.prices.filter(price => price.active).map(price => ({
          value: String(price.id),
          label: `فقط ${durationLabel(price.billingPeriodDays)}`
        })) ?? [])]}
          onValueChange={(value) => set("applicableSubscriptionPriceId", value === "all" ? "" : value)}/></Field>
        <DateTimeField label="شروع اعتبار" hint="از این زمان کد برای کاربران قابل استفاده است." value={form.startsAt} onChange={(value) => set("startsAt", value)}/>
        <DateTimeField label="پایان اعتبار (اختیاری)" hint="خالی بگذار تا زمان انقضا نداشته باشد." value={form.endsAt} optional onChange={(value) => set("endsAt", value)}/>
        <Field label="سقف استفاده کل (اختیاری)" hint="پس از این تعداد، کد برای همه کاربران متوقف می‌شود."><input type="number" min="1" inputMode="numeric" value={form.maxRedemptions} onChange={(event) => set("maxRedemptions", event.target.value)} className="h-10 rounded-xl border bg-background px-3"/></Field>
        <Field label="سقف هر کاربر" hint="تعداد دفعاتی که هر کاربر می‌تواند از این کد استفاده کند."><input type="number" min="1" inputMode="numeric" value={form.perUserRedemptionLimit} onChange={(event) => set("perUserRedemptionLimit", event.target.value)} className="h-10 rounded-xl border bg-background px-3"/></Field>
        <Field label="یادداشت داخلی" hint="برای تیم پشتیبانی؛ هرگز اطلاعات محرمانه وارد نکن."><input value={form.internalNotes} onChange={(event) => set("internalNotes", event.target.value)} className="h-10 rounded-xl border bg-background px-3"/></Field>
      </div>
      <label className="flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2 text-sm font-bold"><input type="checkbox" checked={form.active} onChange={(event) => set("active", event.target.checked)}/> این کد فعال باشد</label>
      <div className="flex flex-wrap gap-2"><Button disabled={pending} onClick={save}>{pending ? "در حال ذخیره…" : "ذخیره کد"}</Button>{promotion ? <Button variant="destructive" disabled={pending} onClick={archive}>بایگانی کد</Button> : null}</div>
    </section>
  );
}

function DateTimeField({label, hint, value, optional = false, onChange}: {label: string; hint: string; value: string; optional?: boolean; onChange: (value: string) => void}) {
  const [date = "", time = ""] = value.split("T");
  const today = toLocalDateTimeValue(new Date()).slice(0, 10);
  return <Field label={label} hint={hint}>
    <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
      <DropdownDatePicker value={date} today={today} ariaLabel={label} placeholder="انتخاب تاریخ" onChange={(nextDate) => onChange(`${nextDate}T${time || "00:00"}`)}/>
      <input type="time" aria-label={`ساعت ${label}`} value={time} onChange={(event) => onChange(date ? `${date}T${event.target.value}` : "")} className="h-11 rounded-xl border bg-background px-3"/>
    </div>
    {optional && value ? <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => onChange("")}>حذف پایان اعتبار</Button> : null}
  </Field>;
}

function Field({label, hint, children}: {label: string; hint: string; children: React.ReactNode}) {
  return <div className="grid gap-1.5 text-sm font-black"><span>{label}</span>{children}<span className="text-xs font-semibold leading-5 text-muted-foreground">{hint}</span></div>;
}

function toLocalDateTimeValue(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseLocalDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
