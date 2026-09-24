import assert from "node:assert/strict";
import test from "node:test";

import {
  advancedOverlayFormValues,
  calculatorSnapshotFromPreview,
  goalFormValuesFromGoal,
  goalOutcomeForSave,
  hasAdvancedScheduleOverlay,
  hasSavedCalculatorBase,
} from "../lib/goals/goal-form";
import type { GoalPreviewResponseDto } from "../lib/api/goals";

test("maintain-weight preview normalizes an omitted target date to null", () => {
  const preview = {
    formula: { name: "MIFFLIN_ST_JEOR", version: "1" },
    calculationDate: "2026-07-18",
    maintenanceCalories: 2200,
    targetCalories: 2200,
    activityFactor: 1.45,
    dailyEnergyDelta: 0,
    weeklyWeightChangeKg: 0,
    timeline: {
      estimatedWeeksMin: 0,
      estimatedWeeksMax: 0,
      estimatedMonths: 0,
    },
    macros: {
      proteinGrams: 140,
      proteinCalories: 560,
      carbsGrams: 240,
      carbsCalories: 960,
      fatGrams: 75.5,
      fatCalories: 679.5,
    },
    warnings: [],
  } satisfies GoalPreviewResponseDto;

  assert.equal(
    calculatorSnapshotFromPreview(preview).timeline.estimatedTargetDate,
    null,
  );

  assert.deepEqual(
    calculatorSnapshotFromPreview(preview, {
      sex: "FEMALE",
      birthDate: "1995-04-12",
      heightCm: "165",
      currentWeightKg: "82",
      targetWeightKg: "",
      dailyMovementLevel: "MODERATE",
      workoutFrequency: "THREE_TO_FOUR_DAYS",
      speed: "AGGRESSIVE",
    }).profile,
    {
      sex: "FEMALE",
      birthDate: "1995-04-12",
      heightCm: 165,
      currentWeightKg: 82,
      targetWeightKg: null,
      dailyMovementLevel: "MODERATE",
      workoutFrequency: "THREE_TO_FOUR_DAYS",
      speed: "AGGRESSIVE",
    },
  );
});

test("maintain-weight saves without stale target weight or date", () => {
  assert.deepEqual(
    goalOutcomeForSave("MAINTAIN_WEIGHT", 72, "2026-12-01"),
    {
      type: "MAINTAIN_WEIGHT",
      targetWeight: null,
      targetDate: null,
    },
  );
});

test("weight-change goals keep their chosen target", () => {
  assert.deepEqual(goalOutcomeForSave("LOSE_WEIGHT", 72, "2026-12-01"), {
    type: "LOSE_WEIGHT",
    targetWeight: { value: 72, unit: "KG" },
    targetDate: "2026-12-01",
  });
});

test("configured calculator goals round-trip as preserve without serializing an incomplete snapshot", () => {
  const values = goalFormValuesFromGoal({
    status: "CONFIGURED",
    goal: { targetWeight: { value: 76.5, unit: "KG" }, targetDate: "2026-10-01" },
    activePlan: {
      id: "plan-1",
      goalType: "LOSE_WEIGHT",
      startDate: "2026-07-01",
      baseTargets: { calories: 2200, protein: 140, carbs: 220, fat: 70, fiber: 28 },
      calculator: {
        formula: "mifflin-st-jeor",
        formulaVersion: "1",
        maintenanceCalories: 2600,
        dailyEnergyDelta: -400,
        expectedWeeklyWeightChangeKg: -0.36,
        profile: null,
        maintenanceSource: "FORMULA",
        formulaMaintenanceCalories: 2600,
        observationBasis: null,
      },
      schedule: {
        type: "CUSTOM",
        activeFrom: "2026-07-01",
        activeTo: null,
        weeklyCalorieBudget: 15400,
        weekdayTargets: {},
        dateOverrides: {},
        macroAdjustmentMode: "FIXED_GRAMS",
        dietMode: null,
      },
    },
  });

  assert.equal(values.calculatorUpdateMode, "PRESERVE");
  assert.equal(values.calculatorSnapshot, "");
  assert.equal(JSON.parse(values.advancedSchedule).type, "CUSTOM");
});

test("manual goals explicitly remain clear", () => {
  const values = goalFormValuesFromGoal({ status: "UNCONFIGURED" });
  assert.equal(values.calculatorUpdateMode, "CLEAR");
});

test("advanced design requires a saved calculator base", () => {
  const manual = goalFormValuesFromGoal({ status: "UNCONFIGURED" });
  const calculated = { ...manual, calculatorUpdateMode: "PRESERVE" as const };

  assert.equal(hasSavedCalculatorBase(false, calculated), false);
  assert.equal(hasSavedCalculatorBase(true, manual), false);
  assert.equal(hasSavedCalculatorBase(true, calculated), true);
});

test("only non-flat schedules count as advanced overlays", () => {
  assert.equal(hasAdvancedScheduleOverlay(""), false);
  assert.equal(hasAdvancedScheduleOverlay('{"type":"FLAT"}'), false);
  assert.equal(hasAdvancedScheduleOverlay('{"type":"CUSTOM"}'), true);
  assert.equal(hasAdvancedScheduleOverlay("invalid schedule"), true);
});

test("advanced overlay preserves calculator base fields", () => {
  const initial = goalFormValuesFromGoal({ status: "UNCONFIGURED" });
  const saved = {
    ...initial,
    calories: "2200",
    protein: "140",
    calculatorUpdateMode: "PRESERVE" as const,
  };
  const draft = {
    ...saved,
    calories: "2500",
    protein: "180",
    planningPattern: "ZIGZAG" as const,
  };

  const overlay = advancedOverlayFormValues(saved, draft);
  assert.equal(overlay.calories, "2200");
  assert.equal(overlay.protein, "140");
  assert.equal(overlay.planningPattern, "ZIGZAG");
  assert.equal(overlay.calculatorUpdateMode, "PRESERVE");
  assert.equal(overlay.calculatorSnapshot, "");
});
