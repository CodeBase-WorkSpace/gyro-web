import assert from "node:assert/strict";
import test from "node:test";

import type {FoodDetailDto} from "../lib/api/foods";
import type {MealDetailDto} from "../lib/api/meals";
import {
  mealEditorItemsFrom,
  mealTemplateIngredientWeight,
  mealTemplateItemFromFood,
  mealTemplateRequestItemFrom,
} from "../lib/foods/meal-editor";

const meal: MealDetailDto = {
	id: "meal-1",
	name: "وعده تمرین",
  items: [
    {
      id: "item-1",
      foodId: "internal-food-uuid",
      foodName: "برنج",
      quantity: 150,
      servingUnit: {id: "unit-gram", code: "GRAM", label: "Gram"},
      calories: 195,
      protein: 4,
      carbs: 42,
      fat: 0.5,
      fiber: 0,
      sugar: 0,
      sodium: 1,
    },
  ],
	calories: 195,
	protein: 4,
	carbs: 42,
	fat: 0.5,
	fiber: 0,
	sugar: 0,
	sodium: 1,
};

const food: FoodDetailDto = {
	id: "food-public-id",
	type: "SYSTEM",
	name: "Rice",
	displayName: "برنج",
	locale: "fa",
	servingQuantity: 100,
	servingUnit: { id: "unit-gram", code: "GRAM", label: "Gram" },
  portions: [
    {
      amount: 1,
      unitName: "پیمانه",
      unitAbbreviation: "CUP",
      modifier: null,
      gramWeight: 180,
      displayText: "۱ پیمانه",
    },
  ],
	favorite: false,
	recent: false,
	source: "USDA_FDC",
	dataQuality: "FOUNDATION",
	calories: 130,
	protein: 2.7,
	carbs: 28,
	fat: 0.3,
	fiber: 0,
	sugar: 0,
	sodium: 1,
};

test("meal editor normalizes ids and exposes every convertible serving option", () => {
  const [item] = mealEditorItemsFrom(meal, [food]);

  assert.equal(item!.foodId, "food-public-id");
  assert.equal(item!.foodName, "برنج");
  assert.equal(item!.quantityInput, "150");
  assert.equal(item!.servingOptionId, "base:GRAM");
  assert.deepEqual(
    item!.servingOptions.map((option) => option.label),
    ["گرم", "۱ پیمانه"],
  );
});

test("meal editor converts selected portions for payloads and accumulated weight", () => {
  const rice = mealTemplateItemFromFood(food);
  const cup = rice.servingOptions[1]!;
  const selectedCup = {
    ...rice,
    quantityInput: "۱٫۵",
    servingOptionId: cup.id,
  };
  const secondRice = {
    ...mealTemplateItemFromFood({...food, id: "food-second"}),
    quantityInput: "۸۰",
  };

  assert.deepEqual(mealTemplateRequestItemFrom(selectedCup), {
		foodId: "food-public-id",
    quantity: 270,
		servingUnit: "GRAM",
  });
  assert.equal(
    mealTemplateIngredientWeight([selectedCup, secondRice]),
    350,
  );
});
