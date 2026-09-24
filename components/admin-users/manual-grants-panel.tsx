"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";

import {mutateAdminGrantAction} from "@/app/_actions/admin-users";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import type {AdminGrantPlanDto, AdminManualGrantDto, EntitlementDto} from "@/lib/api/admin-users";
import {formatPersianGregorianDate} from "@/lib/format";

const reasons = ["TESTER_ACCESS", "EARLY_SUPPORTER", "SUPPORT_RECOVERY", "OFFLINE_PAYMENT", "INVESTOR_ACCESS", "CUSTOM"];

export function ManualGrantsPanel({userId, grants, plans, entitlement}: {userId: string; grants: AdminManualGrantDto[]; plans: AdminGrantPlanDto[]; entitlement: EntitlementDto | null}) {
  const router = useRouter(); const [pending, startTransition] = useTransition();
  const [planId, setPlanId] = useState(String(plans[0]?.id ?? "")); const [days, setDays] = useState("30");
  const [reason, setReason] = useState("SUPPORT_RECOVERY"); const [note, setNote] = useState(""); const [error, setError] = useState<string | null>(null);
  const run = (input: Parameters<typeof mutateAdminGrantAction>[0]) => startTransition(async () => { setError(null); const result = await mutateAdminGrantAction(input); if (!result.ok) setError(result.message); else router.refresh(); });
  return <section className="rounded-3xl border bg-card/90 p-4 shadow-sm sm:p-5">
    <p className="text-xs font-black text-primary">دسترسی پشتیبانی</p><h2 className="mt-1 text-lg font-black">گرنت دستی و entitlement</h2>
    <p className="mt-2 text-sm font-bold text-muted-foreground">وضعیت فعلی: {entitlement ? `${entitlement.status} · ${entitlement.source}` : "نامشخص"}</p>
    {error ? <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{error}</p> : null}
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <select className="h-10 rounded-xl border bg-background px-3 text-sm" value={planId} onChange={(e) => setPlanId(e.target.value)}>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} ({plan.code})</option>)}</select>
      <Input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} aria-label="مدت گرنت به روز" />
      <select className="h-10 rounded-xl border bg-background px-3 text-sm" value={reason} onChange={(e) => setReason(e.target.value)}>{reasons.map((item) => <option key={item}>{item}</option>)}</select>
      <Input value={note} maxLength={500} placeholder="دلیل و یادداشت" onChange={(e) => setNote(e.target.value)} />
    </div>
    <div className="mt-3 flex flex-wrap gap-2"><Button disabled={pending || !planId || Number(days) < 1 || note.trim().length < 3} onClick={() => run({userId, action: "create", planId: Number(planId), durationDays: Number(days), reason, reasonNote: note})}>ثبت گرنت</Button><Button variant="outline" disabled={pending || note.trim().length < 3} onClick={() => run({userId, action: "recalculate", reason: note})}>بازمحاسبه entitlement</Button></div>
    <div className="mt-5 grid gap-2">{grants.length === 0 ? <p className="text-sm font-bold text-muted-foreground">گرنتی ثبت نشده است.</p> : grants.map((grant) => { const plan = plans.find((item) => item.id === grant.planId); return <div key={grant.id} className="rounded-2xl border p-3 text-sm font-bold"><div className="flex flex-wrap justify-between gap-2"><span>{plan ? `${plan.name} (${plan.code})` : `پلن #${grant.planId}`} · {grant.durationDays ? `${grant.durationDays.toLocaleString("fa-IR")} روز` : "بدون محدودیت"}</span><span>{status(grant)}</span></div>{grant.promotionCode ? <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-black text-primary">کد {grant.promotionCode}</span> : null}<p className="mt-1 text-xs text-muted-foreground">{grant.expiresAt ? `پایان: ${formatPersianGregorianDate(new Date(grant.expiresAt))}` : "بدون پایان"} · {grant.reasonNote ?? "بدون یادداشت"}</p>{status(grant) === "فعال" ? <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" disabled={pending} onClick={() => run({userId, action: "extend", grantId: grant.id, durationDays: Number(days), reason: note || "تمدید پشتیبانی"})}>تمدید {days} روز</Button><Button size="sm" variant="destructive" disabled={pending} onClick={() => run({userId, action: "revoke", grantId: grant.id, reason: note || "لغو پشتیبانی"})}>لغو</Button></div> : null}</div>; })}</div>
  </section>;
}
function status(grant: AdminManualGrantDto) { if (grant.revokedAt) return "لغوشده"; if (grant.expiresAt && new Date(grant.expiresAt) <= new Date()) return "منقضی"; return "فعال"; }
