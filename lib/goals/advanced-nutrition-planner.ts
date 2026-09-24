import type {GoalScheduleType, Weekday} from "@/lib/api/goals";
import type {PlanningPatternId} from "@/lib/goals/goal-form";

export const plannerWeekdays: Weekday[] = [
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];
const plannerWeekdaySet = new Set(plannerWeekdays);

export const FLAT_REFEED_ERROR =
  "برای افزودن روز ریفید، روش «یکسان در تمام روزها» را تغییر بده.";

export function flatScheduleRefeedError(
  pattern: PlanningPatternId,
  refeedFrequency: string,
) {
  return pattern === "UNIFORM" && refeedFrequency !== "NONE"
    ? FLAT_REFEED_ERROR
    : null;
}

export function advancedPlannerControlAccess({
                                               plannerUnlocked,
                                               workoutUnlocked,
                                               refeedUnlocked,
                                             }: {
  plannerUnlocked: boolean;
  workoutUnlocked: boolean;
  refeedUnlocked: boolean;
}) {
  return {
    manualDisabled: !plannerUnlocked,
    workoutDisabled: !plannerUnlocked || !workoutUnlocked,
    refeedDisabled: !plannerUnlocked || !refeedUnlocked,
  };
}

export function parseTrainingDays(value: string): Weekday[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is Weekday => plannerWeekdaySet.has(item as Weekday));
}

export function scheduleTypeForPlanningPattern(
  pattern: PlanningPatternId,
): GoalScheduleType {
  if (pattern === "UNIFORM") return "FLAT";
  if (pattern === "ZIGZAG") return "ZIGZAG";
  if (pattern === "HIGH_WEEKEND" || pattern === "LOW_WEEKEND") {
    return "WEEKDAY_WEEKEND";
  }
  return "CUSTOM";
}

export function effectiveManualDailyTargets(
  value: string,
  calories: number,
): Record<Weekday, number> {
  let parsed: Partial<Record<Weekday, number>> = {};
  try {
    parsed = JSON.parse(value) as Partial<Record<Weekday, number>>;
  } catch {
    // An untouched manual draft intentionally starts with the daily target.
  }

  return Object.fromEntries(
    plannerWeekdays.map((day) => [
      day,
      Math.round(Number(parsed[day]) || calories),
    ]),
  ) as Record<Weekday, number>;
}

export function manualDailyTargetsAreValid(value: string) {
  if (!value.trim()) return true;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return (
      parsed != null &&
      typeof parsed === "object" &&
      Object.keys(parsed).length === plannerWeekdays.length &&
      plannerWeekdays.every(
        (day) =>
          typeof parsed[day] === "number" &&
          Number.isFinite(parsed[day]) &&
          parsed[day] > 0,
      )
    );
  } catch {
    return false;
  }
}

export function reconcileWeeklyCalories(
  calories: number[],
  budget: number,
  minimum = 800,
) {
  const minimumTotal = calories.length * minimum;
  if (budget < minimumTotal) return calories.map(() => minimum);

  const available = budget - minimumTotal;
  const weights = calories.map((value) => Math.max(0, value - minimum));
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const exact = weights.map(
    (weight) =>
      minimum +
      (weightTotal > 0
        ? (available * weight) / weightTotal
        : available / calories.length),
  );
  const rounded = exact.map(Math.floor);
  let remainder = budget - rounded.reduce((sum, value) => sum + value, 0);
  const priority = exact
    .map((value, index) => ({ index, fraction: value - rounded[index] }))
    .sort((left, right) => right.fraction - left.fraction);

  for (const item of priority) {
    if (remainder <= 0) break;
    rounded[item.index] += 1;
    remainder -= 1;
  }

  return rounded;
}

export function applyCompensatedRefeed(
  calories: number[],
  selectedIndex: number,
  increasePercent: number,
  budget: number,
) {
  if (selectedIndex < 0 || selectedIndex >= calories.length) return calories;
  const surplus = Math.round((calories[selectedIndex] * increasePercent) / 100);
  const compensation = surplus / Math.max(calories.length - 1, 1);
  return reconcileWeeklyCalories(
    calories.map((value, index) =>
      index === selectedIndex ? value + surplus : value - compensation,
    ),
    budget,
  );
}
