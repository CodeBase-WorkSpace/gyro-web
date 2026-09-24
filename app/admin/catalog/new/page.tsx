import {redirect} from "next/navigation";

import {AdminFoodEditor} from "@/components/admin-catalog/food-editor";
import {AppMobileNavigation} from "@/components/dashboard/app-mobile-navigation";
import {DesktopSidebar} from "@/components/dashboard/desktop-sidebar";
import {AppTopBar} from "@/components/design-system/app-top-bar";
import {
  getAdminCatalogCategories,
  getAdminCatalogFood,
  getAdminCatalogServingUnits,
  type AdminFoodDetailDto,
} from "@/lib/api/admin-catalog";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {getSession} from "@/lib/auth/session";

export const metadata = {
  title: "Gyro | غذای جدید کاتالوگ",
  description: "ساخت غذای کامل با ارزش غذایی، ترجمه و چند گزینه سروینگ",
};

type AdminCatalogNewFoodPageProps = {
  searchParams: Promise<{ copyFrom?: string }>;
};

export default async function AdminCatalogNewFoodPage({searchParams}: AdminCatalogNewFoodPageProps) {
  const session = await getSession();
  if (!session.isAuthenticated) redirect("/auth/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const copyFrom = params.copyFrom?.trim().slice(0, 80) || undefined;

  const [servingUnits, categories, copySource] = await Promise.all([
    authenticatedServerRequest(
      (accessToken) => getAdminCatalogServingUnits(accessToken),
      {nextPath: "/admin/catalog/new", retryPolicy: "idempotent"},
    ).catch(() => []),
    authenticatedServerRequest(
      (accessToken) => getAdminCatalogCategories(accessToken),
      {nextPath: "/admin/catalog/new", retryPolicy: "idempotent"},
    ).catch(() => []),
    copyFrom
      ? authenticatedServerRequest(
        (accessToken) => getAdminCatalogFood(accessToken, copyFrom),
        {nextPath: `/admin/catalog/new?copyFrom=${encodeURIComponent(copyFrom)}`, retryPolicy: "idempotent"},
      ).catch(() => null)
      : Promise.resolve<AdminFoodDetailDto | null>(null),
  ]);

  return (
    <div className="dashboard-shell min-h-svh bg-background text-foreground">
      <DesktopSidebar isAdmin/>
      <main id="main-content"
            className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">
        <AppTopBar
          title={copySource ? `کپی از «${copySource.name}»` : "غذای جدید کاتالوگ"}
          description={copySource
            ? "یک غذای کاتالوگی جدید بر پایه غذای انتخاب‌شده؛ قبل از ذخیره هر بخشی را می‌توانید تغییر دهید"
            : "ساخت غذای کامل با برند، ترجمه، ارزش غذایی و چند گزینه سروینگ"}
          backLink={{href: "/admin/catalog", label: "بازگشت به کاتالوگ"}}
          showDateControl={false}
          showMobileDateAction={false}
        />
        {copyFrom && !copySource ? (
          <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-bold text-destructive">
            غذای مبدأ برای کپی پیدا نشد؛ فرم خالی نمایش داده می‌شود.
          </p>
        ) : null}
        <AdminFoodEditor mode="create" servingUnits={servingUnits} categories={categories} food={copySource}/>
      </main>
      <AppMobileNavigation isAdmin activeHref="/admin"/>
    </div>
  );
}
