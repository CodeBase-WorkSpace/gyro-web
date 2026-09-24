"use server";

import {revalidatePath} from "next/cache";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {assignAdminAffiliateAccount, createAdminAffiliate, setAdminAffiliateActive, updateAdminAffiliate} from "@/lib/api/affiliates";

export async function createAffiliateAction(payload: unknown) { try { await authenticatedServerRequest(t => createAdminAffiliate(t, payload), {nextPath:"/admin/affiliates",retryPolicy:"never"}); revalidatePath("/admin/affiliates"); return {ok:true as const}; } catch { return {ok:false as const,message:"ساخت همکار فروش انجام نشد. کد، نرخ‌ها و محدودیت‌ها را بررسی کنید."}; } }
export async function updateAffiliateAction(id: string, payload: unknown) { try { await authenticatedServerRequest(t => updateAdminAffiliate(t, id, payload), {nextPath:"/admin/affiliates",retryPolicy:"never"}); revalidatePath("/admin/affiliates"); return {ok:true as const}; } catch { return {ok:false as const,message:"ویرایش همکار فروش انجام نشد."}; } }
export async function toggleAffiliateAction(id: string, active: boolean) { await authenticatedServerRequest(t => setAdminAffiliateActive(t,id,active), {nextPath:"/admin/affiliates",retryPolicy:"never"}); revalidatePath("/admin/affiliates"); }
export async function assignAffiliateAction(id: string, userId: string | null) { try { await authenticatedServerRequest(t => assignAdminAffiliateAccount(t,id,userId), {nextPath:"/admin/affiliates",retryPolicy:"never"}); revalidatePath("/admin/affiliates"); return {ok:true as const}; } catch { return {ok:false as const,message:"حساب باید فعال، تأییدشده و بدون اتصال تکراری باشد."}; } }
