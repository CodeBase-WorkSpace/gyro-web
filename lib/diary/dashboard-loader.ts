import {mapDiaryDayToDashboardData} from "@/components/dashboard/dashboard-data";
import {getDiaryDay} from "@/lib/api/diary";
import {getWeeklyNutritionProgress, getWeeklyProgress, getWeightProgress} from "@/lib/api/progress";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";

export { diaryDateHref, shiftDiaryDate } from "./date";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function resolveDiaryDate(value: string | undefined, timeZone: string) {
	if (value && ISO_DATE.test(value) && isValidCalendarDate(value)) return value;

	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(new Date());
	const part = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((item) => item.type === type)?.value;

	return `${part("year")}-${part("month")}-${part("day")}`;
}

export async function loadDashboardDiary(date: string, nextPath: string) {
	const day = await authenticatedServerRequest(
		(accessToken) => getDiaryDay(date, accessToken),
		{ nextPath, retryPolicy: "idempotent" },
	);
	return mapDiaryDayToDashboardData(day);
}

export async function loadDashboardProgress(date: string, nextPath: string) {
  const monthRange = monthRangeFor(date);
  const [weekly, nutritionWeek, weightMonth] = await Promise.all([
    authenticatedServerRequest(
      (accessToken) => getWeeklyProgress(date, accessToken),
      {nextPath, retryPolicy: "idempotent"},
    ),
    authenticatedServerRequest(
      (accessToken) => getWeeklyNutritionProgress(date, accessToken),
      {nextPath, retryPolicy: "idempotent"},
    ),
    authenticatedServerRequest(
      (accessToken) => getWeightProgress({period: "PHASE", ...monthRange}, accessToken),
      {nextPath, retryPolicy: "idempotent"},
    ),
  ]);

  return {weekly, nutritionWeek, weightMonth};
}

function isValidCalendarDate(value: string) {
	const date = new Date(`${value}T12:00:00Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function monthRangeFor(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  const from = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
  const to = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12));

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}
