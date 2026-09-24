import assert from "node:assert/strict";
import test from "node:test";

import type {GoalResponseDto, Weekday} from "../lib/api/goals";
import {
  advancedPlannerControlAccess,
  applyCompensatedRefeed,
  effectiveManualDailyTargets,
  FLAT_REFEED_ERROR,
  flatScheduleRefeedError,
  manualDailyTargetsAreValid,
  parseTrainingDays,
  reconcileWeeklyCalories,
  scheduleTypeForPlanningPattern,
} from "../lib/goals/advanced-nutrition-planner";
import {goalFormValuesFromGoal} from "../lib/goals/goal-form";
import {rebaseAdvancedSchedule} from "../lib/goals/advanced-nutrition-design";

test("weekday patterns keep their backend schedule types", () => {
  assert.equal(scheduleTypeForPlanningPattern("ZIGZAG"), "ZIGZAG");
  assert.equal(
    scheduleTypeForPlanningPattern("HIGH_WEEKEND"),
    "WEEKDAY_WEEKEND",
  );
  assert.equal(
    scheduleTypeForPlanningPattern("LOW_WEEKEND"),
    "WEEKDAY_WEEKEND",
  );
});

test("untouched manual mode materializes all seven daily targets", () => {
  const targets = effectiveManualDailyTargets("", 2100);

  assert.equal(Object.keys(targets).length, 7);
  assert.deepEqual(new Set(Object.values(targets)), new Set([2100]));
});

test("malformed persisted manual targets are not treated as untouched", () => {
  assert.equal(manualDailyTargetsAreValid(""), true);
  assert.equal(manualDailyTargetsAreValid('{"SATURDAY":"bad"}'), false);
});

test("manual and refeed controls use independent entitlement states", () => {
  const access = advancedPlannerControlAccess({
    plannerUnlocked: true,
    workoutUnlocked: true,
    refeedUnlocked: false,
  });

  assert.equal(access.manualDisabled, false);
  assert.equal(access.refeedDisabled, true);
});

test("an explicit empty training selection remains empty", () => {
  assert.deepEqual(parseTrainingDays(""), []);
});

test("weekly reconciliation preserves both the budget and daily floor", () => {
  const targets = reconcileWeeklyCalories(
    [900, 900, 900, 900, 900, 900, 5000],
    5_600,
  );

  assert.equal(
    targets.reduce((sum, value) => sum + value, 0),
    5_600,
  );
  assert.ok(targets.every((value) => value >= 800));
});

test("refeed adds to one day and compensates without changing the week", () => {
  const targets = applyCompensatedRefeed(
    [2000, 2000, 2000, 2000, 2000, 2000, 2000],
    6,
    10,
    14_000,
  );

  assert.equal(
    targets.reduce((sum, value) => sum + value, 0),
    14_000,
  );
  assert.ok(targets[6] > 2000);
  assert.ok(targets.slice(0, 6).every((value) => value < 2000));
});

test("flat schedules explain that refeed needs another weekly method", () => {
  assert.equal(
    flatScheduleRefeedError("UNIFORM", "WEEKLY"),
    FLAT_REFEED_ERROR,
  );
  assert.equal(
    flatScheduleRefeedError("CUSTOM", "WEEKLY"),
    null,
  );
});

test("legacy custom workout schedules hydrate as workout and rest", () => {
  const values = goalFormValuesFromGoal(
    configuredGoal({
      planningPattern: "CUSTOM",
      trainingDays: ["SATURDAY", "MONDAY", "WEDNESDAY"],
    }),
  );

  assert.equal(values.planningPattern, "TRAINING_REST");
});

test("materialized manual schedules remain manual after hydration", () => {
  const manualTargets = effectiveManualDailyTargets("", 2100);
  const values = goalFormValuesFromGoal(
    configuredGoal({
      planningPattern: "CUSTOM",
      trainingDays: ["SATURDAY", "MONDAY", "WEDNESDAY"],
      manualDailyTargets: JSON.stringify(manualTargets),
    }),
  );

  assert.equal(values.planningPattern, "CUSTOM");
  assert.deepEqual(JSON.parse(values.manualDailyTargets), manualTargets);
});

test("wizard rebasing preserves the advanced distribution and future overrides", () => {
  const values = goalFormValuesFromGoal(
    configuredGoal({
      planningPattern: "CUSTOM",
      macroStrategy: "CUSTOM",
      manualDailyTargets: JSON.stringify({
        SATURDAY: 1800,
        SUNDAY: 1900,
        MONDAY: 2000,
        TUESDAY: 2100,
        WEDNESDAY: 2200,
        THURSDAY: 2300,
        FRIDAY: 2400,
      }),
    }),
  );
  const saved = JSON.parse(values.advancedSchedule);
  saved.dateOverrides = {
    "2026-08-14": {
      calories: 2500,
      protein: 140,
      carbs: 280,
      fat: 70,
      fiber: 30,
    },
  };
  values.advancedSchedule = JSON.stringify(saved);

  const rebased = rebaseAdvancedSchedule(values, {
    calories: "2400",
    protein: "156",
    carbs: "300",
    fat: "78",
    fiber: "34",
  });
  const week = Object.values(rebased.weekdayTargets ?? {});

  assert.equal(rebased.weeklyCalorieBudget, 16_800);
  assert.equal(week.reduce((sum, target) => sum + target.calories, 0), 16_800);
  assert.equal(rebased.dateOverrides?.["2026-08-14"].calories, 2857);
  assert.equal(rebased.dateOverrides?.["2026-08-14"].protein, 168);
});

function configuredGoal(metadata: Record<string, unknown>): GoalResponseDto {
  const weekdayTargets = Object.fromEntries(
    [
      "SATURDAY",
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
    ].map((day) => [
      day,
      { calories: 2100, protein: 130, carbs: 250, fat: 65, fiber: null },
    ]),
  ) as Record<
    Weekday,
    {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: null;
    }
  >;

  return {
    status: "CONFIGURED",
    goal: null,
    activePlan: {
      id: "plan-1",
      goalType: "MAINTAIN_WEIGHT",
      startDate: "2026-07-11",
      baseTargets: weekdayTargets.SATURDAY,
      calculator: null,
      schedule: {
        type: "CUSTOM",
        activeFrom: "2026-07-11",
        activeTo: null,
        weeklyCalorieBudget: 14_700,
        weekdayTargets,
        dietMode: `ADVANCED_NUTRITION:${JSON.stringify(metadata)}`,
      },
    },
    todayTarget: null,
  };
}
