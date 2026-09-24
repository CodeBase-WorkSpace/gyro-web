import assert from "node:assert/strict";
import test from "node:test";

import type { WeightProgressResponseDto } from "../lib/api/progress";
import {
	buildWeightChartPoints,
	buildWeightChartXFractions,
	buildWeightTrendValues,
	comparisonRangesForWeightExplorer,
	measuredWeightPoints,
	resolveWeightExplorerState,
	weightComparisonCopy,
	weightExplorerHref,
	weightExplorerModeHref,
	weightTrendDescription,
} from "../lib/progress/weight-explorer";

test("weight explorer resolves fa-IR week ranges from a preserved anchor date", () => {
	const state = resolveWeightExplorerState(
		{ period: "WEEK", date: "2026-06-28" },
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

test("weight explorer defaults phase ranges to the selected month and preserves anchor when switching", () => {
	const state = resolveWeightExplorerState(
		{ period: "PHASE", date: "2026-02-14" },
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
	assert.equal(
		weightExplorerModeHref(state, "WEEK"),
		"/progress/weight?period=WEEK&date=2026-02-14",
	);
});

test("weight explorer clamps invalid phase edits without discarding the selected start date", () => {
	const state = resolveWeightExplorerState(
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
	assert.equal(
		weightExplorerHref({
			period: "PHASE",
			date: "2026-06-28",
			from: "2026-07-10",
			to: "2026-06-16",
		}),
		"/progress/weight?period=PHASE&date=2026-06-28&from=2026-07-10&to=2026-07-10",
	);
});

test("weight explorer builds previous week and phase comparison ranges", () => {
	const week = resolveWeightExplorerState(
		{ period: "WEEK", date: "2026-06-28" },
		"2026-06-28",
		"fa-IR",
	);
	const phase = resolveWeightExplorerState(
		{ period: "PHASE", date: "2026-06-28", from: "2026-06-10", to: "2026-06-16" },
		"2026-06-28",
		"fa-IR",
	);

	assert.deepEqual(comparisonRangesForWeightExplorer(week)[1], {
		requestId: "previous",
		period: "WEEK",
		anchor: "2026-06-21",
	});
	assert.deepEqual(comparisonRangesForWeightExplorer(phase)[1], {
		requestId: "previous",
		period: "PHASE",
		from: "2026-06-03",
		to: "2026-06-09",
	});
	assert.equal(weightComparisonCopy(phase).title, "مقایسه با فاز قبلی");
});

test("weight explorer chart uses measured points only", () => {
	const progress = weightProgress({
		points: [
			point("2026-06-01", 81.2),
			point("2026-06-02", null),
			point("2026-06-03", 80.9),
		],
	});

	const measured = measuredWeightPoints(progress);
	const chartPoints = buildWeightChartPoints(progress);

	assert.deepEqual(
		measured.map((item) => item.date),
		["2026-06-01", "2026-06-03"],
	);
	assert.deepEqual(
		chartPoints.map((item) => item.weightKg),
		[81.2, 80.9],
	);
});

test("weight explorer trend descriptions come from backend summary shape", () => {
	assert.equal(
		weightTrendDescription(weightProgress({ absoluteChangeKg: -0.5 })),
		"وزن از اولین تا آخرین اندازه‌گیری این بازه کاهش داشته است.",
	);
	assert.equal(
		weightTrendDescription(weightProgress({ absoluteChangeKg: null })),
		"برای محاسبه روند، حداقل دو اندازه‌گیری در این بازه لازم است.",
	);
});

test("trend description speaks from the fitted line when there is one", () => {
	const fitted = weightTrendDescription(
		weightProgress({
			trend: trend({ slopeKgPerWeek: -0.42, direction: "DOWN" }),
		}),
	);
	assert.ok(fitted.includes("خط روند"));
	assert.ok(fitted.includes("۰٫۴۲"));

	// A flat fit must not be reported with a magnitude.
	assert.equal(
		weightTrendDescription(
			weightProgress({ trend: trend({ slopeKgPerWeek: 0.01, direction: "FLAT" }) }),
		),
		"خط روند این بازه تقریباً صاف است و تغییر معناداری نشان نمی‌دهد.",
	);

	// Without a fit it falls back to the endpoint sentence, which is what
	// summary.absoluteChangeKg actually measures.
	assert.equal(
		weightTrendDescription(weightProgress({ absoluteChangeKg: -0.3 })),
		"وزن از اولین تا آخرین اندازه‌گیری این بازه کاهش داشته است.",
	);
});

test("trend values align to chart points by date", () => {
	const points = [
		point("2026-06-01", 82),
		point("2026-06-03", 81.5),
		point("2026-06-05", 81),
	];
	const progress = weightProgress({
		points,
		trend: trend({
			points: [
				{ date: "2026-06-01", fittedWeightKg: 82 },
				{ date: "2026-06-03", fittedWeightKg: 81.5 },
				{ date: "2026-06-05", fittedWeightKg: 81 },
			],
		}),
	});

	assert.deepEqual(
		buildWeightTrendValues(progress, buildWeightChartPoints(progress)),
		[82, 81.5, 81],
	);
});

test("trend values are withheld entirely rather than partially", () => {
	const points = [point("2026-06-01", 82), point("2026-06-03", 81.5)];

	// The regression this guards: InteractiveLineChart silently drops a series whose
	// length differs from labels, so a short array would remove the line with no error.
	const missingDate = weightProgress({
		points,
		trend: trend({ points: [{ date: "2026-06-01", fittedWeightKg: 82 }] }),
	});
	assert.equal(
		buildWeightTrendValues(missingDate, buildWeightChartPoints(missingDate)),
		null,
	);

	// Extra fitted dates are harmless; alignment is driven by the chart points.
	const extraDate = weightProgress({
		points,
		trend: trend({
			points: [
				{ date: "2026-06-01", fittedWeightKg: 82 },
				{ date: "2026-06-02", fittedWeightKg: 81.75 },
				{ date: "2026-06-03", fittedWeightKg: 81.5 },
			],
		}),
	});
	assert.deepEqual(
		buildWeightTrendValues(extraDate, buildWeightChartPoints(extraDate)),
		[82, 81.5],
	);

	const noTrend = weightProgress({ points });
	assert.equal(buildWeightTrendValues(noTrend, buildWeightChartPoints(noTrend)), null);
	assert.equal(buildWeightTrendValues(missingDate, []), null);
});

test("chart x fractions are normalized against the selected range", () => {
	const progress = weightProgress({
		points: [point("2026-06-10", 82), point("2026-06-20", 81)],
		from: "2026-06-01",
		to: "2026-06-30",
	});

	// Normalizing against the measured extent instead would stretch these two dots
	// across the full width and erase the empty start and end of the month.
	const fractions = buildWeightChartXFractions(
		progress,
		buildWeightChartPoints(progress),
	);
	assert.ok(fractions);
	assert.equal(Math.round(fractions[0] * 100) / 100, 0.31);
	assert.equal(Math.round(fractions[1] * 100) / 100, 0.66);
});

test("a single-day range falls back to even spacing", () => {
	const progress = weightProgress({
		points: [point("2026-06-01", 82)],
		from: "2026-06-01",
		to: "2026-06-01",
	});

	assert.equal(
		buildWeightChartXFractions(progress, buildWeightChartPoints(progress)),
		null,
	);
});

function trend(
	overrides: Partial<NonNullable<WeightProgressResponseDto["trend"]>> = {},
): NonNullable<WeightProgressResponseDto["trend"]> {
	return {
		method: "OLS",
		slopeKgPerWeek: -1.75,
		direction: "DOWN",
		startValueKg: 82,
		endValueKg: 81,
		points: [],
		...overrides,
	};
}

function weightProgress({
	points = [point("2026-06-01", 81.2), point("2026-06-02", 80.9)],
	absoluteChangeKg = -0.3,
	trend = null,
	from,
	to,
}: {
	points?: WeightProgressResponseDto["points"];
	absoluteChangeKg?: number | null;
	trend?: WeightProgressResponseDto["trend"];
	from?: string;
	to?: string;
}): WeightProgressResponseDto {
	const measurementCount = points.filter((item) => item.hasMeasurement).length;
	return {
		period: "PHASE",
		timezone: "Asia/Tehran",
		from: from ?? points[0]?.date ?? "2026-06-01",
		to: to ?? points.at(-1)?.date ?? "2026-06-01",
		latestMeasurementDate: points.at(-1)?.date ?? null,
		points,
		summary: {
			startWeightKg: points.find((item) => item.weightKg !== null)?.weightKg ?? null,
			endWeightKg: [...points].reverse().find((item) => item.weightKg !== null)?.weightKg ?? null,
			absoluteChangeKg,
			percentChange: null,
			trendDirection:
				absoluteChangeKg === null
					? "INSUFFICIENT_DATA"
					: absoluteChangeKg < 0
						? "DOWN"
						: absoluteChangeKg > 0
							? "UP"
							: "FLAT",
			measurementCount,
			missingDayCount: points.length - measurementCount,
		},
		trend,
	};
}

function point(date: string, weightKg: number | null) {
	return {
		date,
		weightKg,
		hasMeasurement: weightKg !== null,
	};
}
