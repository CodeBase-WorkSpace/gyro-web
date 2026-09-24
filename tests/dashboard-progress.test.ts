import assert from "node:assert/strict";
import test from "node:test";

import type {NutritionProgressPoint} from "../lib/api/progress";
import {isDashboardLoggedDay} from "../lib/progress/dashboard";

test("dashboard logged-day state preserves logged zero-calorie days", () => {
  const day: NutritionProgressPoint = {
    date: "2026-06-30",
    logged: true,
    totals: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    },
    goal: null,
  };

  assert.equal(isDashboardLoggedDay(day), true);
});

test("dashboard logged-day state keeps backend missing days missing", () => {
  const day: NutritionProgressPoint = {
    date: "2026-07-01",
    logged: false,
    totals: {
      calories: 450,
      protein: 12,
      carbs: 60,
      fat: 15,
      fiber: 4,
      sugar: 8,
      sodium: 300,
    },
    goal: null,
  };

  assert.equal(isDashboardLoggedDay(day), false);
});
