import {notFound, redirect} from "next/navigation";

import {AdminFoodEditor} from "@/components/admin-catalog/food-editor";
import {AppMobileNavigation} from "@/components/dashboard/app-mobile-navigation";
import {DesktopSidebar} from "@/components/dashboard/desktop-sidebar";
import {AppTopBar} from "@/components/design-system/app-top-bar";
import {
  getAdminCatalogCategories,
  getAdminCatalogFood,
  getAdminCatalogServingUnits,
} from "@/lib/api/admin-catalog";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {getSession} from "@/lib/auth/session";

export const metadata = {
  title: "Gyro | ویرایش غذای کاتالوگ",
  description: "ویرایش غذا، برند، ترجمه‌ها و گزینه‌های سروینگ",
};

type AdminCatalogFoodPageProps = {
  params: Promise<{ foodId: string }>;
};

export default async function AdminCatalogFoodPage({params}: AdminCatalogFoodPageProps) {
  const session = await getSession();
  if (!session.isAuthenticated) redirect("/auth/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const {foodId} = await params;
  const normalizedFoodId = foodId.trim().slice(0, 80);
  if (!normalizedFoodId) notFound();

  const [food, servingUnits, categories] = await Promise.all([
    authenticatedServerRequest(
      (accessToken) => getAdminCatalogFood(accessToken, normalizedFoodId),
      {nextPath: `/admin/catalog/${normalizedFoodId}`, retryPolicy: "idempotent"},
    ).catch(() => null),
    authenticatedServerRequest(
      (accessToken) => getAdminCatalogServingUnits(accessToken),
      {nextPath: `/admin/catalog/${normalizedFoodId}`, retryPolicy: "idempotent"},
    ).catch(() => []),
    authenticatedServerRequest(
      (accessToken) => getAdminCatalogCategories(accessToken),
      {nextPath: `/admin/catalog/${normalizedFoodId}`, retryPolicy: "idempotent"},
    ).catch(() => []),
  ]);

  if (!food) notFound();

  return (
    <div className="dashboard-shell min-h-svh bg-background text-foreground">
      <DesktopSidebar isAdmin/>
      <main id="main-content"
            className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">
        <AppTopBar
          title={food.name}
          description={food.editable
            ? `ویرایش کاتالوگ · ساخت ادمین · نسخه ${food.lockVersion}`
            : "مشاهده غذای کاربر · فقط‌خواندنی"}
          backLink={{href: "/admin/catalog", label: "بازگشت به کاتالوگ"}}
          showDateControl={false}
          showMobileDateAction={false}
        />
        <AdminFoodEditor mode="edit" servingUnits={servingUnits} categories={categories} food={food}/>
      </main>
      <AppMobileNavigation isAdmin activeHref="/admin"/>
    </div>
  );
}
