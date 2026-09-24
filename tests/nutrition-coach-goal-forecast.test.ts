import assert from "node:assert/strict";
import test from "node:test";

import {
  parseNutritionCoachState,
  type GoalForecast,
  type NutritionCoachInsight,
} from "../lib/api/nutrition-coach";
import {
  formatPersianForecastDate,
  goalForecastCopy,
} from "../lib/nutrition-coach/evidence-copy";

const IMPRESSION_ID = "OBS|GF|V1|2026-10-05|2027-01-01|2027-02-14|AV|LATE_31_60|P50_75";

function availableForecast(overrides: Partial<GoalForecast> = {}): GoalForecast {
  return {
    status: "AVAILABLE",
    originalTargetDate: "2027-01-01",
    forecastTargetDate: "2027-02-14",
    delayDays: 44,
    startWeightKg: 90,
    targetWeightKg: 80,
    fittedWeightKg: 85.831,
    observedKgPerWeek: -0.49,
    progressPercent: 41.69,
    evidenceStart: "2026-09-07",
    evidenceEnd: "2026-10-05",
    weighInDayCount: 29,
    weightSpanDays: 28,
    milestones: [
      {
        progressPercent: 25,
        targetWeightKg: 87.5,
        plannedDate: "2026-10-01",
        forecastDate: null,
        state: "REACHED",
      },
      {
        progressPercent: 50,
        targetWeightKg: 85,
        plannedDate: "2026-11-01",
        forecastDate: "2026-10-18",
        state: "NEXT",
      },
      {
        progressPercent: 75,
        targetWeightKg: 82.5,
        plannedDate: "2026-12-01",
        forecastDate: "2026-12-16",
        state: "UPCOMING",
      },
      {
        progressPercent: 100,
        targetWeightKg: 80,
        plannedDate: "2027-01-01",
        forecastDate: "2027-02-14",
        state: "UPCOMING",
      },
    ],
    ...overrides,
  };
}

function unavailableForecast(
  status: GoalForecast["status"] = "INSUFFICIENT_EVIDENCE",
): GoalForecast {
  const available = availableForecast();
  return {
    ...available,
    status,
    forecastTargetDate: null,
    delayDays: null,
    fittedWeightKg: null,
    observedKgPerWeek: null,
    evidenceStart: null,
    evidenceEnd: null,
    weighInDayCount: 0,
    weightSpanDays: 0,
    progressPercent: 0,
    milestones: available.milestones.map((milestone, index) => ({
      ...milestone,
      forecastDate: null,
      state: index === 0 ? "NEXT" : "UPCOMING",
    })),
  };
}

function payload(forecast: GoalForecast, value = 42) {
  return {
    asOf: "2026-10-06T06:00:00Z",
    mode: "INSIGHTS_ONLY",
    state: "INSIGHTS",
    insights: [
      {
        kind: "GOAL_FORECAST",
        impressionId: IMPRESSION_ID,
        value,
        basis: "WEIGHT_FORECAST",
        goalForecast: forecast,
      },
    ],
  };
}

function goalForecastOf(insight: NutritionCoachInsight | undefined): GoalForecast {
  assert.ok(insight);
  assert.equal(insight.kind, "GOAL_FORECAST");
  if (insight.kind !== "GOAL_FORECAST") throw new Error("unreachable");
  return insight.goalForecast;
}

function parsedInsight(
  forecast: GoalForecast,
  value = 42,
): NutritionCoachInsight | undefined {
  return parseNutritionCoachState(payload(forecast, value))?.insights[0];
}

test("a complete goal forecast is parsed with its four milestones", () => {
  const insight = parsedInsight(availableForecast());
  const forecast = goalForecastOf(insight);

  assert.equal(insight?.impressionId, IMPRESSION_ID);
  assert.equal(forecast.milestones.length, 4);
  assert.deepEqual(
    forecast.milestones.map((milestone) => milestone.progressPercent),
    [25, 50, 75, 100],
  );
  assert.equal(forecast.forecastTargetDate, forecast.milestones[3].forecastDate);
});

test("an unavailable forecast keeps the blocks and carries no projected date", () => {
  for (const status of [
    "INSUFFICIENT_EVIDENCE",
    "STALE_EVIDENCE",
    "FLAT_TREND",
    "OPPOSITE_TREND",
    "LOW_TREND_QUALITY",
    "BEYOND_HORIZON",
  ] as const) {
    const forecast = goalForecastOf(parsedInsight(unavailableForecast(status), 0));
    assert.equal(forecast.status, status);
    assert.equal(forecast.milestones.length, 4);
    assert.equal(forecast.forecastTargetDate, null);
    for (const milestone of forecast.milestones) {
      assert.equal(milestone.forecastDate, null);
    }
  }
});

test("a malformed nested payload rejects the whole observation", () => {
  const rejected: Array<[string, unknown]> = [
    ["missing nested model", { ...payload(availableForecast()).insights[0], goalForecast: undefined }],
    [
      "three milestones",
      {
        ...payload(availableForecast()).insights[0],
        goalForecast: {
          ...availableForecast(),
          milestones: availableForecast().milestones.slice(0, 3),
        },
      },
    ],
    [
      "wrong percentages",
      {
        ...payload(availableForecast()).insights[0],
        goalForecast: availableForecast({
          milestones: availableForecast().milestones.map((milestone, index) =>
            index === 1 ? { ...milestone, progressPercent: 60 as 50 } : milestone,
          ),
        }),
      },
    ],
    [
      "weights not moving toward the goal",
      {
        ...payload(availableForecast()).insights[0],
        goalForecast: availableForecast({
          milestones: availableForecast().milestones.map((milestone, index) =>
            index === 1 ? { ...milestone, targetWeightKg: 88.5 } : milestone,
          ),
        }),
      },
    ],
    [
      "planned dates out of order",
      {
        ...payload(availableForecast()).insights[0],
        goalForecast: availableForecast({
          milestones: availableForecast().milestones.map((milestone, index) =>
            index === 1 ? { ...milestone, plannedDate: "2026-09-01" } : milestone,
          ),
        }),
      },
    ],
    [
      "forecast dates out of order",
      {
        ...payload(availableForecast()).insights[0],
        goalForecast: availableForecast({
          milestones: availableForecast().milestones.map((milestone, index) =>
            index === 2 ? { ...milestone, forecastDate: "2026-10-02" } : milestone,
          ),
        }),
      },
    ],
    [
      "end forecast disagreeing with the final block",
      {
        ...payload(availableForecast()).insights[0],
        goalForecast: availableForecast({ forecastTargetDate: "2027-03-01" }),
      },
    ],
    [
      "an unavailable state carrying a projected date",
      {
        ...payload(availableForecast()).insights[0],
        goalForecast: { ...unavailableForecast(), forecastTargetDate: "2027-02-14" },
      },
    ],
    [
      "an available state without an end forecast",
      {
        ...payload(availableForecast()).insights[0],
        goalForecast: availableForecast({
          forecastTargetDate: null,
          delayDays: null,
          milestones: availableForecast().milestones.map((milestone, index) =>
            index === 3 ? { ...milestone, forecastDate: null } : milestone,
          ),
        }),
      },
    ],
    [
      "a delay that disagrees with the two dates",
      {
        ...payload(availableForecast()).insights[0],
        goalForecast: availableForecast({ delayDays: 12 }),
      },
    ],
    [
      "an evidence span that disagrees with the evidence dates",
      {
        ...payload(availableForecast()).insights[0],
        goalForecast: availableForecast({ weightSpanDays: 12 }),
      },
    ],
    [
      "a display value that disagrees with the progress percentage",
      { ...payload(availableForecast(), 80).insights[0] },
    ],
    [
      "a forecast beyond the twelve-month horizon",
      {
        ...payload(availableForecast()).insights[0],
        goalForecast: availableForecast({
          forecastTargetDate: "2027-12-01",
          delayDays: 334,
          milestones: availableForecast().milestones.map((milestone, index) =>
            index === 3 ? { ...milestone, forecastDate: "2027-12-01" } : milestone,
          ),
        }),
      },
    ],
    [
      "a generic trend label the frontend would read as improvement",
      { ...payload(availableForecast()).insights[0], trend: "UP" },
    ],
    [
      "a reached block carrying a projected date",
      {
        ...payload(availableForecast()).insights[0],
        goalForecast: availableForecast({
          milestones: availableForecast().milestones.map((milestone, index) =>
            index === 0 ? { ...milestone, forecastDate: "2026-10-10" } : milestone,
          ),
        }),
      },
    ],
    [
      "a reached block after an unfinished one",
      {
        ...payload(availableForecast()).insights[0],
        goalForecast: availableForecast({
          milestones: availableForecast().milestones.map((milestone, index) =>
            index === 2
              ? { ...milestone, forecastDate: null, state: "REACHED" as const }
              : milestone,
          ),
        }),
      },
    ],
  ];

  for (const [name, insight] of rejected) {
    const state = parseNutritionCoachState({
      asOf: "2026-10-06T06:00:00Z",
      mode: "INSIGHTS_ONLY",
      state: "INSIGHTS",
      insights: [insight],
    });
    assert.deepEqual(state?.insights, [], name);
  }
});

test("available copy names the estimate and the saved plan date separately", () => {
  const insight = parsedInsight(availableForecast());
  assert.ok(insight);
  const copy = goalForecastCopy(insight);
  assert.ok(copy);

  assert.equal(copy.label, "برآورد مسیر هدفت");
  assert.equal(
    copy.statement,
    `با روند فعلی، تاریخ تقریبی رسیدن به هدفت ${formatPersianForecastDate("2027-02-14")} است.`,
  );
  assert.equal(
    copy.originalPlanLabel,
    `تاریخ برنامه: ${formatPersianForecastDate("2027-01-01")}`,
  );
  assert.match(copy.statement, /تقریبی/u);
  assert.equal(
    copy.note,
    "برآورد فعلی نسبت به تاریخ برنامه دیرتر شده و با ثبت وزن‌های بعدی به‌روزرسانی می‌شود.",
  );
});

test("an on-plan forecast adds no schedule note and an earlier one is framed neutrally", () => {
  const onPlan = goalForecastCopy(
    parsedInsight(
      availableForecast({
        forecastTargetDate: "2027-01-04",
        delayDays: 3,
        milestones: availableForecast().milestones.map((milestone, index) =>
          index === 3 ? { ...milestone, forecastDate: "2027-01-04" } : milestone,
        ),
      }),
    )!,
  );
  const earlier = goalForecastCopy(
    parsedInsight(
      availableForecast({
        forecastTargetDate: "2026-12-01",
        delayDays: -31,
        milestones: availableForecast().milestones.map((milestone, index) => {
          if (index === 2) return { ...milestone, forecastDate: "2026-11-08" };
          if (index === 3) return { ...milestone, forecastDate: "2026-12-01" };
          return milestone;
        }),
      }),
    )!,
  );

  assert.equal(onPlan?.note, null);
  assert.equal(
    earlier?.note,
    "برآورد فعلی نسبت به تاریخ برنامه زودتر شده و با ثبت وزن‌های بعدی به‌روزرسانی می‌شود.",
  );
});

test("unavailable copy keeps the blocks and offers no estimate", () => {
  const insight = parsedInsight(unavailableForecast("FLAT_TREND"), 0);
  assert.ok(insight);
  const copy = goalForecastCopy(insight);
  assert.ok(copy);

  assert.match(copy.statement, /تقریباً ثابت/u);
  assert.match(copy.statement, /مراحل برنامه‌ات حفظ می‌شوند/u);
  assert.equal(copy.note, null);
  assert.equal(copy.milestones.length, 4);
  for (const milestone of copy.milestones) {
    assert.equal(milestone.forecastLabel, null);
    assert.match(milestone.plannedLabel, /^برنامه: /u);
  }
});

test("each unavailable state explains itself rather than sharing one sentence", () => {
  const statements = new Map<string, string>();
  for (const status of [
    "INSUFFICIENT_EVIDENCE",
    "STALE_EVIDENCE",
    "FLAT_TREND",
    "OPPOSITE_TREND",
    "LOW_TREND_QUALITY",
    "BEYOND_HORIZON",
  ] as const) {
    const copy = goalForecastCopy(parsedInsight(unavailableForecast(status), 0)!);
    assert.ok(copy, status);
    statements.set(status, copy.statement);
    // The milestone plan survives every unavailable state.
    assert.match(copy.statement, /مراحل برنامه‌ات حفظ می‌شوند/u);
    assert.equal(copy.milestones.length, 4);
  }

  assert.equal(new Set(statements.values()).size, statements.size);

  // Only the states another measurement can actually resolve ask for one.
  for (const status of ["INSUFFICIENT_EVIDENCE", "STALE_EVIDENCE"]) {
    assert.match(statements.get(status)!, /وزن/u);
  }
  // A stable weight, an opposing direction, and a distant date must not be
  // presented as missing data that one more weigh-in would fix.
  for (const status of ["FLAT_TREND", "OPPOSITE_TREND", "BEYOND_HORIZON"]) {
    assert.doesNotMatch(statements.get(status)!, /کافی نیست/u);
  }
});

test("each block renders its share, weight, and dates in Persian numerals", () => {
  const insight = parsedInsight(availableForecast());
  assert.ok(insight);
  const copy = goalForecastCopy(insight);
  assert.ok(copy);

  assert.deepEqual(
    copy.milestones.map((milestone) => milestone.progressLabel),
    ["۲۵٪ مسیر", "۵۰٪ مسیر", "۷۵٪ مسیر", "۱۰۰٪ مسیر"],
  );
  assert.equal(copy.milestones[0].weight, "۸۷٫۵ کیلوگرم");
  assert.equal(copy.milestones[3].weight, "۸۰ کیلوگرم");
  assert.equal(copy.milestones[0].forecastLabel, null);
  assert.match(copy.milestones[1].forecastLabel ?? "", /^برآورد فعلی: /u);
  assert.deepEqual(
    copy.milestones.map((milestone) => milestone.state),
    ["REACHED", "NEXT", "UPCOMING", "UPCOMING"],
  );
  const text = copy.milestones.map((milestone) => milestone.plannedLabel).join(" ");
  assert.doesNotMatch(text, /[0-9]/u);
});

test("forecast dates render as Solar Hijri day, month, and year", () => {
  // 2027-02-14 is 25 Bahman 1405.
  assert.equal(formatPersianForecastDate("2027-02-14"), "۲۵ بهمن ۱۴۰۵");
  // 2027-01-01 is 11 Dey 1405.
  assert.equal(formatPersianForecastDate("2027-01-01"), "۱۱ دی ۱۴۰۵");
});

test("the year disambiguates a plan date and an estimate one year apart", () => {
  // The same Persian day and month in adjacent years must not read as one date.
  const planDate = formatPersianForecastDate("2026-02-14");
  const forecastDate = formatPersianForecastDate("2027-02-14");

  assert.notEqual(planDate, forecastDate);
  assert.match(planDate, /۱۴۰۴$/u);
  assert.match(forecastDate, /۱۴۰۵$/u);
});

test("every block carries a text state label, not colour alone", () => {
  const available = goalForecastCopy(parsedInsight(availableForecast())!);
  assert.ok(available);
  assert.deepEqual(
    available.milestones.map((milestone) => milestone.stateLabel),
    ["رسیده‌شده", "مرحله بعد", "پیش رو", "پیش رو"],
  );

  const unavailable = goalForecastCopy(parsedInsight(unavailableForecast(), 0)!);
  assert.ok(unavailable);
  assert.equal(unavailable.milestones[0].stateLabel, "مرحله بعد");
  for (const milestone of unavailable.milestones) {
    assert.ok(milestone.stateLabel.length > 0);
  }
});

test("goal forecast copy never promises, blames, or prescribes a calorie change", () => {
  const forecasts = [availableForecast(), unavailableForecast()];
  for (const forecast of forecasts) {
    const insight = parsedInsight(forecast, forecast.status === "AVAILABLE" ? 42 : 0);
    assert.ok(insight);
    const copy = goalForecastCopy(insight);
    assert.ok(copy);
    const text = [
      copy.label,
      copy.statement,
      copy.originalPlanLabel,
      copy.note ?? "",
      ...copy.milestones.flatMap((milestone) => [
        milestone.progressLabel,
        milestone.weight,
        milestone.plannedLabel,
        milestone.forecastLabel ?? "",
        milestone.stateLabel,
      ]),
    ].join(" ");

    for (const forbidden of [
      "حتماً",
      "قطعاً",
      "تضمین",
      "شکست",
      "موفق",
      "کالری",
      "هدفت را تغییر",
      "تاریخ برنامه‌ات را",
    ]) {
      assert.ok(!text.includes(forbidden), `${forbidden} must not appear`);
    }
  }
});

test("an explicitly null trend is accepted as making no directional claim", () => {
  // The backend now declares `trend` on every kind and omits it when null. If a
  // serializer setting ever emitted `trend: null` instead, a neutral observation
  // must still parse rather than being discarded as malformed.
  const insight = parseNutritionCoachState({
    asOf: "2026-10-06T06:00:00Z",
    mode: "INSIGHTS_ONLY",
    state: "INSIGHTS",
    insights: [
      {
        kind: "GOAL_FORECAST",
        impressionId: IMPRESSION_ID,
        value: 42,
        basis: "WEIGHT_FORECAST",
        trend: null,
        goalForecast: availableForecast(),
      },
    ],
  })?.insights[0];

  assert.equal(goalForecastOf(insight).status, "AVAILABLE");
});

test("a real trend value on a neutral kind is still rejected", () => {
  const insight = parseNutritionCoachState({
    asOf: "2026-10-06T06:00:00Z",
    mode: "INSIGHTS_ONLY",
    state: "INSIGHTS",
    insights: [
      {
        kind: "GOAL_FORECAST",
        impressionId: IMPRESSION_ID,
        value: 42,
        basis: "WEIGHT_FORECAST",
        trend: "UP",
        goalForecast: availableForecast(),
      },
    ],
  })?.insights;

  assert.deepEqual(insight, []);
});

test("a non-forecast insight is not treated as a forecast", () => {
  assert.equal(
    goalForecastCopy({
      kind: "LOGGING_STREAK",
      impressionId: "OBS|LS|M7",
      value: 7,
      capped: false,
    }),
    null,
  );
});
