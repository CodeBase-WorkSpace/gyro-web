export type NutritionRingMetric = "calories" | "protein" | "carbs" | "fat";

export type NutritionRangeStatus =
	| "below"
	| "within"
	| "above"
	| "unconfigured";

export type NutritionRangeAssessment = {
	percentage: number;
	chartProgress: number;
	status: NutritionRangeStatus;
	rangeStart: number;
	rangeEnd: number | null;
	distance: number;
};

type NutritionTargetRange = {
	start: number;
	end: number | null;
};

const TARGET_RANGES: Record<NutritionRingMetric, NutritionTargetRange> = {
	calories: { start: 95, end: 105 },
	protein: { start: 90, end: null },
	carbs: { start: 85, end: 115 },
	fat: { start: 85, end: 115 },
};

export function assessNutritionRange(
	metric: NutritionRingMetric,
	consumed: number,
	target: number | null,
): NutritionRangeAssessment {
	const range = TARGET_RANGES[metric];
	if (!target || target <= 0) {
		return {
			percentage: 0,
			chartProgress: 0,
			status: "unconfigured",
			rangeStart: range.start,
			rangeEnd: range.end,
			distance: 0,
		};
	}

	const exactPercentage = Math.max((consumed / target) * 100, 0);
	const percentage = Math.round(exactPercentage);

	if (exactPercentage < range.start) {
		return {
			percentage,
			chartProgress: Math.min(percentage, 100),
			status: "below",
			rangeStart: range.start,
			rangeEnd: range.end,
			distance: Math.ceil(range.start - exactPercentage),
		};
	}

	if (range.end !== null && exactPercentage > range.end) {
		return {
			percentage,
			chartProgress: 100,
			status: "above",
			rangeStart: range.start,
			rangeEnd: range.end,
			distance: Math.ceil(exactPercentage - range.end),
		};
	}

	return {
		percentage,
		chartProgress: Math.min(percentage, 100),
		status: "within",
		rangeStart: range.start,
		rangeEnd: range.end,
		distance: 0,
	};
}
