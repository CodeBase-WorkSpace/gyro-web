import assert from "node:assert/strict";
import test from "node:test";

import {diaryEntryDetailHref} from "../lib/diary/entry-detail";
import type {DiaryEntrySummary} from "../lib/api/diary";

const baseEntry: DiaryEntrySummary = {
  id: "entry-1",
  mealType: "LUNCH",
  sourceType: "FOOD",
  sourceFoodId: "food 1",
  sourceMealId: null,
  displayName: "غذا",
  servingQuantity: 1,
  servingUnitCode: "GRAM",
  servingUnitName: "گرم",
  sortOrder: 0,
  nutrition: {calories: 1, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0},
};

test("diary source detail links resolve food and meal routes", () => {
  assert.equal(diaryEntryDetailHref(baseEntry), "/foods/food%201");
  assert.equal(
    diaryEntryDetailHref({...baseEntry, sourceType: "MEAL", sourceFoodId: null, sourceMealId: "meal-1"}),
    "/foods/meals/meal-1",
  );
});

test("manual and source-less diary entries have no detail route", () => {
  assert.equal(diaryEntryDetailHref({...baseEntry, sourceType: "MANUAL", sourceFoodId: null}), null);
  assert.equal(diaryEntryDetailHref({...baseEntry, sourceFoodId: " "}), null);
});
