export const NUTRITION_CALORIE_VISUAL_DIVISOR = 5;

export function formatNutritionRangeChartDate(date: string) {
	return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
		day: "numeric",
		month: "short",
	}).format(new Date(`${date}T12:00:00Z`));
}

export function formatNutritionRangeChartDateRange(from: string, to: string) {
	if (from === to) {
		return formatNutritionRangeChartDate(from);
	}

	const fromParts = getPersianChartDateParts(from);
	const toParts = getPersianChartDateParts(to);

	if (fromParts.year === toParts.year && fromParts.month === toParts.month) {
		return `${fromParts.day} تا ${toParts.day} ${toParts.monthName}`;
	}

	return `${formatNutritionRangeChartDate(from)} تا ${formatNutritionRangeChartDate(to)}`;
}

function getPersianChartDateParts(date: string) {
	const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).formatToParts(new Date(`${date}T12:00:00Z`));

	return {
		year: parts.find((part) => part.type === "year")?.value ?? "",
		month: parts.find((part) => part.type === "month")?.value ?? "",
		monthName: parts.find((part) => part.type === "month")?.value ?? "",
		day: parts.find((part) => part.type === "day")?.value ?? "",
	};
}
