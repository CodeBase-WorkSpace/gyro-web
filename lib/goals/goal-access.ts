import type { SaveGoalRequestDto } from "@/lib/api/goals";

type GoalSaveAccessInput = {
  advancedSchedule: SaveGoalRequestDto["activePlan"]["schedule"] | null;
  targetDate: string | null;
};

export function goalSaveRequiresPremiumAccess(values: GoalSaveAccessInput) {
  const schedule = values.advancedSchedule;
  if (!schedule) return false;

  return (
    schedule.type !== "FLAT" ||
    schedule.weeklyCalorieBudget != null ||
    Object.keys(schedule.weekdayTargets ?? {}).length > 0 ||
    Object.keys(schedule.dateOverrides ?? {}).length > 0 ||
    (schedule.macroAdjustmentMode != null &&
      schedule.macroAdjustmentMode !== "FIXED_GRAMS") ||
    schedule.dietMode != null
  );
}
