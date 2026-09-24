"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { ApiClientError } from "@/lib/api/errors";
import { claimTrial } from "@/lib/api/entitlement";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-api";

export type TrialClaimState = {
  ok?: boolean;
  message?: string;
};

export async function claimTrialAction(): Promise<TrialClaimState> {
  try {
    await authenticatedServerRequest(
      (accessToken) => claimTrial(accessToken),
      { nextPath: "/dashboard", retryPolicy: "never" },
    );

    revalidatePath("/dashboard");
    revalidatePath("/progress/goals");
    revalidatePath("/profile/billing");

    return {
      ok: true,
      message: "دوره آزمایشی ۱۴ روزه پیشرفته فعال شد!",
    };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiClientError) {
      if (error.code === "TRIAL_ALREADY_REDEEMED") {
        return { message: "دوره آزمایشی قبلاً برای این حساب فعال شده است." };
      }
      if (error.code === "TRIAL_NOT_AVAILABLE") {
        return { message: "دوره آزمایشی برای این حساب در دسترس نیست." };
      }
    }

    return { message: "فعال‌سازی دوره آزمایشی انجام نشد. کمی بعد دوباره تلاش کنید." };
  }
}
