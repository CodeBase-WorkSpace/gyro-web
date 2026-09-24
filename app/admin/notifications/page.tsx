import {redirect} from "next/navigation";
import {getSession} from "@/lib/auth/session";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {getAdminAnnouncementHistory, getAdminNotificationRuntime} from "@/lib/api/admin-notifications";
import {AnnouncementComposer} from "@/components/admin-notifications/announcement-composer";
import {AppMobileNavigation} from "@/components/dashboard/app-mobile-navigation";
import {DesktopSidebar} from "@/components/dashboard/desktop-sidebar";
import {AppTopBar} from "@/components/design-system/app-top-bar";
import {isFrontendTelegramEnabled} from "@/lib/features/server-features";

export const metadata = {title: "Gyro | ارسال اعلان", description: "ارسال پیام دلخواه به همه کاربران یا یک کاربر مشخص"};

export default async function AdminNotificationsPage() {
  const session = await getSession();
  if (!session.isAuthenticated) redirect("/auth/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  const {history, runtime} = await authenticatedServerRequest(
    async token => ({history: await getAdminAnnouncementHistory(token), runtime: await getAdminNotificationRuntime(token)}),
    {nextPath: "/admin/notifications", retryPolicy: "idempotent"},
  );
  return <div className="dashboard-shell min-h-svh bg-background text-foreground">
    <DesktopSidebar isAdmin/>
    <main id="main-content" className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">
      <AppTopBar title="ارسال اعلان" description="ارسال پیام دلخواه به همه کاربران یا یک کاربر مشخص" backLink={{href: "/admin", label: "بازگشت به پنل ادمین"}} showDateControl={false} showMobileDateAction={false} />
      <AnnouncementComposer history={history} runtime={runtime} telegramVisible={isFrontendTelegramEnabled()} />
    </main>
    <AppMobileNavigation isAdmin activeHref="/admin"/>
  </div>;
}
