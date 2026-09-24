import {redirect} from "next/navigation";
import {AppTopBar} from "@/components/design-system/app-top-bar";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {getAffiliateEarnings, getAffiliateSummary} from "@/lib/api/affiliates";
import {getSession} from "@/lib/auth/session";
import {formatIrr} from "@/lib/format";

export default async function AffiliateDashboardPage() {
  const session = await getSession(); if (!session.isAuthenticated) redirect("/auth/login?next=/profile/affiliate");
  const now = new Date(); const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth()-5, 1));
  const [summary, earnings] = await Promise.all([authenticatedServerRequest(t => getAffiliateSummary(t), {nextPath:"/profile/affiliate",retryPolicy:"idempotent"}), authenticatedServerRequest(t => getAffiliateEarnings(t, from.toISOString(), now.toISOString()), {nextPath:"/profile/affiliate",retryPolicy:"idempotent"})]);
  return <main id="main-content" className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8"><AppTopBar title="همکاری در فروش" description={`کد اختصاصی شما: ${summary.code}`} backLink={{href:"/profile",label:"پروفایل"}}/><section className="grid gap-3 sm:grid-cols-3"><Metric label="مشتری موفق" value={String(summary.successfulCustomerCount)}/><Metric label="فروش با تخفیف" value={formatIrr(summary.totalCustomerPaidAmount)}/><Metric label="درآمد محاسبه‌شده" value={formatIrr(summary.totalEarnedAmount)}/></section><Card className="rounded-3xl"><CardHeader><CardTitle>شیوه محاسبه</CardTitle><CardDescription className="leading-7">مشتری جدید با کد شما {summary.discountPercentage}٪ تخفیف می‌گیرد و {summary.commissionPercentage}٪ از مبلغ پرداخت‌شده همان اولین صورتحساب، به‌عنوان درآمد همکاری محاسبه می‌شود.</CardDescription></CardHeader><CardContent><p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-7 text-amber-800 dark:text-amber-200">این ارقام فعلاً گزارش محاسباتی هستند و موجودی کیف پول قابل برداشت محسوب نمی‌شوند.</p></CardContent></Card><Card className="rounded-3xl"><CardHeader><CardTitle>روند تجمیعی شش ماه اخیر</CardTitle><CardDescription>بدون نمایش نام، حساب یا شناسه مشتریان</CardDescription></CardHeader><CardContent className="space-y-3">{earnings.buckets.map(b => <div key={b.period} className="grid grid-cols-3 gap-2 rounded-2xl border p-3 text-sm"><span>{b.period}</span><span>{b.successfulCustomerCount} خرید</span><strong>{formatIrr(b.earnedAmount)}</strong></div>)}{earnings.buckets.length === 0 ? <p className="text-sm text-muted-foreground">هنوز درآمد موفقی ثبت نشده است.</p> : null}</CardContent></Card></main>;
}
function Metric({label,value}:{label:string;value:string}) { return <Card className="rounded-3xl"><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="tabular-nums">{value}</CardTitle></CardHeader></Card>; }
