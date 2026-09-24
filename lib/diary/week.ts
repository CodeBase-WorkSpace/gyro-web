import { shiftDiaryDate } from "./date";

const localeWeekStartDay: Record<string, number> = {
	"fa-IR": 6,
};

export function localWeekStart(date: string, locale = "fa-IR") {
	const startDay = localeWeekStartDay[locale] ?? 1;
	const currentDay = weekdayIndex(date);
	const daysFromStart = (currentDay - startDay + 7) % 7;
	return shiftDiaryDate(date, -daysFromStart);
}

export function localWeekDates(date: string, locale = "fa-IR") {
	const start = localWeekStart(date, locale);
	return Array.from({ length: 7 }, (_, index) => shiftDiaryDate(start, index));
}

export function localWeekEnd(date: string, locale = "fa-IR") {
	return shiftDiaryDate(localWeekStart(date, locale), 6);
}

function weekdayIndex(date: string) {
	const [year, month, day] = date.split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}
