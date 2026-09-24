"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { ApiClientError } from "@/lib/api/errors";
import {
  acceptRecalibration,
  dismissRecalibration,
  type RecalibrationDismissReason,
} from "@/lib/api/recalibration";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-api";

export type RecalibrationActionState = {
  ok?: boolean;
  applied?: boolean;
  message?: string;
};

export async function acceptRecalibrationAction(
  suggestionId: string,
): Promise<RecalibrationActionState> {
  try {
    const decision = await authenticatedServerRequest(
      (accessToken) => acceptRecalibration(accessToken, suggestionId),
      { nextPath: "/dashboard", retryPolicy: "never" },
    );

    revalidatePath("/dashboard");
    revalidatePath("/progress/goals");

    if (!decision.applied) {
      return {
        ok: true,
        applied: false,
        message: "هدف شما اخیراً تغییر کرده بود؛ پیشنهاد دیگر معتبر نیست.",
      };
    }
    return { ok: true, applied: true, message: "هدف روزانه به‌روزرسانی شد." };
  } catch (error) {
    unstable_rethrow(error);
    return {
      message:
        error instanceof ApiClientError
          ? error.message
          : "اعمال پیشنهاد انجام نشد. کمی بعد دوباره تلاش کنید.",
    };
  }
}

export async function dismissRecalibrationAction(
  suggestionId: string,
  reason?: RecalibrationDismissReason,
): Promise<RecalibrationActionState> {
  try {
    await authenticatedServerRequest(
      (accessToken) => dismissRecalibration(accessToken, suggestionId, reason),
      { nextPath: "/dashboard", retryPolicy: "never" },
    );

    revalidatePath("/dashboard");
    return { ok: true, applied: false };
  } catch (error) {
    unstable_rethrow(error);
    return {
      message:
        error instanceof ApiClientError
          ? error.message
          : "رد کردن پیشنهاد انجام نشد.",
    };
  }
}
