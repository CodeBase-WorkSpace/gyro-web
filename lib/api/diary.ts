import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

export type DiaryMealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "CUSTOM";
export type DiaryEntrySourceType = "FOOD" | "MEAL" | "MANUAL";

export type DiaryNutritionSummary = {
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	fiber: number;
	sugar: number;
	sodium: number;
};

export type DiaryEntrySummary = {
	id: string;
	mealType: DiaryMealType;
	sourceType: DiaryEntrySourceType;
	sourceFoodId: string | null;
	sourceMealId: string | null;
	displayName: string;
	servingQuantity: number;
	servingUnitCode: string;
	servingUnitName: string;
	sortOrder: number;
	nutrition: DiaryNutritionSummary;
};

export type DiaryNutrientProgress = {
	consumed: number;
	target: number | null;
	remaining: number | null;
	goalPercent: number | null;
};

export type DiaryDayResponseDto = {
	date: string;
	timezone: string;
	canWriteDiary?: boolean;
	goal: {
		configured: boolean;
		calories: number | null;
		protein: number | null;
		carbs: number | null;
		fat: number | null;
		targetSource?: string | null;
	};
	totals: DiaryNutritionSummary;
	remainingCalories: { configured: boolean; value: number | null };
	macroProgress: {
		configured: boolean;
		protein: DiaryNutrientProgress;
		carbs: DiaryNutrientProgress;
		fat: DiaryNutrientProgress;
	};
	mealGroups: { mealType: DiaryMealType; entries: DiaryEntrySummary[]; totals: DiaryNutritionSummary }[];
	warnings: { code: string; message: string }[];
};

export function diaryDayRenderKey(day: DiaryDayResponseDto) {
	return JSON.stringify({
		date: day.date,
		goal: day.goal,
		totals: day.totals,
		remainingCalories: day.remainingCalories,
		macroProgress: day.macroProgress,
		mealGroups: day.mealGroups.map((meal) => ({
			mealType: meal.mealType,
			totals: meal.totals,
			entries: meal.entries.map((entry) => ({
				id: entry.id,
				servingQuantity: entry.servingQuantity,
				servingUnitCode: entry.servingUnitCode,
				nutrition: entry.nutrition,
			})),
		})),
		warnings: day.warnings,
	});
}

export type CreateDiaryEntryRequestDto = {
	mealType: DiaryMealType;
	sourceType: DiaryEntrySourceType;
	sourceFoodId?: string | null;
	sourceMealId?: string | null;
	servingQuantity: number;
	servingUnit?: string | null;
	displayName?: string | null;
	manualNutrition?: DiaryNutritionSummary | null;
};

export type CreateDiaryEntriesBatchRequestDto = {
	mealType: Exclude<DiaryMealType, "CUSTOM">;
	quickPlate?: {
		name: string;
	};
	entries: Array<{
		sourceType: "FOOD";
		sourceId: string;
		quantity: number;
		servingUnitId: string;
	}>;
};

export async function getDiaryDay(date: string, accessToken: string) {
	return apiGet<DiaryDayResponseDto>(`/diary/${date}`, accessToken);
}

export async function createDiaryEntry(
	date: string,
	request: CreateDiaryEntryRequestDto,
	accessToken: string,
	idempotencyKey: string,
) {
	return apiPost<DiaryDayResponseDto>(`/diary/${date}/entries`, request, {
		accessToken,
		headers: {
			"Idempotency-Key": idempotencyKey,
		},
	});
}

export async function createDiaryEntriesBatch(
	date: string,
	request: CreateDiaryEntriesBatchRequestDto,
	accessToken: string,
	idempotencyKey: string,
) {
	return apiPost<DiaryDayResponseDto>(`/diary/${date}/entries/batch`, request, {
		accessToken,
		headers: { "Idempotency-Key": idempotencyKey },
	});
}

export async function updateDiaryEntry(
	date: string,
	entryId: string,
	request: CreateDiaryEntryRequestDto,
	accessToken: string,
	idempotencyKey: string,
) {
	return apiPatch<DiaryDayResponseDto>(
		`/diary/${date}/entries/${encodeURIComponent(entryId)}`,
		request,
		{
			accessToken,
			headers: { "Idempotency-Key": idempotencyKey },
		},
	);
}

export async function deleteDiaryEntry(
	date: string,
	entryId: string,
	accessToken: string,
	idempotencyKey: string,
) {
	return apiDelete<DiaryDayResponseDto>(
		`/diary/${date}/entries/${encodeURIComponent(entryId)}`,
		{ accessToken, headers: { "Idempotency-Key": idempotencyKey } },
	);
}

export async function repeatDiaryEntry(
	targetDate: string,
	entryId: string,
	accessToken: string,
	idempotencyKey: string,
) {
	return apiPost<DiaryDayResponseDto>(
		`/diary/${targetDate}/entries/${encodeURIComponent(entryId)}/repeat`,
		undefined,
		{ accessToken, headers: { "Idempotency-Key": idempotencyKey } },
	);
}

export async function copyDiaryDay(
	targetDate: string,
	sourceDate: string,
	accessToken: string,
	idempotencyKey: string,
) {
	return apiPost<DiaryDayResponseDto>(
		`/diary/${targetDate}/copy-from/${sourceDate}`,
		undefined,
		{ accessToken, headers: { "Idempotency-Key": idempotencyKey } },
	);
}

export type QuickAddSaveStatus = "idle" | "saving" | "validation-error" | "success" | "offline" | "source-unavailable" | "backend-error";

export type DiaryMealOption = {
	label: string;
	mealType: Exclude<DiaryMealType, "CUSTOM">;
	description: string;
};

export const diaryMealOptions: DiaryMealOption[] = [
	{ label: "صبحانه", mealType: "BREAKFAST", description: "شروع روز" },
	{ label: "میان‌وعده صبح", mealType: "SNACK", description: "بین صبحانه و ناهار" },
	{ label: "ناهار", mealType: "LUNCH", description: "وعده میانی روز" },
	{ label: "میان‌وعده عصر", mealType: "SNACK", description: "بین ناهار و شام" },
	{ label: "شام", mealType: "DINNER", description: "وعده اصلی شب" },
	{ label: "میان‌وعده شب", mealType: "SNACK", description: "بعد از شام" },
];

export const quickAddMealTypeByLabel: Record<string, DiaryMealType> =
	Object.fromEntries(
		diaryMealOptions.map((option) => [option.label, option.mealType]),
	);

export function diaryMealLabelForType(mealType: DiaryMealType) {
	if (mealType === "CUSTOM") return "سفارشی";
	return (
		diaryMealOptions.find((option) => option.mealType === mealType)?.label ??
		"میان‌وعده"
	);
}

export function quickAddSaveButtonLabel(status: QuickAddSaveStatus, mealLabel: string) {
	if (status === "saving") return "در حال ذخیره";
	return `ثبت در ${mealLabel}`;
}

export function quickAddValidationMessage({ selectedFoodId, selectedMeal }: { selectedFoodId?: string; selectedMeal: string }) {
	if (!selectedFoodId) return "برای ثبت در دفتر روزانه، ابتدا یک غذا را انتخاب کنید.";
	if (!quickAddMealTypeByLabel[selectedMeal]) return "وعده انتخاب‌شده معتبر نیست.";
	return undefined;
}
