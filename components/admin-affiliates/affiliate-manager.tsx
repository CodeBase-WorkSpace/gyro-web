"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {
  assignAffiliateAction,
  createAffiliateAction,
  toggleAffiliateAction,
  updateAffiliateAction
} from "@/app/_actions/admin-affiliates";
import type {Affiliate, AffiliatePage} from "@/lib/api/affiliates";
import {formatIrr} from "@/lib/format";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";

export function AffiliateManager({page}:{page:AffiliatePage}) { const router=useRouter(); const [pending,start]=useTransition(); const [message,setMessage]=useState<string|null>(null); const [showCreate,setShowCreate]=useState(false); const run=(work:()=>Promise<{ok:boolean;message?:string}|void>)=>start(async()=>{setMessage(null);const result=await work();if(result&& !result.ok)setMessage(result.message??"عملیات انجام نشد.");else {setShowCreate(false);router.refresh();}}); return <><div className="flex flex-wrap items-center justify-between gap-3"><Button onClick={()=>setShowCreate(v=>!v)}>{showCreate?"بستن فرم":"همکار جدید"}</Button>{message?<p role="alert" className="text-sm font-bold text-destructive">{message}</p>:null}</div>{showCreate?<CreateForm disabled={pending} onSubmit={body=>run(()=>createAffiliateAction(body))}/>:null}<section className="grid gap-4 md:grid-cols-2">{page.content.map(a=><AffiliateCard key={a.id} affiliate={a} pending={pending} run={run}/>)}</section>{page.content.length===0&&!showCreate?<Card className="rounded-3xl"><CardHeader><CardTitle>هنوز همکاری تعریف نشده است</CardTitle><CardDescription>برای ساخت کد اختصاصی، «همکار جدید» را انتخاب کنید.</CardDescription></CardHeader></Card>:null}</>; }

function CreateForm({disabled, onSubmit}: { disabled: boolean; onSubmit: (body: unknown) => void }) {
  return <Card className="rounded-3xl">
    <CardHeader>
      <CardTitle>ساخت همکار فروش</CardTitle>
      <CardDescription>کد همکاری هم‌زمان یک کد تخفیف واقعی برای بخش پرداخت است.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div
        className="grid gap-2 rounded-2xl border bg-muted/30 p-4 text-xs font-semibold leading-6 text-muted-foreground sm:text-sm">
        <p>مشتری کد را در بخش پرداخت وارد می‌کند. کد فقط برای اولین پرداخت موفق او معتبر است.</p>
        <p>تخفیف از مبلغ خرید کم می‌شود و سهم همکار از مبلغ نهایی پرداخت‌شده محاسبه می‌شود.</p>
        <p>شناسه پلن و قیمت اختیاری‌اند؛ با واردکردن آن‌ها، کد فقط برای همان اشتراک معتبر خواهد بود.</p>
        <p>درآمد فعلاً فقط برای گزارش‌گیری ثبت می‌شود و موجودی قابل برداشت نیست.</p>
      </div>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={e => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        onSubmit({
          code: normalizeAffiliateCode(String(f.get("code") ?? "")),
          displayName: f.get("displayName"),
          discountPercentage: Number(f.get("discount")),
          commissionPercentage: Number(f.get("commission")),
          applicablePlanId: f.get("planId") ? Number(f.get("planId")) : null,
          applicablePriceId: f.get("priceId") ? Number(f.get("priceId")) : null,
          startsAt: new Date().toISOString(),
          endsAt: null,
          maxRedemptions: f.get("cap") ? Number(f.get("cap")) : null,
          internalNotes: f.get("notes")
        });
      }}>
        <Field name="displayName" label="نام نمایشی" required/>
        <label className="grid gap-1 text-sm font-bold">
          کد تخفیف همکاری
          <Input name="code" required dir="ltr" inputMode="text" autoCapitalize="characters" autoComplete="off"
                 pattern="[A-Z0-9]+" maxLength={64} placeholder="EXAMPLE15" className="font-mono uppercase"
                 onChange={event => {
                   event.currentTarget.value = normalizeAffiliateCode(event.currentTarget.value);
                 }}/>
          <span className="text-xs font-medium leading-5 text-muted-foreground">فقط حروف انگلیسی و عدد؛ کد همیشه با حروف بزرگ ذخیره می‌شود.</span>
        </label>
        <Field name="discount" label="درصد تخفیف مشتری" type="number" defaultValue="15" required/>
        <Field name="commission" label="درصد سهم همکار" type="number" defaultValue="10" required/>
        <Field name="planId" label="شناسه پلن (اختیاری)" type="number"/>
        <Field name="priceId" label="شناسه قیمت/مدت (اختیاری)" type="number"/>
        <Field name="cap" label="سقف استفاده (اختیاری)" type="number"/>
        <Field name="notes" label="یادداشت داخلی"/>
        <Button disabled={disabled} type="submit" className="sm:col-span-2">ذخیره همکار</Button>
      </form>
    </CardContent>
  </Card>;
}

function normalizeAffiliateCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function AffiliateCard({affiliate:a,pending,run}:{affiliate:Affiliate;pending:boolean;run:(w:()=>Promise<{ok:boolean;message?:string}|void>)=>void}) { const [editing,setEditing]=useState(false); return <Card className="rounded-3xl"><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>{a.displayName}</CardTitle><CardDescription className="mt-1 font-mono">{a.code}</CardDescription></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">{a.status==="ACTIVE"?"فعال":"غیرفعال"}</span></div></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-3 text-sm"><Metric label="تخفیف مشتری" value={`${a.discountPercentage}٪`}/><Metric label="سهم همکاری" value={`${a.commissionPercentage}٪`}/><Metric label="خرید موفق" value={String(a.successfulCustomers)}/><Metric label="درآمد محاسبه‌شده" value={formatIrr(a.earnedAmount)}/></div><p className="rounded-2xl border bg-muted/30 p-3 text-xs text-muted-foreground">حساب متصل: {a.linkedUserId??"تعیین نشده"}</p><div className="flex flex-wrap gap-2"><Button disabled={pending} variant="outline" onClick={()=>run(()=>toggleAffiliateAction(a.id,a.status!=="ACTIVE"))}>{a.status==="ACTIVE"?"غیرفعال‌سازی":"فعال‌سازی"}</Button><Button disabled={pending} variant="outline" onClick={()=>{const id=window.prompt("شناسه UUID حساب تأییدشده را وارد کنید؛ برای حذف اتصال خالی بگذارید.",a.linkedUserId??"");if(id!==null)run(()=>assignAffiliateAction(a.id,id.trim()||null));}}>اتصال حساب</Button><Button variant="ghost" onClick={()=>setEditing(v=>!v)}>ویرایش نرخ‌ها</Button></div>{editing?<form className="grid grid-cols-2 gap-2" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);run(()=>updateAffiliateAction(a.id,{displayName:a.displayName,discountPercentage:Number(f.get("discount")),commissionPercentage:Number(f.get("commission")),applicablePlanId:a.applicablePlanId,applicablePriceId:a.applicablePriceId,startsAt:a.startsAt,endsAt:a.endsAt,maxRedemptions:a.maxRedemptions,internalNotes:a.internalNotes,expectedVersion:a.version}));}}><Field name="discount" label="تخفیف" type="number" defaultValue={String(a.discountPercentage)} required/><Field name="commission" label="سهم" type="number" defaultValue={String(a.commissionPercentage)} required/><Button disabled={pending} type="submit" className="col-span-2">ذخیره نرخ‌های آینده</Button></form>:null}</CardContent></Card>; }
function Field(props:{name:string;label:string;type?:string;defaultValue?:string;required?:boolean}) { return <label className="grid gap-1 text-sm font-bold">{props.label}<Input {...props}/></label>; }
function Metric({label,value}:{label:string;value:string}) { return <div className="rounded-2xl border bg-background p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-black tabular-nums">{value}</p></div>; }
