import type {
  GoalForecastMilestoneState,
  GoalForecastStatus,
  NutritionCoachInsight,
} from "../api/nutrition-coach";
import {formatPersianNumber} from "../format";
import {finiteNumber} from "../recalibration/evidence";

const NEAR_TARGET_PERCENT = 5;
const measuredTdeeConfidenceLabels = {
  LOW: "اولیه",
  MEDIUM: "متوسط",
  HIGH: "قوی",
} as const;

export type MeasuredTdeeCopy = {
  label: string;
  value: string;
  evidence: string;
  disclosureAction: string;
  explainer: string;
};

export function measuredTdeeCopy(
  insight: NutritionCoachInsight,
): MeasuredTdeeCopy | null {
  if (
    insight.kind !== "MEASURED_TDEE" ||
    insight.basis !== "OBSERVED_ENERGY" ||
    insight.confidence === undefined ||
    insight.windowDays === undefined ||
    insight.loggedDayCount === undefined ||
    insight.weighInDayCount === undefined
  ) return null;

  const windowDays = formatPersianNumber(insight.windowDays, {
    maximumFractionDigits: 0,
  });
  const loggedDays = formatPersianNumber(insight.loggedDayCount, {
    maximumFractionDigits: 0,
  });
  const weighInDays = formatPersianNumber(insight.weighInDayCount, {
    maximumFractionDigits: 0,
  });
  return {
    label: "برآورد مصرف انرژی روزانه",
    value: `حدود ${formatPersianNumber(insight.value, { maximumFractionDigits: 0 })} کالری`,
    evidence: `بر اساس داده‌های ${windowDays} روز اخیر · کیفیت داده: ${measuredTdeeConfidenceLabels[insight.confidence]}`,
    disclosureAction: "این عدد چطور برآورد شده؟",
    explainer: `این برآورد از میانگین کالری ثبت‌شده و روند وزن در ${loggedDays} روز ثبت غذا و ${weighInDays} روز وزن‌کشی ساخته شده است؛ عدد قطعی یا آزمایشگاهی نیست. با ثبت غذا و وزن‌کشی‌های بعدی، این برآورد را دوباره بررسی می‌کنیم؛ اگر شواهد کافی باشد، نیاز به تنظیم کالری را در یک پیشنهاد جداگانه نشانت می‌دهیم.`,
  };
}

export type WeekendGapCopy = {
  label: string;
  statement: string;
  evidence: string;
};

/**
 * Describes the Iranian weekend pattern without praise, blame, a cause, or a
 * calorie-target recommendation. The unit is percentage points, because the
 * value is the difference between two target-relative percentages.
 */
export function weekendGapCopy(
  insight: NutritionCoachInsight,
): WeekendGapCopy | null {
  if (
    insight.kind !== "WEEKEND_GAP" ||
    insight.basis !== "TARGET_COMPARISON" ||
    insight.weekendLoggedDayCount === undefined ||
    insight.weekdayLoggedDayCount === undefined ||
    insight.value === undefined
  ) {
    return null;
  }

  const points = formatPersianNumber(Math.abs(insight.value), {
    maximumFractionDigits: 0,
  });
  const weekendDays = formatPersianNumber(insight.weekendLoggedDayCount, {
    maximumFractionDigits: 0,
  });
  const weekdayDays = formatPersianNumber(insight.weekdayLoggedDayCount, {
    maximumFractionDigits: 0,
  });
  const comparison = insight.value < 0 ? "کمتر" : "بیشتر";

  return {
    label: "الگوی پنجشنبه و جمعه",
    statement:
      `در پنجشنبه و جمعه، مصرف ثبت‌شده‌ات نسبت به هدف همان روزها حدود ${points} واحد درصد ${comparison} از شنبه تا چهارشنبه بود.`,
    evidence:
      `بر پایه ${weekendDays} روز پنجشنبه و جمعه و ${weekdayDays} روز شنبه تا چهارشنبه در ۱۴ روز گذشته`,
  };
}

export type TrendExplanationCopy = {
  label: string;
  statement: string;
  disclosureAction: string;
  explainer: string;
};

/**
 * States two recorded facts — recorded intake below target while the fitted weight
 * trend rose — and offers an optional, non-causal disclosure. It never claims a cause,
 * never says the gain is or is not fat, and never recommends changing calories, so the
 * text only ever describes "مصرف ثبت‌شده" and lists possible factors without asserting one.
 */
export function trendExplanationCopy(
  insight: NutritionCoachInsight,
): TrendExplanationCopy | null {
  if (
    insight.kind !== "TREND_EXPLANATION" ||
    insight.basis !== "TARGET_COMPARISON" ||
    insight.loggedDayCount === undefined ||
    insight.windowDays === undefined ||
    insight.weightTrendKgPerWeek === undefined ||
    insight.value === undefined ||
    insight.value >= 0
  ) {
    return null;
  }

  const loggedDays = formatPersianNumber(insight.loggedDayCount, {
    maximumFractionDigits: 0,
  });
  const windowDays = formatPersianNumber(insight.windowDays, {
    maximumFractionDigits: 0,
  });
  const delta = formatPersianNumber(Math.abs(insight.value), {
    maximumFractionDigits: 0,
  });
  const weightTrend = formatPersianNumber(insight.weightTrendKgPerWeek, {
    maximumFractionDigits: 2,
  });

  return {
    label: "دو روند متفاوت",
    statement:
      `در ${loggedDays} روز ثبت‌شده از ${windowDays} روز گذشته، مصرف ثبت‌شده‌ات حدود ${delta}٪ پایین‌تر از هدفت بود؛ روند وزنت در همین بازه حدود ${weightTrend} کیلو در هفته بالاتر رفت.`,
    disclosureAction: "چرا این دو روند ممکن است متفاوت باشند؟",
    explainer:
      "از این دو داده به‌تنهایی نمی‌شود علت تغییر وزن را مشخص کرد. آب بدن، زمان وزن‌کشی، نمک، کربوهیدرات و گوارش هم می‌توانند اثر بگذارند. چند روز دیگر همین روند را بررسی می‌کنیم؛ اگر شواهد کافی باشد، نیاز به تنظیم کالری را در یک پیشنهاد جداگانه نشانت می‌دهیم.",
  };
}

export type GoalForecastMilestoneCopy = {
  progressLabel: string;
  weight: string;
  plannedLabel: string;
  forecastLabel: string | null;
  state: GoalForecastMilestoneState;
  /** Text form of [state], so the block never depends on colour alone. */
  stateLabel: string;
};

export type GoalForecastCopy = {
  label: string;
  statement: string;
  originalPlanLabel: string;
  note: string | null;
  milestones: GoalForecastMilestoneCopy[];
};

const persianForecastDateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * A Solar Hijri day, month, and year.
 *
 * The year is not decoration. The card sets the saved plan date directly beside the
 * current estimate, and those two are not confined to one Persian year: the saved date
 * can already be in the past, the plan can cross Nowruz, and a forecast can sit almost
 * twelve months out. Without the year, two dates a year apart read as the same day and
 * the size of a delay becomes unreadable.
 */
export function formatPersianForecastDate(isoDate: string) {
  return persianForecastDateFormatter.format(new Date(`${isoDate}T00:00:00.000Z`));
}

/**
 * Presents the four goal blocks with the saved plan date beside the current estimate.
 *
 * The estimate is always framed as approximate and is simply absent when the trend
 * cannot support one — the blocks stay, and the copy says another weigh-in can bring the
 * estimate back. It never praises, blames, promises a date, or suggests a calorie change,
 * and it never implies the saved plan has been rewritten.
 */
export function goalForecastCopy(
  insight: NutritionCoachInsight,
): GoalForecastCopy | null {
  if (insight.kind !== "GOAL_FORECAST" || insight.basis !== "WEIGHT_FORECAST") {
    return null;
  }
  const forecast = insight.goalForecast;
  const available = forecast.status === "AVAILABLE";
  if (available && !forecast.forecastTargetDate) return null;

  const statement = available && forecast.forecastTargetDate
    ? `با روند فعلی، تاریخ تقریبی رسیدن به هدفت ${formatPersianForecastDate(forecast.forecastTargetDate)} است.`
    : unavailableStatement(forecast.status);

  return {
    label: "برآورد مسیر هدفت",
    statement,
    originalPlanLabel: `تاریخ برنامه: ${formatPersianForecastDate(forecast.originalTargetDate)}`,
    note: available ? scheduleNote(forecast.delayDays) : null,
    milestones: forecast.milestones.map((milestone) => ({
      progressLabel: `${formatPersianNumber(milestone.progressPercent, { maximumFractionDigits: 0 })}٪ مسیر`,
      weight: `${formatPersianNumber(milestone.targetWeightKg, { maximumFractionDigits: 1 })} کیلوگرم`,
      plannedLabel: `برنامه: ${formatPersianForecastDate(milestone.plannedDate)}`,
      forecastLabel: milestone.forecastDate
        ? `برآورد فعلی: ${formatPersianForecastDate(milestone.forecastDate)}`
        : null,
      state: milestone.state,
      stateLabel: goalForecastMilestoneStateLabels[milestone.state],
    })),
  };
}

/**
 * Why there is no estimate, in the person's own terms.
 *
 * The backend distinguishes six unforecastable states and they do not share a remedy:
 * asking for another weigh-in is right when evidence is thin or old, and misleading when
 * the weight has genuinely been stable, when the recent direction runs against the goal,
 * or when the evidence is good and the date is simply too far out. A single generic
 * sentence made every one of those look like missing data. None of these blames the
 * person or names a statistic.
 */
function unavailableStatement(status: GoalForecastStatus): string {
  switch (status) {
    case "INSUFFICIENT_EVIDENCE":
      return "هنوز وزن‌های کافی برای تخمین تاریخ ثبت نشده است. مراحل برنامه‌ات حفظ می‌شوند و با ثبت وزن‌های بعدی به‌روزرسانی می‌شوند.";
    case "STALE_EVIDENCE":
      return "آخرین وزن ثبت‌شده‌ات برای تخمین تاریخ قدیمی است. مراحل برنامه‌ات حفظ می‌شوند و با یک وزن تازه دوباره تخمین می‌زنیم.";
    case "FLAT_TREND":
      return "وزنت در هفته‌های اخیر تقریباً ثابت بوده، برای همین فعلاً تاریخی تخمین نمی‌زنیم. مراحل برنامه‌ات حفظ می‌شوند.";
    case "OPPOSITE_TREND":
      return "روند وزن اخیرت فعلاً در جهت هدفت حرکت نمی‌کند، برای همین تاریخی تخمین نمی‌زنیم. مراحل برنامه‌ات حفظ می‌شوند.";
    case "LOW_TREND_QUALITY":
      return "وزن‌های اخیرت نوسان زیادی دارند و هنوز یک روند روشن نمی‌سازند. مراحل برنامه‌ات حفظ می‌شوند و با ثبت‌های منظم‌تر دوباره بررسی می‌کنیم.";
    case "BEYOND_HORIZON":
      return "با روند فعلی، تاریخ رسیدن به هدفت دورتر از آن است که تخمین قابل‌اتکایی نشان دهیم. مراحل برنامه‌ات حفظ می‌شوند.";
    case "AVAILABLE":
      return "";
  }
}

/** Non-colour label for each block, so the next step is readable and announced. */
export const goalForecastMilestoneStateLabels: Record<GoalForecastMilestoneState, string> = {
  REACHED: "رسیده‌شده",
  NEXT: "مرحله بعد",
  UPCOMING: "پیش رو",
};

/** Neutral framing of the gap between the estimate and the saved plan date. */
function scheduleNote(delayDays: number | null): string | null {
  if (delayDays === null || Math.abs(delayDays) <= ON_PLAN_TOLERANCE_DAYS) return null;
  return delayDays > 0
    ? "برآورد فعلی نسبت به تاریخ برنامه دیرتر شده و با ثبت وزن‌های بعدی به‌روزرسانی می‌شود."
    : "برآورد فعلی نسبت به تاریخ برنامه زودتر شده و با ثبت وزن‌های بعدی به‌روزرسانی می‌شود.";
}

const ON_PLAN_TOLERANCE_DAYS = 7;

export function calorieTargetComparisonCopy(
  insight: NutritionCoachInsight,
): string | null {
  if (
    insight.kind !== "CALORIE_ADHERENCE" ||
    insight.basis !== "TARGET_COMPARISON" ||
    insight.averageIntakeCalories === undefined ||
    insight.averageTargetCalories === undefined ||
    insight.deltaPercent === undefined ||
    insight.loggedDayCount === undefined
  ) {
    return null;
  }

  const days = formatPersianNumber(insight.loggedDayCount, {
    maximumFractionDigits: 0,
  });
  const intake = formatPersianNumber(insight.averageIntakeCalories, {
    maximumFractionDigits: 0,
  });
  const delta = formatPersianNumber(Math.abs(insight.value), {
    maximumFractionDigits: 0,
  });
  const prefix = `در ${days} روز ثبت‌شده از ۷ روز گذشته، میانگین مصرفت`;

  if (Math.abs(insight.deltaPercent) <= NEAR_TARGET_PERCENT) {
    return `${prefix} نزدیک به میانگین هدفت بود.`;
  }
  if (insight.deltaPercent < 0) {
    return `${prefix} ${intake} کالری بود؛ ${delta}٪ کمتر از میانگین هدفت.`;
  }
  return `${prefix} ${intake} کالری بود؛ ${delta}٪ بیشتر از میانگین هدفت.`;
}

export type RecalibrationRecommendationStory = {
  loggedDays: number;
  windowDays: number;
  averageLoggedCalories: number;
  averageHistoricalTargetCalories: number;
  observedKgPerWeek: number;
  intendedDailyEnergyDelta: number;
  windowStart: string;
  intakeThrough: string;
  weightThrough: string;
};

export function parseRecalibrationRecommendationStory(
  basis: Record<string, unknown>,
): RecalibrationRecommendationStory | null {
  const loggedDays = finiteNumber(basis.loggedDays);
  const windowDays = finiteNumber(basis.windowDays);
  const averageLoggedCalories = finiteNumber(basis.averageLoggedCalories);
  const averageHistoricalTargetCalories = finiteNumber(
    basis.averageHistoricalTargetCalories,
  );
  const observedKgPerWeek = finiteNumber(basis.observedKgPerWeek);
  const intendedDailyEnergyDelta = finiteNumber(
    basis.intendedDailyEnergyDelta,
  );
  const windowStart = isoDate(basis.windowStart);
  const intakeThrough = isoDate(basis.intakeThrough);
  const weightThrough = isoDate(basis.weightThrough);

  if (
    loggedDays === null ||
    !Number.isInteger(loggedDays) ||
    loggedDays < 1 ||
    windowDays === null ||
    !Number.isInteger(windowDays) ||
    windowDays < 1 ||
    averageLoggedCalories === null ||
    averageHistoricalTargetCalories === null ||
    averageHistoricalTargetCalories <= 0 ||
    observedKgPerWeek === null ||
    intendedDailyEnergyDelta === null ||
    windowStart === null ||
    intakeThrough === null ||
    weightThrough === null ||
    windowStart > intakeThrough ||
    intakeThrough > weightThrough
  ) {
    return null;
  }

  return {
    loggedDays,
    windowDays,
    averageLoggedCalories,
    averageHistoricalTargetCalories,
    observedKgPerWeek,
    intendedDailyEnergyDelta,
    windowStart,
    intakeThrough,
    weightThrough,
  };
}

export function recalibrationRecommendationCopy(
  story: RecalibrationRecommendationStory,
  previousCalories: number,
  suggestedCalories: number,
): string {
  const days = formatPersianNumber(story.loggedDays, {
    maximumFractionDigits: 0,
  });
  const windowDays = formatPersianNumber(story.windowDays, {
    maximumFractionDigits: 0,
  });
  const average = formatPersianNumber(story.averageLoggedCalories, {
    maximumFractionDigits: 0,
  });
  const previous = formatPersianNumber(previousCalories, {
    maximumFractionDigits: 0,
  });
  const suggested = formatPersianNumber(suggestedCalories, {
    maximumFractionDigits: 0,
  });
  const intakeComparison =
    story.averageLoggedCalories < story.averageHistoricalTargetCalories
      ? "کمتر از میانگین هدفت"
      : story.averageLoggedCalories > story.averageHistoricalTargetCalories
        ? "بیشتر از میانگین هدفت"
        : "برابر با میانگین هدفت";
  const trend = weightTrendCopy(
    story.observedKgPerWeek,
    story.intendedDailyEnergyDelta,
    suggestedCalories - previousCalories,
  );

  return `در ${days} روز ثبت‌شده از ${windowDays} روز گذشته، میانگین مصرفت ${average} کالری بود؛ ${intakeComparison}. در همین بازه، ${trend} برای نزدیک شدن به سرعت برنامه، پیشنهاد می‌کنیم مصرفت را به‌تدریج از هدف ${previous} کالری به هدف جدید ${suggested} کالری نزدیک کنی.`;
}

function weightTrendCopy(
  observedKgPerWeek: number,
  intendedDailyEnergyDelta: number,
  calorieAdjustment: number,
) {
  const intendedKgPerWeek = intendedDailyEnergyDelta * 7 / 7700;
  if (intendedDailyEnergyDelta < 0) {
    if (observedKgPerWeek < intendedKgPerWeek && calorieAdjustment > 0) {
      return "سرعت کاهش وزنت بیشتر از برنامه بود.";
    }
    if (observedKgPerWeek > intendedKgPerWeek && calorieAdjustment < 0) {
      return "سرعت کاهش وزنت کمتر از برنامه بود.";
    }
  }
  if (intendedDailyEnergyDelta > 0) {
    if (observedKgPerWeek < intendedKgPerWeek && calorieAdjustment > 0) {
      return "سرعت افزایش وزنت کمتر از برنامه بود.";
    }
    if (observedKgPerWeek > intendedKgPerWeek && calorieAdjustment < 0) {
      return "سرعت افزایش وزنت بیشتر از برنامه بود.";
    }
  }
  if (intendedDailyEnergyDelta === 0) {
    if (observedKgPerWeek < 0 && calorieAdjustment > 0) {
      return "وزنت در حال کاهش بود، در حالی که برنامه برای حفظ وزن تنظیم شده است.";
    }
    if (observedKgPerWeek > 0 && calorieAdjustment < 0) {
      return "وزنت در حال افزایش بود، در حالی که برنامه برای حفظ وزن تنظیم شده است.";
    }
  }
  return "داده‌های مصرف و روند وزنت نشان داد هدف فعلی نیاز به تنظیم دارد.";
}

function isoDate(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(value)
    ? value
    : null;
}
