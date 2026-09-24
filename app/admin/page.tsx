import {AdminPanel} from "@/components/admin-panel";
import {AppMobileNavigation} from "@/components/dashboard/app-mobile-navigation";
import {DesktopSidebar} from "@/components/dashboard/desktop-sidebar";
import {getSubscriptionCatalog, logSubscriptionCatalogLoadFailure} from "@/lib/api/subscription-catalog";
import {getSession} from "@/lib/auth/session";
import {redirect} from "next/navigation";

export const metadata = {
  title: "Gyro | پنل ادمین",
  description: "پایش عملیات، داده‌ها و آمادگی API در Gyro"
};

export default async function AdminPage() {
  const session = await getSession();

  if (!session.isAuthenticated) {
    redirect("/auth/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const catalogResult = await loadSubscriptionCatalog();

  return (
    <div className="dashboard-shell min-h-svh bg-background text-foreground">
      <DesktopSidebar isAdmin/>

      <a
        className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        href="#main-content"
      >
        رفتن به محتوای اصلی
      </a>

      <AdminPanel
        subscriptionCatalog={catalogResult.catalog}
        subscriptionCatalogLoadFailed={catalogResult.failed}
      />

      <AppMobileNavigation isAdmin activeHref="/admin"/>
    </div>
  );
}

async function loadSubscriptionCatalog() {
  try {
    return {catalog: await getSubscriptionCatalog("fa-IR"), failed: false};
  } catch (error) {
    logSubscriptionCatalogLoadFailure("admin", error);
    return {catalog: null, failed: true};
  }
}
