import {redirect} from "next/navigation";

import {AdminUsersListView} from "@/components/admin-users/users-list";
import {AppMobileNavigation} from "@/components/dashboard/app-mobile-navigation";
import {DesktopSidebar} from "@/components/dashboard/desktop-sidebar";
import {getAdminUsers, type AdminUsersPageDto} from "@/lib/api/admin-users";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {getSession} from "@/lib/auth/session";

export const metadata = {
  title: "Gyro | مدیریت کاربران",
  description: "جستجو، جزئیات داده و حذف کامل حساب کاربران",
};

type AdminUsersPageProps = {
  searchParams: Promise<{ query?: string; role?: string; status?: string; page?: string }>;
};

export default async function AdminUsersPage({searchParams}: AdminUsersPageProps) {
  const session = await getSession();
  if (!session.isAuthenticated) redirect("/auth/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const search = {
    query: safeParam(params.query, 320),
    role: enumParam(params.role, ["USER", "ADMIN"]),
    status: enumParam(params.status, ["ACTIVE", "DISABLED", "PENDING_VERIFICATION", "DEACTIVATED", "DELETED"]),
    page: pageParam(params.page),
  };

  const {page, failed} = await loadUsersPage(search);

  return (
    <div className="dashboard-shell min-h-svh bg-background text-foreground">
      <DesktopSidebar isAdmin/>
      <AdminUsersListView usersPage={page} loadFailed={failed} search={search}/>
      <AppMobileNavigation isAdmin activeHref="/admin"/>
    </div>
  );
}

async function loadUsersPage(search: {
  query?: string;
  role?: string;
  status?: string;
  page?: number;
}): Promise<{ page: AdminUsersPageDto | null; failed: boolean }> {
  try {
    const page = await authenticatedServerRequest(
      (accessToken) => getAdminUsers(accessToken, search),
      {nextPath: "/admin/users", retryPolicy: "idempotent"},
    );
    return {page, failed: false};
  } catch (error) {
    console.warn("event=admin_users_list_fetch outcome=failure", error);
    return {page: null, failed: true};
  }
}

function safeParam(value: string | undefined, maxLength: number) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function enumParam(value: string | undefined, allowed: string[]) {
  const normalized = value?.trim().toUpperCase();
  return normalized && allowed.includes(normalized) ? normalized : undefined;
}

function pageParam(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
