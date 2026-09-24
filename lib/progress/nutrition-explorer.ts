import type {
	NutritionBatchProgressRangeRequest,
  NutritionProgressPeriod,
  NutritionProgressPoint,
  NutritionProgressRequest,
  NutritionProgressResponseDto,
  ProgressGoalAdherence,
	ProgressNutritionTotals,
} from "@/lib/api/progress";
import { formatNutritionRangeChartDate } from "./nutrition-chart";
import {shiftDiaryDate} from "../diary/date";
import {localWeekEnd, localWeekStart} from "../diary/week";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH = /^\d{4}-\d{2}$/;
const MILLIS_PER_DAY = 86_400_000;

export type NutritionExplorerSearchParams = {
  period?: string;
  date?: string;
  month?: string;
  from?: string;
  to?: string;
};

export type NutritionExplorerState = {
  period: NutritionProgressPeriod;
  date: string;
  month: string;
  from: string;
  to: string;
  labelFrom: string;
  labelTo: string;
  activeRequest: NutritionProgressRequest;
};

export type NutritionChartPoint = {
  date: string;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MicronutrientKey = "fiber" | "sugar" | "sodium";

export type MicronutrientRow = {
  key: MicronutrientKey;
  label: string;
  unit: string;
  total: number;
  averagePerDay: number;
  averagePerLoggedDay: number | null;
};

export type NutritionCoverageState = {
  loggedDayCount: number;
  missingDayCount: number;
  totalDayCount: number;
  hasLoggedDays: boolean;
  hasMissingDays: boolean;
  hasPartialLogging: boolean;
  hasLoggedZeroDay: boolean;
  hasGoal: boolean;
};

export type NutritionGoalAdherenceRow = {
  key: keyof ProgressGoalAdherence;
  label: string;
  unit: string;
  averageDelta: number;
};

export type NutritionComparisonCopy = {
  title: string;
  currentRangeLabel: string;
  previousRangeLabel: string;
  explanation: string;
};

const micronutrientDefinitions = [
  {key: "fiber", label: "فیبر", unit: "گرم"},
  {key: "sugar", label: "قند", unit: "گرم"},
  {key: "sodium", label: "سدیم", unit: "میلی‌گرم"},
] satisfies Array<{
  key: MicronutrientKey;
  label: string;
  unit: string;
}>;

const adherenceDefinitions = [
  {key: "caloriesDelta", label: "کالری", unit: "کالری"},
  {key: "proteinDelta", label: "پروتئین", unit: "گرم"},
  {key: "carbsDelta", label: "کربوهیدرات", unit: "گرم"},
  {key: "fatDelta", label: "چربی", unit: "گرم"},
  {key: "fiberDelta", label: "فیبر", unit: "گرم"},
] satisfies Array<{
  key: keyof ProgressGoalAdherence;
  label: string;
  unit: string;
}>;

export function resolveNutritionExplorerState(
  params: NutritionExplorerSearchParams,
  selectedDate: string,
  locale = "fa-IR",
): NutritionExplorerState {
  const period = nutritionExplorerPeriod(params.period);
  const month = isIsoMonth(params.month)
    ? params.month
    : monthFromDate(selectedDate);
  const defaultPhaseRange = monthRange(monthFromDate(selectedDate));
  const from = isIsoDate(params.from) ? params.from : defaultPhaseRange.from;
  const to = isIsoDate(params.to) ? params.to : defaultPhaseRange.to;
  const normalizedPhaseRange = normalizePhaseRange(from, to);
  const weekRange = {
    from: localWeekStart(selectedDate, locale),
    to: localWeekEnd(selectedDate, locale),
  };
  const activeRequest = nutritionProgressRequestFor({
    period,
    date: selectedDate,
    month,
    from: normalizedPhaseRange.from,
    to: normalizedPhaseRange.to,
  });
  const activeRange =
    period === "WEEK"
      ? weekRange
      : period === "MONTH"
        ? monthRange(month)
        : normalizedPhaseRange;

  return {
    period,
    date: selectedDate,
    month,
    from: normalizedPhaseRange.from,
    to: normalizedPhaseRange.to,
    labelFrom: activeRange.from,
    labelTo: activeRange.to,
    activeRequest,
  };
}

export function nutritionExplorerModeHref(
  state: NutritionExplorerState,
  nextPeriod: NutritionProgressPeriod,
) {
  const params = new URLSearchParams({
    period: nextPeriod,
    date: state.date,
  });

  if (nextPeriod === "MONTH") {
    params.set("month", state.month);
  } else if (nextPeriod === "PHASE") {
    params.set("from", state.from);
    params.set("to", state.to);
  }

  return `/progress/nutrition?${params.toString()}`;
}

export function nutritionExplorerHref(
  next: Pick<NutritionExplorerState, "period" | "date" | "month" | "from" | "to">,
) {
  const params = new URLSearchParams({
    period: next.period,
    date: next.date,
  });

  if (next.period === "MONTH") {
    params.set("month", next.month);
  } else if (next.period === "PHASE") {
    const phaseRange = normalizePhaseRange(next.from, next.to);
    params.set("from", phaseRange.from);
    params.set("to", phaseRange.to);
  }

  return `/progress/nutrition?${params.toString()}`;
}

export function comparisonRangesForNutritionExplorer(
  state: NutritionExplorerState,
): NutritionBatchProgressRangeRequest[] {
  return [
    {requestId: "current", ...state.activeRequest},
    {
      requestId: "previous",
      ...previousNutritionProgressRequest(state),
    },
  ];
}

export function nutritionComparisonCopy(
  state: NutritionExplorerState,
): NutritionComparisonCopy {
  const currentRangeLabel = `${state.labelFrom} تا ${state.labelTo}`;

  if (state.period === "WEEK") {
    return {
      title: "مقایسه با هفته قبل",
      currentRangeLabel,
      previousRangeLabel: `${shiftDiaryDate(state.labelFrom, -7)} تا ${shiftDiaryDate(state.labelTo, -7)}`,
      explanation: "هفته قبل همان بازه هفت‌روزه قبل از هفته فعلی است.",
    };
  }

  if (state.period === "MONTH") {
    const previousRange = monthRange(previousMonth(state.month));
    return {
      title: "مقایسه با ماه قبل",
      currentRangeLabel,
      previousRangeLabel: `${previousRange.from} تا ${previousRange.to}`,
      explanation: "ماه قبل با کل ماه فعلی مقایسه می‌شود، نه فقط روزهای ثبت‌شده.",
    };
  }

  const previousRange = previousPhaseRange(state.from, state.to);
  return {
    title: "مقایسه با فاز قبلی",
    currentRangeLabel,
    previousRangeLabel: `${previousRange.from} تا ${previousRange.to}`,
    explanation:
      "فاز قبلی یک بازه هم‌اندازه است که درست یک روز قبل از شروع فاز فعلی تمام می‌شود.",
  };
}

export function buildNutritionChartPoints(
  progress: NutritionProgressResponseDto,
): NutritionChartPoint[] {
  return progress.points.map((point, index) => ({
    date: point.date,
    label: chartDateLabel(progress.points, index, progress.period),
    calories: point.totals.calories,
    protein: point.totals.protein,
    carbs: point.totals.carbs,
    fat: point.totals.fat,
  }));
}

export function micronutrientRows(
  progress: NutritionProgressResponseDto,
): MicronutrientRow[] {
  return micronutrientDefinitions.map((definition) => ({
    ...definition,
    total: progress.summary.totals[definition.key],
    averagePerDay: progress.summary.averagePerDay[definition.key],
    averagePerLoggedDay:
      progress.summary.averagePerLoggedDay?.[definition.key] ?? null,
  }));
}

export function nutritionCoverageState(
  progress: NutritionProgressResponseDto,
): NutritionCoverageState {
  const totalDayCount = progress.points.length;
  const loggedDayCount = progress.summary.loggedDayCount;
  const missingDayCount = progress.summary.missingDayCount;
  const hasLoggedZeroDay = progress.points.some(
    (point) => point.logged && point.totals.calories === 0,
  );

  return {
    loggedDayCount,
    missingDayCount,
    totalDayCount,
    hasLoggedDays: loggedDayCount > 0,
    hasMissingDays: missingDayCount > 0,
    hasPartialLogging: loggedDayCount > 0 && missingDayCount > 0,
    hasLoggedZeroDay,
    hasGoal: progress.points.some((point) => point.goal?.configured),
  };
}

export function nutritionGoalAdherenceRows(
  points: NutritionProgressPoint[],
): NutritionGoalAdherenceRow[] {
  return adherenceDefinitions.flatMap((definition) => {
    const values = points
      .map((point) => point.goal?.adherence?.[definition.key])
      .filter((value): value is number => typeof value === "number");

    if (!values.length) {
      return [];
    }

    return [
      {
        ...definition,
        averageDelta: average(values),
      },
    ];
  });
}

export function monthFromDate(date: string) {
  return date.slice(0, 7);
}

export function monthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const from = new Date(Date.UTC(year, monthNumber - 1, 1, 12));
  const to = new Date(Date.UTC(year, monthNumber, 0, 12));

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function previousMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 2, 1, 12))
    .toISOString()
    .slice(0, 7);
}

function nutritionExplorerPeriod(value: string | undefined): NutritionProgressPeriod {
  if (value === "MONTH" || value === "PHASE") {
    return value;
  }

  return "WEEK";
}

function nutritionProgressRequestFor(input: {
  period: NutritionProgressPeriod;
  date: string;
  month: string;
  from: string;
  to: string;
}): NutritionProgressRequest {
  if (input.period === "WEEK") {
    return {period: "WEEK", anchor: input.date};
  }
  if (input.period === "MONTH") {
    return {period: "MONTH", month: input.month};
  }
  return {period: "PHASE", from: input.from, to: input.to};
}

function previousNutritionProgressRequest(
  state: NutritionExplorerState,
): NutritionProgressRequest {
  if (state.period === "WEEK") {
    return {period: "WEEK", anchor: shiftDiaryDate(state.date, -7)};
  }
  if (state.period === "MONTH") {
    return {period: "MONTH", month: previousMonth(state.month)};
  }

  const previousRange = previousPhaseRange(state.from, state.to);
  return {
    period: "PHASE",
    from: previousRange.from,
    to: previousRange.to,
  };
}

function previousPhaseRange(from: string, to: string) {
  const days = daysBetweenInclusive(from, to);
  const previousTo = shiftDiaryDate(from, -1);

  return {
    from: shiftDiaryDate(previousTo, -(days - 1)),
    to: previousTo,
  };
}

function chartDateLabel(
  points: NutritionProgressPoint[],
  index: number,
  period: NutritionProgressPeriod,
) {
  const date = points[index]?.date;
  if (!date) return "";
  const total = points.length;

  if (period === "WEEK" || total <= 10) {
    return formatNutritionRangeChartDate(date);
  }

	const denseStep = total <= 31 ? 4 : Math.ceil(total / 10);
	if (index === 0 || index === total - 1 || index % denseStep === 0) {
		return formatNutritionRangeChartDate(date);
	}

  return "";
}

function normalizePhaseRange(from: string, to: string) {
  if (compareIsoDate(from, to) <= 0) {
    return {from, to};
  }

  return {from, to: from};
}

function isIsoDate(value: string | undefined): value is string {
  return Boolean(value && ISO_DATE.test(value) && isValidCalendarDate(value));
}

function isIsoMonth(value: string | undefined): value is string {
  return Boolean(value && ISO_MONTH.test(value));
}

function isValidCalendarDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function compareIsoDate(first: string, second: string) {
  return first.localeCompare(second);
}

function daysBetweenInclusive(from: string, to: string) {
  const fromDate = new Date(`${from}T12:00:00Z`);
  const toDate = new Date(`${to}T12:00:00Z`);
  return Math.floor((toDate.getTime() - fromDate.getTime()) / MILLIS_PER_DAY) + 1;
}

function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}
