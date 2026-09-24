"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { ApiClientError } from "@/lib/api/errors";
import {
  acknowledgeCalculatorRerunPrompt,
  markOnboardingWelcomeSeen,
} from "@/lib/auth/api";
import { mutateCurrentUserProfile } from "@/lib/auth/session-profile";

export async function markWelcomeSeenAction() {
  try {
    await mutateCurrentUserProfile(
      (accessToken) => markOnboardingWelcomeSeen(accessToken),
      { nextPath: "/dashboard", retryPolicy: "idempotent" },
    );
    revalidatePath("/dashboard");
    return { ok: true as const };
  } catch (error) {
    unstable_rethrow(error);
    return {
      ok: false as const,
      message:
        error instanceof ApiClientError
          ? error.message
          : "ثبت این مرحله انجام نشد. دوباره تلاش کنید.",
    };
  }
}

export async function acknowledgeCalculatorRerunPromptAction() {
  try {
    await mutateCurrentUserProfile(
      (accessToken) => acknowledgeCalculatorRerunPrompt(accessToken),
      { nextPath: "/dashboard", retryPolicy: "idempotent" },
    );
    revalidatePath("/dashboard");
    return { ok: true as const };
  } catch (error) {
    unstable_rethrow(error);
    return {
      ok: false as const,
      message:
        error instanceof ApiClientError
          ? error.message
          : "ثبت این انتخاب انجام نشد. دوباره تلاش کن.",
    };
  }
}
