import {redirect} from "next/navigation";
import {getSession} from "@/lib/auth/session";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {getAdminPromotions} from "@/lib/api/admin-promotions";
import {getAdminGrantPlans} from "@/lib/api/admin-users";
import {getAdminPricePlans} from "@/lib/api/admin-subscription-prices";
import {PromotionsList} from "@/components/admin-promotions/promotions-list";
import {AppMobileNavigation} from "@/components/dashboard/app-mobile-navigation";
import {DesktopSidebar} from "@/components/dashboard/desktop-sidebar";
export default async function AdminPromotionsPage() { const session = await getSession(); if (!session.isAuthenticated) redirect("/auth/login"); if (session.user.role !== "ADMIN") redirect("/dashboard"); const [page, plans, pricePlans] = await Promise.all([authenticatedServerRequest(token => getAdminPromotions(token), {nextPath: "/admin/promotions", retryPolicy: "idempotent"}), authenticatedServerRequest(token => getAdminGrantPlans(token), {nextPath: "/admin/promotions", retryPolicy: "idempotent"}), authenticatedServerRequest(token => getAdminPricePlans(token), {nextPath: "/admin/promotions", retryPolicy: "idempotent"})]); return <div className="dashboard-shell min-h-svh bg-background text-foreground"><DesktopSidebar isAdmin/><PromotionsList page={page} plans={plans} pricePlans={pricePlans}/><AppMobileNavigation isAdmin activeHref="/admin"/></div>; }
