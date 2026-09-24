"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";

import {ApiClientError} from "@/lib/api/errors";
import {
  archiveAdminCatalogFood,
  createAdminCatalogCategory,
  createAdminCatalogFood,
  restoreAdminCatalogFood,
  updateAdminCatalogFood,
  type AdminCatalogWarning,
  type AdminFoodCategoryDto,
  type AdminFoodDetailDto,
  type AdminFoodPayload,
} from "@/lib/api/admin-catalog";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";

export type AdminCatalogMutationResult =
  | { ok: true; food: AdminFoodDetailDto; warnings: AdminCatalogWarning[] }
  | { ok: false; message: string; requestId?: string; conflict?: boolean };

export type AdminCatalogArchiveResult =
  | { ok: true; foodId: string; archived: boolean }
  | { ok: false; message: string; requestId?: string };

export type AdminCatalogCategoryResult =
  | { ok: true; category: AdminFoodCategoryDto }
  | { ok: false; message: string; requestId?: string };

export async function createAdminFoodAction(payload: AdminFoodPayload): Promise<AdminCatalogMutationResult> {
  try {
    const result = await authenticatedServerRequest(
      (accessToken) => createAdminCatalogFood(accessToken, payload),
      {nextPath: "/admin/catalog/new", retryPolicy: "never"},
    );
    revalidateCatalogPaths(result.food.id);
    return {ok: true, food: result.food, warnings: result.warnings};
  } catch (error) {
    return failure(error, "غذای جدید ذخیره نشد.");
  }
}

export async function updateAdminFoodAction(
  foodId: string,
  payload: AdminFoodPayload & { expectedLockVersion: number },
): Promise<AdminCatalogMutationResult> {
  try {
    const result = await authenticatedServerRequest(
      (accessToken) => updateAdminCatalogFood(accessToken, foodId, payload),
      {nextPath: `/admin/catalog/${foodId}`, retryPolicy: "never"},
    );
    revalidateCatalogPaths(foodId);
    return {ok: true, food: result.food, warnings: result.warnings};
  } catch (error) {
    return failure(error, "تغییرات غذا ذخیره نشد.");
  }
}

export async function setAdminFoodArchivedAction(
  foodId: string,
  archived: boolean,
): Promise<AdminCatalogArchiveResult> {
  try {
    const result = await authenticatedServerRequest(
      (accessToken) => archived
        ? archiveAdminCatalogFood(accessToken, foodId)
        : restoreAdminCatalogFood(accessToken, foodId),
      {nextPath: `/admin/catalog/${foodId}`, retryPolicy: "never"},
    );
    revalidateCatalogPaths(foodId);
    return {ok: true, foodId: result.id, archived: result.archived};
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiClientError) {
      return {ok: false, message: error.message || "تغییر وضعیت آرشیو انجام نشد.", requestId: error.requestId};
    }
    return {ok: false, message: "تغییر وضعیت آرشیو انجام نشد. کمی بعد دوباره تلاش کنید."};
  }
}

export async function createAdminCategoryAction(name: string): Promise<AdminCatalogCategoryResult> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 255) {
    return {ok: false, message: "نام دسته‌بندی معتبر نیست."};
  }
  try {
    const category = await authenticatedServerRequest(
      (accessToken) => createAdminCatalogCategory(accessToken, trimmed),
      {nextPath: "/admin/catalog/new", retryPolicy: "never"},
    );
    revalidatePath("/admin/catalog/new");
    return {ok: true, category};
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiClientError) {
      return {ok: false, message: error.message || "دسته‌بندی ساخته نشد.", requestId: error.requestId};
    }
    return {ok: false, message: "دسته‌بندی ساخته نشد. کمی بعد دوباره تلاش کنید."};
  }
}

function failure(error: unknown, fallbackMessage: string): AdminCatalogMutationResult {
  unstable_rethrow(error);
  if (error instanceof ApiClientError) {
    return {
      ok: false,
      message: error.message || fallbackMessage,
      requestId: error.requestId,
      conflict: error.status === 409,
    };
  }
  return {ok: false, message: `${fallbackMessage} کمی بعد دوباره تلاش کنید.`};
}

function revalidateCatalogPaths(foodId: string) {
  revalidatePath("/admin/catalog");
  revalidatePath(`/admin/catalog/${foodId}`);
}
