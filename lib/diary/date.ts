export function shiftDiaryDate(date: string, days: number) {
	const [year, month, day] = date.split("-").map(Number);
	const shifted = new Date(Date.UTC(year, month - 1, day + days));
	return shifted.toISOString().slice(0, 10);
}

export function diaryDateHref(date: string, pathname = "/dashboard") {
	return `${pathname}?date=${date}`;
}
