import type {FoodNutritionDto} from "@/lib/api/foods";

import {normalizeDecimalInput} from "./custom-food-validation";

/** Equal-sized servings derived from the meal's ingredient weight. */
export type ServingDefinitionDraft = {
  servingCountInput: string;
};

export type ServingDefinitionValues = {
  totalBatchWeight: number;
  servingWeight: number;
};

export const emptyServingDefinitionDraft: ServingDefinitionDraft = {
  servingCountInput: "1",
};

export function servingDefinitionDraftFrom(
  definition:
    | { totalBatchWeight: number; servingWeight: number }
    | null
    | undefined,
): ServingDefinitionDraft {
  if (!definition) return emptyServingDefinitionDraft;
  return {
    servingCountInput: formatServingCount(
      definition.totalBatchWeight / definition.servingWeight,
    ),
  };
}

export type ParsedServingDefinition =
  | { values: ServingDefinitionValues; error?: undefined }
  | { values?: undefined; error: string };

export function parseServingDefinitionDraft(
  draft: ServingDefinitionDraft,
  totalBatchWeight: number | null,
): ParsedServingDefinition {
  if (totalBatchWeight === null || !Number.isFinite(totalBatchWeight)) {
    return {
      error:
        "وزن کل از اجزای وعده قابل محاسبه نیست. برای هر غذا، واحدی با معادل گرم انتخاب کنید.",
    };
  }
  if (totalBatchWeight <= 0) {
    return {error: "وزن کل وعده باید بیشتر از صفر باشد."};
  }

  const countRaw = normalizeDecimalInput(draft.servingCountInput);
  const servingCount = Number(countRaw);
  if (
    !countRaw ||
    !Number.isFinite(servingCount) ||
    !Number.isInteger(servingCount) ||
    servingCount < 1
  ) {
    return {error: "تعداد سروینگ باید یک عدد صحیح و حداقل ۱ باشد."};
  }
  if (servingCount > 1000) {
    return {error: "تعداد سروینگ نمی‌تواند بیشتر از ۱۰۰۰ باشد."};
  }

  return {
    values: {
      totalBatchWeight: scaleWeight(totalBatchWeight),
      servingWeight: scaleWeight(totalBatchWeight / servingCount),
    },
  };
}

export function servingsPerBatch(values: ServingDefinitionValues): number {
  return values.totalBatchWeight / values.servingWeight;
}

export function perServingNutrition(
  totals: FoodNutritionDto,
  values: ServingDefinitionValues,
): FoodNutritionDto {
  const fraction = values.servingWeight / values.totalBatchWeight;
  return {
    calories: totals.calories * fraction,
    protein: totals.protein * fraction,
    carbs: totals.carbs * fraction,
    fat: totals.fat * fraction,
    fiber: totals.fiber * fraction,
    sugar: totals.sugar * fraction,
    sodium: totals.sodium * fraction,
  };
}

function scaleWeight(value: number) {
  return Math.round((value + Number.EPSILON) * 10_000) / 10_000;
}

function formatServingCount(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : String(Math.max(1, Math.round(value)));
}
