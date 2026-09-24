import {redirect} from "next/navigation";

import {AdminBillingPageView} from "@/components/admin-billing-page";
import {AppMobileNavigation} from "@/components/dashboard/app-mobile-navigation";
import {DesktopSidebar} from "@/components/dashboard/desktop-sidebar";
import {getAdminBillingInvoice, getAdminBillingLifecycle, getAdminBillingSnapshot} from "@/lib/api/admin";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {getSession} from "@/lib/auth/session";

export const metadata = {
  title: "Gyro | صورتحساب ادمین",
  description: "جستجو و خط زمانی امن صورتحساب‌ها و پرداخت‌ها",
};

type AdminBillingPageProps = {
  searchParams: Promise<{ query?: string; status?: string; invoiceId?: string }>;
};

export default async function AdminBillingPage({searchParams}: AdminBillingPageProps) {
  const session = await getSession();
  if (!session.isAuthenticated) redirect("/auth/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const search = {
    query: safeParam(params.query, 128),
    status: safeParam(params.status, 32),
    invoiceId: uuidParam(params.invoiceId),
  };
  const [snapshotResult, detailResult, lifecycleResult] = await Promise.all([
    loadSnapshot(search),
    search.invoiceId ? loadDetail(search.invoiceId) : Promise.resolve({detail: null, failed: false}),
    loadLifecycle(),
  ]);

  return (
    <div className="dashboard-shell min-h-svh bg-background text-foreground">
      <DesktopSidebar isAdmin/>
      <AdminBillingPageView
        snapshot={snapshotResult.snapshot}
        snapshotFailed={snapshotResult.failed}
        detail={detailResult.detail}
        detailFailed={detailResult.failed}
        search={search}
        lifecycle={lifecycleResult.lifecycle}
      />
      <AppMobileNavigation isAdmin activeHref="/admin"/>
    </div>
  );
}

async function loadLifecycle() { try { return {lifecycle: await authenticatedServerRequest((accessToken) => getAdminBillingLifecycle(accessToken), {nextPath: "/admin/billing", retryPolicy: "idempotent"})}; } catch { return {lifecycle: null}; } }

async function loadSnapshot(search: { query?: string; status?: string }) {
  try {
    const snapshot = await authenticatedServerRequest(
      (accessToken) => getAdminBillingSnapshot(accessToken, search),
      {nextPath: "/admin/billing", retryPolicy: "idempotent"},
    );
    return {snapshot, failed: false};
  } catch (error) {
    console.warn("event=admin_billing_snapshot_fetch outcome=failure", error);
    return {snapshot: null, failed: true};
  }
}

async function loadDetail(invoiceId: string) {
  try {
    const detail = await authenticatedServerRequest(
      (accessToken) => getAdminBillingInvoice(accessToken, invoiceId),
      {nextPath: `/admin/billing?invoiceId=${invoiceId}`, retryPolicy: "idempotent"},
    );
    return {detail, failed: false};
  } catch (error) {
    console.warn("event=admin_billing_invoice_fetch outcome=failure", error);
    return {detail: null, failed: true};
  }
}

function safeParam(value: string | undefined, maxLength: number) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function uuidParam(value: string | undefined) {
  const normalized = value?.trim();
  return normalized && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)
    ? normalized
    : undefined;
}
