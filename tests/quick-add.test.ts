import assert from "node:assert/strict";
import test from "node:test";

import {
  quickAddDefaultSourceSelection,
  quickAddBatchEntryFrom,
  quickAddEstimatedCalories,
  quickAddMealIdempotencyKey,
  quickAddSelectedFoodFrom,
  quickAddEntryInputFrom,
  quickAddPreviewNutritionFor,
  quickAddServingOptions,
  quickAddValidationMessage,
  quickAddValidationMessageForSelection,
} from "../lib/diary/quick-add";
import type { FoodSearchItem, QuickAddSearchItem } from "../lib/api/foods";

const chickenFood: FoodSearchItem = {
  id: "food-123",
  type: "SYSTEM",
  name: "Chicken breast",
  displayName: "سینه مرغ",
  locale: "fa",
  servingQuantity: 100,
  servingUnit: { id: "unit-gram", code: "GRAM", label: "گرم" },
  calories: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
  fiber: 0,
  sugar: 0,
  sodium: 74,
  portions: [
    {
      amount: 1,
      unitName: "فنجان",
      unitAbbreviation: "CUP",
      modifier: "خردشده",
      gramWeight: 140,
      displayText: "1 cup, diced",
    },
  ],
  favorite: false,
  recent: true,
  source: "USDA_FDC",
  dataQuality: "FOUNDATION",
};

test("quickAddServingOptions keeps base serving first and adds convertible food portions", () => {
  const options = quickAddServingOptions(chickenFood);

  assert.deepEqual(options, [
    {
      id: "base:GRAM",
      label: "گرم",
      detail: "سروینگ پایه: 100 گرم",
      backendServingUnit: "GRAM",
      backendServingUnitId: "unit-gram",
      backendQuantityPerAmount: 1,
    },
    {
      id: "portion:1 cup, diced",
      label: "1 cup, diced",
      detail: "140 گرم",
      backendServingUnit: "GRAM",
      backendServingUnitId: "unit-gram",
      backendQuantityPerAmount: 140,
      gramEquivalent: 140,
    },
  ]);
});

test("quickAddValidationMessage accepts Persian digits and rejects invalid amounts", () => {
  const [baseOption] = quickAddServingOptions(chickenFood);
  const selectedSource = quickAddDefaultSourceSelection(chickenFood);

  assert.equal(
    quickAddValidationMessage({
      selectedSource,
      selectedMeal: "LUNCH",
      selectedOption: baseOption,
      amountInput: "۱٫۵",
    }),
    undefined
  );

  assert.equal(
    quickAddValidationMessage({
      selectedSource,
      selectedMeal: "LUNCH",
      selectedOption: baseOption,
      amountInput: "۰",
    }),
    "مقدار سروینگ باید بیشتر از صفر باشد."
  );

  assert.equal(
    quickAddValidationMessage({
      selectedSource,
      selectedMeal: "LUNCH",
      selectedOption: baseOption,
      amountInput: "abc",
    }),
    "مقدار سروینگ باید عدد معتبر باشد."
  );
});

test("quickAddPreviewNutritionFor matches backend-style scaled preview math", () => {
  const [, portionOption] = quickAddServingOptions(chickenFood);
  const preview = quickAddPreviewNutritionFor(chickenFood, portionOption!, 0.5);

  assert.deepEqual(preview, {
    backendServingQuantity: 70,
    calories: 115.5,
    protein: 21.7,
    carbs: 0,
    fat: 2.52,
    fiber: 0,
    sugar: 0,
    sodium: 51.8,
  });
});

test("quickAddEntryInputFrom builds backend payload from selected serving option and amount", () => {
  const [, portionOption] = quickAddServingOptions(chickenFood);
  const payload = quickAddEntryInputFrom({
    date: "2026-06-21",
    nextPath: "/dashboard?date=2026-06-21",
    selectedMeal: "LUNCH",
    selectedSource: quickAddDefaultSourceSelection(chickenFood),
    selectedOption: portionOption!,
    amountInput: "۱.۵",
  });

  assert.deepEqual(payload, {
    date: "2026-06-21",
    nextPath: "/dashboard?date=2026-06-21",
    mealType: "LUNCH",
    sourceType: "FOOD",
    sourceId: "food-123",
    servingQuantity: 210,
    servingUnit: "GRAM",
  });
});

test("serving-defined meals submit the same serving quantity used by the preview", () => {
  const servingDefinedMeal = {
    ...chickenFood,
    id: "meal-123",
    servingQuantity: 1,
    servingUnit: { id: "meal-serving", code: "SERVING", label: "وعده" },
    portions: [
      {
        amount: 1,
        unitName: "سروینگ (۱۰ گرم)",
        displayText: "سروینگ (۱۰ گرم)",
        servingUnitId: "meal-serving",
        servingUnitCode: "SERVING",
      },
      {
        amount: 20,
        unitName: "کل وعده (۲۰ سروینگ)",
        displayText: "کل وعده (۲۰ سروینگ)",
        servingUnitId: "meal-serving",
        servingUnitCode: "SERVING",
      },
    ],
    quickAddSourceType: "MEAL" as const,
    calories: 10,
  } satisfies QuickAddSearchItem;
  const [serving, wholeBatch] = quickAddServingOptions(servingDefinedMeal);
  const source = quickAddDefaultSourceSelection(servingDefinedMeal);

  assert.equal(quickAddPreviewNutritionFor(servingDefinedMeal, serving!, 2)?.calories, 20);
  assert.equal(quickAddPreviewNutritionFor(servingDefinedMeal, wholeBatch!, 1)?.calories, 200);
  assert.equal(
    quickAddEntryInputFrom({ date: "2026-06-21", nextPath: "/dashboard?date=2026-06-21", selectedMeal: "LUNCH", selectedSource: source, selectedOption: serving!, amountInput: "2" }).servingQuantity,
    2,
  );
  assert.equal(
    quickAddEntryInputFrom({ date: "2026-06-21", nextPath: "/dashboard?date=2026-06-21", selectedMeal: "LUNCH", selectedSource: source, selectedOption: wholeBatch!, amountInput: "1" }).servingQuantity,
    20,
  );
});

test("batch quick add builds one entry per selection and totals estimated calories", () => {
  const first = { ...quickAddSelectedFoodFrom(chickenFood), amountInput: "۱۰۰" };
  const second = {
    ...quickAddSelectedFoodFrom({ ...chickenFood, id: "food-456", displayName: "مرغ دوم" }),
    amountInput: "۵۰",
  };

  assert.deepEqual(quickAddBatchEntryFrom(first), {
    sourceType: "FOOD",
    sourceId: "food-123",
    quantity: 100,
    servingUnitId: "unit-gram",
  });
  assert.equal(quickAddEstimatedCalories([first, second]), 247.5);
});

test("quick add uses a food-defined serving unit only when a gram-based conversion is unavailable", () => {
  const foodWithCup = {
    ...chickenFood,
    portions: [
      {
        amount: 1,
        unitName: "فنجان",
        unitAbbreviation: "CUP",
        modifier: null,
        gramWeight: null,
        displayText: "1 cup",
        servingUnitId: "unit-cup",
        servingUnitCode: "CUP",
      },
    ],
  } satisfies FoodSearchItem;

  assert.deepEqual(quickAddServingOptions(foodWithCup)[1], {
    id: "portion:1 cup",
    label: "1 cup",
    detail: "1 فنجان",
    backendServingUnit: "CUP",
    backendServingUnitId: "unit-cup",
    backendQuantityPerAmount: 1,
  });
});

test("quick add normalizes cup and piece portions to grams for gram-based foods", () => {
  const foodWithWeightedPortions = {
    ...chickenFood,
    portions: [
      {
        amount: 1,
        unitName: "فنجان",
        unitAbbreviation: "CUP",
        modifier: null,
        gramWeight: 140,
        displayText: "1 cup",
        servingUnitId: "unit-cup",
        servingUnitCode: "CUP",
      },
      {
        amount: 1,
        unitName: "عدد",
        unitAbbreviation: "PIECE",
        modifier: null,
        gramWeight: 55,
        displayText: "1 piece",
        servingUnitId: "unit-piece",
        servingUnitCode: "PIECE",
      },
    ],
  } satisfies FoodSearchItem;

  const [, cup, piece] = quickAddServingOptions(foodWithWeightedPortions);
  assert.deepEqual(cup, {
    id: "portion:1 cup",
    label: "1 cup",
    detail: "140 گرم",
    backendServingUnit: "GRAM",
    backendServingUnitId: "unit-gram",
    backendQuantityPerAmount: 140,
    gramEquivalent: 140,
  });
  assert.deepEqual(piece, {
    id: "portion:1 piece",
    label: "1 piece",
    detail: "55 گرم",
    backendServingUnit: "GRAM",
    backendServingUnitId: "unit-gram",
    backendQuantityPerAmount: 55,
    gramEquivalent: 55,
  });

  assert.deepEqual(
    quickAddBatchEntryFrom({
      ...quickAddSelectedFoodFrom(foodWithWeightedPortions),
      servingOptionId: cup!.id,
      amountInput: "1",
    }),
    { sourceType: "FOOD", sourceId: "food-123", quantity: 140, servingUnitId: "unit-gram" },
  );
});

test("batch quick add rejects stale food data without a serving unit ID locally", () => {
  const staleFood = {
    ...chickenFood,
    servingUnit: { code: "GRAM", label: "گرم" },
  } as unknown as FoodSearchItem;
  const selection = quickAddSelectedFoodFrom(staleFood);

  assert.equal(
    quickAddValidationMessageForSelection({
      selectedFoods: [selection],
      selectedMeal: "LUNCH",
    }),
    "شناسه واحد سروینگ در دسترس نیست. نتایج غذا را تازه‌سازی کنید."
  );
  assert.throws(
    () => quickAddBatchEntryFrom(selection),
    /serving unit ID is missing/
  );
});

test("meal idempotency key is stable so a retry cannot double-log the entry", () => {
  // The retry path: same intent, same selection, second attempt.
  assert.equal(
    quickAddMealIdempotencyKey("intent-1", "meal-abc"),
    quickAddMealIdempotencyKey("intent-1", "meal-abc")
  );
});

test("meal idempotency key is unique per selection within one intent", () => {
  assert.notEqual(
    quickAddMealIdempotencyKey("intent-1", "meal-abc"),
    quickAddMealIdempotencyKey("intent-1", "meal-xyz")
  );
});

test("meal idempotency key changes once the intent rotates after a success", () => {
  assert.notEqual(
    quickAddMealIdempotencyKey("intent-1", "meal-abc"),
    quickAddMealIdempotencyKey("intent-2", "meal-abc")
  );
});

test("meal idempotency key does not collide with the batch key for the same intent", () => {
  // Batch writes use `${intentId}:${mealType}`; a meal template whose source id
  // happened to match a meal type must not land on that key.
  assert.notEqual(
    quickAddMealIdempotencyKey("intent-1", "LUNCH"),
    "intent-1:LUNCH"
  );
});
