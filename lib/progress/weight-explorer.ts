import type {
	WeightBatchProgressRangeRequest,
	WeightProgressRequest,
	WeightProgressResponseDto,
} from "@/lib/api/progress";
import { formatNutritionRangeChartDate } from "./nutrition-chart";
import { shiftDiaryDate } from "../diary/date";
import { localWeekEnd, localWeekStart } from "../diary/week";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MILLIS_PER_DAY = 86_400_000;

export type WeightExplorerSearchParams = {
	period?: string;
	date?: string;
	from?: string;
	to?: string;
};

export type WeightExplorerPeriod = "WEEK" | "PHASE";

export type WeightExplorerState = {
	period: WeightExplorerPeriod;
	date: string;
	from: string;
	to: string;
	labelFrom: string;
	labelTo: string;
	activeRequest: WeightProgressRequest;
};

export type WeightChartPoint = {
	date: string;
	label: string;
	weightKg: number;
};

export type WeightComparisonCopy = {
	title: string;
	currentRangeLabel: string;
	previousRangeLabel: string;
	explanation: string;
};

export function resolveWeightExplorerState(
	params: WeightExplorerSearchParams,
	selectedDate: string,
	locale = "fa-IR",
): WeightExplorerState {
	const period = weightExplorerPeriod(params.period);
	const defaultPhaseRange = monthRange(selectedDate);
	const from = isIsoDate(params.from) ? params.from : defaultPhaseRange.from;
	const to = isIsoDate(params.to) ? params.to : defaultPhaseRange.to;
	const phaseRange = normalizePhaseRange(from, to);
	const weekRange = {
		from: localWeekStart(selectedDate, locale),
		to: localWeekEnd(selectedDate, locale),
	};
	const activeRange = period === "WEEK" ? weekRange : phaseRange;

	return {
		period,
		date: selectedDate,
		from: phaseRange.from,
		to: phaseRange.to,
		labelFrom: activeRange.from,
		labelTo: activeRange.to,
		activeRequest:
			period === "WEEK"
				? { period: "WEEK", anchor: selectedDate }
				: { period: "PHASE", from: phaseRange.from, to: phaseRange.to },
	};
}

export function weightExplorerModeHref(
	state: WeightExplorerState,
	nextPeriod: WeightExplorerPeriod,
) {
	const params = new URLSearchParams({
		period: nextPeriod,
		date: state.date,
	});

	if (nextPeriod === "PHASE") {
		params.set("from", state.from);
		params.set("to", state.to);
	}

	return `/progress/weight?${params.toString()}`;
}

export function weightExplorerHref(
	next: Pick<WeightExplorerState, "period" | "date" | "from" | "to">,
) {
	const params = new URLSearchParams({
		period: next.period,
		date: next.date,
	});

	if (next.period === "PHASE") {
		const phaseRange = normalizePhaseRange(next.from, next.to);
		params.set("from", phaseRange.from);
		params.set("to", phaseRange.to);
	}

	return `/progress/weight?${params.toString()}`;
}

export function comparisonRangesForWeightExplorer(
	state: WeightExplorerState,
): WeightBatchProgressRangeRequest[] {
	return [
		{ requestId: "current", ...state.activeRequest },
		{ requestId: "previous", ...previousWeightProgressRequest(state) },
	];
}

export function weightComparisonCopy(
	state: WeightExplorerState,
): WeightComparisonCopy {
	const currentRangeLabel = `${state.labelFrom} تا ${state.labelTo}`;

	if (state.period === "WEEK") {
		return {
			title: "مقایسه با هفته قبل",
			currentRangeLabel,
			previousRangeLabel: `${shiftDiaryDate(state.labelFrom, -7)} تا ${shiftDiaryDate(state.labelTo, -7)}`,
			explanation: "هفته قبل همان بازه هفت‌روزه قبل از هفته فعلی است.",
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

export function buildWeightChartPoints(
	progress: WeightProgressResponseDto,
): WeightChartPoint[] {
	return progress.points
		.filter((point) => point.hasMeasurement && point.weightKg !== null)
		.map((point) => ({
			date: point.date,
			label: formatNutritionRangeChartDate(point.date),
			weightKg: point.weightKg ?? 0,
		}));
}

export function measuredWeightPoints(progress: WeightProgressResponseDto) {
	return progress.points.filter(
		(point) => point.hasMeasurement && point.weightKg !== null,
	);
}

export function weightTrendDescription(progress: WeightProgressResponseDto) {
	const trend = progress.trend;
	if (trend) {
		// Speaks from the fitted line when there is one, so the sentence and the drawn
		// line cannot disagree. Falls back to the endpoint comparison below, which is
		// what summary.absoluteChangeKg actually measures.
		if (trend.direction === "FLAT") {
			return "خط روند این بازه تقریباً صاف است و تغییر معناداری نشان نمی‌دهد.";
		}
		const weekly = Math.abs(trend.slopeKgPerWeek).toLocaleString("fa-IR", {
			maximumFractionDigits: 2,
		});
		return trend.slopeKgPerWeek < 0
			? `خط روند این بازه حدود ${weekly} کیلوگرم کاهش در هفته را نشان می‌دهد.`
			: `خط روند این بازه حدود ${weekly} کیلوگرم افزایش در هفته را نشان می‌دهد.`;
	}

	const change = progress.summary.absoluteChangeKg;
	if (change === null || change === undefined) {
		return "برای محاسبه روند، حداقل دو اندازه‌گیری در این بازه لازم است.";
	}
	if (change < 0) {
		return "وزن از اولین تا آخرین اندازه‌گیری این بازه کاهش داشته است.";
	}
	if (change > 0) {
		return "وزن از اولین تا آخرین اندازه‌گیری این بازه افزایش داشته است.";
	}
	return "اولین و آخرین اندازه‌گیری این بازه بدون تغییر قابل توجه هستند.";
}

/**
 * Fitted values aligned to `chartPoints`, or null when they cannot be aligned.
 *
 * Returns null rather than a short array on any mismatch: `InteractiveLineChart`
 * silently drops a series whose length differs from `labels`, so a partial array would
 * produce a chart with no trend line and no error anywhere.
 *
 * Alignment is by date, never by index — index alignment fails silently.
 */
export function buildWeightTrendValues(
	progress: WeightProgressResponseDto,
	chartPoints: WeightChartPoint[],
): number[] | null {
	const trend = progress.trend;
	if (!trend || chartPoints.length === 0) return null;

	const fittedByDate = new Map(
		trend.points.map((point) => [point.date, point.fittedWeightKg]),
	);
	const values: number[] = [];
	for (const point of chartPoints) {
		const fitted = fittedByDate.get(point.date);
		if (fitted === undefined) return null;
		values.push(fitted);
	}
	return values;
}

/**
 * Horizontal positions for `chartPoints`, normalized against the **selected range**
 * rather than the measured extent.
 *
 * Normalizing against first and last measurement would stretch two mid-month weigh-ins
 * across the full width and erase the empty start and end of the period. Against the
 * range, a month with measurements on the 10th and 20th places them near 0.30 and 0.63.
 *
 * Returns null for a single-day range (zero-width denominator) so the caller falls back
 * to even spacing.
 */
export function buildWeightChartXFractions(
	progress: WeightProgressResponseDto,
	chartPoints: WeightChartPoint[],
): number[] | null {
	if (chartPoints.length === 0) return null;
	const span = daysBetween(progress.from, progress.to);
	if (!Number.isFinite(span) || span <= 0) return null;

	const fractions: number[] = [];
	for (const point of chartPoints) {
		const offset = daysBetween(progress.from, point.date);
		if (!Number.isFinite(offset)) return null;
		fractions.push(Math.min(1, Math.max(0, offset / span)));
	}
	return fractions;
}

function daysBetween(from: string, to: string) {
	const start = Date.parse(`${from}T00:00:00Z`);
	const end = Date.parse(`${to}T00:00:00Z`);
	if (Number.isNaN(start) || Number.isNaN(end)) return Number.NaN;
	return (end - start) / MILLIS_PER_DAY;
}

function previousWeightProgressRequest(
	state: WeightExplorerState,
): WeightProgressRequest {
	if (state.period === "WEEK") {
		return { period: "WEEK", anchor: shiftDiaryDate(state.date, -7) };
	}

	const previousRange = previousPhaseRange(state.from, state.to);
	return { period: "PHASE", from: previousRange.from, to: previousRange.to };
}

function previousPhaseRange(from: string, to: string) {
	const days = daysBetweenInclusive(from, to);
	const previousTo = shiftDiaryDate(from, -1);

	return {
		from: shiftDiaryDate(previousTo, -(days - 1)),
		to: previousTo,
	};
}

function weightExplorerPeriod(value: string | undefined): WeightExplorerPeriod {
	return value === "PHASE" ? "PHASE" : "WEEK";
}

function monthRange(date: string) {
	const [year, monthNumber] = date.slice(0, 7).split("-").map(Number);
	const from = new Date(Date.UTC(year, monthNumber - 1, 1, 12));
	const to = new Date(Date.UTC(year, monthNumber, 0, 12));

	return {
		from: from.toISOString().slice(0, 10),
		to: to.toISOString().slice(0, 10),
	};
}

function normalizePhaseRange(from: string, to: string) {
	if (from.localeCompare(to) <= 0) {
		return { from, to };
	}

	return { from, to: from };
}

function isIsoDate(value: string | undefined): value is string {
	return Boolean(value && ISO_DATE.test(value) && isValidCalendarDate(value));
}

function isValidCalendarDate(value: string) {
	const date = new Date(`${value}T12:00:00Z`);
	return (
		!Number.isNaN(date.getTime()) &&
		date.toISOString().slice(0, 10) === value
	);
}

function daysBetweenInclusive(from: string, to: string) {
	const fromDate = new Date(`${from}T12:00:00Z`);
	const toDate = new Date(`${to}T12:00:00Z`);
	return Math.floor((toDate.getTime() - fromDate.getTime()) / MILLIS_PER_DAY) + 1;
}
