import type {FoodDetailDto, FoodSearchItem} from "../api/foods";
import type {CreateMealItemRequestDto, MealDetailDto} from "../api/meals";
import {parseQuickAddAmount, type QuickAddServingOption, quickAddServingOptions,} from "../diary/quick-add";
import {localizedServingUnit} from "../format";

export type MealTemplateFormItem = {
	key: string;
	foodId: string;
	foodName: string;
	quantityInput: string;
  servingOptionId: string;
  servingOptions: QuickAddServingOption[];
};

export function mealTemplateItemFromFood(
  food: FoodSearchItem,
): MealTemplateFormItem {
  const servingOptions = quickAddServingOptions(food);
  return {
    key: `new:${food.id}`,
    foodId: food.id,
    foodName: food.displayName,
		quantityInput: "",
    servingOptionId: servingOptions[0]?.id ?? "",
    servingOptions,
  };
}

export function mealEditorItemsFrom(
	meal: MealDetailDto,
	foods: Array<FoodDetailDto | null>,
): MealTemplateFormItem[] {
	return meal.items.map((item, index) => {
		const food = foods[index];
    const servingOptions = food
      ? quickAddServingOptions(food)
      : [savedServingOption(item.servingUnit)];
    const selectedOption =
      servingOptions.find(
        (option) =>
          option.backendServingUnit === item.servingUnit.code &&
          option.backendQuantityPerAmount === 1,
      ) ??
      servingOptions.find(
        (option) => option.backendServingUnit === item.servingUnit.code,
      ) ??
      servingOptions[0]!;

		return {
			key: item.id,
			foodId: food?.id ?? item.foodId,
			foodName: food?.displayName ?? item.foodName,
      quantityInput: formatNumber(
        item.quantity / selectedOption.backendQuantityPerAmount,
      ),
      servingOptionId: selectedOption.id,
      servingOptions,
		};
	});
}

export function mealTemplateRequestItemFrom(
  item: MealTemplateFormItem,
): CreateMealItemRequestDto | null {
  const option = selectedServingOption(item);
  const amount = parseQuickAddAmount(item.quantityInput).value;
  if (!option || amount === null || amount <= 0) return null;

  return {
    foodId: item.foodId,
    quantity: scaleQuantity(amount * option.backendQuantityPerAmount),
    servingUnit: option.backendServingUnit,
  };
}

export function mealTemplateItemWeight(
  item: MealTemplateFormItem,
): number | null {
  const option = selectedServingOption(item);
  const amount = parseQuickAddAmount(item.quantityInput).value;
  if (!option || amount === null || amount <= 0) return null;

  const gramsPerAmount =
    option.gramEquivalent ??
    (option.backendServingUnit === "GRAM"
      ? option.backendQuantityPerAmount
      : null);
  return gramsPerAmount === null
    ? null
    : scaleQuantity(amount * gramsPerAmount);
}

export function mealTemplateIngredientWeight(
  items: MealTemplateFormItem[],
): number | null {
  if (items.length === 0) return null;
  let total = 0;
  for (const item of items) {
    const weight = mealTemplateItemWeight(item);
    if (weight === null) return null;
    total += weight;
  }
  return scaleQuantity(total);
}

function selectedServingOption(item: MealTemplateFormItem) {
  return item.servingOptions.find(
    (option) => option.id === item.servingOptionId,
  );
}

function savedServingOption(unit: {
  id: string;
  code: string;
  label: string;
}): QuickAddServingOption {
  const label = localizedServingUnit(unit.code, unit.label);
  return {
    id: `saved:${unit.id || unit.code}`,
    label,
    detail: label,
    backendServingUnit: unit.code,
    backendServingUnitId: unit.id,
    backendQuantityPerAmount: 1,
    ...(unit.code === "GRAM" ? {gramEquivalent: 1} : {}),
  };
}

function scaleQuantity(value: number) {
  return Math.round((value + Number.EPSILON) * 10_000) / 10_000;
}

function formatNumber(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(4).replace(/\.?0+$/, "");
}
