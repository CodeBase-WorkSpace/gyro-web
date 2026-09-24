"use server";

import {unstable_rethrow} from "next/navigation";
import {revalidatePath} from "next/cache";

import {
  AuthApiError,
  changePassword,
  confirmSecurityStepUp,
  removePassword,
  setPassword,
  startSecurityStepUp,
} from "@/lib/auth/api";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {mutateCurrentUserProfile} from "@/lib/auth/session-profile";
import {authCodeMessage, mapApiFieldErrors} from "@/lib/auth/errors";
import type {ActionState} from "@/lib/auth/types";
import {
  changePasswordSchema,
  setPasswordSchema,
  stepUpConfirmSchema,
  zodFieldErrors,
} from "@/lib/auth/validation";

export async function setPasswordAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const formValues = formValuesFrom(formData, ["newPassword", "confirmPassword"]);
  const parsed = setPasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {message: "رمز عبور را بررسی کنید.", fieldErrors: zodFieldErrors(parsed.error), formValues};
  }

  try {
    await mutateCurrentUserProfile(
      (accessToken) => setPassword(accessToken, parsed.data.newPassword),
      {nextPath: "/profile", retryPolicy: "never"},
    );
  } catch (error) {
    return toSecurityError(error);
  }

  revalidatePath("/profile");
  return {successMessage: "رمز عبور برای حساب شما تنظیم شد."};
}

export async function changePasswordAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const formValues = formValuesFrom(formData, ["currentPassword", "newPassword", "confirmPassword"]);
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {message: "رمز عبور را بررسی کنید.", fieldErrors: zodFieldErrors(parsed.error), formValues};
  }

  try {
    await mutateCurrentUserProfile(
      (accessToken) =>
        changePassword(accessToken, {
          currentPassword: parsed.data.currentPassword,
          newPassword: parsed.data.newPassword,
        }),
      {nextPath: "/profile", retryPolicy: "never"},
    );
  } catch (error) {
    return toSecurityError(error);
  }

  revalidatePath("/profile");
  return {successMessage: "رمز عبور با موفقیت تغییر کرد."};
}

export async function removePasswordAction(_prevState: ActionState): Promise<ActionState> {
  try {
    await mutateCurrentUserProfile((accessToken) => removePassword(accessToken), {
      nextPath: "/profile",
      retryPolicy: "never",
    });
  } catch (error) {
    return toSecurityError(error);
  }

  revalidatePath("/profile");
  return {successMessage: "رمز عبور حذف شد. اکنون فقط با کد یک‌بارمصرف وارد می‌شوید."};
}

export async function startStepUpAction(_prevState: ActionState): Promise<ActionState> {
  try {
    await authenticatedServerRequest((accessToken) => startSecurityStepUp(accessToken), {
      nextPath: "/profile",
      retryPolicy: "never",
    });
  } catch (error) {
    return toSecurityError(error);
  }

  return {successMessage: "کد تایید ارسال شد."};
}

export async function confirmStepUpAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const formValues = formValuesFrom(formData, ["code"]);
  const parsed = stepUpConfirmSchema.safeParse({code: formData.get("code")});

  if (!parsed.success) {
    return {message: "کد تایید را بررسی کنید.", fieldErrors: zodFieldErrors(parsed.error), formValues};
  }

  try {
    await authenticatedServerRequest(
      (accessToken) => confirmSecurityStepUp(accessToken, parsed.data.code),
      {nextPath: "/profile", retryPolicy: "never"},
    );
  } catch (error) {
    return toSecurityError(error);
  }

  return {successMessage: "هویت شما تایید شد."};
}

function toSecurityError(error: unknown): ActionState {
  unstable_rethrow(error);
  if (error instanceof AuthApiError) {
    return {
      message: authCodeMessage(error.code, error.message),
      fieldErrors: mapApiFieldErrors(error.fieldErrors),
      requestId: error.requestId,
    };
  }

  return {message: "درخواست انجام نشد. کمی بعد دوباره تلاش کنید."};
}

function formValuesFrom(formData: FormData, fields: string[]): Record<string, string> {
  return Object.fromEntries(fields.map((field) => [field, String(formData.get(field) ?? "")]));
}
