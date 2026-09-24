import assert from "node:assert/strict";
import test from "node:test";

import type {NutritionCoachInsight} from "../lib/api/nutrition-coach";
import {
  calorieTargetComparisonCopy,
  measuredTdeeCopy,
  parseRecalibrationRecommendationStory,
  recalibrationRecommendationCopy,
  trendExplanationCopy,
  weekendGapCopy,
} from "../lib/nutrition-coach/evidence-copy";

function unsafeInsight(value: unknown): NutritionCoachInsight {
  return value as NutritionCoachInsight;
}

function trendExplanationInsight(): NutritionCoachInsight {
  return {
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
}

test("trend explanation copy states both recorded facts with Persian numerals", () => {
  const copy = trendExplanationCopy(trendExplanationInsight());
  assert.ok(copy);
  assert.equal(copy.label, "دو روند متفاوت");
  assert.equal(
    copy.statement,
    "در ۱۲ روز ثبت‌شده از ۱۴ روز گذشته، مصرف ثبت‌شده‌ات حدود ۱۸٪ پایین‌تر از هدفت بود؛ روند وزنت در همین بازه حدود ۰٫۵۵ کیلو در هفته بالاتر رفت.",
  );
  assert.equal(copy.disclosureAction, "چرا این دو روند ممکن است متفاوت باشند؟");
  assert.match(copy.explainer, /آب بدن/u);
  assert.match(copy.explainer, /چند روز دیگر همین روند را بررسی می‌کنیم/u);
  assert.match(copy.explainer, /اگر شواهد کافی باشد/u);
  assert.match(copy.explainer, /پیشنهاد جداگانه/u);
});

test("trend explanation copy avoids causal, diagnostic, and prescriptive wording", () => {
  const copy = trendExplanationCopy(trendExplanationInsight());
  assert.ok(copy);
  const text = `${copy.label} ${copy.statement} ${copy.disclosureAction} ${copy.explainer}`;
  assert.match(copy.statement, /مصرف ثبت‌شده/u);
  for (const forbidden of [
    "حتماً",
    "به دلیل",
    "چون",
    "چربی",
    "کاهش بده",
    "افزایش بده",
    "کالری هدف",
    "بیماری",
    "پزشک",
  ]) {
    assert.ok(!text.includes(forbidden), `${forbidden} must not appear`);
  }
});

test("trend explanation copy is withheld for above-target or incomplete payloads", () => {
  assert.equal(
    trendExplanationCopy(unsafeInsight({ ...trendExplanationInsight(), value: 12 })),
    null,
  );
  assert.equal(
    trendExplanationCopy(unsafeInsight({ ...trendExplanationInsight(), weightTrendKgPerWeek: undefined })),
    null,
  );
  assert.equal(
    trendExplanationCopy(unsafeInsight({ ...trendExplanationInsight(), basis: "LOGGED_DAYS" })),
    null,
  );
});

function weekendGapInsight(value: number): NutritionCoachInsight {
  return {
    kind: "WEEKEND_GAP",
    impressionId: "OBS|WG|V1|2026-08-01|HIGHER|MODERATE",
    value,
    basis: "TARGET_COMPARISON",
    weekendTargetDeltaPercent: value > 0 ? 8.25 : -8.25,
    weekdayTargetDeltaPercent: value > 0 ? -5.6 : 5.6,
    weekendLoggedDayCount: 3,
    weekdayLoggedDayCount: 8,
    loggedDayCount: 11,
    windowDays: 14,
    periodStart: "2026-07-19",
    periodEnd: "2026-08-01",
  };
}

test("weekend gap copy names Thursday and Friday in both directions", () => {
  const higher = weekendGapCopy(weekendGapInsight(14));
  assert.ok(higher);
  assert.equal(
    higher.statement,
    "در پنجشنبه و جمعه، مصرف ثبت‌شده‌ات نسبت به هدف همان روزها حدود ۱۴ واحد درصد بیشتر از شنبه تا چهارشنبه بود.",
  );
  assert.equal(
    higher.evidence,
    "بر پایه ۳ روز پنجشنبه و جمعه و ۸ روز شنبه تا چهارشنبه در ۱۴ روز گذشته",
  );

  const lower = weekendGapCopy(weekendGapInsight(-14));
  assert.ok(lower);
  assert.equal(
    lower.statement,
    "در پنجشنبه و جمعه، مصرف ثبت‌شده‌ات نسبت به هدف همان روزها حدود ۱۴ واحد درصد کمتر از شنبه تا چهارشنبه بود.",
  );
});

test("weekend gap copy uses percentage points and stays non-judgmental", () => {
  const copy = weekendGapCopy(weekendGapInsight(14));
  assert.ok(copy);
  const text = `${copy.label} ${copy.statement} ${copy.evidence}`;
  assert.match(copy.statement, /واحد درصد/u);
  assert.doesNotMatch(copy.statement, /(?<!واحد )درصد(?! )/u);
  assert.match(copy.statement, /نسبت به هدف/u);
  assert.match(copy.statement, /مصرف ثبت‌شده/u);
  for (const forbidden of [
    "آفرین",
    "عالی",
    "بد",
    "ضعیف",
    "چون",
    "به دلیل",
    "پیشنهاد",
    "کاهش بده",
    "افزایش بده",
    "کالری هدف",
  ]) {
    assert.ok(!text.includes(forbidden), `${forbidden} must not appear`);
  }
});

test("weekend gap copy is withheld when group evidence is missing", () => {
  assert.equal(
    weekendGapCopy(unsafeInsight({ ...weekendGapInsight(14), weekendLoggedDayCount: undefined })),
    null,
  );
  assert.equal(
    weekendGapCopy(unsafeInsight({ ...weekendGapInsight(14), basis: "LOGGED_DAYS" })),
    null,
  );
});

function calorieInsight(
  deltaPercent: number,
  value: number,
  averageIntakeCalories: number,
): NutritionCoachInsight {
  return {
    impressionId: "CALORIE_ADHERENCE",
    kind: "CALORIE_ADHERENCE",
    basis: "TARGET_COMPARISON",
    value,
    averageIntakeCalories,
    averageTargetCalories: 1500,
    deltaPercent,
    loggedDayCount: 4,
    periodStart: "2026-07-18",
    periodEnd: "2026-07-22",
  };
}

test("measured TDEE copy labels confidence and discloses non-laboratory evidence", () => {
  const copy = measuredTdeeCopy({
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
  });

  assert.ok(copy);
  assert.equal(copy.label, "برآورد مصرف انرژی روزانه");
  assert.equal(copy.value, "حدود ۲٬۳۴۰ کالری");
  assert.match(copy.evidence, /۱۴ روز اخیر · کیفیت داده: متوسط/u);
  assert.equal(copy.disclosureAction, "این عدد چطور برآورد شده؟");
  assert.match(copy.explainer, /۱۰ روز ثبت غذا و ۵ روز وزن‌کشی/u);
  assert.match(copy.explainer, /قطعی یا آزمایشگاهی نیست/u);
  assert.match(copy.explainer, /ثبت غذا و وزن‌کشی‌های بعدی/u);
  assert.match(copy.explainer, /اگر شواهد کافی باشد/u);
  assert.match(copy.explainer, /پیشنهاد جداگانه/u);
});

test("rolling calorie copy covers below, near, and above target", () => {
  assert.equal(
    calorieTargetComparisonCopy(calorieInsight(-13.333333, -13, 1300)),
    "در ۴ روز ثبت‌شده از ۷ روز گذشته، میانگین مصرفت ۱٬۳۰۰ کالری بود؛ ۱۳٪ کمتر از میانگین هدفت.",
  );
  assert.equal(
    calorieTargetComparisonCopy(calorieInsight(5, 5, 1575)),
    "در ۴ روز ثبت‌شده از ۷ روز گذشته، میانگین مصرفت نزدیک به میانگین هدفت بود.",
  );
  assert.equal(
    calorieTargetComparisonCopy(calorieInsight(12, 12, 1680)),
    "در ۴ روز ثبت‌شده از ۷ روز گذشته، میانگین مصرفت ۱٬۶۸۰ کالری بود؛ ۱۲٪ بیشتر از میانگین هدفت.",
  );
});

test("recommendation story requires one complete persisted evidence basis", () => {
  const basis = {
    windowStart: "2026-07-09",
    intakeThrough: "2026-07-22",
    weightThrough: "2026-07-23",
    windowDays: 14,
    loggedDays: 11,
    averageLoggedCalories: "1300",
    averageHistoricalTargetCalories: "1500",
    observedKgPerWeek: "-0.8",
    intendedDailyEnergyDelta: "-500",
  };
  const story = parseRecalibrationRecommendationStory(basis);
  assert.ok(story);
  assert.equal(
    recalibrationRecommendationCopy(story, 1500, 1650),
    "در ۱۱ روز ثبت‌شده از ۱۴ روز گذشته، میانگین مصرفت ۱٬۳۰۰ کالری بود؛ کمتر از میانگین هدفت. در همین بازه، سرعت کاهش وزنت بیشتر از برنامه بود. برای نزدیک شدن به سرعت برنامه، پیشنهاد می‌کنیم مصرفت را به‌تدریج از هدف ۱٬۵۰۰ کالری به هدف جدید ۱٬۶۵۰ کالری نزدیک کنی.",
  );

  assert.equal(
    parseRecalibrationRecommendationStory({
      ...basis,
      averageHistoricalTargetCalories: undefined,
    }),
    null,
  );
  assert.equal(
    parseRecalibrationRecommendationStory({
      ...basis,
      weightThrough: undefined,
    }),
    null,
  );
});

test("recommendation copy uses the selected adaptive evidence window", () => {
  const story = parseRecalibrationRecommendationStory({
    windowStart: "2026-06-25",
    intakeThrough: "2026-07-22",
    weightThrough: "2026-07-23",
    windowDays: 28,
    loggedDays: 20,
    averageLoggedCalories: "1500",
    averageHistoricalTargetCalories: "1600",
    observedKgPerWeek: "-0.8",
    intendedDailyEnergyDelta: "-500",
  });

  assert.ok(story);
  assert.match(
    recalibrationRecommendationCopy(story, 1600, 1700),
    /۲۰ روز ثبت‌شده از ۲۸ روز گذشته/u,
  );
});
