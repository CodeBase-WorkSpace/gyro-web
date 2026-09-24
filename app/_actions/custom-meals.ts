"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { ApiClientError } from "@/lib/api/errors";
import {
	archiveMeal,
	createMeal,
	getMealDetail,
	updateMeal,
	type CreateMealRequestDto,
	type MealDetailDto,
} from "@/lib/api/meals";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-api";
import {planLimitNoticeFromMetadata, type PlanLimitNotice} from "@/lib/subscription/plan-limits";

export type CreateCustomMealInput = {
	request: CreateMealRequestDto;
	idempotencyKey: string;
	nextPath: string;
};

export type CreateCustomMealResult =
	| { ok: true; meal: MealDetailDto }
	| { ok: false; message: string; requestId?: string; planLimit?: PlanLimitNotice };

export type UpdateCustomMealInput = {
	mealId: string;
	request: CreateMealRequestDto;
	nextPath: string;
};

export type DuplicateCustomMealInput = CreateCustomMealInput & {
	sourceMealId: string;
};

export type ArchiveCustomMealResult =
	| { ok: true; mealId: string }
	| { ok: false; message: string; requestId?: string; planLimit?: PlanLimitNotice };

export async function createCustomMealAction(
	input: CreateCustomMealInput,
): Promise<CreateCustomMealResult> {
	const validationMessage = validateInput(input);
	if (validationMessage) return { ok: false, message: validationMessage };

	try {
		const meal = await authenticatedServerRequest(
			(accessToken) => createMeal(input.request, accessToken, input.idempotencyKey),
			{
				nextPath: input.nextPath.startsWith("/") ? input.nextPath : "/",
				retryPolicy: "idempotent",
			},
		);
		revalidateMealPaths(meal.id);
		return { ok: true, meal };
	} catch (error) {
		unstable_rethrow(error);
		if (error instanceof ApiClientError) {
			return {
				ok: false,
				message: error.message || "وعده سفارشی ذخیره نشد.",
				requestId: error.requestId,
				planLimit: planLimitNoticeFromMetadata(error.metadata),
			};
		}
		return {
			ok: false,
			message: "وعده سفارشی ذخیره نشد. کمی بعد دوباره تلاش کنید.",
		};
	}
}

export async function duplicateCustomMealAction(
	input: DuplicateCustomMealInput,
): Promise<CreateCustomMealResult> {
	const validationMessage = validateInput(input);
	if (validationMessage) return { ok: false, message: validationMessage };
	if (!input.sourceMealId.trim() || input.sourceMealId.length > 80) {
		return { ok: false, message: "شناسه وعده اصلی معتبر نیست." };
	}

	try {
		const meal = await authenticatedServerRequest(
			async (accessToken) => {
				const source = await getMealDetail(input.sourceMealId, accessToken);
				if (source.name.trim() === input.request.name.trim()) throw new DuplicateMealNameError();
				return createMeal(input.request, accessToken, input.idempotencyKey);
			},
			{
				nextPath: input.nextPath.startsWith("/") ? input.nextPath : "/foods/meals",
				retryPolicy: "idempotent",
			},
		);
		revalidateMealPaths(meal.id);
		return { ok: true, meal };
	} catch (error) {
		if (error instanceof DuplicateMealNameError) {
			return { ok: false, message: "برای نسخه جدید، نامی متفاوت از وعده اصلی وارد کنید." };
		}
		return mealFailureState(error, "ساخت نسخه جدید انجام نشد.");
	}
}

export async function updateCustomMealAction(
	input: UpdateCustomMealInput,
): Promise<CreateCustomMealResult> {
	if (!input.mealId.trim() || input.mealId.length > 80) {
		return { ok: false, message: "شناسه وعده سفارشی معتبر نیست." };
	}
	const validationMessage = validateRequest(input.request);
	if (validationMessage) return { ok: false, message: validationMessage };

	try {
		const meal = await authenticatedServerRequest(
			(accessToken) => updateMeal(input.mealId, input.request, accessToken),
			{
				nextPath: input.nextPath.startsWith("/") ? input.nextPath : "/foods/meals",
				retryPolicy: "never",
			},
		);
		revalidateMealPaths(meal.id);
		return { ok: true, meal };
	} catch (error) {
		return mealFailureState(error, "ویرایش وعده سفارشی انجام نشد.");
	}
}

export async function archiveCustomMealAction(
	input: { mealId: string; nextPath: string },
): Promise<ArchiveCustomMealResult> {
	if (!input.mealId.trim() || input.mealId.length > 80) {
		return { ok: false, message: "شناسه وعده سفارشی معتبر نیست." };
	}

	try {
		const response = await authenticatedServerRequest(
			(accessToken) => archiveMeal(input.mealId, accessToken),
			{
				nextPath: input.nextPath.startsWith("/") ? input.nextPath : "/foods/meals",
				retryPolicy: "never",
			},
		);
		revalidateMealPaths(response.mealId);
		return { ok: true, mealId: response.mealId };
	} catch (error) {
		unstable_rethrow(error);
		if (error instanceof ApiClientError) {
			return {
				ok: false,
				message: error.message || "بایگانی وعده سفارشی انجام نشد.",
				requestId: error.requestId,
				planLimit: planLimitNoticeFromMetadata(error.metadata),
			};
		}
		return { ok: false, message: "بایگانی وعده سفارشی انجام نشد. کمی بعد دوباره تلاش کنید." };
	}
}

function validateInput(input: CreateCustomMealInput) {
	if (!input.idempotencyKey.trim() || input.idempotencyKey.length > 160)
		return "شناسه ذخیره وعده معتبر نیست.";
	return validateRequest(input.request);
}

function validateRequest(request: CreateMealRequestDto) {
	const name = request.name.trim();
	if (!name) return "نام وعده سفارشی را وارد کنید.";
	if (name.length > 160) return "نام وعده باید حداکثر ۱۶۰ نویسه باشد.";
	if (request.items.length === 0 || request.items.length > 50)
		return "بین ۱ تا ۵۰ غذا به وعده اضافه کنید.";
	for (const item of request.items) {
		if (!item.foodId.trim() || item.foodId.length > 80)
			return "یکی از غذاهای انتخاب‌شده معتبر نیست.";
		if (!Number.isFinite(item.quantity) || item.quantity < 0.001)
			return "مقدار یکی از غذاها معتبر نیست.";
		if (!item.servingUnit.trim() || item.servingUnit.length > 40)
			return "واحد یکی از غذاها معتبر نیست.";
	}
  return validateServingDefinition(request);
}

function validateServingDefinition(request: CreateMealRequestDto) {
  const total = request.totalBatchWeight ?? null;
  const serving = request.servingWeight ?? null;
  if (total === null && serving === null) return undefined;
  if (total === null || serving === null)
    return "وزن کل و وزن هر سروینگ را با هم وارد کنید.";
  if (!Number.isFinite(total) || total <= 0)
    return "وزن کل باید عددی بیشتر از صفر باشد.";
  if (!Number.isFinite(serving) || serving <= 0)
    return "وزن هر سروینگ باید عددی بیشتر از صفر باشد.";
  if (serving > total)
    return "وزن هر سروینگ نمی‌تواند از وزن کل بیشتر باشد.";
	return undefined;
}

function revalidateMealPaths(mealId: string) {
	revalidatePath("/dashboard");
	revalidatePath("/foods");
	revalidatePath("/foods/meals");
	revalidatePath(`/foods/meals/${mealId}`);
}

function mealFailureState(error: unknown, fallback: string): CreateCustomMealResult {
	unstable_rethrow(error);
	if (error instanceof ApiClientError) {
		return {
			ok: false,
			message: error.message || fallback,
			requestId: error.requestId,
			planLimit: planLimitNoticeFromMetadata(error.metadata),
		};
	}
	return { ok: false, message: `${fallback} کمی بعد دوباره تلاش کنید.` };
}

class DuplicateMealNameError extends Error {}
