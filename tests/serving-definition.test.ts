import assert from "node:assert/strict";
import test from "node:test";

import {
  emptyServingDefinitionDraft,
  parseServingDefinitionDraft,
  perServingNutrition,
  servingDefinitionDraftFrom,
  servingsPerBatch,
} from "../lib/foods/serving-definition";
import {
  customFoodPortionDraftsFrom,
  parseCustomFoodPortionsJson,
  serializeCustomFoodPortionDrafts,
  validateCustomFoodPortionDraft,
} from "../lib/foods/custom-food-portions";

test("serving builder defaults the whole derived batch to one serving", () => {
  const parsed = parseServingDefinitionDraft(emptyServingDefinitionDraft, 350);
  assert.deepEqual(parsed.values, {
    totalBatchWeight: 350,
    servingWeight: 350,
  });
});

test("serving builder derives equal weights for multiple servings", () => {
  const parsed = parseServingDefinitionDraft(
    {servingCountInput: "۴"},
    350,
  );
  assert.deepEqual(parsed.values, {
    totalBatchWeight: 350,
    servingWeight: 87.5,
  });
  assert.equal(servingsPerBatch(parsed.values!), 4);
});

test("serving builder rejects missing ingredient weights and invalid counts", () => {
  assert.ok(parseServingDefinitionDraft({servingCountInput: "1"}, null).error);
  assert.ok(parseServingDefinitionDraft({servingCountInput: "1.5"}, 200).error);
  assert.ok(parseServingDefinitionDraft({servingCountInput: "0"}, 200).error);
});

test("per serving nutrition scales totals by derived weight fraction", () => {
  const perServing = perServingNutrition(
    {
      calories: 200,
      protein: 20,
      carbs: 10,
      fat: 4,
      fiber: 2,
      sugar: 1,
      sodium: 100,
    },
    {totalBatchWeight: 200, servingWeight: 50},
  );
  assert.equal(perServing.calories, 50);
  assert.equal(perServing.protein, 5);
  assert.equal(perServing.sodium, 25);
});

test("serving definition draft restores the saved serving count", () => {
  assert.deepEqual(
    servingDefinitionDraftFrom({totalBatchWeight: 200, servingWeight: 50}),
    {servingCountInput: "4"},
  );
  assert.deepEqual(servingDefinitionDraftFrom(null), emptyServingDefinitionDraft);
});

test("custom food portions json parses names and Persian gram weights", () => {
  const serialized = serializeCustomFoodPortionDrafts([
    {id: "a", name: " یک تکه ", gramWeightInput: "۱۰"},
  ]);
  const parsed = parseCustomFoodPortionsJson(serialized);
  assert.deepEqual(parsed.portions, [{name: "یک تکه", gramWeight: 10}]);
});

test("custom food portions reject duplicates and invalid weights", () => {
  assert.ok(
    parseCustomFoodPortionsJson(
      JSON.stringify([
        {name: "تکه", gramWeight: "10"},
        {name: "تکه", gramWeight: "20"},
      ]),
    ).error,
  );
  assert.ok(
    parseCustomFoodPortionsJson(
      JSON.stringify([{name: "تکه", gramWeight: "0"}]),
    ).error,
  );
  assert.ok(parseCustomFoodPortionsJson("not json").error);
  assert.deepEqual(parseCustomFoodPortionsJson("").portions, []);
});

test("portion draft validation flags blank names and bad weights", () => {
  assert.equal(
    validateCustomFoodPortionDraft({
      id: "a",
      name: "تکه",
      gramWeightInput: "10",
    }),
    null,
  );
  assert.ok(
    validateCustomFoodPortionDraft({
      id: "a",
      name: " ",
      gramWeightInput: "10",
    }),
  );
  assert.ok(
    validateCustomFoodPortionDraft({
      id: "a",
      name: "تکه",
      gramWeightInput: "abc",
    }),
  );
});

test("portion drafts are rebuilt from api portions with gram weights", () => {
  const drafts = customFoodPortionDraftsFrom([
    {
      amount: 1,
      unitName: "یک تکه",
      unitAbbreviation: null,
      modifier: null,
      gramWeight: 10,
      displayText: "۱ یک تکه (۱۰ گرم)",
    },
    {
      amount: 1,
      unitName: "بدون وزن",
      unitAbbreviation: null,
      modifier: null,
      gramWeight: null,
      displayText: "۱ بدون وزن",
    },
  ]);
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].name, "یک تکه");
  assert.equal(drafts[0].gramWeightInput, "10");
});
