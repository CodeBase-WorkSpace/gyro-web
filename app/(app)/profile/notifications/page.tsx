import type {Metadata} from "next";
import {redirect} from "next/navigation";
import {BellRingIcon} from "lucide-react";

import {saveNotificationPreferencesAction} from "@/app/(app)/profile/notifications/actions";
import {PushPermissionButton} from "@/components/profile/push-permission-button";
import {TelegramLinkCard} from "@/components/profile/telegram-link-card";
import {NotificationPreferencesForm} from "@/components/profile/notification-preferences-form";
import {AppTopBar} from "@/components/design-system/app-top-bar";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {getFoodReminderSchedules, getNotificationPreferences, getTelegramStatus} from "@/lib/api/notifications";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {getSession} from "@/lib/auth/session";
import {isFrontendTelegramEnabled} from "@/lib/features/server-features";

export const metadata: Metadata = {title: "جیرو | تنظیمات اعلان", description: "تنظیمات اعلان و ساعات آرام"};

export default async function NotificationPreferencesPage() {
  const session = await getSession();
  if (!session.isAuthenticated) redirect("/auth/login?next=/profile/notifications&expired=1");
  const telegramEnabled = isFrontendTelegramEnabled();
  const preferencesPromise = authenticatedServerRequest(
    (accessToken) => getNotificationPreferences(accessToken),
    {nextPath: "/profile/notifications", retryPolicy: "never"},
  );
  const schedulesPromise = authenticatedServerRequest(
    (accessToken) => getFoodReminderSchedules(accessToken),
    {nextPath: "/profile/notifications", retryPolicy: "never"},
  );
  const telegramPromise = telegramEnabled ? authenticatedServerRequest(
    (accessToken) => getTelegramStatus(accessToken),
    {nextPath: "/profile/notifications", retryPolicy: "never"},
  ) : Promise.resolve(null);
  const [preferences, schedules, telegramStatus] = await Promise.all([preferencesPromise, schedulesPromise, telegramPromise]);
  const mealSchedule = schedules.find(({type}) => type === "MEAL_REMINDER");
  const weightSchedule = schedules.find(({type}) => type === "WEIGHT_REMINDER");
  const optionalBilling = preferences.categories.find(({category}) => category === "OPTIONAL_BILLING")?.enabled ?? false;
  const optionalAnnouncements = preferences.categories.find(({category}) => category === "OPTIONAL_ANNOUNCEMENTS")?.enabled ?? true;
  return <main id="main-content" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8">
    <AppTopBar title="تنظیمات اعلان" description="کنترل یادآوری‌های اختیاری و ساعات آرام" backLink={{href: "/profile", label: "بازگشت به پروفایل"}} showDateControl={false} showMobileDateAction={false} />
    <Card className="rounded-3xl border bg-card shadow-sm"><CardHeader><CardTitle className="text-base">فعال‌سازی اعلان مرورگر</CardTitle><CardDescription>برای دریافت یادآوری‌های غذا و وزن، اعلان مرورگر را در همین دستگاه فعال کنید.</CardDescription></CardHeader><CardContent><PushPermissionButton/></CardContent></Card>
    <Card className="rounded-3xl border bg-card shadow-sm"><CardHeader><div className="flex items-center gap-3"><BellRingIcon className="size-6 text-primary"/><div><CardTitle className="text-lg font-semibold">اعلان‌های شما</CardTitle><CardDescription className="leading-7">ساعات آرام بر اساس منطقه زمانی {preferences.timezone} اعمال می‌شود.</CardDescription></div></div></CardHeader><CardContent><NotificationPreferencesForm action={saveNotificationPreferencesAction} quietHoursStart={preferences.quietHoursStart} quietHoursEnd={preferences.quietHoursEnd} optionalBillingEnabled={optionalBilling} optionalAnnouncementsEnabled={optionalAnnouncements} foodReminderEnabled={mealSchedule?.enabled ?? false} foodReminderTime={mealSchedule?.localTime ?? "20:00"} weightReminderEnabled={weightSchedule?.enabled ?? false} weightReminderTime={weightSchedule?.localTime ?? "08:00"}/></CardContent></Card>
    {telegramEnabled && telegramStatus ? <Card className="rounded-3xl border bg-card shadow-sm"><CardHeader><CardTitle className="text-base">اتصال تلگرام</CardTitle><CardDescription>تلگرام فقط برای پیام تأیید و آزمایش اتصال استفاده می‌شود؛ یادآوری‌های غذایی همچنان فقط Push هستند.</CardDescription></CardHeader><CardContent><TelegramLinkCard initialStatus={telegramStatus}/></CardContent></Card> : null}
    <p className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-7 text-muted-foreground">رسیدهای پرداخت، تغییرات مهم اشتراک و اعلان‌های امنیتی قابل غیرفعال‌کردن نیستند. هیچ جایگزینی خودکار از ایمیل به پیامک انجام نمی‌شود.</p>
  </main>;
}
