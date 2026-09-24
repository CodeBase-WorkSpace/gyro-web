import assert from "node:assert/strict";
import test from "node:test";

import { isNutritionCoachFlagEnabled } from "../lib/features/nutrition-coach";

test("nutrition coach flag defaults off and only exact true enables it", () => {
  assert.equal(isNutritionCoachFlagEnabled(undefined), false);
  assert.equal(isNutritionCoachFlagEnabled(""), false);
  assert.equal(isNutritionCoachFlagEnabled("TRUE"), false);
  assert.equal(isNutritionCoachFlagEnabled("1"), false);
  assert.equal(isNutritionCoachFlagEnabled("true"), true);
});
