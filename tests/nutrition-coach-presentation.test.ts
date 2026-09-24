import assert from "node:assert/strict";
import test from "node:test";

import type {
  NutritionCoachInsight,
  NutritionCoachState,
  NutritionCoachStateName,
} from "../lib/api/nutrition-coach";
import {
  coachTips,
  coachTipForDay,
  formatCoachDateTime,
  getNutritionCoachPresentation,
  recognizedInsights,
} from "../lib/nutrition-coach/presentation";

const states: NutritionCoachStateName[] = [
  "RECOMMENDATION",
  "RECOMMENDATION_LOCKED",
  "RECOMMENDATION_PREPARING",
  "WAITING",
  "LEARNING",
  "COLLECTING_DATA",
  "NEEDS_ATTENTION",
  "ON_TRACK",
  "NO_CHANGE_RECOMMENDED",
  "OBSERVED_PROGRESS",
  "INSIGHTS",
];

function coach(state: NutritionCoachStateName, mode: NutritionCoachState["mode"] = "FULL"): NutritionCoachState {
  return {
    mode,
    state,
    asOf: "2026-07-23T08:00:00Z",
    collecting: {
      weighIns: 2,
      weighInsRequired: 3,
      spanDays: 5,
      spanDaysRequired: 7,
      coveragePercent: 40,
      coverageRequired: 50,
    },
    waiting: { appliedAt: "2026-07-21T08:00:00Z", nextEvaluationAt: "2026-08-04T08:00:00Z" },
    analysisScope: "ROLLING",
    observedProgress: {
      status: "SUFFICIENT",
      windowDays: 14,
      windowStart: "2026-07-09",
      windowEnd: "2026-07-22",
      loggedDays: 10,
      loggedDaysRequired: 9,
      weighInDays: 4,
      weightSpanDays: 10,
      averageIntakeCalories: 2100,
      observedKgPerWeek: -0.1,
      estimatedTdee: null,
    },
    recommendation: {
      id: "suggestion-1",
      status: "PENDING",
      suggested: { calories: 1600, protein: 120, carbs: 180, fat: 50 },
      previous: { calories: 1800, protein: 130, carbs: 200, fat: 60 },
      basis: {},
      createdAt: "2026-07-22T08:00:00Z",
      expiresAt: "2026-08-04T08:00:00Z",
    },
    insights: [
      {
        impressionId: "PROTEIN_CONSISTENCY",
        kind: "PROTEIN_CONSISTENCY",
        value: 80,
        trend: "UP",
        basis: "LOGGED_DAYS",
        loggedDayCount: 5,
        periodStart: "2026-07-16",
        periodEnd: "2026-07-22",
      },
      { impressionId: "LOGGING_STREAK", kind: "LOGGING_STREAK", value: 7, capped: false },
    ],
  };
}

test("every coach state has a deliberate tone and presentation for both modes", () => {
  for (const mode of ["FULL", "INSIGHTS_ONLY"] as const) {
    for (const state of states) {
      const presentation = getNutritionCoachPresentation(coach(state, mode));
      assert.ok(presentation, `${mode} ${state} should render`);
      assert.ok(["primary", "muted"].includes(presentation.tone));
    }
  }
});

test("observational progress is factual and does not judge the new goal", () => {
  const presentation = getNutritionCoachPresentation(
    coach("OBSERVED_PROGRESS", "INSIGHTS_ONLY"),
  );

  assert.equal(presentation?.title, "روند ثبت‌های اخیرت");
  assert.match(presentation?.description ?? "", /قضاوت نمی‌کند/);
  assert.doesNotMatch(presentation?.description ?? "", /با هدفت هماهنگ/);
  assert.deepEqual(presentation?.actions, []);
});

test("recommendation variants keep billing and recalibration claims safely scoped", () => {
  assert.deepEqual(getNutritionCoachPresentation(coach("RECOMMENDATION"))?.actions, ["recalibration"]);
  const locked = getNutritionCoachPresentation(coach("RECOMMENDATION_LOCKED"));
  assert.equal(locked?.title, "تحلیل هدف شما آماده است");
  assert.deepEqual(locked?.actions, ["billing"]);
  assert.equal(locked?.insights.length, 2);

  const manual = getNutritionCoachPresentation(coach("RECOMMENDATION", "INSIGHTS_ONLY"));
  const insights = getNutritionCoachPresentation(coach("INSIGHTS", "INSIGHTS_ONLY"));
  assert.deepEqual(manual, insights);
  assert.equal(manual?.tone, "muted");
  assert.deepEqual(manual?.actions, []);

  const manualLocked = getNutritionCoachPresentation(
    coach("RECOMMENDATION_LOCKED", "INSIGHTS_ONLY"),
  );
  assert.deepEqual(manualLocked, insights);
});

test("only states asking for a decision take the first mobile slot", () => {
  // Drives carousel order on small screens, where one card is visible at a time.
  const priority: NutritionCoachStateName[] = [
    "RECOMMENDATION",
    "RECOMMENDATION_LOCKED",
    "RECOMMENDATION_PREPARING",
    "NEEDS_ATTENTION",
  ];

  for (const state of states) {
    const presentation = getNutritionCoachPresentation(coach(state));
    assert.equal(
      presentation?.priority,
      priority.includes(state),
      `${state} priority`,
    );
  }

  // On a manual plan the recommendation states collapse to a report, so they stop
  // asking for anything and lose the slot. NEEDS_ATTENTION deliberately does not:
  // "log something today" is just as true without an automatic plan.
  for (const state of ["RECOMMENDATION", "RECOMMENDATION_LOCKED", "RECOMMENDATION_PREPARING"] as const) {
    assert.equal(
      getNutritionCoachPresentation(coach(state, "INSIGHTS_ONLY"))?.priority,
      false,
      `${state} INSIGHTS_ONLY priority`,
    );
  }
  assert.equal(
    getNutritionCoachPresentation(coach("NEEDS_ATTENTION", "INSIGHTS_ONLY"))?.priority,
    true,
  );
});

test("entitled preparing state outranks the free teaser without promising numbers", () => {
  const preparing = getNutritionCoachPresentation(coach("RECOMMENDATION_PREPARING"));
  const neutral = getNutritionCoachPresentation(coach("INSIGHTS"));

  // The regression this guards: an entitled, suggestion-worthy user used to fall
  // through to INSIGHTS and receive vaguer copy than a free user in the same state.
  assert.notDeepEqual(preparing, neutral);
  assert.equal(preparing?.tone, "primary");
  // No billing CTA (they already pay) and no action to take while the producer runs.
  assert.deepEqual(preparing?.actions, []);
  // Nothing is computed yet, so the copy must not contain a target number.
  assert.equal(/\d|[۰-۹]/u.test(preparing?.description ?? ""), false);

  const manual = getNutritionCoachPresentation(
    coach("RECOMMENDATION_PREPARING", "INSIGHTS_ONLY"),
  );
  assert.deepEqual(manual, getNutritionCoachPresentation(coach("INSIGHTS", "INSIGHTS_ONLY")));
});

test("empty or malformed state has no coach shell", () => {
  assert.equal(getNutritionCoachPresentation({ ...coach("INSIGHTS"), mode: null }), null);
  assert.equal(getNutritionCoachPresentation({ ...coach("INSIGHTS"), state: null }), null);
  assert.equal(getNutritionCoachPresentation({ ...coach("RECOMMENDATION"), recommendation: null }), null);
  assert.equal(getNutritionCoachPresentation({ ...coach("WAITING"), waiting: null }), null);
  assert.equal(getNutritionCoachPresentation({ ...coach("COLLECTING_DATA"), collecting: null }), null);
});

test("on-track does not duplicate the compatibility TDEE field", () => {
  const onTrack = getNutritionCoachPresentation({
    ...coach("ON_TRACK"),
    measuredTdee: 2340,
  });
  assert.doesNotMatch(onTrack?.description ?? "", /۲٬۳۴۰|متابولیسم/u);
  assert.match(onTrack?.description ?? "", /به تغییر نیاز ندارد/u);

  const withheld = getNutritionCoachPresentation(
    coach("NO_CHANGE_RECOMMENDED"),
  );
  assert.doesNotMatch(withheld?.description ?? "", /درست تنظیم شده/u);
  assert.equal(withheld?.priority, false);
});

test("collecting actions match the missing weight and food gates", () => {
  const both = getNutritionCoachPresentation(
    coach("COLLECTING_DATA"),
  );
  assert.deepEqual(both?.actions, ["weight", "food"]);

  const weightOnly = getNutritionCoachPresentation({
    ...coach("COLLECTING_DATA"),
    collecting: {
      weighIns: 2,
      weighInsRequired: 3,
      spanDays: 10,
      spanDaysRequired: 7,
      coveragePercent: 60,
      coverageRequired: 50,
    },
  });
  assert.deepEqual(weightOnly?.actions, ["weight"]);

  const foodOnly = getNutritionCoachPresentation({
    ...coach("COLLECTING_DATA"),
    collecting: {
      weighIns: 5,
      weighInsRequired: 3,
      spanDays: 10,
      spanDaysRequired: 7,
      coveragePercent: 40,
      coverageRequired: 50,
    },
  });
  assert.deepEqual(foodOnly?.actions, ["food"]);

  const complete = getNutritionCoachPresentation({
    ...coach("COLLECTING_DATA"),
    collecting: {
      weighIns: 5,
      weighInsRequired: 3,
      spanDays: 10,
      spanDaysRequired: 7,
      coveragePercent: 60,
      coverageRequired: 50,
    },
  });
  assert.deepEqual(complete?.actions, []);
});

test("enriched collecting guidance names the binding evidence and one next action", () => {
  const base = coach("COLLECTING_DATA");
  const collecting = {
    weighIns: 2,
    weighInsRequired: 3,
    spanDays: 5,
    spanDaysRequired: 7,
    coveragePercent: 42,
    coverageRequired: 50,
    foodEvidenceDays: 3,
    foodEvidenceDaysRequired: 4,
    weighInDays: 2,
    weighInDaysRequired: 3,
    weightSpanDays: 5,
    weightSpanDaysRequired: 7,
    weighedInToday: false,
  };

  const food = getNutritionCoachPresentation({
    ...base,
    collecting: {
      ...collecting,
      readinessReason: "INSUFFICIENT_FOOD_EVIDENCE",
      nextUsefulAction: "LOG_FOOD",
    },
  });
  assert.deepEqual(food?.actions, ["food"]);
  assert.match(food?.description ?? "", /۳ روز ثبت غذا/u);
  assert.match(food?.description ?? "", /به ۴ روز نیاز داریم/u);
  assert.match(food?.description ?? "", /ثبت غذای امروز/u);

  const weight = getNutritionCoachPresentation({
    ...base,
    collecting: {
      ...collecting,
      readinessReason: "INSUFFICIENT_WEIGH_IN_DAYS",
      nextUsefulAction: "LOG_WEIGHT_TODAY",
    },
  });
  assert.deepEqual(weight?.actions, ["weight"]);
  assert.match(weight?.description ?? "", /وزن ۲ روز/u);
  assert.match(weight?.description ?? "", /یک وزن‌کشی امروز/u);

  const waitForAnotherDay = getNutritionCoachPresentation({
    ...base,
    collecting: {
      ...collecting,
      weighedInToday: true,
      readinessReason: "INSUFFICIENT_WEIGH_IN_DAYS",
      nextUsefulAction: "WAIT_FOR_ANOTHER_WEIGHT_DAY",
    },
  });
  assert.deepEqual(waitForAnotherDay?.actions, []);
  assert.match(waitForAnotherDay?.description ?? "", /امروزت ثبت شده/u);
  assert.match(waitForAnotherDay?.description ?? "", /روزهای آینده/u);
  assert.doesNotMatch(waitForAnotherDay?.description ?? "", /وزن‌کشی امروز کمک/u);

  const span = getNutritionCoachPresentation({
    ...base,
    collecting: {
      ...collecting,
      weighedInToday: true,
      readinessReason: "INSUFFICIENT_WEIGHT_SPAN",
      nextUsefulAction: "EXTEND_WEIGHT_SPAN",
    },
  });
  assert.deepEqual(span?.actions, []);
  assert.match(span?.description ?? "", /۵ روز را پوشش می‌دهد/u);
  assert.match(span?.description ?? "", /بازه ۷ روزه/u);
  assert.doesNotMatch(span?.description ?? "", /وزن‌کشی امروز کمک/u);

  const combined = getNutritionCoachPresentation({
    ...base,
    collecting: {
      ...collecting,
      readinessReason: "INSUFFICIENT_FOOD_AND_WEIGHT_EVIDENCE",
      nextUsefulAction: "LOG_FOOD",
    },
  });
  assert.deepEqual(combined?.actions, ["food"]);
  assert.match(combined?.title ?? "", /ثبت غذا و وزن/u);

  for (const presentation of [food, weight, waitForAnotherDay, span, combined]) {
    const copy = `${presentation?.title ?? ""} ${presentation?.description ?? ""}`;
    assert.doesNotMatch(copy, /عدم پایبندی|پایبند|رعایت نکرد/u);
  }
});

test("the ranked observation list stays capped at two", () => {
  const insights = recognizedInsights([
    {
      impressionId: "CALORIE_ADHERENCE",
      kind: "CALORIE_ADHERENCE",
      basis: "TARGET_COMPARISON",
      value: -9,
      averageIntakeCalories: 1820,
      averageTargetCalories: 2000,
      deltaPercent: -9,
      loggedDayCount: 4,
      periodStart: "2026-07-18",
      periodEnd: "2026-07-22",
    },
    {
      impressionId: "PROTEIN_CONSISTENCY",
      kind: "PROTEIN_CONSISTENCY",
      value: 81,
      basis: "LOGGED_DAYS",
      loggedDayCount: 5,
      periodStart: "2026-07-16",
      periodEnd: "2026-07-22",
    },
    { impressionId: "LOGGING_STREAK", kind: "LOGGING_STREAK", value: 8, capped: false },
  ]);

  assert.deepEqual(insights.map((insight) => insight.kind), ["CALORIE_ADHERENCE", "PROTEIN_CONSISTENCY"]);
});

test("weekend gap joins the same ranked list mobile and desktop both render", () => {
  const weekendGap: NutritionCoachInsight = {
    impressionId: "OBS|WG|V1|2026-08-01|HIGHER|MODERATE",
    kind: "WEEKEND_GAP",
    basis: "TARGET_COMPARISON",
    value: 14,
    weekendTargetDeltaPercent: 8.25,
    weekdayTargetDeltaPercent: -5.6,
    weekendLoggedDayCount: 3,
    weekdayLoggedDayCount: 8,
    loggedDayCount: 11,
    windowDays: 14,
    periodStart: "2026-07-19",
    periodEnd: "2026-08-01",
  };
  const ranked = [
    weekendGap,
    {
      impressionId: "PROTEIN_CONSISTENCY",
      kind: "PROTEIN_CONSISTENCY",
      value: 81,
      basis: "LOGGED_DAYS",
      loggedDayCount: 5,
      periodStart: "2026-07-26",
      periodEnd: "2026-08-01",
    } as NutritionCoachInsight,
    { impressionId: "LOGGING_STREAK", kind: "LOGGING_STREAK", value: 8, capped: false } as NutritionCoachInsight,
  ];

  // One list feeds both viewports; responsive hiding needs product approval.
  assert.deepEqual(
    recognizedInsights(ranked).map((insight) => insight.kind),
    ["WEEKEND_GAP", "PROTEIN_CONSISTENCY"],
  );
  const first = recognizedInsights(ranked)[0];
  assert.equal(first && "trend" in first, false);
});

test("coach dates and rotating tips use Persian formatting and the supplied timezone", () => {
  const formatted = formatCoachDateTime("2026-07-23T08:00:00Z", "Asia/Tehran");
  assert.match(formatted, /[۰-۹]/);
  assert.equal(coachTipForDay("2026-07-23T08:00:00Z", "Asia/Tehran"), coachTipForDay("2026-07-23T18:00:00Z", "Asia/Tehran"));
  assert.equal(coachTips.length, 40);
});
