import assert from "node:assert/strict";
import test from "node:test";

import type {NutritionProgressResponseDto} from "../lib/api/progress";
import {
  buildNutritionChartPoints,
  comparisonRangesForNutritionExplorer,
  micronutrientRows,
  nutritionComparisonCopy,
  nutritionCoverageState,
  nutritionExplorerHref,
  nutritionExplorerModeHref,
  nutritionGoalAdherenceRows,
  resolveNutritionExplorerState,
} from "../lib/progress/nutrition-explorer";

test("nutrition explorer resolves fa-IR week ranges from a preserved anchor date", () => {
  const state = resolveNutritionExplorerState(
    {period: "WEEK", date: "2026-06-28"},
    "2026-06-28",
    "fa-IR",
  );

  assert.equal(state.period, "WEEK");
  assert.equal(state.labelFrom, "2026-06-27");
  assert.equal(state.labelTo, "2026-07-03");
  assert.deepEqual(state.activeRequest, {
    period: "WEEK",
    anchor: "2026-06-28",
  });
});

test("nutrition explorer resolves month boundaries and preserves the anchor when switching modes", () => {
  const state = resolveNutritionExplorerState(
    {period: "MONTH", date: "2026-06-28", month: "2026-06"},
    "2026-06-28",
    "fa-IR",
  );

  assert.equal(state.labelFrom, "2026-06-01");
  assert.equal(state.labelTo, "2026-06-30");
  assert.deepEqual(state.activeRequest, {
    period: "MONTH",
    month: "2026-06",
  });
  assert.equal(
    nutritionExplorerModeHref(state, "PHASE"),
    "/progress/nutrition?period=PHASE&date=2026-06-28&from=2026-06-01&to=2026-06-30",
  );
});

test("nutrition explorer defaults phase ranges to the selected local month", () => {
  const state = resolveNutritionExplorerState(
    {period: "PHASE", date: "2026-02-14"},
    "2026-02-14",
    "fa-IR",
  );

  assert.equal(state.from, "2026-02-01");
  assert.equal(state.to, "2026-02-28");
  assert.deepEqual(state.activeRequest, {
    period: "PHASE",
    from: "2026-02-01",
    to: "2026-02-28",
  });
});

test("nutrition explorer clamps invalid phase edits without discarding the selected date", () => {
  const state = resolveNutritionExplorerState(
    {
      period: "PHASE",
      date: "2026-06-28",
      from: "2026-07-10",
      to: "2026-06-16",
    },
    "2026-06-28",
    "fa-IR",
  );

  assert.equal(state.from, "2026-07-10");
  assert.equal(state.to, "2026-07-10");
  assert.deepEqual(state.activeRequest, {
    period: "PHASE",
    from: "2026-07-10",
    to: "2026-07-10",
  });
  assert.equal(
    nutritionExplorerHref({
      period: "PHASE",
      date: "2026-06-28",
      month: "2026-06",
      from: "2026-07-10",
      to: "2026-06-16",
    }),
    "/progress/nutrition?period=PHASE&date=2026-06-28&from=2026-07-10&to=2026-07-10",
  );
});

test("nutrition explorer preserves a valid phase edit range", () => {
  const href = nutritionExplorerHref({
    period: "PHASE",
    date: "2026-06-28",
    month: "2026-06",
    from: "2026-06-10",
    to: "2026-06-16",
  });

  assert.equal(
    href,
    "/progress/nutrition?period=PHASE&date=2026-06-28&from=2026-06-10&to=2026-06-16",
  );
});

test("nutrition explorer builds comparison ranges for previous periods", () => {
  const week = resolveNutritionExplorerState(
    {period: "WEEK", date: "2026-06-28"},
    "2026-06-28",
    "fa-IR",
  );
  const month = resolveNutritionExplorerState(
    {period: "MONTH", date: "2026-06-28", month: "2026-06"},
    "2026-06-28",
    "fa-IR",
  );
  const phase = resolveNutritionExplorerState(
    {period: "PHASE", date: "2026-06-28", from: "2026-06-10", to: "2026-06-16"},
    "2026-06-28",
    "fa-IR",
  );

  assert.deepEqual(comparisonRangesForNutritionExplorer(week)[1], {
    requestId: "previous",
    period: "WEEK",
    anchor: "2026-06-21",
  });
  assert.deepEqual(comparisonRangesForNutritionExplorer(month)[1], {
    requestId: "previous",
    period: "MONTH",
    month: "2026-05",
  });
  assert.deepEqual(comparisonRangesForNutritionExplorer(phase)[1], {
    requestId: "previous",
    period: "PHASE",
    from: "2026-06-03",
    to: "2026-06-09",
  });
});

test("nutrition explorer explains the previous phase as the adjacent same-length range", () => {
  const phase = resolveNutritionExplorerState(
    {period: "PHASE", date: "2026-06-28", from: "2026-06-10", to: "2026-06-16"},
    "2026-06-28",
    "fa-IR",
  );

  const copy = nutritionComparisonCopy(phase);

  assert.equal(copy.title, "مقایسه با فاز قبلی");
  assert.equal(copy.currentRangeLabel, "2026-06-10 تا 2026-06-16");
  assert.equal(copy.previousRangeLabel, "2026-06-03 تا 2026-06-09");
  assert.equal(
    copy.explanation,
    "فاز قبلی یک بازه هم‌اندازه است که درست یک روز قبل از شروع فاز فعلی تمام می‌شود.",
  );
});

test("nutrition explorer chart labels long month ranges with denser Persian dates", () => {
  const progress = nutritionProgress({
    period: "MONTH",
    points: Array.from({length: 30}, (_, index) =>
      point(`2026-06-${String(index + 1).padStart(2, "0")}`, false, 0),
    ),
  });

  const labels = buildNutritionChartPoints(progress).map((item) => item.label);

	assert.equal(labels[0], "۱۱ خرداد");
	assert.equal(labels[1], "");
	assert.equal(labels[4], "۱۵ خرداد");
	assert.equal(labels[5], "");
	assert.equal(labels[8], "۱۹ خرداد");
	assert.equal(labels[29], "۹ تیر");
});

test("nutrition explorer distinguishes missing days from logged zero days", () => {
  const progress = nutritionProgress({
    period: "WEEK",
    points: [
      point("2026-06-27", true, 0),
      point("2026-06-28", true, 450),
      point("2026-06-29", false, 0),
    ],
  });

  const coverage = nutritionCoverageState(progress);

  assert.equal(coverage.hasLoggedDays, true);
  assert.equal(coverage.hasMissingDays, true);
  assert.equal(coverage.hasPartialLogging, true);
  assert.equal(coverage.hasLoggedZeroDay, true);
});

test("nutrition explorer builds micronutrient and adherence rows from backend data", () => {
  const progress = nutritionProgress({
    period: "WEEK",
    points: [
      {
        ...point("2026-06-27", true, 100),
        goal: {
          configured: true,
          targets: {
            calories: 2000,
            protein: 120,
            carbs: 220,
            fat: 60,
            fiber: 25,
          },
          adherence: {
            caloriesDelta: -1900,
            proteinDelta: -110,
            carbsDelta: -210,
            fatDelta: -55,
            fiberDelta: -20,
          },
        },
      },
    ],
  });

  const micronutrients = micronutrientRows(progress);
  const adherence = nutritionGoalAdherenceRows(progress.points);

  assert.deepEqual(
    micronutrients.map((row) => row.key),
    ["fiber", "sugar", "sodium"],
  );
  assert.equal(micronutrients[0].total, 6);
  assert.equal(adherence.find((row) => row.key === "caloriesDelta")?.averageDelta, -1900);
});

function nutritionProgress({
  period,
  points,
}: {
  period: "WEEK" | "MONTH" | "PHASE";
  points: NutritionProgressResponseDto["points"];
}): NutritionProgressResponseDto {
  const loggedPoints = points.filter((item) => item.logged);
  const totals = points.reduce(
    (summary, item) => ({
      calories: summary.calories + item.totals.calories,
      protein: summary.protein + item.totals.protein,
      carbs: summary.carbs + item.totals.carbs,
      fat: summary.fat + item.totals.fat,
      fiber: summary.fiber + item.totals.fiber,
      sugar: summary.sugar + item.totals.sugar,
      sodium: summary.sodium + item.totals.sodium,
    }),
    totalsZero(),
  );

  return {
    period,
    timezone: "Asia/Tehran",
    from: points[0]?.date ?? "2026-06-01",
    to: points.at(-1)?.date ?? "2026-06-01",
    points,
    summary: {
      totals,
      averagePerDay: divideTotals(totals, points.length || 1),
      averagePerLoggedDay: loggedPoints.length ? divideTotals(totals, loggedPoints.length) : null,
      minDailyTotals: null,
      maxDailyTotals: null,
      loggedDayCount: loggedPoints.length,
      missingDayCount: points.length - loggedPoints.length,
    },
  };
}

function point(date: string, logged: boolean, calories: number) {
  return {
    date,
    logged,
    totals: {
      calories,
      protein: logged ? 10 : 0,
      carbs: logged ? 20 : 0,
      fat: logged ? 5 : 0,
      fiber: logged ? 6 : 0,
      sugar: logged ? 7 : 0,
      sodium: logged ? 300 : 0,
    },
    goal: null,
  };
}

function totalsZero() {
  return {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  };
}

function divideTotals(totals: ProgressTotals, divisor: number) {
  return {
    calories: totals.calories / divisor,
    protein: totals.protein / divisor,
    carbs: totals.carbs / divisor,
    fat: totals.fat / divisor,
    fiber: totals.fiber / divisor,
    sugar: totals.sugar / divisor,
    sodium: totals.sodium / divisor,
  };
}

type ProgressTotals = ReturnType<typeof totalsZero>;
