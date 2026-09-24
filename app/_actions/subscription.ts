"use server";

import {revalidatePath} from "next/cache";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {cancelSubscription, restoreSubscription} from "@/lib/api/subscription";

export type SubscriptionActionState = {status: "idle" | "success" | "error"; error?: string};
const perform = async (action: (token: string) => Promise<unknown>): Promise<SubscriptionActionState> => {
  try { await authenticatedServerRequest(action, {nextPath: "/profile/billing", retryPolicy: "idempotent"}); revalidatePath("/profile/billing"); return {status: "success"}; }
  catch { return {status: "error", error: "تغییر وضعیت اشتراک انجام نشد. دوباره تلاش کنید."}; }
};
export async function cancelSubscriptionAction(_: SubscriptionActionState, form: FormData) {
  return perform(cancelSubscription);
}

export async function restoreSubscriptionAction(_: SubscriptionActionState, form: FormData) {
  return perform(restoreSubscription);
}
