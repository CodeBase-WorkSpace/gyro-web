import {redirect} from "next/navigation";
import Link from "next/link";
import {AppMobileNavigation} from "@/components/dashboard/app-mobile-navigation";
import {DesktopSidebar} from "@/components/dashboard/desktop-sidebar";
import {AppTopBar} from "@/components/design-system/app-top-bar";
import {buttonVariants} from "@/components/ui/button";
import {getSession} from "@/lib/auth/session";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {getAdminAffiliates} from "@/lib/api/affiliates";
import {AffiliateManager} from "@/components/admin-affiliates/affiliate-manager";

export default async function AdminAffiliatesPage() {
  const session = await getSession();
  if (!session.isAuthenticated) redirect("/auth/login?next=/admin/affiliates");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  const page = await authenticatedServerRequest(token => getAdminAffiliates(token), {nextPath: "/admin/affiliates", retryPolicy: "idempotent"});
  return <div className="dashboard-shell min-h-svh bg-background text-foreground"><DesktopSidebar isAdmin/><main id="main-content" className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8"><AppTopBar title="همکاران فروش" description="کدهای اختصاصی، اتصال حساب و گزارش تجمیعی درآمد" backLink={{href:"/admin",label:"پنل ادمین"}}/><div className="flex flex-wrap gap-2"><Link href="/admin/promotions" className={buttonVariants({variant:"outline"})}>مشاهده همه کدهای تخفیف</Link></div><AffiliateManager page={page}/></main><AppMobileNavigation isAdmin activeHref="/admin"/></div>;
}
