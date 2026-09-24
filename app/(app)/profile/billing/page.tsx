import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {AlertTriangleIcon, CheckCircle2Icon, CrownIcon, LockIcon, ShieldCheckIcon,} from "lucide-react";

import {AppTopBar} from "@/components/design-system/app-top-bar";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {PlanCheckoutForm} from "@/components/subscription/checkout-button";
import {BillingHistorySection} from "@/components/subscription/billing-history-section";
import {SubscriptionStatusCard} from "@/components/subscription/subscription-status-card";
import {getBillingHistory, type BillingHistoryCursor} from "@/lib/api/billing-history";
import {getCurrentEntitlement} from "@/lib/api/entitlement";
import {getSubscriptionCatalog, logSubscriptionCatalogLoadFailure} from "@/lib/api/subscription-catalog";
import {getCurrentSubscription} from "@/lib/api/subscription";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {getSession} from "@/lib/auth/session";
import {accountRecoveryView, type AccountRecoveryViewWithRequest} from "@/lib/subscription/account-recovery";
import {billingPurchaseContext} from "@/lib/subscription/billing-presentation";
import {demoSubscriptionState, type SubscriptionState} from "@/lib/subscription/entitlements";
import {
  currentPlanFromSubscription,
  planForTierFromPlans,
  plansWithCatalog,
  type SubscriptionPlan,
} from "@/lib/subscription/plans";
import {cn} from "@/lib/utils";

export const metadata: Metadata = {
  title: "جیرو | اشتراک و صورتحساب",
  description: "مدیریت اشتراک، انتخاب طرح و پیگیری امن پرداخت در جیرو",
};

type BillingPageProps = {
  searchParams: Promise<{
    status?: string;
    requestId?: string;
    historyBeforeCreatedAt?: string;
    historyBeforeInvoiceId?: string;
  }>;
};

export default async function BillingPage({searchParams}: BillingPageProps) {
  const session = await getSession();

  if (!session.isAuthenticated) {
    redirect("/auth/login?next=%2Fprofile%2Fbilling&expired=1");
  }

  const params = await searchParams;
  const allowBillingPreview = process.env.NODE_ENV !== "production";
  const previewStatus = allowBillingPreview ? params?.status : undefined;
  const previewRequestId = allowBillingPreview ? params?.requestId : undefined;
  const historyCursor = billingHistoryCursorParam(params?.historyBeforeCreatedAt, params?.historyBeforeInvoiceId);
  const [catalogResult, entitlementResult, historyResult, lifecycleResult] = await Promise.all([
    loadSubscriptionCatalog(),
    loadCurrentEntitlement(),
    loadBillingHistory(historyCursor),
    loadCurrentSubscription(),
  ]);
  const catalog = catalogResult.catalog;
  const subscriptionPlans = plansWithCatalog(catalog);
  const subscription = entitlementResult.subscription;
  const currentPlan = catalog
    ? planForTierFromPlans(subscriptionPlans, subscription.tier)
    : currentPlanFromSubscription(subscription);
  const recoveryState = accountRecoveryView(previewStatus, previewRequestId);
  const enabledEntitlements = new Set(subscription.entitlements);

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10"
      aria-label="اشتراک و صورتحساب"
    >
      <AppTopBar
        title="اشتراک و صورتحساب"
        description="طرح فعلی، گزینه‌های پرداخت و وضعیت تأیید اشتراک"
        backLink={{href: "/profile", label: "بازگشت به تنظیمات"}}
        showDateControl={false}
        showMobileDateAction={false}
      />

      {recoveryState ? <BillingRecoveryBanner recovery={recoveryState}/> : null}

      {catalogResult.failed ? (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTriangleIcon/>
          <AlertTitle className="font-bold">کاتالوگ اشتراک در دسترس نیست</AlertTitle>
          <AlertDescription className="leading-7">
            قیمت‌ها از fallback محلی نمایش داده می‌شوند و اقدام‌های پرداخت تا دریافت کاتالوگ backend غیرفعال می‌مانند.
          </AlertDescription>
        </Alert>
      ) : null}

      {entitlementResult.failed ? (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTriangleIcon/>
          <AlertTitle className="font-bold">وضعیت اشتراک خوانده نشد</AlertTitle>
          <AlertDescription className="leading-7">
            برای جلوگیری از باز شدن اشتباه قابلیت‌های پولی، صفحه موقتا وضعیت رایگان را نمایش می‌دهد.
          </AlertDescription>
        </Alert>
      ) : null}

      <SubscriptionStatusCard
        subscription={lifecycleResult.subscription}
        entitlement={subscription}
      />

      <section id="plans" className="grid scroll-mt-24 gap-4 lg:grid-cols-2" aria-label="پلن‌های اشتراک">
        {subscriptionPlans.map((plan) => (
          <BillingPlanCard
            key={plan.tier}
            plan={plan}
            current={plan.tier === currentPlan.tier}
            enabledEntitlements={enabledEntitlements}
            subscription={subscription}
          />
        ))}
      </section>

      <BillingHistorySection
        history={historyResult.history}
        failed={historyResult.failed}
        paginated={Boolean(historyCursor)}
      />
    </main>
  );
}

async function loadCurrentSubscription() {
  try {
    const subscription = await authenticatedServerRequest((accessToken) => getCurrentSubscription(accessToken), {nextPath: "/profile/billing", retryPolicy: "idempotent"});
    return {subscription};
  } catch { return {subscription: null}; }
}

async function loadSubscriptionCatalog() {
  try {
    // Plan catalog is shared across users; serve from the Data Cache like the
    // landing page does instead of a per-render backend round trip.
    return {
      catalog: await getSubscriptionCatalog("fa-IR", {
        cache: "force-cache",
        next: {revalidate: 300},
      }),
      failed: false,
    };
  } catch (error) {
    logSubscriptionCatalogLoadFailure("billing", error);
    return {catalog: null, failed: true};
  }
}

async function loadCurrentEntitlement() {
  try {
    const subscription = await authenticatedServerRequest(
      (accessToken) => getCurrentEntitlement(accessToken),
      {nextPath: "/profile/billing", retryPolicy: "idempotent"},
    );
    return {subscription, failed: false};
  } catch (error) {
    console.warn("event=entitlement_fetch outcome=failure surface=billing", error);
    return {subscription: demoSubscriptionState("FREE"), failed: true};
  }
}

async function loadBillingHistory(cursor?: BillingHistoryCursor) {
  try {
    const history = await authenticatedServerRequest(
      (accessToken) => getBillingHistory(accessToken, 20, cursor),
      {nextPath: "/profile/billing", retryPolicy: "idempotent"},
    );
    return {history, failed: false};
  } catch (error) {
    console.warn("event=billing_history_fetch outcome=failure", error);
    return {history: null, failed: true};
  }
}

function billingHistoryCursorParam(
  beforeCreatedAt: string | undefined,
  beforeInvoiceId: string | undefined,
): BillingHistoryCursor | undefined {
  const createdAt = beforeCreatedAt?.trim();
  const invoiceId = beforeInvoiceId?.trim();
  if (!createdAt || !invoiceId) return undefined;
  if (Number.isNaN(new Date(createdAt).getTime())) return undefined;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(invoiceId)) return undefined;
  return {beforeCreatedAt: createdAt, beforeInvoiceId: invoiceId};
}

function BillingRecoveryBanner({recovery}: { recovery: AccountRecoveryViewWithRequest }) {
  const hardBlock = recovery.kind === "hard_block";

  return (
    <Alert variant={hardBlock ? "destructive" : "default"} className="rounded-2xl">
      <AlertTriangleIcon/>
      <AlertTitle className="font-bold">{recovery.title}</AlertTitle>
      <AlertDescription>
        <div className="flex flex-col gap-3">
          <p className="leading-7">{recovery.description}</p>
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="flex flex-wrap gap-2">
              {recovery.safeActions.map((action) => (
                <span
                  key={action}
                  className="rounded-full border bg-background/70 px-3 py-1 text-xs font-bold text-muted-foreground"
                >
                  {action}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {recovery.primaryAction.href && !recovery.primaryAction.disabled ? (
                <Link
                  href={recovery.primaryAction.href}
                  className={cn(buttonLinkClass(hardBlock), "rounded-full px-3 py-1.5 text-xs font-black")}
                >
                  {recovery.primaryAction.label}
                </Link>
              ) : (
                <span className="rounded-full border px-3 py-1.5 text-xs font-black text-muted-foreground">
                  {recovery.primaryAction.label}
                </span>
              )}
              {recovery.secondaryAction.href && !recovery.secondaryAction.disabled ? (
                <Link
                  href={recovery.secondaryAction.href}
                  className="rounded-full border bg-background px-3 py-1.5 text-xs font-black text-foreground transition-colors hover:bg-muted"
                >
                  {recovery.secondaryAction.label}
                </Link>
              ) : null}
            </div>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            مسیر پشتیبانی: {recovery.supportPath}
            {recovery.requestId ? (
              <>
                {" "}· شناسه پیگیری: <bdi>{recovery.requestId}</bdi>
              </>
            ) : null}
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}

function BillingPlanCard({
                           plan,
                           current,
                           enabledEntitlements,
                           subscription,
                         }: {
  plan: SubscriptionPlan;
  current: boolean;
  enabledEntitlements: Set<string>;
  subscription: SubscriptionState;
}) {
  const Icon = plan.featured ? CrownIcon : ShieldCheckIcon;
  const purchaseContext = billingPurchaseContext(
    subscription,
    plan.tier,
    current,
  );
  const isTrialPlan = current && subscription.trial?.active === true;

  return (
    <Card
      className={cn(
        "rounded-3xl border bg-card shadow-sm",
        plan.featured && "border-primary/45 bg-primary/8",
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Icon data-icon="inline-start"/>
          {plan.localizedName}
        </CardTitle>
        <CardDescription className="leading-7">{plan.summary}</CardDescription>
        <CardAction>
          {current ? (
            <StatusPill
              label={isTrialPlan
                ? "دوره آزمایشی فعال"
                : plan.tier === "ADVANCED"
                  ? "اشتراک فعلی"
                  : "طرح فعلی"}
            />
          ) : null}
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 sm:grid-cols-3">
          {plan.limits.map((limit) => (
            <div key={limit.label} className="rounded-2xl border bg-background/45 p-3">
              <p className="text-xs font-bold text-muted-foreground">{limit.label}</p>
              <p className="mt-1 font-black">{limit.value}</p>
            </div>
          ))}
        </div>
        <ul className="grid gap-2">
          {plan.features.map((feature) => {
            const locked =
              plan.tier === "ADVANCED" &&
              !current &&
              !enabledEntitlements.size;

            return (
              <li
                key={feature.label}
                className="flex items-start gap-2 rounded-2xl bg-background/45 px-3 py-2 text-sm leading-6"
              >
                {locked ? (
                  <LockIcon className="mt-1 shrink-0 text-muted-foreground" aria-hidden="true"/>
                ) : (
                  <CheckCircle2Icon className="mt-1 shrink-0 text-primary" aria-hidden="true"/>
                )}
                <span className="min-w-0">{feature.label}</span>
              </li>
            );
          })}
        </ul>
        {plan.prices.length ? (
          <div className="grid gap-2 rounded-2xl border bg-background/45 p-3">
            <p className="text-xs font-bold text-muted-foreground">
              {purchaseContext === "TRIAL_EXTENSION"
                ? "خرید اشتراک پس از دوره آزمایشی"
                : purchaseContext === "RENEWAL"
                  ? "افزودن مدت به اشتراک"
                  : "انتخاب دوره اشتراک"}
            </p>
            <p className="text-sm font-semibold leading-7 text-muted-foreground">
              {purchaseContext === "TRIAL_EXTENSION"
                ? "روزهای خریداری‌شده بعد از پایان دوره آزمایشی شروع می‌شوند؛ هیچ روزی از دست نمی‌رود."
                : purchaseContext === "RENEWAL"
                  ? "مدت دوره جدید به پایان اشتراک فعلی اضافه می‌شود."
                  : "مدت و مبلغ را انتخاب کن و سپس وارد درگاه پرداخت شو."}
            </p>
            <PlanCheckoutForm
              prices={plan.prices}
              featured={plan.featured}
              purchaseContext={purchaseContext}
            />
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <p className="text-xs leading-6 text-muted-foreground">
          {plan.name} · {plan.eyebrow}
        </p>
        {current && !plan.prices.length ? (
          <Button type="button" variant="outline" disabled>
            فعال
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}

function buttonLinkClass(destructive: boolean) {
  return destructive
    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
    : "bg-primary text-primary-foreground hover:bg-primary/90";
}

function StatusPill({label}: { label: string }) {
  return (
    <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-black text-primary">
      {label}
    </span>
  );
}
