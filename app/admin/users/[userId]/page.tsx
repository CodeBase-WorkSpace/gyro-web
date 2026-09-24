import {notFound, redirect} from "next/navigation";

import {AdminUserDetailView} from "@/components/admin-users/user-detail";
import {AppMobileNavigation} from "@/components/dashboard/app-mobile-navigation";
import {DesktopSidebar} from "@/components/dashboard/desktop-sidebar";
import {AppTopBar} from "@/components/design-system/app-top-bar";
import {getAdminGrantPlans, getAdminUserDetail, getAdminUserEntitlement, getAdminUserGrants} from "@/lib/api/admin-users";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {getSession} from "@/lib/auth/session";

export const metadata = {
  title: "Gyro | جزئیات کاربر",
  description: "همه داده‌های نگه‌داری‌شده برای کاربر و حذف کامل حساب",
};

type AdminUserDetailPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function AdminUserDetailPage({params}: AdminUserDetailPageProps) {
  const session = await getSession();
  if (!session.isAuthenticated) redirect("/auth/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const {userId} = await params;
  const normalizedUserId = userId.trim().slice(0, 80);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalizedUserId)) notFound();

  const data = await authenticatedServerRequest(
    async (accessToken) => ({detail: await getAdminUserDetail(accessToken, normalizedUserId), grants: await getAdminUserGrants(accessToken, normalizedUserId), plans: await getAdminGrantPlans(accessToken), entitlement: await getAdminUserEntitlement(accessToken, normalizedUserId)}),
    {nextPath: `/admin/users/${normalizedUserId}`, retryPolicy: "idempotent"},
  ).catch(() => null);

  if (!data) notFound();
  const {detail, grants, plans, entitlement} = data;

  const title = detail.identity.displayName || detail.identity.email || detail.identity.phoneNumber || "کاربر";

  return (
    <div className="dashboard-shell min-h-svh bg-background text-foreground">
      <DesktopSidebar isAdmin/>
      <main id="main-content"
            className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">
        <AppTopBar
          title={title}
          description={`جزئیات کاربر · ${detail.identity.role} · ${detail.identity.status}`}
          backLink={{href: "/admin/users", label: "بازگشت به فهرست کاربران"}}
          showDateControl={false}
          showMobileDateAction={false}
        />
        <AdminUserDetailView detail={detail} actingAdminId={session.user.id} grants={grants} grantPlans={plans} entitlement={entitlement}/>
      </main>
      <AppMobileNavigation isAdmin activeHref="/admin"/>
    </div>
  );
}
