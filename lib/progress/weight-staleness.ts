export const WEIGHT_STALENESS_DAYS = 7;

/**
 * Days since the owner-scoped latest measurement, relative to `todayIso`.
 * Both values use canonical ISO yyyy-mm-dd dates.
 */
export function daysSinceLastWeightEntry(
  latestMeasurementDate: string | null,
  todayIso: string,
): number | null {
  const today = parseIsoDate(todayIso);
  const latest = latestMeasurementDate === null ? null : parseIsoDate(latestMeasurementDate);
  if (today === null || latest === null || latest > today) return null;

  return Math.round((today - latest) / 86_400_000);
}

/**
 * Show the nudge when the user has no weight entry in the last
 * WEIGHT_STALENESS_DAYS days (including the no-data-at-all case).
 */
export function isWeightStale(
  latestMeasurementDate: string | null,
  todayIso: string,
): boolean {
  const days = daysSinceLastWeightEntry(latestMeasurementDate, todayIso);
  return days === null || days >= WEIGHT_STALENESS_DAYS;
}

export function shouldShowWeightNudge(
  latestMeasurementDate: string | null,
  todayIso: string,
  viewedDateIso: string,
): boolean {
  return viewedDateIso === todayIso && isWeightStale(latestMeasurementDate, todayIso);
}

function parseIsoDate(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const time = Date.UTC(year, month, day);
  const parsed = new Date(time);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month ||
    parsed.getUTCDate() !== day
  ) return null;
  return time;
}
