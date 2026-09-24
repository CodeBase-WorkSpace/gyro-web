import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {AlertTriangleIcon, ShieldAlertIcon} from "lucide-react";

import {DesktopSidebar} from "@/components/dashboard/desktop-sidebar";
import {AppMobileNavigation} from "@/components/dashboard/app-mobile-navigation";
import {AppTopBar} from "@/components/design-system/app-top-bar";
import {buttonVariants} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {getSession} from "@/lib/auth/session";
import {accountRecoveryView} from "@/lib/subscription/account-recovery";
import {cn} from "@/lib/utils";

export const metadata: Metadata = {
  title: "Gyro | بازیابی دسترسی حساب",
  description: "مسیر بازیابی، پشتیبانی و وضعیت امن حساب‌های محدودشده در Gyro",
};

type AccountRecoveryPageProps = {
  searchParams: Promise<{
    state?: string;
    requestId?: string;
  }>;
};

export default async function AccountRecoveryPage({searchParams}: AccountRecoveryPageProps) {
  const session = await getSession();

  if (!session.isAuthenticated) {
    redirect("/auth/login?next=%2Faccount%2Frecovery&expired=1");
  }

  const params = await searchParams;
  const recovery = accountRecoveryView(params?.state ?? "ACCOUNT_STOPPED", params?.requestId);

  if (!recovery) {
    redirect("/profile/billing?status=backend_error");
  }

  const hardBlock = recovery.kind === "hard_block";

  return (
    <div className="dashboard-shell min-h-svh bg-background text-foreground">
      <DesktopSidebar isAdmin={session.user.role === "ADMIN"} />

      <main
        id="main-content"
        className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10"
        aria-label="بازیابی دسترسی حساب"
      >
        <AppTopBar
          title="بازیابی دسترسی حساب"
          description="مسیر مشخص برای حساب‌های متوقف، مسدود یا محدودشده"
          backLink={{href: "/profile/billing", label: "بازگشت به صورتحساب"}}
          showDateControl={false}
          showMobileDateAction={false}
        />

        <Card className="rounded-3xl border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              {hardBlock ? <ShieldAlertIcon data-icon="inline-start" /> : <AlertTriangleIcon data-icon="inline-start" />}
              {recovery.title}
            </CardTitle>
            <CardDescription className="leading-7">
              {recovery.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-3 rounded-2xl border bg-muted/30 p-4">
              <p className="text-xs font-bold text-muted-foreground">وضعیت</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border bg-background/70 px-3 py-1 text-xs font-black">
                  {recovery.label}
                </span>
                <span className="rounded-full border bg-background/70 px-3 py-1 text-xs font-bold text-muted-foreground">
                  {recovery.kind === "recoverable"
                    ? "قابل بازیابی"
                    : recovery.kind === "temporary"
                      ? "موقت"
                      : "بلوک سخت"}
                </span>
              </div>
              {recovery.requestId ? (
                <p className="text-sm leading-7 text-muted-foreground">
                  شناسه پیگیری برای پشتیبانی: <bdi className="font-bold text-foreground">{recovery.requestId}</bdi>
                </p>
              ) : (
                <p className="text-sm leading-7 text-muted-foreground">
                  اگر این پیام از پاسخ backend آمده باشد، شناسه پیگیری باید کنار همین وضعیت نمایش داده شود.
                </p>
              )}
            </div>

            <section className="grid gap-3" aria-label="اقدام‌های امن">
              <h2 className="text-base font-bold">اقدام‌های امن باقی‌مانده</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {recovery.safeActions.map((action) => (
                  <div key={action} className="rounded-2xl border bg-background/45 p-3 text-sm font-semibold leading-6">
                    {action}
                  </div>
                ))}
              </div>
            </section>
          </CardContent>
          <CardFooter className="flex-wrap justify-between gap-3">
            <p className="text-xs leading-6 text-muted-foreground">
              مسیر پشتیبانی: {recovery.supportPath}
            </p>
            <div className="flex flex-wrap gap-2">
              {recovery.secondaryAction.href && !recovery.secondaryAction.disabled ? (
                <Link
                  href={recovery.secondaryAction.href}
                  className={cn(buttonVariants({variant: "outline"}))}
                >
                  {recovery.secondaryAction.label}
                </Link>
              ) : null}
              {recovery.primaryAction.href && !recovery.primaryAction.disabled ? (
                <Link
                  href={recovery.primaryAction.href}
                  className={cn(buttonVariants())}
                >
                  {recovery.primaryAction.label}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className={cn(buttonVariants(), "disabled:pointer-events-none disabled:opacity-50")}
                >
                  {recovery.primaryAction.label}
                </button>
              )}
            </div>
          </CardFooter>
        </Card>
      </main>

      <AppMobileNavigation
        isAdmin={session.user.role === "ADMIN"}
        activeHref="/profile"
      />
    </div>
  );
}
