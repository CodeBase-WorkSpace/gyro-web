import { apiGet, apiPatch, apiPost } from "./client";

import type { FoodNutritionDto } from "./foods";

export type CreateMealItemRequestDto = {
	foodId: string;
	quantity: number;
	servingUnit: string;
};

export type CreateMealRequestDto = {
	name: string;
	items: CreateMealItemRequestDto[];
  totalBatchWeight?: number | null;
  servingWeight?: number | null;
};

export type UpdateMealRequestDto = CreateMealRequestDto;

export type MealArchiveResponseDto = {
	mealId: string;
	archived: boolean;
};

export type MealServingDefinitionDto = {
  totalBatchWeight: number;
  servingWeight: number;
  servingsPerBatch: number;
  perServing: FoodNutritionDto;
};

export type MealSummaryDto = FoodNutritionDto & {
	id: string;
	name: string;
	itemCount: number;
  servingDefinition?: MealServingDefinitionDto | null;
};

export type MealListResponseDto = {
	items: MealSummaryDto[];
	page: number;
	size: number;
	totalItems: number;
	totalPages: number;
};

export type MealDetailDto = FoodNutritionDto & {
	id: string;
	name: string;
	items: Array<{
		id: string;
		foodId: string;
		foodName: string;
		quantity: number;
		servingUnit: { id: string; code: string; label: string };
	} & FoodNutritionDto>;
  servingDefinition?: MealServingDefinitionDto | null;
};

export async function getMealDetail(mealId: string, accessToken: string) {
	return apiGet<MealDetailDto>(`/meals/${encodeURIComponent(mealId)}`, accessToken);
}

export async function listMeals(
	request: { query?: string; page?: number; size?: number },
	accessToken: string,
) {
	const searchParams = new URLSearchParams();
	if (request.query?.trim()) searchParams.set("query", request.query.trim());
	searchParams.set("page", String(request.page ?? 0));
	searchParams.set("size", String(request.size ?? 20));
	return apiGet<MealListResponseDto>(`/meals?${searchParams.toString()}`, accessToken);
}

export async function createMeal(
	request: CreateMealRequestDto,
	accessToken: string,
	idempotencyKey: string,
) {
	return apiPost<MealDetailDto>("/meals", request, {
		accessToken,
		headers: { "Idempotency-Key": idempotencyKey },
	});
}

export async function updateMeal(
	mealId: string,
	request: UpdateMealRequestDto,
	accessToken: string,
) {
	return apiPatch<MealDetailDto>(`/meals/${encodeURIComponent(mealId)}`, request, {
		accessToken,
	});
}

export async function archiveMeal(mealId: string, accessToken: string) {
	return apiPost<MealArchiveResponseDto>(
		`/meals/${encodeURIComponent(mealId)}/archive`,
		undefined,
		{ accessToken },
	);
}
