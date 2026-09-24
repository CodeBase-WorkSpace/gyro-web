import type { DiaryMealType } from "../api/diary";
import type { FoodNutritionDto, QuickAddSearchItem } from "../api/foods";
import { normalizeDecimalInput } from "../foods/custom-food-validation";
import { localizedServingUnit } from "../format";

export type QuickAddSourceSelection = {
	sourceType: "FOOD" | "MEAL";
	sourceId: string;
};

export type QuickAddSelectedFood = {
	food: QuickAddSearchItem;
	source: QuickAddSourceSelection;
	servingOptionId: string;
	amountInput: string;
	mealLabel: string;
};

export type QuickAddServingOption = {
	id: string;
	label: string;
	detail: string;
	backendServingUnit: string;
	backendServingUnitId: string;
	backendQuantityPerAmount: number;
	gramEquivalent?: number;
};

export type QuickAddPreviewNutrition = FoodNutritionDto & {
	backendServingQuantity: number;
};

export function quickAddDefaultSourceSelection(
	food: QuickAddSearchItem,
): QuickAddSourceSelection {
	return {
		sourceType: food.quickAddSourceType ?? "FOOD",
		sourceId: food.id,
	};
}

export function quickAddSelectedFoodFrom(food: QuickAddSearchItem): QuickAddSelectedFood {
	return {
		food,
		source: quickAddDefaultSourceSelection(food),
		servingOptionId: quickAddInitialServingOptionId(food),
		amountInput: "",
		mealLabel: "ناهار",
	};
}

export function quickAddServingOptions(food: QuickAddSearchItem): QuickAddServingOption[] {
	const baseUnitLabel = localizedServingUnit(
		food.servingUnit.code,
		food.servingUnit.label,
	);
  // Serving-defined meals expose their options purely through portions
  // ("serving" and "whole batch"); the raw base unit would duplicate them.
  const isServingDefinedMeal =
    food.quickAddSourceType === "MEAL" && food.portions.length > 0;
  const options: QuickAddServingOption[] = isServingDefinedMeal
    ? []
    : [
      {
        id: `base:${food.servingUnit.code}`,
        label: baseUnitLabel,
        detail: `سروینگ پایه: ${formatDecimal(food.servingQuantity)} ${baseUnitLabel}`,
        backendServingUnit: food.servingUnit.code,
        backendServingUnitId: food.servingUnit.id,
        backendQuantityPerAmount: 1,
      },
    ];

	for (const portion of food.portions) {
		const portionUnitId = portion.servingUnitId?.trim();
		const portionUnitCode = portion.servingUnitCode?.trim();
		const usesFoodSpecificGramWeight = food.servingUnit.code === "GRAM" && Boolean(portion.gramWeight && portion.gramWeight > 0);
		const usesDefinedUnit = !usesFoodSpecificGramWeight && Boolean(portionUnitId && portionUnitCode && portion.amount > 0);
		if (!usesFoodSpecificGramWeight && !usesDefinedUnit) continue;

		options.push({
			id: `portion:${portion.displayText}`,
			label: portion.displayText,
			detail: usesFoodSpecificGramWeight
				? `${formatDecimal(portion.gramWeight!)} ${baseUnitLabel}`
				: `${formatDecimal(portion.amount)} ${localizedServingUnit(portionUnitCode!, portion.unitName ?? portionUnitCode)}`,
			backendServingUnit: usesFoodSpecificGramWeight ? food.servingUnit.code : portionUnitCode!,
			backendServingUnitId: usesFoodSpecificGramWeight ? food.servingUnit.id : portionUnitId!,
			backendQuantityPerAmount: usesFoodSpecificGramWeight ? portion.gramWeight! : portion.amount,
			...(portion.gramWeight ? { gramEquivalent: portion.gramWeight } : {}),
		});
	}

	return options;
}

export function quickAddInitialServingOptionId(food: QuickAddSearchItem) {
	return quickAddServingOptions(food)[0]?.id ?? "";
}

export function parseQuickAddAmount(value: string) {
	const normalized = normalizeDecimalInput(value);

	if (!normalized.length) {
		return { normalized, value: null };
	}

	const parsed = Number(normalized);
	return {
		normalized,
		value: Number.isFinite(parsed) ? parsed : null,
	};
}

export function quickAddPreviewNutritionFor(
	food: QuickAddSearchItem,
	option: QuickAddServingOption,
	amount: number,
): QuickAddPreviewNutrition | null {
	if (!Number.isFinite(amount) || amount <= 0) return null;

	const backendServingQuantity = scaleQuantity(
		amount * option.backendQuantityPerAmount,
	);
	const ratio = backendServingQuantity / food.servingQuantity;

	return {
		backendServingQuantity,
		calories: scaleNutrition(food.calories * ratio),
		protein: scaleNutrition(food.protein * ratio),
		carbs: scaleNutrition(food.carbs * ratio),
		fat: scaleNutrition(food.fat * ratio),
		fiber: scaleNutrition(food.fiber * ratio),
		sugar: scaleNutrition(food.sugar * ratio),
		sodium: scaleNutrition(food.sodium * ratio),
	};
}

export function quickAddValidationMessage(input: {
	selectedSource?: QuickAddSourceSelection | null;
	selectedMeal?: DiaryMealType | null;
	selectedOption?: QuickAddServingOption | null;
	amountInput: string;
}) {
	if (!input.selectedSource?.sourceId) {
		return "برای ثبت در دفتر روزانه، ابتدا یک غذا را انتخاب کنید.";
	}

	if (!input.selectedMeal) {
		return "وعده انتخاب‌شده معتبر نیست.";
	}

	if (!input.selectedOption) {
		return "سروینگ انتخاب‌شده معتبر نیست.";
	}

	if (!input.selectedOption.backendServingUnitId) {
		return "شناسه واحد سروینگ در دسترس نیست. نتایج غذا را تازه‌سازی کنید.";
	}

	const parsed = parseQuickAddAmount(input.amountInput);

	if (parsed.normalized.length === 0) {
		return "مقدار سروینگ را وارد کنید.";
	}

	if (parsed.value === null) {
		return "مقدار سروینگ باید عدد معتبر باشد.";
	}

	if (parsed.value <= 0) {
		return "مقدار سروینگ باید بیشتر از صفر باشد.";
	}

	return undefined;
}

export function quickAddValidationMessageForSelection(input: {
	selectedFoods: QuickAddSelectedFood[];
	selectedMeal?: DiaryMealType | null;
	selectedMealForFood?: (selectedFood: QuickAddSelectedFood) => DiaryMealType | null | undefined;
}) {
	if (!input.selectedFoods.length) {
		return "برای ثبت در دفتر روزانه، ابتدا یک غذا را انتخاب کنید.";
	}

	for (const selectedFood of input.selectedFoods) {
		const option = quickAddServingOptions(selectedFood.food).find(
					(candidate) => candidate.id === selectedFood.servingOptionId,
				) ?? null;
		const message = quickAddValidationMessage({
			selectedSource: selectedFood.source,
			selectedMeal:
				input.selectedMealForFood?.(selectedFood) ?? input.selectedMeal,
			selectedOption: option,
			amountInput: selectedFood.amountInput,
		});

		if (message) return message;
	}

	return undefined;
}

export function quickAddEntryInputFrom(input: {
	date: string;
	nextPath: string;
	selectedMeal: DiaryMealType;
	selectedSource: QuickAddSourceSelection;
	selectedOption: QuickAddServingOption;
	amountInput: string;
}) {
	const parsed = parseQuickAddAmount(input.amountInput);

	if (parsed.value === null || parsed.value <= 0) {
		throw new Error("Quick add amount is invalid.");
	}

	return {
		date: input.date,
		nextPath: input.nextPath,
		mealType: input.selectedMeal,
		sourceType: input.selectedSource.sourceType,
		sourceId: input.selectedSource.sourceId,
		servingQuantity: scaleQuantity(
			parsed.value * input.selectedOption.backendQuantityPerAmount,
		),
		servingUnit: input.selectedOption.backendServingUnit,
	};
}

/**
 * Idempotency key for a single meal-template write.
 *
 * Retrying a partly-failed save must not re-log what already succeeded, so the
 * key has to survive the retry: `intentId` only rotates once a save fully
 * succeeds, and a selection holds at most one entry per `sourceId`, which makes
 * the pair both stable and unique.
 *
 * Amount and meal are deliberately excluded. Including them would mint a new
 * key whenever the user edited a failed selection, so the retry would write a
 * second entry alongside the one already stored. Leaving them out turns that
 * case into an idempotency conflict the user can see.
 */
export function quickAddMealIdempotencyKey(intentId: string, sourceId: string) {
	return `${intentId}:meal:${sourceId}`;
}

export function quickAddBatchEntryFrom(selectedFood: QuickAddSelectedFood) {
	const selectedOption = quickAddServingOptions(selectedFood.food).find(
		(option) => option.id === selectedFood.servingOptionId,
	);
	const parsed = parseQuickAddAmount(selectedFood.amountInput);

	if (!selectedOption?.backendServingUnitId) {
		throw new Error("Quick add serving unit ID is missing.");
	}

	if (parsed.value === null || parsed.value <= 0) {
		throw new Error("Quick add selection is invalid.");
	}

	if (selectedFood.source.sourceType !== "FOOD") {
		throw new Error("Batch quick add only supports food entries.");
	}

	return {
		sourceType: "FOOD" as const,
		sourceId: selectedFood.source.sourceId,
		quantity: scaleQuantity(parsed.value * selectedOption.backendQuantityPerAmount),
		servingUnitId: selectedOption.backendServingUnitId,
	};
}

export function quickAddEstimatedCalories(selectedFoods: QuickAddSelectedFood[]) {
	return scaleNutrition(selectedFoods.reduce((total, selectedFood) => {
		const option = quickAddServingOptions(selectedFood.food).find(
			(candidate) => candidate.id === selectedFood.servingOptionId,
		);
		const amount = parseQuickAddAmount(selectedFood.amountInput).value;
		const preview = option && amount !== null
			? quickAddPreviewNutritionFor(selectedFood.food, option, amount)
			: null;
		return total + (preview?.calories ?? 0);
	}, 0));
}

function scaleNutrition(value: number) {
	return Math.round((value + Number.EPSILON) * 100) / 100;
}

function scaleQuantity(value: number) {
	return Math.round((value + Number.EPSILON) * 10_000) / 10_000;
}

function formatDecimal(value: number) {
	return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}
