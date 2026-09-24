import {apiGet, apiPost} from "./client";

export type NutritionProgressPeriod = "WEEK" | "MONTH" | "PHASE";
export type WeightProgressPeriod = "WEEK" | "PHASE";

export type ProgressNutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
};

export type ProgressGoalTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
};

export type ProgressGoalAdherence = {
  caloriesDelta: number;
  proteinDelta: number;
  carbsDelta: number;
  fatDelta: number;
  fiberDelta: number | null;
};

export type NutritionProgressPoint = {
  date: string;
  logged: boolean;
  totals: ProgressNutritionTotals;
  goal: {
    configured: boolean;
    targets: ProgressGoalTargets | null;
    adherence: ProgressGoalAdherence | null;
  } | null;
};

export type NutritionProgressResponseDto = {
  period: NutritionProgressPeriod;
  timezone: string;
  from: string;
  to: string;
  points: NutritionProgressPoint[];
  summary: {
    totals: ProgressNutritionTotals;
    averagePerDay: ProgressNutritionTotals;
    averagePerLoggedDay: ProgressNutritionTotals | null;
    minDailyTotals: ProgressNutritionTotals | null;
    maxDailyTotals: ProgressNutritionTotals | null;
    loggedDayCount: number;
    missingDayCount: number;
  };
};

export type NutritionProgressRequest =
  | {period: "WEEK"; anchor: string}
  | {period: "MONTH"; month: string}
  | {period: "PHASE"; from: string; to: string};

export type NutritionBatchProgressRangeRequest = {
  requestId: string;
} & NutritionProgressRequest;

export type NutritionBatchProgressRequestDto = {
  ranges: NutritionBatchProgressRangeRequest[];
};

export type NutritionBatchProgressResultEnvelope =
  NutritionProgressResponseDto & {
    requestId: string;
  };

export type NutritionBatchProgressResponseDto = {
  results: NutritionBatchProgressResultEnvelope[];
};

export type WeeklyProgressMetric = {
  total: number;
  average: number | null;
  goalAveragePercent: number | null;
};

export type WeeklyProgressResponseDto = {
  timezone: string;
  from: string;
  to: string;
  nutrition: {
    loggedDayCount: number;
    missingDayCount: number;
    calories: WeeklyProgressMetric;
    macros: {
      protein: WeeklyProgressMetric;
      carbs: WeeklyProgressMetric;
      fat: WeeklyProgressMetric;
    };
    micronutrients: {
      fiber: WeeklyProgressMetric;
      sugar: WeeklyProgressMetric;
      sodium: WeeklyProgressMetric;
    };
  };
  weight: {
    configured: boolean;
    startWeightKg: number | null;
    endWeightKg: number | null;
    absoluteChangeKg: number | null;
    trendDirection: "DOWN" | "UP" | "FLAT" | "INSUFFICIENT_DATA" | string | null;
    targetWeightKg: number | null;
  } | null;
  warnings: string[];
};

export type WeightProgressResponseDto = {
  period: WeightProgressPeriod;
  timezone: string;
  from: string;
  to: string;
  latestMeasurementDate: string | null;
  points: Array<{
    date: string;
    weightKg: number | null;
    hasMeasurement: boolean;
  }>;
  summary: {
    startWeightKg: number | null;
    endWeightKg: number | null;
    absoluteChangeKg: number | null;
    percentChange: number | null;
    trendDirection: "DOWN" | "UP" | "FLAT" | "INSUFFICIENT_DATA" | string;
    measurementCount: number;
    missingDayCount: number;
  };
  /**
   * Fitted line over this range, or null below three measured days. Optional so the
   * frontend can deploy ahead of the API.
   *
   * The recalibration engine fits over its own fixed window, so its slope describes a
   * different interval and will not match this one. Never label this as the line behind
   * a recalibration suggestion.
   */
  trend?: WeightTrendDto | null;
};

export type WeightTrendDto = {
  method: string;
  slopeKgPerWeek: number;
  direction: "DOWN" | "UP" | "FLAT" | "INSUFFICIENT_DATA" | string;
  startValueKg: number;
  endValueKg: number;
  /** Measured dates only; no synthetic points are emitted for unmeasured days. */
  points: Array<{date: string; fittedWeightKg: number}>;
};

export type WeightProgressRequest =
  | {period: "WEEK"; anchor: string}
  | {period: "PHASE"; from: string; to: string};

export type WeightBatchProgressRangeRequest = {
  requestId: string;
} & WeightProgressRequest;

export type WeightBatchProgressRequestDto = {
  ranges: WeightBatchProgressRangeRequest[];
};

export type WeightBatchProgressResultEnvelope =
  WeightProgressResponseDto & {
    requestId: string;
  };

export type WeightBatchProgressResponseDto = {
  results: WeightBatchProgressResultEnvelope[];
};

export async function getWeeklyProgress(
  request: string | {from: string; to: string},
  accessToken: string,
) {
  const query =
    typeof request === "string"
      ? `anchor=${encodeURIComponent(request)}`
      : new URLSearchParams({from: request.from, to: request.to}).toString();

  return apiGet<WeeklyProgressResponseDto>(
    `/progress/weekly?${query}`,
    accessToken,
  );
}

export async function getWeightProgress(
  request: WeightProgressRequest,
  accessToken: string,
) {
  const searchParams = new URLSearchParams({period: request.period});

  if (request.period === "WEEK") {
    searchParams.set("anchor", request.anchor);
  } else {
    searchParams.set("from", request.from);
    searchParams.set("to", request.to);
  }

  return apiGet<WeightProgressResponseDto>(
    `/progress/weight?${searchParams.toString()}`,
    accessToken,
  );
}

export async function getWeightProgressBatch(
  request: WeightBatchProgressRequestDto,
  accessToken: string,
) {
  return apiPost<WeightBatchProgressResponseDto>(
    "/progress/weight/batch",
    request,
    {accessToken},
  );
}

export async function getNutritionProgress(
  request: NutritionProgressRequest,
  accessToken: string,
) {
  const searchParams = nutritionProgressSearchParams(request);
  return apiGet<NutritionProgressResponseDto>(
    `/progress/nutrition?${searchParams.toString()}`,
    accessToken,
  );
}

export async function getNutritionProgressBatch(
  request: NutritionBatchProgressRequestDto,
  accessToken: string,
) {
  return apiPost<NutritionBatchProgressResponseDto>(
    "/progress/nutrition/batch",
    request,
    {accessToken},
  );
}

export async function getWeeklyNutritionProgress(anchor: string, accessToken: string) {
  return getNutritionProgress({period: "WEEK", anchor}, accessToken);
}

function nutritionProgressSearchParams(request: NutritionProgressRequest) {
  const searchParams = new URLSearchParams({period: request.period});

  if (request.period === "WEEK") {
    searchParams.set("anchor", request.anchor);
  } else if (request.period === "MONTH") {
    searchParams.set("month", request.month);
  } else {
    searchParams.set("from", request.from);
    searchParams.set("to", request.to);
  }

  return searchParams;
}
