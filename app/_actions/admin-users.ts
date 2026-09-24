"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";

import {ApiClientError} from "@/lib/api/errors";
import {
  confirmAdminUserDeletion,
  previewAdminUserDeletion,
  type AdminUserDeletionPreviewDto,
  type AdminUserDeletionResultDto,
  createAdminGrant, extendAdminGrant, recalculateAdminEntitlement, revokeAdminGrant,
} from "@/lib/api/admin-users";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";

export type AdminUserDeletionPreviewResult =
  | { ok: true; preview: AdminUserDeletionPreviewDto }
  | { ok: false; message: string; code?: string; requestId?: string };

export type AdminUserDeletionConfirmResult =
  | { ok: true; result: AdminUserDeletionResultDto }
  | { ok: false; message: string; code?: string; requestId?: string };

export async function previewAdminUserDeletionAction(userId: string): Promise<AdminUserDeletionPreviewResult> {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) return {ok: false, message: "شناسه کاربر معتبر نیست."};

  try {
    const preview = await authenticatedServerRequest(
      (accessToken) => previewAdminUserDeletion(accessToken, normalizedUserId),
      {nextPath: `/admin/users/${normalizedUserId}`, retryPolicy: "never"},
    );
    return {ok: true, preview};
  } catch (error) {
    return failure(error, "پیش‌نمایش حذف آماده نشد.");
  }
}

export async function mutateAdminGrantAction(input: {userId: string; action: "create" | "extend" | "revoke" | "recalculate"; grantId?: string; planId?: number; durationDays?: number; reason: string; reasonNote?: string}) {
  if (input.reason.trim().length < 3) return {ok: false as const, message: "دلیل باید حداقل ۳ کاراکتر باشد."};
  try {
    await authenticatedServerRequest(async (accessToken): Promise<void> => {
      if (input.action === "create") await createAdminGrant(accessToken, {userId: input.userId, planId: input.planId!, durationDays: input.durationDays!, reason: input.reason, reasonNote: input.reasonNote ?? ""});
      else if (input.action === "extend") await extendAdminGrant(accessToken, input.grantId!, {additionalDays: input.durationDays!, reason: input.reason});
      else if (input.action === "revoke") await revokeAdminGrant(accessToken, input.grantId!, input.reason);
      else await recalculateAdminEntitlement(accessToken, input.userId, input.reason);
    }, {nextPath: `/admin/users/${input.userId}`, retryPolicy: "never"});
    revalidatePath(`/admin/users/${input.userId}`); revalidatePath("/admin/users");
    return {ok: true as const};
  } catch (error) { return failure(error, "عملیات دسترسی انجام نشد."); }
}

export async function confirmAdminUserDeletionAction(input: {
  userId: string;
  operationId: string;
  confirmationToken: string;
  confirmation: string;
  reason: string;
}): Promise<AdminUserDeletionConfirmResult> {
  const normalizedUserId = input.userId.trim();
  if (!normalizedUserId) return {ok: false, message: "شناسه کاربر معتبر نیست."};
  if (input.reason.trim().length < 5) return {ok: false, message: "دلیل حذف باید حداقل ۵ کاراکتر باشد."};

  try {
    const result = await authenticatedServerRequest(
      (accessToken) => confirmAdminUserDeletion(accessToken, normalizedUserId, {
        operationId: input.operationId,
        confirmationToken: input.confirmationToken,
        confirmation: input.confirmation,
        reason: input.reason.trim(),
      }),
      {nextPath: `/admin/users/${normalizedUserId}`, retryPolicy: "never"},
    );
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${normalizedUserId}`);
    return {ok: true, result};
  } catch (error) {
    return failure(error, "حذف کاربر انجام نشد.");
  }
}

function failure(error: unknown, fallbackMessage: string) {
  unstable_rethrow(error);
  if (error instanceof ApiClientError) {
    return {
      ok: false as const,
      message: error.message || fallbackMessage,
      code: error.code,
      requestId: error.requestId,
    };
  }
  return {ok: false as const, message: `${fallbackMessage} کمی بعد دوباره تلاش کنید.`};
}
