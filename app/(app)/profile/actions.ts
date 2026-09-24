"use server";

import {redirect, unstable_rethrow} from "next/navigation";
import {revalidatePath} from "next/cache";

import {AuthApiError, updateMeProfile} from "@/lib/auth/api";
import type {ActionState} from "@/lib/auth/types";
import {mapApiFieldErrors} from "@/lib/auth/errors";
import {setLocaleCookie} from "@/lib/i18n/server";
import {mutateCurrentUserProfile} from "@/lib/auth/session-profile";
import {profileSchema} from "@/lib/profile/validation";

export async function updateProfileAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const formValues = formValuesFrom(formData, ["displayName", "timezone", "locale"]);
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    timezone: formData.get("timezone"),
    locale: formData.get("locale"),
  });

  if (!parsed.success) {
    return {
      message: "اطلاعات پروفایل را بررسی کنید.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [String(issue.path[0] ?? ""), issue.message])
      ),
      formValues,
    };
  }

  try {
    await mutateCurrentUserProfile(
      (accessToken) => updateMeProfile(accessToken, parsed.data),
      { nextPath: "/profile", retryPolicy: "never" },
    );
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AuthApiError) {
      return {
        message: "پروفایل ذخیره نشد.",
        fieldErrors: mapApiFieldErrors(error.fieldErrors),
        formValues,
      };
    }

    return {
      message: "پروفایل ذخیره نشد. کمی بعد دوباره تلاش کنید.",
      formValues,
    };
  }

  await setLocaleCookie(parsed.data.locale);
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  redirect("/profile?saved=1");
}

function formValuesFrom(formData: FormData, fields: string[]): Record<string, string> {
  return Object.fromEntries(
    fields.map((field) => [field, String(formData.get(field) ?? "")])
  );
}
