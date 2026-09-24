"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {AlertTriangleIcon, Trash2Icon} from "lucide-react";

import {
  confirmAdminUserDeletionAction,
  previewAdminUserDeletionAction,
} from "@/app/_actions/admin-users";
import {Button} from "@/components/ui/button";
import {Field, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import type {AdminUserDeletionPreviewDto, AdminUserDeletionResultDto} from "@/lib/api/admin-users";
import {toPersianDigits} from "@/lib/format";

export function AdminUserDangerZone({userId, identityLabel}: { userId: string; identityLabel: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<AdminUserDeletionPreviewDto | null>(null);
  const [result, setResult] = useState<AdminUserDeletionResultDto | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = () => {
    setError(null);
    startTransition(async () => {
      const response = await previewAdminUserDeletionAction(userId);
      if (!response.ok) {
        setError(response.message);
        return;
      }
      setPreview(response.preview);
      setConfirmation("");
      setReason("");
      setAcknowledged(false);
    });
  };

  const handleConfirm = () => {
    if (!preview || isPending) return;
    setError(null);
    startTransition(async () => {
      const response = await confirmAdminUserDeletionAction({
        userId,
        operationId: preview.operationId,
        confirmationToken: preview.confirmationToken,
        confirmation,
        reason,
      });
      if (!response.ok) {
        setError(
          response.code === "DELETION_PREVIEW_STALE"
            ? "پیش‌نمایش منقضی شده است؛ دوباره پیش‌نمایش بگیرید."
            : response.message,
        );
        return;
      }
      setResult(response.result);
      setPreview(null);
      router.refresh();
    });
  };

  if (result) {
    return (
      <section className="rounded-3xl border border-destructive/40 bg-destructive/5 p-5" aria-label="نتیجه حذف">
        <h2 className="text-lg font-black text-destructive">حذف کامل انجام شد</h2>
        <p className="mt-2 text-sm font-bold leading-7 text-muted-foreground">
          شناسه عملیات برای پیگیری پشتیبانی: <bdi className="break-all font-black" dir="ltr">{result.operationId}</bdi>
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <PlanList title="حذف‌شده" entries={Object.entries(result.deletedCounts)}/>
          <PlanList title="نگه‌داری‌شده" entries={Object.entries(result.retainedCounts)}/>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-destructive/40 bg-destructive/5 p-5" aria-label="محدوده خطر">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-destructive">محدوده خطر</p>
          <h2 className="mt-1 text-lg font-black">حذف کامل حساب و داده‌ها</h2>
        </div>
        <AlertTriangleIcon className="size-5 text-destructive"/>
      </div>
      <p className="mt-2 text-sm font-bold leading-7 text-muted-foreground">
        همه داده‌های خصوصی کاربر (پروفایل، دفترچه، وعده‌ها، غذاهای سفارشی، وزن، اهداف و نشست‌ها) برای همیشه حذف می‌شود.
        رکورد‌های مالی و ممیزی بدون هیچ مشخصه هویتی نگه‌داری می‌شوند. این عمل قابل بازگشت نیست.
      </p>

      {error ? (
        <p className="mt-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm font-bold text-destructive">
          {error}
        </p>
      ) : null}

      {!preview ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4 h-11 rounded-full border-destructive/50 font-black text-destructive hover:bg-destructive/10"
          disabled={isPending}
          onClick={handlePreview}
        >
          {isPending ? "در حال آماده‌سازی..." : "پیش‌نمایش حذف"}
        </Button>
      ) : (
        <div className="mt-4 grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <PlanList
              title="حذف می‌شود"
              entries={preview.deletePlan.map((entry) => [entry.domain, entry.records])}
            />
            <PlanList
              title="نگه‌داری می‌شود"
              entries={preview.retainPlan.map((entry) => [entry.domain, entry.records])}
            />
          </div>

          <Field>
            <FieldLabel htmlFor="deletion-reason">دلیل حذف (اجباری)</FieldLabel>
            <Input
              id="deletion-reason"
              value={reason}
              maxLength={500}
              placeholder="مثلاً درخواست حذف کامل توسط خود کاربر"
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="deletion-confirmation">
              برای تأیید، شناسه حساب را دقیقاً تایپ کنید: <bdi dir="ltr" className="font-black">{preview.confirmationValue}</bdi>
            </FieldLabel>
            <Input
              id="deletion-confirmation"
              dir="ltr"
              value={confirmation}
              maxLength={320}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </Field>

          <label className="flex items-start gap-2 text-sm font-bold" htmlFor="deletion-acknowledge">
            <input
              id="deletion-acknowledge"
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="mt-1 size-4 accent-destructive"
            />
            می‌دانم که حذف «{identityLabel}» قطعی و غیرقابل بازگشت است.
          </label>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full font-black"
              disabled={isPending}
              onClick={() => setPreview(null)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              className="h-11 rounded-full bg-destructive font-black text-white hover:bg-destructive/90"
              disabled={
                isPending ||
                !acknowledged ||
                reason.trim().length < 5 ||
                confirmation.trim() !== preview.confirmationValue
              }
              onClick={handleConfirm}
            >
              <Trash2Icon className="size-4"/>
              {isPending ? "در حال حذف..." : "حذف قطعی حساب"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function PlanList({title, entries}: { title: string; entries: Array<[string, number]> }) {
  return (
    <div className="rounded-2xl border bg-background/50 p-3">
      <p className="text-xs font-black text-muted-foreground">{title}</p>
      <ul className="mt-2 grid gap-1 text-xs font-bold leading-6">
        {entries.map(([domain, records]) => (
          <li key={domain} className="flex items-center justify-between gap-2">
            <span>{domainLabels[domain] ?? domain}</span>
            <span className="tabular-nums">{toPersianDigits(records)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const domainLabels: Record<string, string> = {
  sessions: "نشست‌ها",
  refreshTokens: "نشست‌ها",
  idempotencyKeys: "کلیدهای idempotency",
  profile: "پروفایل",
  userProfiles: "پروفایل",
  nutritionPlans: "پلن‌های تغذیه",
  planSchedules: "زمان‌بندی پلن",
  weightEntries: "ثبت وزن",
  dailyScores: "امتیاز روزانه",
  diaryDays: "روزهای دفترچه",
  diaryEntries: "ثبت‌های دفترچه",
  meals: "وعده‌ها",
  mealItems: "آیتم‌های وعده",
  customFoods: "غذاهای سفارشی",
  foodFavorites: "علاقه‌مندی‌ها",
  recentFoods: "غذاهای اخیر",
  subscriptions: "اشتراک‌ها",
  subscriptionEvents: "رویدادهای اشتراک",
  invoices: "صورتحساب‌ها",
  paymentAttempts: "تلاش‌های پرداخت",
  manualGrants: "اعطای دستی",
  promotionRedemptions: "کدهای تخفیف",
  auditEvents: "رویدادهای ممیزی",
};
