import { apiGet, apiPost } from "./client";
import type { RecalibrationSuggestionDto } from "./recalibration";

export type NutritionCoachMode = "FULL" | "INSIGHTS_ONLY";
export type NutritionCoachReadinessReason =
  | "INSUFFICIENT_FOOD_EVIDENCE"
  | "INSUFFICIENT_WEIGH_IN_DAYS"
  | "INSUFFICIENT_WEIGHT_SPAN"
  | "INSUFFICIENT_FOOD_AND_WEIGHT_EVIDENCE";
export type NutritionCoachNextUsefulAction =
  | "LOG_FOOD"
  | "LOG_WEIGHT_TODAY"
  | "WAIT_FOR_ANOTHER_WEIGHT_DAY"
  | "EXTEND_WEIGHT_SPAN";
export type NutritionCoachStateName =
  | "RECOMMENDATION"
  | "RECOMMENDATION_LOCKED"
  | "RECOMMENDATION_PREPARING"
  | "WAITING"
  | "LEARNING"
  | "COLLECTING_DATA"
  | "NEEDS_ATTENTION"
  | "ON_TRACK"
  | "NO_CHANGE_RECOMMENDED"
  | "OBSERVED_PROGRESS"
  | "INSIGHTS";

export type NutritionCoachInsightKind =
  | "CALORIE_ADHERENCE"
  | "SCORE_TREND"
  | "BEST_DAY"
  | "PROTEIN_CONSISTENCY"
  | "LOGGING_STREAK"
  | "COACH_TIP"
  | "MEASURED_TDEE"
  | "WEEKEND_GAP"
  | "TREND_EXPLANATION"
  | "GOAL_FORECAST";

export type NutritionCoachInsightConfidence = "LOW" | "MEDIUM" | "HIGH";

export type GoalForecastStatus =
  | "AVAILABLE"
  | "INSUFFICIENT_EVIDENCE"
  | "STALE_EVIDENCE"
  | "FLAT_TREND"
  | "OPPOSITE_TREND"
  | "LOW_TREND_QUALITY"
  | "BEYOND_HORIZON";

export type GoalForecastMilestoneState = "REACHED" | "NEXT" | "UPCOMING";

export type GoalForecastMilestone = {
  progressPercent: 25 | 50 | 75 | 100;
  targetWeightKg: number;
  plannedDate: string;
  forecastDate: string | null;
  state: GoalForecastMilestoneState;
};

export type GoalForecast = {
  status: GoalForecastStatus;
  originalTargetDate: string;
  forecastTargetDate: string | null;
  delayDays: number | null;
  startWeightKg: number;
  targetWeightKg: number;
  fittedWeightKg: number | null;
  observedKgPerWeek: number | null;
  progressPercent: number;
  evidenceStart: string | null;
  evidenceEnd: string | null;
  weighInDayCount: number;
  weightSpanDays: number;
  milestones: GoalForecastMilestone[];
};
export type NutritionCoachEstimatorVersion = "OLS_7700_V1";
export type NutritionCoachDisplayPolicyVersion = "V1";
export type NutritionCoachInsightTrend = "UP" | "DOWN" | "STABLE";

type InsightBase<K extends NutritionCoachInsightKind> = {
  kind: K;
  impressionId: string;
  value: number;
};

export type NutritionCoachInsight =
  | (InsightBase<"CALORIE_ADHERENCE"> & {
      basis: "TARGET_COMPARISON";
      averageIntakeCalories: number;
      averageTargetCalories: number;
      deltaPercent: number;
      loggedDayCount: number;
      periodStart: string;
      periodEnd: string;
    })
  | (InsightBase<"SCORE_TREND"> & {
      trend: "UP" | "DOWN";
      basis: "LOGGED_DAYS";
      loggedDayCount: number;
      previousLoggedDayCount: number;
      periodStart: string;
      periodEnd: string;
    })
  | (InsightBase<"BEST_DAY"> & {
      basis: "LOGGED_DAYS";
      date: string;
      loggedDayCount: number;
      periodStart: string;
      periodEnd: string;
    })
  | (InsightBase<"PROTEIN_CONSISTENCY"> & {
      trend?: NutritionCoachInsightTrend;
      basis: "LOGGED_DAYS";
      loggedDayCount: number;
      periodStart: string;
      periodEnd: string;
    })
  | (InsightBase<"LOGGING_STREAK"> & { capped: boolean })
  | InsightBase<"COACH_TIP">
  | (InsightBase<"MEASURED_TDEE"> & {
      basis: "OBSERVED_ENERGY";
      confidence: NutritionCoachInsightConfidence;
      estimatorVersion: NutritionCoachEstimatorVersion;
      displayPolicyVersion: NutritionCoachDisplayPolicyVersion;
      windowDays: 14 | 21 | 28;
      loggedDayCount: number;
      weighInDayCount: number;
      weightSpanDays: number;
      periodStart: string;
      periodEnd: string;
    })
  | (InsightBase<"WEEKEND_GAP"> & {
      basis: "TARGET_COMPARISON";
      weekendTargetDeltaPercent: number;
      weekdayTargetDeltaPercent: number;
      weekendLoggedDayCount: number;
      weekdayLoggedDayCount: number;
      loggedDayCount: number;
      windowDays: 14;
      periodStart: string;
      periodEnd: string;
    })
  | (InsightBase<"TREND_EXPLANATION"> & {
      basis: "TARGET_COMPARISON";
      deltaPercent: number;
      weightTrendKgPerWeek: number;
      averageIntakeCalories: number;
      averageTargetCalories: number;
      loggedDayCount: number;
      weighInDayCount: number;
      weightSpanDays: number;
      windowDays: 14 | 21 | 28;
      confidence: NutritionCoachInsightConfidence;
      periodStart: string;
      periodEnd: string;
    })
  | (InsightBase<"GOAL_FORECAST"> & {
      basis: "WEIGHT_FORECAST";
      goalForecast: GoalForecast;
    });

export type NutritionCoachState = {
  mode: NutritionCoachMode | null;
  state: NutritionCoachStateName | null;
  asOf: string;
  collecting?: {
    weighIns: number;
    weighInsRequired: number;
    spanDays: number;
    spanDaysRequired: number;
    coveragePercent: number;
    coverageRequired: number;
    foodEvidenceDays?: number;
    foodEvidenceDaysRequired?: number;
    weighInDays?: number;
    weighInDaysRequired?: number;
    weightSpanDays?: number;
    weightSpanDaysRequired?: number;
    weighedInToday?: boolean;
    readinessReason?: NutritionCoachReadinessReason;
    nextUsefulAction?: NutritionCoachNextUsefulAction;
  } | null;
  recommendation?: RecalibrationSuggestionDto | null;
  waiting?: {
    appliedAt: string;
    nextEvaluationAt: string;
  } | null;
  measuredTdee?: number | null;
  analysisScope?: "ROLLING" | "TRIAL_HISTORY" | null;
  observedProgress?: {
    status:
      | "SUFFICIENT"
      | "INSUFFICIENT_FOOD"
      | "INSUFFICIENT_WEIGHT_DAYS"
      | "INSUFFICIENT_WEIGHT_SPAN";
    windowDays: number;
    windowStart: string;
    windowEnd: string;
    loggedDays: number;
    loggedDaysRequired: number;
    weighInDays: number;
    weightSpanDays: number;
    averageIntakeCalories: number | null;
    observedKgPerWeek: number | null;
    estimatedTdee: number | null;
  } | null;
  calculatorProvenanceComplete?: boolean;
  advancedScheduleAccess?: {
    degraded: boolean;
    degradedFrom: string | null;
    preserved: boolean;
  } | null;
  insights: NutritionCoachInsight[];
};

const modes = new Set<NutritionCoachMode>(["FULL", "INSIGHTS_ONLY"]);
const states = new Set<NutritionCoachStateName>([
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
]);
const trends = new Set<NutritionCoachInsightTrend>([
  "UP",
  "DOWN",
  "STABLE",
]);
const readinessReasons = new Set<NutritionCoachReadinessReason>([
  "INSUFFICIENT_FOOD_EVIDENCE",
  "INSUFFICIENT_WEIGH_IN_DAYS",
  "INSUFFICIENT_WEIGHT_SPAN",
  "INSUFFICIENT_FOOD_AND_WEIGHT_EVIDENCE",
]);
const nextUsefulActions = new Set<NutritionCoachNextUsefulAction>([
  "LOG_FOOD",
  "LOG_WEIGHT_TODAY",
  "WAIT_FOR_ANOTHER_WEIGHT_DAY",
  "EXTEND_WEIGHT_SPAN",
]);
const insightKinds = new Set<NutritionCoachInsightKind>([
  "CALORIE_ADHERENCE",
  "SCORE_TREND",
  "BEST_DAY",
  "PROTEIN_CONSISTENCY",
  "LOGGING_STREAK",
  "COACH_TIP",
  "MEASURED_TDEE",
  "WEEKEND_GAP",
  "TREND_EXPLANATION",
  "GOAL_FORECAST",
]);
const measuredTdeeConfidences = new Set<NutritionCoachInsightConfidence>([
  "LOW",
  "MEDIUM",
  "HIGH",
]);

export async function getNutritionCoachState(accessToken: string) {
  const payload = await apiGet<unknown>("/goals/coach/state", accessToken);
  return parseNutritionCoachState(payload);
}

export async function recordNutritionCoachImpression(
  accessToken: string,
  impressionId: string,
) {
  await apiPost<void>(
    "/goals/coach/impressions",
    { impressionId },
    { accessToken },
  );
}

/** Returns null for a broken rollout payload so the dashboard remains quiet. */
export function parseNutritionCoachState(payload: unknown): NutritionCoachState | null {
  if (!isRecord(payload) || !isIsoTimestamp(payload.asOf)) return null;
  if (payload.mode !== null && (!isString(payload.mode) || !modes.has(payload.mode as NutritionCoachMode))) {
    return null;
  }
  if (payload.state !== null && (!isString(payload.state) || !states.has(payload.state as NutritionCoachStateName))) {
    return null;
  }
  if (!Array.isArray(payload.insights)) return null;

  const collecting = parseCollecting(payload.collecting);
  if (payload.collecting !== undefined && payload.collecting !== null && !collecting) return null;

  const waiting = parseWaiting(payload.waiting);
  if (payload.waiting !== undefined && payload.waiting !== null && !waiting) return null;

  const recommendation = parseRecommendation(payload.recommendation);
  if (payload.recommendation !== undefined && payload.recommendation !== null && !recommendation) return null;
  if (
    payload.measuredTdee !== undefined &&
    payload.measuredTdee !== null &&
    !isFiniteNumber(payload.measuredTdee)
  ) {
    return null;
  }
  const observedProgress = parseObservedProgress(payload.observedProgress);
  if (payload.observedProgress !== undefined && payload.observedProgress !== null && !observedProgress) return null;
  const advancedScheduleAccess = parseAdvancedScheduleAccess(payload.advancedScheduleAccess);
  if (payload.advancedScheduleAccess !== undefined && payload.advancedScheduleAccess !== null && !advancedScheduleAccess) return null;
  if (payload.analysisScope !== undefined && payload.analysisScope !== null && payload.analysisScope !== "ROLLING" && payload.analysisScope !== "TRIAL_HISTORY") return null;
  if (payload.calculatorProvenanceComplete !== undefined && typeof payload.calculatorProvenanceComplete !== "boolean") return null;

  const state = payload.state as NutritionCoachStateName | null;
  if (state === "RECOMMENDATION" && !recommendation) return null;
  if (state === "WAITING" && !waiting) return null;
  if (state === "COLLECTING_DATA" && !collecting) return null;
  if (state === "OBSERVED_PROGRESS" && !observedProgress) return null;

  return {
    mode: payload.mode as NutritionCoachMode | null,
    state,
    asOf: payload.asOf,
    collecting,
    recommendation,
    waiting,
    measuredTdee:
      payload.measuredTdee === undefined
        ? null
        : (payload.measuredTdee as number | null),
    analysisScope: (payload.analysisScope as NutritionCoachState["analysisScope"]) ?? null,
    observedProgress,
    calculatorProvenanceComplete:
      payload.calculatorProvenanceComplete === undefined
        ? payload.mode === "FULL"
        : payload.calculatorProvenanceComplete,
    advancedScheduleAccess,
    insights: payload.insights.flatMap(parseInsight),
  };
}

function parseObservedProgress(value: unknown): NutritionCoachState["observedProgress"] {
  if (!isRecord(value)) return null;
  const status = value.status;
  if (!isString(status) || ![
    "SUFFICIENT",
    "INSUFFICIENT_FOOD",
    "INSUFFICIENT_WEIGHT_DAYS",
    "INSUFFICIENT_WEIGHT_SPAN",
  ].includes(status)) return null;
  const counts = ["windowDays", "loggedDays", "loggedDaysRequired", "weighInDays", "weightSpanDays"] as const;
  if (!counts.every((key) => isFiniteNumber(value[key]) && value[key] >= 0)) return null;
  if (!isIsoDate(value.windowStart) || !isIsoDate(value.windowEnd) || value.windowStart > value.windowEnd) return null;
  const optionalNumbers = ["averageIntakeCalories", "observedKgPerWeek", "estimatedTdee"] as const;
  if (!optionalNumbers.every((key) => value[key] == null || isFiniteNumber(value[key]))) return null;
  return {
    status: status as NonNullable<NutritionCoachState["observedProgress"]>["status"],
    windowDays: value.windowDays as number,
    windowStart: value.windowStart,
    windowEnd: value.windowEnd,
    loggedDays: value.loggedDays as number,
    loggedDaysRequired: value.loggedDaysRequired as number,
    weighInDays: value.weighInDays as number,
    weightSpanDays: value.weightSpanDays as number,
    averageIntakeCalories: (value.averageIntakeCalories as number | null | undefined) ?? null,
    observedKgPerWeek: (value.observedKgPerWeek as number | null | undefined) ?? null,
    estimatedTdee: (value.estimatedTdee as number | null | undefined) ?? null,
  };
}

function parseAdvancedScheduleAccess(value: unknown): NutritionCoachState["advancedScheduleAccess"] {
  if (!isRecord(value) || typeof value.degraded !== "boolean" || typeof value.preserved !== "boolean") return null;
  const degradedFrom = value.degradedFrom;
  if (value.degraded) {
    if (!isIsoDate(degradedFrom)) return null;
  } else if (degradedFrom != null) {
    return null;
  }
  return {
    degraded: value.degraded,
    // Spring omits null properties. Normalize the active-entitlement shape so
    // callers never need to distinguish an omitted value from explicit null.
    degradedFrom: (degradedFrom as string | null | undefined) ?? null,
    preserved: value.preserved,
  };
}

function parseCollecting(value: unknown): NutritionCoachState["collecting"] {
  if (!isRecord(value)) return null;
  const keys = [
    "weighIns",
    "weighInsRequired",
    "spanDays",
    "spanDaysRequired",
    "coveragePercent",
    "coverageRequired",
  ] as const;
  if (!keys.every((key) => isFiniteNumber(value[key]))) return null;

  const readinessKeys = [
    "foodEvidenceDays",
    "foodEvidenceDaysRequired",
    "weighInDays",
    "weighInDaysRequired",
    "weightSpanDays",
    "weightSpanDaysRequired",
    "weighedInToday",
    "readinessReason",
    "nextUsefulAction",
  ] as const;
  const hasReadiness = readinessKeys.some((key) => value[key] !== undefined);
  if (hasReadiness) {
    const countKeys = readinessKeys.slice(0, 6);
    const nextAction = value.nextUsefulAction as NutritionCoachNextUsefulAction;
    if (
      !countKeys.every(
        (key) =>
          isFiniteNumber(value[key]) &&
          Number.isInteger(value[key]) &&
          value[key] >= 0,
      ) ||
      typeof value.weighedInToday !== "boolean" ||
      !isString(value.readinessReason) ||
      !readinessReasons.has(value.readinessReason as NutritionCoachReadinessReason) ||
      !isString(value.nextUsefulAction) ||
      !nextUsefulActions.has(nextAction) ||
      (nextAction === "LOG_WEIGHT_TODAY" && value.weighedInToday) ||
      ((nextAction === "WAIT_FOR_ANOTHER_WEIGHT_DAY" ||
        nextAction === "EXTEND_WEIGHT_SPAN") &&
        !value.weighedInToday) ||
      (value.foodEvidenceDaysRequired as number) <= 0 ||
      (value.weighInDaysRequired as number) <= 0 ||
      (value.weightSpanDaysRequired as number) <= 0
    ) {
      return null;
    }
  }

  return {
    weighIns: value.weighIns as number,
    weighInsRequired: value.weighInsRequired as number,
    spanDays: value.spanDays as number,
    spanDaysRequired: value.spanDaysRequired as number,
    coveragePercent: value.coveragePercent as number,
    coverageRequired: value.coverageRequired as number,
    ...(hasReadiness
      ? {
          foodEvidenceDays: value.foodEvidenceDays as number,
          foodEvidenceDaysRequired: value.foodEvidenceDaysRequired as number,
          weighInDays: value.weighInDays as number,
          weighInDaysRequired: value.weighInDaysRequired as number,
          weightSpanDays: value.weightSpanDays as number,
          weightSpanDaysRequired: value.weightSpanDaysRequired as number,
          weighedInToday: value.weighedInToday as boolean,
          readinessReason:
            value.readinessReason as NutritionCoachReadinessReason,
          nextUsefulAction:
            value.nextUsefulAction as NutritionCoachNextUsefulAction,
        }
      : {}),
  };
}

function parseWaiting(value: unknown): NutritionCoachState["waiting"] {
  if (!isRecord(value) || !isIsoTimestamp(value.appliedAt) || !isIsoTimestamp(value.nextEvaluationAt)) return null;
  return { appliedAt: value.appliedAt, nextEvaluationAt: value.nextEvaluationAt };
}

function parseRecommendation(value: unknown): RecalibrationSuggestionDto | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.status) || !isRecord(value.suggested) || !isRecord(value.previous) || !isRecord(value.basis) || !isIsoTimestamp(value.createdAt) || !isIsoTimestamp(value.expiresAt)) {
    return null;
  }
  if (!["PENDING", "ACCEPTED", "DISMISSED", "EXPIRED", "SUPERSEDED"].includes(value.status)) return null;
  if (!hasTargets(value.suggested) || !hasTargets(value.previous)) return null;

  return {
    id: value.id,
    status: value.status as RecalibrationSuggestionDto["status"],
    suggested: targetsFrom(value.suggested),
    previous: targetsFrom(value.previous),
    basis: value.basis,
    createdAt: value.createdAt,
    expiresAt: value.expiresAt,
  };
}

function parseInsight(value: unknown): NutritionCoachInsight[] {
  if (
    !isRecord(value) ||
    !isString(value.kind) ||
    !isString(value.impressionId) ||
    !isFiniteInteger(value.value)
  ) return [];
  if (!insightKinds.has(value.kind as NutritionCoachInsightKind)) return [];
  if (!isValidImpressionId(value.impressionId)) return [];
  // Absent and explicitly null both mean "this kind makes no directional claim".
  // The backend omits nulls today, but the contract is that the field is optional,
  // not that it is missing, and a serializer setting would otherwise silently
  // reject every neutral observation.
  if (value.trend != null && (!isString(value.trend) || !trends.has(value.trend as NutritionCoachInsightTrend))) {
    return [];
  }
  if (value.capped !== undefined && typeof value.capped !== "boolean") return [];
  if (value.date !== undefined && value.date !== null && !isIsoDate(value.date)) return [];
  if (value.kind === "MEASURED_TDEE") {
    return parseMeasuredTdeeInsight(value);
  }
  if (value.kind === "WEEKEND_GAP") {
    return parseWeekendGapInsight(value);
  }
  if (value.kind === "TREND_EXPLANATION") {
    return parseTrendExplanationInsight(value);
  }
  if (value.kind === "GOAL_FORECAST") {
    return parseGoalForecastInsight(value);
  }
  if (value.kind === "CALORIE_ADHERENCE") {
    if (
      value.basis !== "TARGET_COMPARISON" ||
      !isFiniteNumber(value.averageIntakeCalories) ||
      value.averageIntakeCalories < 0 ||
      !isFiniteNumber(value.averageTargetCalories) ||
      value.averageTargetCalories <= 0 ||
      !isFiniteNumber(value.deltaPercent) ||
      Math.abs(value.value - value.deltaPercent) > 0.500001 ||
      (value.deltaPercent < 0 && value.value > 0) ||
      (value.deltaPercent > 0 && value.value < 0) ||
      !isFiniteNumber(value.loggedDayCount) ||
      !Number.isInteger(value.loggedDayCount) ||
      value.loggedDayCount < 2 ||
      !isIsoDate(value.periodStart) ||
      !isIsoDate(value.periodEnd) ||
      value.periodStart > value.periodEnd
    ) {
      return [];
    }
    return [{
      kind: "CALORIE_ADHERENCE",
      impressionId: value.impressionId,
      value: value.value,
      basis: "TARGET_COMPARISON",
      averageIntakeCalories: value.averageIntakeCalories,
      averageTargetCalories: value.averageTargetCalories,
      deltaPercent: value.deltaPercent,
      loggedDayCount: value.loggedDayCount,
      periodStart: value.periodStart,
      periodEnd: value.periodEnd,
    }];
  }
  if (value.kind === "COACH_TIP") {
    return value.value >= 0 && value.value < 40
      ? [{ kind: "COACH_TIP", impressionId: value.impressionId, value: value.value }]
      : [];
  }
  if (value.kind === "LOGGING_STREAK") {
    return value.value > 0 && typeof value.capped === "boolean"
      ? [{
          kind: "LOGGING_STREAK",
          impressionId: value.impressionId,
          value: value.value,
          capped: value.capped,
        }]
      : [];
  }
  if (
    value.basis !== "LOGGED_DAYS" ||
    !isFiniteInteger(value.loggedDayCount) ||
    value.loggedDayCount < 1 ||
    !isIsoDate(value.periodStart) ||
    !isIsoDate(value.periodEnd) ||
    value.periodStart > value.periodEnd
  ) return [];
  if (value.kind === "BEST_DAY") {
    return isIsoDate(value.date)
      ? [{
          kind: "BEST_DAY",
          impressionId: value.impressionId,
          value: value.value,
          basis: "LOGGED_DAYS",
          date: value.date,
          loggedDayCount: value.loggedDayCount,
          periodStart: value.periodStart,
          periodEnd: value.periodEnd,
        }]
      : [];
  }
  if (value.kind === "SCORE_TREND") {
    if (
      (value.trend !== "UP" && value.trend !== "DOWN") ||
      !isFiniteInteger(value.previousLoggedDayCount) ||
      value.previousLoggedDayCount < 1
    ) return [];
    return [{
      kind: "SCORE_TREND",
      impressionId: value.impressionId,
      value: value.value,
      trend: value.trend,
      basis: "LOGGED_DAYS",
      loggedDayCount: value.loggedDayCount,
      previousLoggedDayCount: value.previousLoggedDayCount,
      periodStart: value.periodStart,
      periodEnd: value.periodEnd,
    }];
  }
  if (value.kind === "PROTEIN_CONSISTENCY") {
    return [{
      kind: "PROTEIN_CONSISTENCY",
      impressionId: value.impressionId,
      value: value.value,
      ...(value.trend == null ? {} : { trend: value.trend as NutritionCoachInsightTrend }),
      basis: "LOGGED_DAYS",
      loggedDayCount: value.loggedDayCount,
      periodStart: value.periodStart,
      periodEnd: value.periodEnd,
    }];
  }
  return [];
}

function parseMeasuredTdeeInsight(
  value: Record<string, unknown>,
): NutritionCoachInsight[] {
  if (
    value.basis !== "OBSERVED_ENERGY" ||
    !isFiniteNumber(value.value) ||
    !Number.isInteger(value.value) ||
    value.value <= 0 ||
    value.value % 10 !== 0 ||
    !isString(value.confidence) ||
    !measuredTdeeConfidences.has(value.confidence as NutritionCoachInsightConfidence) ||
    value.estimatorVersion !== "OLS_7700_V1" ||
    value.displayPolicyVersion !== "V1" ||
    !isFiniteInteger(value.windowDays) ||
    ![14, 21, 28].includes(value.windowDays) ||
    !isFiniteInteger(value.loggedDayCount) ||
    value.loggedDayCount < 0 ||
    !isFiniteInteger(value.weighInDayCount) ||
    value.weighInDayCount < 0 ||
    !isFiniteInteger(value.weightSpanDays) ||
    value.weightSpanDays < 0 ||
    !isIsoDate(value.periodStart) ||
    !isIsoDate(value.periodEnd) ||
    value.periodStart > value.periodEnd ||
    isoDateSpan(value.periodStart, value.periodEnd) !== value.windowDays
  ) return [];

  return [{
    kind: "MEASURED_TDEE",
    impressionId: value.impressionId as string,
    value: value.value,
    basis: "OBSERVED_ENERGY",
    confidence: value.confidence as NutritionCoachInsightConfidence,
    estimatorVersion: "OLS_7700_V1",
    displayPolicyVersion: "V1",
    windowDays: value.windowDays as 14 | 21 | 28,
    loggedDayCount: value.loggedDayCount,
    weighInDayCount: value.weighInDayCount,
    weightSpanDays: value.weightSpanDays,
    periodStart: value.periodStart,
    periodEnd: value.periodEnd,
  }];
}

const WEEKEND_GAP_WINDOW_DAYS = 14;
const WEEKEND_GAP_MIN_POINTS = 10;

/**
 * The gap is a difference of two target-relative percentages, so the payload is
 * only trusted when both groups, their day counts, and the signed display value
 * agree with each other. The impression ID stays opaque.
 */
function parseWeekendGapInsight(
  value: Record<string, unknown>,
): NutritionCoachInsight[] {
  if (
    value.basis !== "TARGET_COMPARISON" ||
    value.trend != null ||
    !isFiniteInteger(value.value) ||
    !isFiniteNumber(value.weekendTargetDeltaPercent) ||
    !isFiniteNumber(value.weekdayTargetDeltaPercent) ||
    !isFiniteInteger(value.weekendLoggedDayCount) ||
    value.weekendLoggedDayCount < 3 ||
    value.weekendLoggedDayCount > 4 ||
    !isFiniteInteger(value.weekdayLoggedDayCount) ||
    value.weekdayLoggedDayCount < 6 ||
    value.weekdayLoggedDayCount > 10 ||
    !isFiniteInteger(value.loggedDayCount) ||
    value.loggedDayCount !==
      value.weekendLoggedDayCount + value.weekdayLoggedDayCount ||
    value.windowDays !== WEEKEND_GAP_WINDOW_DAYS ||
    !isIsoDate(value.periodStart) ||
    !isIsoDate(value.periodEnd) ||
    value.periodStart > value.periodEnd ||
    isoDateSpan(value.periodStart, value.periodEnd) !== WEEKEND_GAP_WINDOW_DAYS
  ) return [];

  const rawGap =
    value.weekendTargetDeltaPercent - value.weekdayTargetDeltaPercent;
  if (
    Math.abs(rawGap) < WEEKEND_GAP_MIN_POINTS ||
    Math.abs(value.value - rawGap) > 0.500001 ||
    (rawGap < 0 && value.value > 0) ||
    (rawGap > 0 && value.value < 0)
  ) return [];

  return [{
    kind: "WEEKEND_GAP",
    impressionId: value.impressionId as string,
    value: value.value,
    basis: "TARGET_COMPARISON",
    weekendTargetDeltaPercent: value.weekendTargetDeltaPercent,
    weekdayTargetDeltaPercent: value.weekdayTargetDeltaPercent,
    weekendLoggedDayCount: value.weekendLoggedDayCount,
    weekdayLoggedDayCount: value.weekdayLoggedDayCount,
    loggedDayCount: value.loggedDayCount,
    windowDays: WEEKEND_GAP_WINDOW_DAYS,
    periodStart: value.periodStart,
    periodEnd: value.periodEnd,
  }];
}

const TREND_EXPLANATION_WINDOW_DAYS = new Set([14, 21, 28]);
const TREND_EXPLANATION_MIN_KG_PER_WEEK = 0.2;
const TREND_EXPLANATION_MAX_KG_PER_WEEK = 1.5;

/**
 * Two recorded facts, so the payload is only trusted when the rounded display value,
 * the authoritative delta, the positive weight trend, both averages, and the window
 * length all agree with each other. The generic `trend=UP` label must never be present:
 * the frontend reads UP as improvement, which this observation deliberately does not claim.
 */
function parseTrendExplanationInsight(
  value: Record<string, unknown>,
): NutritionCoachInsight[] {
  if (
    value.basis !== "TARGET_COMPARISON" ||
    value.trend != null ||
    !isFiniteInteger(value.value) ||
    value.value >= 0 ||
    !isFiniteNumber(value.deltaPercent) ||
    value.deltaPercent >= 0 ||
    Math.abs(value.value - value.deltaPercent) > 0.500001 ||
    !isFiniteNumber(value.weightTrendKgPerWeek) ||
    value.weightTrendKgPerWeek < TREND_EXPLANATION_MIN_KG_PER_WEEK ||
    value.weightTrendKgPerWeek > TREND_EXPLANATION_MAX_KG_PER_WEEK ||
    !isFiniteInteger(value.averageIntakeCalories) ||
    value.averageIntakeCalories < 0 ||
    !isFiniteInteger(value.averageTargetCalories) ||
    value.averageTargetCalories <= 0 ||
    value.averageIntakeCalories >= value.averageTargetCalories ||
    !isFiniteInteger(value.loggedDayCount) ||
    value.loggedDayCount < 3 ||
    !isFiniteInteger(value.weighInDayCount) ||
    value.weighInDayCount < 3 ||
    !isFiniteInteger(value.weightSpanDays) ||
    value.weightSpanDays < 7 ||
    !isFiniteInteger(value.windowDays) ||
    !TREND_EXPLANATION_WINDOW_DAYS.has(value.windowDays) ||
    !isString(value.confidence) ||
    !measuredTdeeConfidences.has(value.confidence as NutritionCoachInsightConfidence) ||
    !isIsoDate(value.periodStart) ||
    !isIsoDate(value.periodEnd) ||
    value.periodStart > value.periodEnd ||
    isoDateSpan(value.periodStart, value.periodEnd) !== value.windowDays
  ) return [];

  return [{
    kind: "TREND_EXPLANATION",
    impressionId: value.impressionId as string,
    value: value.value,
    basis: "TARGET_COMPARISON",
    deltaPercent: value.deltaPercent,
    weightTrendKgPerWeek: value.weightTrendKgPerWeek,
    averageIntakeCalories: value.averageIntakeCalories,
    averageTargetCalories: value.averageTargetCalories,
    loggedDayCount: value.loggedDayCount,
    weighInDayCount: value.weighInDayCount,
    weightSpanDays: value.weightSpanDays,
    windowDays: value.windowDays as 14 | 21 | 28,
    confidence: value.confidence as NutritionCoachInsightConfidence,
    periodStart: value.periodStart,
    periodEnd: value.periodEnd,
  }];
}

const GOAL_FORECAST_PROGRESS_STEPS = [25, 50, 75, 100] as const;
const GOAL_FORECAST_MIN_WEIGH_IN_DAYS = 5;
const GOAL_FORECAST_MIN_SPAN_DAYS = 14;
const GOAL_FORECAST_MAX_HORIZON_DAYS = 365;
const goalForecastStatuses = new Set<GoalForecastStatus>([
  "AVAILABLE",
  "INSUFFICIENT_EVIDENCE",
  "STALE_EVIDENCE",
  "FLAT_TREND",
  "OPPOSITE_TREND",
  "LOW_TREND_QUALITY",
  "BEYOND_HORIZON",
]);
const goalForecastMilestoneStates = new Set<GoalForecastMilestoneState>([
  "REACHED",
  "NEXT",
  "UPCOMING",
]);

/**
 * The whole observation is rejected rather than partially rendered, because a
 * milestone list that disagrees with its own summary would show the person a
 * schedule that does not exist. Every internal relationship is re-checked here:
 * the four fixed percentages, weights moving toward the goal, ordered planned and
 * projected dates, the end forecast agreeing with the final block, and — for any
 * unavailable state — the complete absence of projected dates.
 */
function parseGoalForecastInsight(
  value: Record<string, unknown>,
): NutritionCoachInsight[] {
  if (
    value.basis !== "WEIGHT_FORECAST" ||
    value.trend != null ||
    !isFiniteInteger(value.value)
  ) return [];
  const raw = value.goalForecast;
  if (!isRecord(raw)) return [];
  if (!isString(raw.status) || !goalForecastStatuses.has(raw.status as GoalForecastStatus)) {
    return [];
  }
  const status = raw.status as GoalForecastStatus;
  const available = status === "AVAILABLE";

  if (
    !isIsoDate(raw.originalTargetDate) ||
    !isFiniteNumber(raw.startWeightKg) ||
    raw.startWeightKg <= 0 ||
    !isFiniteNumber(raw.targetWeightKg) ||
    raw.targetWeightKg <= 0 ||
    raw.startWeightKg === raw.targetWeightKg ||
    !isFiniteNumber(raw.progressPercent) ||
    raw.progressPercent < 0 ||
    raw.progressPercent > 100 ||
    Math.abs(value.value - raw.progressPercent) > 0.500001 ||
    !isFiniteInteger(raw.weighInDayCount) ||
    raw.weighInDayCount < 0 ||
    !isFiniteInteger(raw.weightSpanDays) ||
    raw.weightSpanDays < 0 ||
    !Array.isArray(raw.milestones) ||
    raw.milestones.length !== GOAL_FORECAST_PROGRESS_STEPS.length
  ) return [];

  const evidenceStart = optionalIsoDate(raw.evidenceStart);
  const evidenceEnd = optionalIsoDate(raw.evidenceEnd);
  if (evidenceStart === false || evidenceEnd === false) return [];
  if ((evidenceStart === null) !== (evidenceEnd === null)) return [];
  if (evidenceStart !== null && evidenceEnd !== null) {
    if (
      evidenceStart > evidenceEnd ||
      isoDateSpan(evidenceStart, evidenceEnd) - 1 !== raw.weightSpanDays
    ) return [];
  } else if (raw.weighInDayCount !== 0 || raw.weightSpanDays !== 0) {
    return [];
  }

  const forecastTargetDate = optionalIsoDate(raw.forecastTargetDate);
  if (forecastTargetDate === false) return [];
  const delayDays = optionalNumber(raw.delayDays);
  const fittedWeightKg = optionalNumber(raw.fittedWeightKg);
  const observedKgPerWeek = optionalNumber(raw.observedKgPerWeek);
  if (delayDays === false || fittedWeightKg === false || observedKgPerWeek === false) {
    return [];
  }

  if (available) {
    if (
      forecastTargetDate === null ||
      delayDays === null ||
      !Number.isInteger(delayDays) ||
      fittedWeightKg === null ||
      observedKgPerWeek === null ||
      observedKgPerWeek === 0 ||
      evidenceStart === null ||
      evidenceEnd === null ||
      raw.weighInDayCount < GOAL_FORECAST_MIN_WEIGH_IN_DAYS ||
      raw.weightSpanDays < GOAL_FORECAST_MIN_SPAN_DAYS ||
      forecastTargetDate <= evidenceEnd ||
      isoDateSpan(evidenceEnd, forecastTargetDate) - 1 > GOAL_FORECAST_MAX_HORIZON_DAYS ||
      isoDateSpan(raw.originalTargetDate, forecastTargetDate) - 1 !== delayDays
    ) return [];
  } else if (
    forecastTargetDate !== null ||
    delayDays !== null ||
    fittedWeightKg !== null ||
    observedKgPerWeek !== null
  ) return [];

  const losing = raw.targetWeightKg < raw.startWeightKg;
  const milestones: GoalForecastMilestone[] = [];
  for (const [index, step] of GOAL_FORECAST_PROGRESS_STEPS.entries()) {
    const entry = raw.milestones[index];
    if (
      !isRecord(entry) ||
      entry.progressPercent !== step ||
      !isFiniteNumber(entry.targetWeightKg) ||
      entry.targetWeightKg <= 0 ||
      !isIsoDate(entry.plannedDate) ||
      !isString(entry.state) ||
      !goalForecastMilestoneStates.has(entry.state as GoalForecastMilestoneState)
    ) return [];

    const forecastDate = optionalIsoDate(entry.forecastDate);
    if (forecastDate === false) return [];
    const state = entry.state as GoalForecastMilestoneState;
    if (state === "REACHED" && forecastDate !== null) return [];
    if (!available && forecastDate !== null) return [];
    if (available && state !== "REACHED" && forecastDate === null) return [];

    const previous = milestones[index - 1];
    if (previous) {
      if (
        losing
          ? entry.targetWeightKg >= previous.targetWeightKg
          : entry.targetWeightKg <= previous.targetWeightKg
      ) return [];
      if (entry.plannedDate < previous.plannedDate) return [];
      if (
        forecastDate !== null &&
        previous.forecastDate !== null &&
        forecastDate < previous.forecastDate
      ) return [];
      // Once a block is unfinished, no later block may be reported as reached.
      if (state === "REACHED" && previous.state !== "REACHED") return [];
      if (state === "NEXT" && previous.state !== "REACHED") return [];
    }

    milestones.push({
      progressPercent: step,
      targetWeightKg: entry.targetWeightKg,
      plannedDate: entry.plannedDate,
      forecastDate,
      state,
    });
  }

  const finalMilestone = milestones[milestones.length - 1];
  if (
    finalMilestone.plannedDate !== raw.originalTargetDate ||
    Math.abs(finalMilestone.targetWeightKg - raw.targetWeightKg) > 0.0005 ||
    finalMilestone.forecastDate !== forecastTargetDate ||
    milestones.filter((milestone) => milestone.state === "NEXT").length !==
      (finalMilestone.state === "REACHED" ? 0 : 1)
  ) return [];

  return [{
    kind: "GOAL_FORECAST",
    impressionId: value.impressionId as string,
    value: value.value,
    basis: "WEIGHT_FORECAST",
    goalForecast: {
      status,
      originalTargetDate: raw.originalTargetDate,
      forecastTargetDate,
      delayDays,
      startWeightKg: raw.startWeightKg,
      targetWeightKg: raw.targetWeightKg,
      fittedWeightKg,
      observedKgPerWeek,
      progressPercent: raw.progressPercent,
      evidenceStart,
      evidenceEnd,
      weighInDayCount: raw.weighInDayCount,
      weightSpanDays: raw.weightSpanDays,
      milestones,
    },
  }];
}

/** Null for an omitted or explicitly null date, false for anything malformed. */
function optionalIsoDate(value: unknown): string | null | false {
  if (value === undefined || value === null) return null;
  return isIsoDate(value) ? value : false;
}

/** Null for an omitted or explicitly null number, false for anything malformed. */
function optionalNumber(value: unknown): number | null | false {
  if (value === undefined || value === null) return null;
  return isFiniteNumber(value) ? value : false;
}

function isValidImpressionId(value: string) {
  return value.length >= 1 && value.length <= 80;
}

function hasTargets(value: Record<string, unknown>) {
  return ["calories", "protein", "carbs", "fat"].every((key) => isFiniteNumber(value[key]));
}

function targetsFrom(value: Record<string, unknown>) {
  return {
    calories: value.calories as number,
    protein: value.protein as number,
    carbs: value.carbs as number,
    fat: value.fat as number,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isFiniteInteger(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value);
}

function isIsoTimestamp(value: unknown): value is string {
  return isString(value) && !Number.isNaN(Date.parse(value));
}

function isIsoDate(value: unknown): value is string {
  if (!isString(value) || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isoDateSpan(start: string, end: string) {
  const startTime = Date.parse(`${start}T00:00:00.000Z`);
  const endTime = Date.parse(`${end}T00:00:00.000Z`);
  return Math.round((endTime - startTime) / 86_400_000) + 1;
}
