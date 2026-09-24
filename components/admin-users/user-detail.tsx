import type {AdminUserDetailDto} from "@/lib/api/admin-users";
import {formatPersianGregorianDate, toPersianDigits} from "@/lib/format";

import {AdminUserDangerZone} from "./deletion-danger-zone";
import {ManualGrantsPanel} from "./manual-grants-panel";

export function AdminUserDetailView({detail, actingAdminId, grants, grantPlans, entitlement}: { detail: AdminUserDetailDto; actingAdminId: string; grants: import("@/lib/api/admin-users").AdminManualGrantDto[]; grantPlans: import("@/lib/api/admin-users").AdminGrantPlanDto[]; entitlement: import("@/lib/api/admin-users").EntitlementDto | null }) {
  const identity = detail.identity;
  const isDeleted = identity.status === "DELETED";
  const isProtected = identity.role === "ADMIN" || identity.id === actingAdminId;

  return (
    <div className="grid gap-5">
      {isDeleted ? (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-bold text-destructive">
          این حساب حذف شده است؛ رکوردهای مالی و ممیزی طبق سیاست نگه‌داری سیستم باقی می‌مانند.
        </p>
      ) : null}

      <Section eyebrow="هویت" title="هویت و حساب">
        <div className="grid gap-2 text-sm font-bold sm:grid-cols-2 lg:grid-cols-3">
          <Datum label="شناسه" value={identity.id} ltr/>
          <Datum label="ایمیل" value={identity.email ?? "ثبت نشده"} ltr/>
          <Datum label="شماره تماس" value={identity.phoneNumber ?? "ثبت نشده"} ltr/>
          <Datum label="نام نمایشی" value={identity.displayName ?? "ثبت نشده"}/>
          <Datum label="نقش" value={identity.role}/>
          <Datum label="وضعیت" value={identity.status}/>
          <Datum label="تأیید ایمیل" value={identity.emailVerificationStatus}/>
          <Datum label="تأیید شماره" value={identity.phoneVerificationStatus}/>
          <Datum label="منطقه زمانی" value={identity.timezone ?? "—"}/>
        </div>
      </Section>

      <Section eyebrow="سلامت و پیگیری" title="اهداف، وزن و امتیاز">
        <CountGrid
          items={[
            ["پلن‌های تغذیه", detail.health.nutritionPlans],
            ["زمان‌بندی پلن", detail.health.planSchedules],
            ["ثبت وزن", detail.health.weightEntries],
            ["امتیاز روزانه", detail.health.dailyScores],
          ]}
        />
      </Section>

      <Section eyebrow="غذا و دفترچه" title="دفترچه غذایی، وعده‌ها و غذاهای سفارشی">
        <CountGrid
          items={[
            ["روزهای دفترچه", detail.foodAndDiary.diaryDays],
            ["ثبت‌های دفترچه", detail.foodAndDiary.diaryEntries],
            ["وعده‌ها", detail.foodAndDiary.meals],
            ["آیتم‌های وعده", detail.foodAndDiary.mealItems],
            ["غذاهای سفارشی", detail.foodAndDiary.customFoods],
            ["علاقه‌مندی‌ها", detail.foodAndDiary.foodFavorites],
            ["غذاهای اخیر", detail.foodAndDiary.recentFoods],
          ]}
        />
      </Section>

      <Section eyebrow="احراز هویت" title="نشست‌ها">
        <CountGrid
          items={[
            ["نشست‌های فعال", detail.authentication.activeSessions],
            ["کل نشست‌ها", detail.authentication.totalSessions],
          ]}
        />
      </Section>

      <Section eyebrow="مالی" title="اشتراک و صورتحساب (پس از حذف هم نگه‌داری می‌شود)">
        <CountGrid
          items={[
            ["اشتراک‌ها", detail.billing.subscriptions],
            ["صورتحساب‌ها", detail.billing.invoices],
            ["تلاش‌های پرداخت", detail.billing.paymentAttempts],
            ["اعطای دستی", detail.billing.manualGrants],
            ["کد تخفیف", detail.billing.promotionRedemptions],
          ]}
        />
        {detail.billing.currentSubscription ? (
          <div className="mt-3 grid gap-2 text-sm font-bold sm:grid-cols-2 lg:grid-cols-4">
            <Datum label="پلن" value={`${detail.billing.currentSubscription.planName} (${detail.billing.currentSubscription.planCode})`}/>
            <Datum label="وضعیت" value={detail.billing.currentSubscription.status}/>
            <Datum label="پایان دوره" value={detail.billing.currentSubscription.periodEnd ? formatPersianGregorianDate(new Date(detail.billing.currentSubscription.periodEnd)) : "بدون پایان"}/>
            <Datum label="تمدید" value={detail.billing.currentSubscription.cancelAtPeriodEnd ? "لغو در پایان دوره" : "فعال"}/>
            {detail.billing.currentSubscription.gracePeriodEnd ? (
              <Datum label="پایان مهلت" value={formatPersianGregorianDate(new Date(detail.billing.currentSubscription.gracePeriodEnd))}/>
            ) : null}
          </div>
        ) : null}
      </Section>

      <Section eyebrow="ممیزی" title="رویدادهای ممیزی و عملیات حذف">
        <CountGrid
          items={[
            ["رویدادهای ممیزی", detail.auditAndOperations.auditEvents],
            ["عملیات حذف", detail.auditAndOperations.deletionOperations],
          ]}
        />
      </Section>

      {!isDeleted ? <ManualGrantsPanel userId={identity.id} grants={grants} plans={grantPlans} entitlement={entitlement}/> : null}

      {!isDeleted && !isProtected ? (
        <AdminUserDangerZone
          userId={identity.id}
          identityLabel={identity.email ?? identity.phoneNumber ?? identity.id}
        />
      ) : null}

      {isProtected && !isDeleted ? (
        <p className="rounded-2xl border border-dashed p-4 text-xs font-bold text-muted-foreground">
          حساب‌های ادمین و حساب خودتان از حذف محافظت می‌شوند.
        </p>
      ) : null}
    </div>
  );
}

function Section({eyebrow, title, children}: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border bg-card/90 p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <p className="text-xs font-black text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function CountGrid({items}: { items: Array<[string, number]> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([label, count]) => (
        <span key={label} className="rounded-xl border bg-background/50 px-3 py-2 text-sm font-bold">
          <small className="block text-muted-foreground">{label}</small>
          <span className="mt-1 block text-lg font-black tabular-nums">{toPersianDigits(count)}</span>
        </span>
      ))}
    </div>
  );
}

function Datum({label, value, ltr = false}: { label: string; value: string; ltr?: boolean }) {
  return (
    <span className="min-w-0 rounded-xl border bg-background/50 px-3 py-2">
      <small className="block text-muted-foreground">{label}</small>
      <bdi className="mt-1 block break-all" dir={ltr ? "ltr" : undefined}>{value}</bdi>
    </span>
  );
}
