import {shiftDiaryDate} from "./date";

export type PersianDateParts = {
	year: number;
	month: number;
	day: number;
};

export type PersianCalendarDay = PersianDateParts & {
	isoDate: string;
	inCurrentMonth: boolean;
};

const numericPersianFormatter = new Intl.DateTimeFormat("en-US-u-ca-persian", {
	year: "numeric",
	month: "numeric",
	day: "numeric",
	timeZone: "UTC",
});

const persianMonthFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
	year: "numeric",
	month: "long",
	timeZone: "UTC",
});

export function isIsoDiaryDate(value: string) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = isoDateToUtc(value);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function getPersianDateParts(isoDate: string): PersianDateParts {
	const parts = numericPersianFormatter.formatToParts(isoDateToUtc(isoDate));
	return {
		year: numberPart(parts, "year"),
		month: numberPart(parts, "month"),
		day: numberPart(parts, "day"),
	};
}

export function formatPersianMonth(isoDate: string) {
	return persianMonthFormatter.format(isoDateToUtc(isoDate));
}

export function startOfPersianMonth(isoDate: string) {
	let cursor = isoDate;
	for (let index = 0; index < 31; index += 1) {
		if (getPersianDateParts(cursor).day === 1) return cursor;
		cursor = shiftDiaryDate(cursor, -1);
	}
	throw new Error(`Could not resolve Persian month for ${isoDate}`);
}

export function shiftPersianMonth(isoDate: string, direction: -1 | 1) {
	const currentStart = startOfPersianMonth(isoDate);
	if (direction === -1) return startOfPersianMonth(shiftDiaryDate(currentStart, -1));

	const current = getPersianDateParts(currentStart);
	let cursor = shiftDiaryDate(currentStart, 28);
	for (let index = 0; index < 4; index += 1) {
		const candidate = getPersianDateParts(cursor);
		if (candidate.year !== current.year || candidate.month !== current.month) {
			return startOfPersianMonth(cursor);
		}
		cursor = shiftDiaryDate(cursor, 1);
	}
	throw new Error(`Could not resolve next Persian month for ${isoDate}`);
}

export function isoDateForPersianMonth(year: number, month: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Invalid Persian month ${year}-${month}`);
  }

  const searchStart = new Date(Date.UTC(year + 621, 0, 1, 12));
  for (let index = 0; index < 430; index += 1) {
    const candidate = new Date(searchStart);
    candidate.setUTCDate(searchStart.getUTCDate() + index);
    const isoDate = candidate.toISOString().slice(0, 10);
    const parts = getPersianDateParts(isoDate);
    if (parts.year === year && parts.month === month && parts.day === 1) {
      return isoDate;
    }
  }

  throw new Error(`Could not resolve Persian month ${year}-${month}`);
}

export function buildPersianCalendarMonth(isoDate: string): PersianCalendarDay[] {
	const monthStart = startOfPersianMonth(isoDate);
	const current = getPersianDateParts(monthStart);
	const saturdayOffset = (isoDateToUtc(monthStart).getUTCDay() + 1) % 7;
	const gridStart = shiftDiaryDate(monthStart, -saturdayOffset);

	return Array.from({ length: 42 }, (_, index) => {
		const dayIsoDate = shiftDiaryDate(gridStart, index);
		const parts = getPersianDateParts(dayIsoDate);
		return {
			...parts,
			isoDate: dayIsoDate,
			inCurrentMonth: parts.year === current.year && parts.month === current.month,
		};
	});
}

function isoDateToUtc(isoDate: string) {
	return new Date(`${isoDate}T12:00:00Z`);
}

function numberPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
	const value = parts.find((part) => part.type === type)?.value;
	if (!value) throw new Error(`Missing ${type} in Persian date`);
	return Number(value);
}
