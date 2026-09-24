"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";

import {PromotionEditor} from "@/components/admin-promotions/promotion-editor";
import {AppTopBar} from "@/components/design-system/app-top-bar";
import {Button} from "@/components/ui/button";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import type {AdminGrantPlanDto} from "@/lib/api/admin-users";
import type {AdminPromotion, AdminPromotionPage} from "@/lib/api/admin-promotions";
import type {AdminPricePlan} from "@/lib/api/admin-subscription-prices";

export function PromotionsList({page, plans, pricePlans, initialEditingPromotion}: {page: AdminPromotionPage; plans: AdminGrantPlanDto[]; pricePlans: AdminPricePlan[]; initialEditingPromotion?: AdminPromotion}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(initialEditingPromotion ?? null);
  const closeEditor = () => { setEditingPromotion(null); if (initialEditingPromotion) router.replace("/admin/promotions"); };
  return <main id="main-content"
               className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 pb-[max(7rem,calc(5rem+env(safe-area-inset-bottom)))] sm:p-8 lg:pb-10">
    <AppTopBar title="کدهای تخفیف" description="ساخت، زمان‌بندی و پیگیری مصرف کدهای تخفیف"
               backLink={{href: "/admin", label: "بازگشت به پنل ادمین"}} showDateControl={false}
               showMobileDateAction={false}/>
    <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-sm font-black text-primary">مدیریت اشتراک</p><h1 className="text-2xl font-black">کدهای
        تخفیف</h1><p className="mt-1 text-sm font-semibold text-muted-foreground">کد را بساز، زمان و سقف استفاده‌اش را
        تعیین کن، و مصرف آن را پیگیری کن.</p></div>
      <Button className="w-full rounded-full sm:w-auto" onClick={() => setCreateOpen(true)}>کد جدید</Button></div>
    <Sheet open={createOpen} onOpenChange={setCreateOpen}><SheetContent side="bottom"
                                                                        className="inset-y-0 mx-auto h-svh max-h-svh w-full max-w-3xl gap-3 rounded-none p-4 sm:p-5"
                                                                        dir="rtl"><SheetHeader
      className="shrink-0 gap-1 pl-10"><SheetTitle>ساخت کد تخفیف</SheetTitle><SheetDescription>ابتدا نوع اثر کد را
      انتخاب کن. کد و نوع آن بعد از ساخت قابل تغییر نیستند.</SheetDescription></SheetHeader>
      <ScrollArea className="min-h-0 flex-1"
                  viewportClassName="pb-[max(1rem,env(safe-area-inset-bottom))] pe-2"><PromotionEditor
        plans={plans} pricePlans={pricePlans} embedded onSaved={() => setCreateOpen(false)}/></ScrollArea>
    </SheetContent></Sheet>
    <Dialog open={editingPromotion !== null} onOpenChange={(open) => { if (!open) closeEditor(); }}><DialogContent className="max-h-[90svh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>ویرایش کد تخفیف</DialogTitle><DialogDescription>تنظیمات قابل تغییر کد را ویرایش کن؛ کد و نوع اثر ثابت می‌مانند.</DialogDescription></DialogHeader>{editingPromotion ? <PromotionEditor key={editingPromotion.id} promotion={editingPromotion} plans={plans} pricePlans={pricePlans} embedded onSaved={closeEditor}/> : null}</DialogContent></Dialog>
    <div className="grid gap-3 md:hidden">{page.items.map((item) => <PromotionCard key={item.id} item={item}
                                                                                   onEdit={() => setEditingPromotion(item)}/>)}</div>
    <div className="hidden overflow-x-auto rounded-3xl border bg-card md:block">
      <table className="w-full min-w-[40rem] text-right text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
        <tr>
          <th className="p-3">کد</th>
          <th>نوع</th>
          <th>مقدار</th>
          <th>مصرف</th>
          <th>وضعیت</th>
        </tr>
        </thead>
        <tbody>{page.items.map((item) => {
          const redeemed = item.counts?.redeemed ?? 0;
          const exhausted = item.maxRedemptions !== null && redeemed >= item.maxRedemptions;
          const affiliateManaged = item.internalNotes?.startsWith("Managed by affiliate:");
          return <tr key={item.id} className="border-t">
            <td className="p-3 font-black">{affiliateManaged ?
              <Link className="hover:underline" href="/admin/affiliates">{item.code}<span
                className="mr-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">همکاری</span></Link> :
              <button className="hover:underline" onClick={() => setEditingPromotion(item)}>{item.code}</button>}</td>
            <td>{item.type}</td>
            <td>{item.value.toLocaleString("fa-IR")}</td>
            <td>{redeemed}/{item.maxRedemptions ?? "∞"}</td>
            <td>{item.active ? exhausted ? "ظرفیت تکمیل" : "فعال" : "بایگانی"}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    {page.items.length === 0 ? <p className="p-6 text-center text-muted-foreground">هنوز کدی ثبت نشده است.</p> : null}
  </main>;
}

function PromotionCard({item, onEdit}: { item: AdminPromotion; onEdit: () => void }) {
  const redeemed = item.counts?.redeemed ?? 0;
  const exhausted = item.maxRedemptions !== null && redeemed >= item.maxRedemptions;
  const status = item.active ? exhausted ? "ظرفیت تکمیل" : "فعال" : "بایگانی";
  return <button type="button" onClick={onEdit} className="grid gap-3 rounded-2xl border bg-card p-4 text-right">
    <span className="flex items-center justify-between gap-3"><strong
      className="font-mono text-base">{item.code}</strong><span
      className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold">{status}</span></span>
    <span className="grid grid-cols-3 gap-2 text-xs text-muted-foreground"><span>نوع<br/><b
      className="text-foreground">{item.type}</b></span><span>مقدار<br/><b
      className="text-foreground">{item.value.toLocaleString("fa-IR")}</b></span><span>مصرف<br/><b
      className="text-foreground">{redeemed}/{item.maxRedemptions ?? "∞"}</b></span></span>
  </button>;
}
