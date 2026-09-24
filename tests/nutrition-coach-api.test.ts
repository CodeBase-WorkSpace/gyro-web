import assert from "node:assert/strict";
import test from "node:test";

import {
  getNutritionCoachState,
  parseNutritionCoachState,
  recordNutritionCoachImpression,
} from "../lib/api/nutrition-coach";

process.env.API_BASE_URL ??= "http://localhost:8080/api/v1";

const coachState = {
  mode: "FULL",
  state: "COLLECTING_DATA",
  asOf: "2026-07-23T08:00:00Z",
  collecting: {
    weighIns: 5,
    weighInsRequired: 3,
    spanDays: 10,
    spanDaysRequired: 7,
    coveragePercent: 60,
    coverageRequired: 50,
    foodEvidenceDays: 4,
    foodEvidenceDaysRequired: 4,
    weighInDays: 2,
    weighInDaysRequired: 3,
    weightSpanDays: 5,
    weightSpanDaysRequired: 7,
    weighedInToday: false,
    readinessReason: "INSUFFICIENT_FOOD_AND_WEIGHT_EVIDENCE",
    nextUsefulAction: "LOG_WEIGHT_TODAY",
  },
  recommendation: null,
  waiting: null,
  insights: [
    {
      impressionId: "PROTEIN_CONSISTENCY",
      kind: "PROTEIN_CONSISTENCY",
      value: 80,
      trend: "UP",
      basis: "LOGGED_DAYS",
      loggedDayCount: 5,
      periodStart: "2026-07-18",
      periodEnd: "2026-07-22",
    },
    { kind: "UNRECOGNIZED", value: 10, capped: true },
  ],
};

const measuredTdeeInsight = {
  kind: "MEASURED_TDEE",
  impressionId: "OBS|MT|V1|2026-08-01|MEDIUM|B2300",
  value: 2340,
  basis: "OBSERVED_ENERGY",
  confidence: "MEDIUM",
  estimatorVersion: "OLS_7700_V1",
  displayPolicyVersion: "V1",
  windowDays: 14,
  loggedDayCount: 10,
  weighInDayCount: 5,
  weightSpanDays: 12,
  periodStart: "2026-07-19",
  periodEnd: "2026-08-01",
};

const weekendGapInsight = {
  kind: "WEEKEND_GAP",
  impressionId: "OBS|WG|V1|2026-08-01|HIGHER|MODERATE",
  value: 14,
  basis: "TARGET_COMPARISON",
  weekendTargetDeltaPercent: 8.25,
  weekdayTargetDeltaPercent: -5.6,
  weekendLoggedDayCount: 3,
  weekdayLoggedDayCount: 8,
  loggedDayCount: 11,
  windowDays: 14,
  periodStart: "2026-07-19",
  periodEnd: "2026-08-01",
};

test("nutrition coach reads the authenticated state endpoint", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let authorization = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    authorization = new Headers(init?.headers).get("Authorization") ?? "";
    return new Response(JSON.stringify(coachState), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }) as Response;
  };

  try {
    const state = await getNutritionCoachState("access-token");
    assert.equal(requestedUrl, "http://localhost:8080/api/v1/goals/coach/state");
    assert.equal(authorization, "Bearer access-token");
    assert.equal(state?.state, "COLLECTING_DATA");
  } finally {
    global.fetch = originalFetch;
  }
});

test("nutrition coach records one visible impression through the authenticated endpoint", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let method = "";
  let body = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    method = init?.method ?? "";
    body = String(init?.body ?? "");
    return new Response(null, { status: 204 }) as Response;
  };

  try {
    await recordNutritionCoachImpression(
      "access-token",
      "CALORIE_ADHERENCE",
    );
    assert.equal(
      requestedUrl,
      "http://localhost:8080/api/v1/goals/coach/impressions",
    );
    assert.equal(method, "POST");
    assert.deepEqual(JSON.parse(body), {
      impressionId: "CALORIE_ADHERENCE",
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test("malformed coach payloads are hidden while unknown insight kinds are dropped", () => {
  assert.equal(parseNutritionCoachState({ ...coachState, asOf: "not-a-date" }), null);
  assert.equal(parseNutritionCoachState({ ...coachState, insights: null }), null);
  assert.equal(
    parseNutritionCoachState({ ...coachState, state: "RECOMMENDATION" }),
    null,
  );
  assert.equal(
    parseNutritionCoachState({ ...coachState, state: "WAITING" }),
    null,
  );
  assert.equal(
    parseNutritionCoachState({ ...coachState, collecting: null }),
    null,
  );

  const parsed = parseNutritionCoachState(coachState);
  assert.equal(parsed?.insights.length, 1);
  assert.equal(parsed?.insights[0]?.kind, "PROTEIN_CONSISTENCY");
  assert.equal(parsed?.insights[0]?.kind === "PROTEIN_CONSISTENCY" && parsed.insights[0].basis, "LOGGED_DAYS");
  assert.equal(parsed?.insights[0]?.impressionId, "PROTEIN_CONSISTENCY");
  assert.equal(
    parseNutritionCoachState({ ...coachState, measuredTdee: "2340" }),
    null,
  );
  assert.equal(
    parseNutritionCoachState({
      ...coachState,
      state: "ON_TRACK",
      measuredTdee: 2340,
    })?.measuredTdee,
    2340,
  );
  assert.equal(
    parseNutritionCoachState({
      ...coachState,
      collecting: {
        ...coachState.collecting,
        nextUsefulAction: undefined,
      },
    }),
    null,
  );
});

test("measured TDEE parser accepts the complete structured observation", () => {
  const parsed = parseNutritionCoachState({
    ...coachState,
    insights: [measuredTdeeInsight],
  });

  assert.deepEqual(parsed?.insights, [measuredTdeeInsight]);
});

test("measured TDEE parser rejects incomplete or inconsistent observations", () => {
  const invalid = [
    { ...measuredTdeeInsight, basis: undefined },
    { ...measuredTdeeInsight, confidence: "UNKNOWN" },
    { ...measuredTdeeInsight, estimatorVersion: "OLS_7700_V2" },
    { ...measuredTdeeInsight, value: 0 },
    { ...measuredTdeeInsight, loggedDayCount: -1 },
    { ...measuredTdeeInsight, windowDays: 21 },
    { ...measuredTdeeInsight, periodEnd: "2026-08-02" },
  ];

  for (const insight of invalid) {
    const parsed = parseNutritionCoachState({
      ...coachState,
      insights: [insight],
    });
    assert.deepEqual(parsed?.insights, [], JSON.stringify(insight));
  }
});

test("measured TDEE parser preserves opaque backend impression IDs", () => {
  const opaqueImpressionId = "server-issued-measured-tdee-v2";
  const parsed = parseNutritionCoachState({
    ...coachState,
    insights: [{ ...measuredTdeeInsight, impressionId: opaqueImpressionId }],
  });

  assert.equal(parsed?.insights[0]?.impressionId, opaqueImpressionId);
});

const trendExplanationInsight = {
  kind: "TREND_EXPLANATION",
  impressionId: "OBS|TX|V1|2026-08-01|W_MEDIUM|I_15_25",
  value: -18,
  basis: "TARGET_COMPARISON",
  deltaPercent: -18.2,
  weightTrendKgPerWeek: 0.55,
  averageIntakeCalories: 1720,
  averageTargetCalories: 2100,
  loggedDayCount: 12,
  weighInDayCount: 5,
  weightSpanDays: 12,
  windowDays: 14,
  confidence: "MEDIUM",
  periodStart: "2026-07-19",
  periodEnd: "2026-08-01",
};

test("trend explanation parser accepts the complete structured observation", () => {
  const parsed = parseNutritionCoachState({
    ...coachState,
    insights: [trendExplanationInsight],
  });

  assert.deepEqual(parsed?.insights, [trendExplanationInsight]);
  assert.equal(parsed?.insights[0] && "trend" in parsed.insights[0], false);
});

test("trend explanation parser rejects missing or contradictory fields", () => {
  const invalid = [
    // The generic UP label must never ride along; the frontend reads it as improvement.
    { ...trendExplanationInsight, trend: "UP" },
    { ...trendExplanationInsight, basis: "OBSERVED_ENERGY" },
    // Intake delta not below target.
    { ...trendExplanationInsight, deltaPercent: 4.5, value: 5 },
    { ...trendExplanationInsight, value: 0, deltaPercent: -18.2 },
    // Display value disagrees with the authoritative delta after rounding.
    { ...trendExplanationInsight, value: -22 },
    // Weight trend outside the [0.20, 1.50] contract.
    { ...trendExplanationInsight, weightTrendKgPerWeek: 0.19 },
    { ...trendExplanationInsight, weightTrendKgPerWeek: 1.51 },
    { ...trendExplanationInsight, weightTrendKgPerWeek: -0.55 },
    { ...trendExplanationInsight, weightTrendKgPerWeek: "0.55" },
    // Averages inconsistent with a below-target gap.
    { ...trendExplanationInsight, averageIntakeCalories: 2100, averageTargetCalories: 2100 },
    { ...trendExplanationInsight, averageTargetCalories: 0 },
    // Negative or missing counts.
    { ...trendExplanationInsight, loggedDayCount: 2 },
    { ...trendExplanationInsight, weighInDayCount: 2 },
    { ...trendExplanationInsight, weightSpanDays: 6 },
    { ...trendExplanationInsight, confidence: "UNKNOWN" },
    // Window length disagrees with the reported period span.
    { ...trendExplanationInsight, windowDays: 21 },
    { ...trendExplanationInsight, periodEnd: "2026-08-02" },
    { ...trendExplanationInsight, periodStart: "2026-08-02" },
  ];

  for (const insight of invalid) {
    const parsed = parseNutritionCoachState({
      ...coachState,
      insights: [insight],
    });
    assert.deepEqual(parsed?.insights, [], JSON.stringify(insight));
  }
});

test("trend explanation parser accepts boundary trend and gap values with opaque IDs", () => {
  const opaqueImpressionId = "server-issued-trend-explanation";
  const parsed = parseNutritionCoachState({
    ...coachState,
    insights: [{
      ...trendExplanationInsight,
      impressionId: opaqueImpressionId,
      weightTrendKgPerWeek: 0.2,
      deltaPercent: -40,
      value: -40,
      averageIntakeCalories: 1260,
      averageTargetCalories: 2100,
    }],
  });

  assert.equal(parsed?.insights[0]?.impressionId, opaqueImpressionId);
  assert.equal(parsed?.insights[0]?.value, -40);
  assert.equal(
    parsed?.insights[0]?.kind === "TREND_EXPLANATION"
      ? parsed.insights[0].weightTrendKgPerWeek
      : undefined,
    0.2,
  );
});

test("weekend gap parser accepts the complete structured observation", () => {
  const parsed = parseNutritionCoachState({
    ...coachState,
    insights: [weekendGapInsight],
  });

  assert.deepEqual(parsed?.insights, [weekendGapInsight]);
  assert.equal(parsed?.insights[0] && "trend" in parsed.insights[0], false);
});

test("weekend gap parser rejects missing or inconsistent group fields", () => {
  const invalid = [
    { ...weekendGapInsight, basis: "LOGGED_DAYS" },
    { ...weekendGapInsight, trend: "UP" },
    { ...weekendGapInsight, weekendTargetDeltaPercent: undefined },
    { ...weekendGapInsight, weekdayTargetDeltaPercent: "-5.6" },
    { ...weekendGapInsight, weekendTargetDeltaPercent: Number.NaN },
    // Below the minimum eligible weekend coverage.
    { ...weekendGapInsight, weekendLoggedDayCount: 2, loggedDayCount: 10 },
    // Above the ten possible weekday slots.
    { ...weekendGapInsight, weekdayLoggedDayCount: 11, loggedDayCount: 14 },
    // The total no longer equals the two groups.
    { ...weekendGapInsight, loggedDayCount: 12 },
    { ...weekendGapInsight, windowDays: 21 },
    { ...weekendGapInsight, periodEnd: "2026-08-02" },
    // The signed display value contradicts the raw difference.
    { ...weekendGapInsight, value: -14 },
    { ...weekendGapInsight, value: 20 },
    // A raw difference below the materiality threshold.
    {
      ...weekendGapInsight,
      weekendTargetDeltaPercent: 4,
      weekdayTargetDeltaPercent: -5.6,
      value: 10,
    },
  ];

  for (const insight of invalid) {
    const parsed = parseNutritionCoachState({
      ...coachState,
      insights: [insight],
    });
    assert.deepEqual(parsed?.insights, [], JSON.stringify(insight));
  }
});

test("weekend gap parser accepts exactly ten percentage points and opaque IDs", () => {
  const opaqueImpressionId = "server-issued-weekend-gap-v2";
  const parsed = parseNutritionCoachState({
    ...coachState,
    insights: [{
      ...weekendGapInsight,
      impressionId: opaqueImpressionId,
      weekendTargetDeltaPercent: 10,
      weekdayTargetDeltaPercent: 0,
      value: 10,
    }],
  });

  assert.equal(parsed?.insights[0]?.impressionId, opaqueImpressionId);
  assert.equal(parsed?.insights[0]?.value, 10);
});

test("collecting parser accepts enriched readiness and legacy progress atomically", () => {
  const enriched = parseNutritionCoachState(coachState)?.collecting;
  assert.equal(enriched?.readinessReason, "INSUFFICIENT_FOOD_AND_WEIGHT_EVIDENCE");
  assert.equal(enriched?.nextUsefulAction, "LOG_WEIGHT_TODAY");
  assert.equal(enriched?.foodEvidenceDays, 4);
  assert.equal(enriched?.foodEvidenceDaysRequired, 4);
  assert.equal(enriched?.weighedInToday, false);

  for (const invalidCollecting of [
    { ...coachState.collecting, weighedInToday: undefined },
    { ...coachState.collecting, weighedInToday: true },
    {
      ...coachState.collecting,
      weighedInToday: false,
      nextUsefulAction: "WAIT_FOR_ANOTHER_WEIGHT_DAY",
    },
  ]) {
    assert.equal(
      parseNutritionCoachState({ ...coachState, collecting: invalidCollecting }),
      null,
    );
  }

  const legacy = parseNutritionCoachState({
    ...coachState,
    collecting: {
      weighIns: 2,
      weighInsRequired: 3,
      spanDays: 5,
      spanDaysRequired: 7,
      coveragePercent: 40,
      coverageRequired: 50,
    },
  });
  assert.equal(legacy?.state, "COLLECTING_DATA");
  assert.equal(legacy?.collecting?.readinessReason, undefined);
});

test("observed progress accepts omitted nullable measurements from the backend", () => {
  const parsed = parseNutritionCoachState({
    ...coachState,
    mode: "INSIGHTS_ONLY",
    state: "OBSERVED_PROGRESS",
    observedProgress: {
      status: "SUFFICIENT",
      windowDays: 14,
      windowStart: "2026-07-18",
      windowEnd: "2026-07-31",
      loggedDays: 14,
      loggedDaysRequired: 7,
      weighInDays: 4,
      weightSpanDays: 13,
      averageIntakeCalories: 3200,
      observedKgPerWeek: 0,
    },
  });

  assert.equal(parsed?.state, "OBSERVED_PROGRESS");
  assert.equal(parsed?.observedProgress?.averageIntakeCalories, 3200);
  assert.equal(parsed?.observedProgress?.estimatedTdee, null);
});

test("advanced schedule access accepts every valid backend null shape", () => {
  for (const advancedScheduleAccess of [
    { degraded: false, preserved: true },
    { degraded: false, degradedFrom: null, preserved: true },
  ]) {
    const parsed = parseNutritionCoachState({
      ...coachState,
      advancedScheduleAccess,
    });

    assert.deepEqual(parsed?.advancedScheduleAccess, {
      degraded: false,
      degradedFrom: null,
      preserved: true,
    });
  }

  assert.equal(
    parseNutritionCoachState(coachState)?.advancedScheduleAccess,
    null,
  );
  assert.equal(
    parseNutritionCoachState({
      ...coachState,
      advancedScheduleAccess: null,
    })?.advancedScheduleAccess,
    null,
  );
});

test("advanced schedule access requires a date exactly when degraded", () => {
  const degraded = parseNutritionCoachState({
    ...coachState,
    advancedScheduleAccess: {
      degraded: true,
      degradedFrom: "2026-08-01",
      preserved: true,
    },
  });
  assert.deepEqual(degraded?.advancedScheduleAccess, {
    degraded: true,
    degradedFrom: "2026-08-01",
    preserved: true,
  });

  for (const advancedScheduleAccess of [
    { degraded: true, preserved: true },
    { degraded: true, degradedFrom: null, preserved: true },
    { degraded: true, degradedFrom: "not-a-date", preserved: true },
    { degraded: false, degradedFrom: "2026-08-01", preserved: true },
  ]) {
    assert.equal(
      parseNutritionCoachState({
        ...coachState,
        advancedScheduleAccess,
      }),
      null,
    );
  }
});

test("calorie comparison parsing is kind-specific and rejects legacy score payloads", () => {
  const targetComparison = {
    impressionId: "OBS|CA|2026-07-22|DOWN|MODERATE",
    kind: "CALORIE_ADHERENCE",
    basis: "TARGET_COMPARISON",
    value: -13,
    averageIntakeCalories: 1300,
    averageTargetCalories: 1500,
    deltaPercent: -13.333333,
    loggedDayCount: 4,
    periodStart: "2026-07-18",
    periodEnd: "2026-07-22",
  };

  const parsed = parseNutritionCoachState({
    ...coachState,
    insights: [targetComparison],
  });
  assert.deepEqual(parsed?.insights, [targetComparison]);

  const opaqueIdentity = { ...targetComparison, impressionId: "future:id/v2" };
  assert.deepEqual(
    parseNutritionCoachState({ ...coachState, insights: [opaqueIdentity] })?.insights,
    [opaqueIdentity],
  );
  for (const impressionId of ["", "x".repeat(81)]) {
    assert.deepEqual(
      parseNutritionCoachState({
        ...coachState,
        insights: [{ ...targetComparison, impressionId }],
      })?.insights,
      [],
    );
  }

  for (const legacy of [
    { impressionId: "CALORIE_ADHERENCE", kind: "CALORIE_ADHERENCE", value: 81 },
    {
      impressionId: "CALORIE_ADHERENCE",
      kind: "CALORIE_ADHERENCE",
      value: 81,
      basis: "LOGGED_DAYS",
    },
    { ...targetComparison, averageTargetCalories: undefined },
  ]) {
    assert.deepEqual(
      parseNutritionCoachState({ ...coachState, insights: [legacy] })?.insights,
      [],
    );
  }

  const defaultInsight = parseNutritionCoachState(coachState)?.insights[0];
  assert.equal(
    defaultInsight?.kind === "PROTEIN_CONSISTENCY" ? defaultInsight.basis : undefined,
    "LOGGED_DAYS",
  );
});
