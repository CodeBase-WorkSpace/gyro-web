import {redirect} from "next/navigation";

import {AdminCatalogListView} from "@/components/admin-catalog/catalog-list";
import {AppMobileNavigation} from "@/components/dashboard/app-mobile-navigation";
import {DesktopSidebar} from "@/components/dashboard/desktop-sidebar";
import {getAdminCatalogFoods, type AdminCatalogOwnership, type AdminCatalogPageDto} from "@/lib/api/admin-catalog";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {getSession} from "@/lib/auth/session";

export const metadata = {
  title: "Gyro | کاتالوگ غذا",
  description: "مدیریت غذاها، برندها و واحدهای سروینگ کاتالوگ",
};

type AdminCatalogPageProps = {
  searchParams: Promise<{
    query?: string;
    curationStatus?: string;
    archived?: string;
    ownership?: string;
    page?: string;
  }>;
};

export default async function AdminCatalogPage({searchParams}: AdminCatalogPageProps) {
  const session = await getSession();
  if (!session.isAuthenticated) redirect("/auth/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const search = {
    query: safeParam(params.query, 120),
    curationStatus: safeParam(params.curationStatus, 50),
    archived: params.archived === "true" || params.archived === "false" ? params.archived : undefined,
    ownership: ownershipParam(params.ownership),
    page: pageParam(params.page),
  };

  const {page, failed} = await loadCatalogPage(search);

  return (
    <div className="dashboard-shell min-h-svh bg-background text-foreground">
      <DesktopSidebar isAdmin/>
      <AdminCatalogListView catalogPage={page} loadFailed={failed} search={search}/>
      <AppMobileNavigation isAdmin activeHref="/admin"/>
    </div>
  );
}

async function loadCatalogPage(search: {
  query?: string;
  curationStatus?: string;
  archived?: string;
  ownership?: AdminCatalogOwnership;
  page?: number;
}): Promise<{ page: AdminCatalogPageDto | null; failed: boolean }> {
  try {
    const page = await authenticatedServerRequest(
      (accessToken) => getAdminCatalogFoods(accessToken, search),
      {nextPath: "/admin/catalog", retryPolicy: "idempotent"},
    );
    return {page, failed: false};
  } catch (error) {
    console.warn("event=admin_catalog_list_fetch outcome=failure", error);
    return {page: null, failed: true};
  }
}

function safeParam(value: string | undefined, maxLength: number) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function pageParam(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function ownershipParam(value: string | undefined): "USER" | "ALL" | undefined {
  const normalized = value?.trim().toUpperCase();
  return normalized === "USER" || normalized === "ALL" ? normalized : undefined;
}
