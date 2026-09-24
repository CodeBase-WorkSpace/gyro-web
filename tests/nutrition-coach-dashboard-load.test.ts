import assert from "node:assert/strict";
import test from "node:test";

import { resolveNutritionCoachDashboardLoad } from "../lib/nutrition-coach/dashboard-load";

test("a failed Coach request alone restores the legacy recalibration load", () => {
  assert.deepEqual(resolveNutritionCoachDashboardLoad({ kind: "failure" }), {
    nutritionCoach: null,
    shouldLoadLegacyRecalibration: true,
  });
});

test("a valid empty Coach state remains quiet without the legacy fallback", () => {
  assert.deepEqual(
    resolveNutritionCoachDashboardLoad({ kind: "success", state: null }),
    { nutritionCoach: null, shouldLoadLegacyRecalibration: false },
  );
});
