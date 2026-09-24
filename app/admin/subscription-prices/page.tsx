import {redirect} from "next/navigation";
import {getSession} from "@/lib/auth/session";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {getAdminPricePlans} from "@/lib/api/admin-subscription-prices";
import {SubscriptionPriceManager} from "@/components/admin-subscription-prices/subscription-price-manager";
import {AppMobileNavigation} from "@/components/dashboard/app-mobile-navigation";
import {DesktopSidebar} from "@/components/dashboard/desktop-sidebar";

export default async function AdminSubscriptionPricesPage() {
  const session = await getSession();
  if (!session.isAuthenticated) redirect("/auth/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  const plans = await authenticatedServerRequest(token => getAdminPricePlans(token), {nextPath: "/admin/subscription-prices", retryPolicy: "idempotent"});
  return <div className="dashboard-shell min-h-svh bg-background text-foreground"><DesktopSidebar isAdmin/><SubscriptionPriceManager plans={plans}/><AppMobileNavigation isAdmin activeHref="/admin"/></div>;
}
