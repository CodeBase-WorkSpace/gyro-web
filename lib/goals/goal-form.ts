import type {
  GoalResponseDto,
  GoalCalculatorSnapshotDto,
  GoalPreviewResponseDto,
  GoalScheduleType,
  GoalType,
  PlanScheduleDto,
  SaveGoalRequestDto,
} from "@/lib/api/goals";

type CalculatorProfileFormValues = {
  sex: NonNullable<GoalCalculatorSnapshotDto["profile"]>["sex"];
  birthDate: string;
  heightCm: string;
  currentWeightKg: string;
  targetWeightKg: string;
  dailyMovementLevel: NonNullable<
    GoalCalculatorSnapshotDto["profile"]
  >["dailyMovementLevel"];
  workoutFrequency: NonNullable<
    GoalCalculatorSnapshotDto["profile"]
  >["workoutFrequency"];
  speed: NonNullable<GoalCalculatorSnapshotDto["profile"]>["speed"];
};

export function calculatorSnapshotFromPreview(
  preview: GoalPreviewResponseDto,
  values?: CalculatorProfileFormValues,
  maintenanceSource: "FORMULA" | "OBSERVED" = "FORMULA",
): GoalCalculatorSnapshotDto {
  const observed =
    maintenanceSource === "OBSERVED"
      ? preview.observedCalibration?.recommendation
      : null;
  const selected = observed ?? preview;
  return {
    formula: preview.formula,
    maintenanceCalories: selected.maintenanceCalories,
    targetCalories: selected.targetCalories,
    activityFactor: preview.activityFactor,
    dailyEnergyDelta: selected.dailyEnergyDelta,
    weeklyWeightChangeKg: selected.weeklyWeightChangeKg,
    timeline: {
      estimatedWeeksMin: selected.timeline.estimatedWeeksMin,
      estimatedWeeksMax: selected.timeline.estimatedWeeksMax,
      // The API omits null properties, so maintain-weight previews can arrive
      // without an estimatedTargetDate even though the save contract uses null.
      estimatedTargetDate: selected.timeline.estimatedTargetDate ?? null,
    },
    warningCodes: selected.warnings
      .filter((warning) => !warning.blocking)
      .map((warning) => warning.code),
    maintenanceSource,
    formulaMaintenanceCalories: preview.maintenanceCalories,
    observationBasis: observed?.observationBasis ?? null,
    ...(values
      ? {
          profile: {
            sex: values.sex,
            birthDate: values.birthDate,
            heightCm: Number(values.heightCm),
            currentWeightKg: Number(values.currentWeightKg),
            targetWeightKg: values.targetWeightKg
              ? Number(values.targetWeightKg)
              : null,
            dailyMovementLevel: values.dailyMovementLevel,
            workoutFrequency: values.workoutFrequency,
            speed: values.speed,
          },
        }
      : {}),
  };
}

export function goalOutcomeForSave(
  goalType: GoalType,
  targetWeight: number | null,
  targetDate: string | null,
): SaveGoalRequestDto["goal"] {
  if (goalType === "MAINTAIN_WEIGHT") {
    return { type: goalType, targetWeight: null, targetDate: null };
  }

  return {
    type: goalType,
    targetWeight:
      targetWeight === null ? null : { value: targetWeight, unit: "KG" },
    targetDate,
  };
}

export type PlanningPatternId =
  | "UNIFORM"
  | "TRAINING_REST"
  | "CUSTOM"
  | "ZIGZAG"
  | "HIGH_WEEKEND"
  | "LOW_WEEKEND";

export type MacroStrategyId =
  | "CUSTOM"
  | "BALANCED"
  | "HIGH_PROTEIN"
  | "BODYBUILDING"
  | "KETOGENIC"
  | "CARNIVORE_STYLE";

export type GoalFormValues = {
  goalType: GoalType;
  startDate: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  targetWeight: string;
  targetDate: string;
  calculatorSnapshot: string;
  calculatorUpdateMode: NonNullable<
    SaveGoalRequestDto["activePlan"]["calculatorUpdateMode"]
  >;
  advancedSchedule: string;
  planningPattern: PlanningPatternId;
  scheduleType: GoalScheduleType;
  macroStrategy: MacroStrategyId;
  minProtein: string;
  fatMin: string;
  fatMax: string;
  carbPreference: string;
  mealsPerDay: string;
  breakfastShare: string;
  dinnerShare: string;
  trainingDayCalories: string;
  restDayCalories: string;
  trainingDays: string;
  refeedFrequency: string;
  refeedDay: string;
  refeedIncrease: string;
  manualDailyTargets: string;
};

export function hasSavedCalculatorBase(
  configured: boolean,
  values: GoalFormValues,
) {
  return configured && values.calculatorUpdateMode === "PRESERVE";
}

export function hasAdvancedScheduleOverlay(serializedSchedule: string) {
  if (!serializedSchedule.trim()) return false;

  try {
    const schedule = JSON.parse(serializedSchedule) as { type?: unknown };
    return schedule.type !== "FLAT";
  } catch {
    // Preserve malformed non-empty state so the save path reports validation
    // instead of silently discarding a schedule the user may have edited.
    return true;
  }
}

export function advancedOverlayFormValues(
  savedBase: GoalFormValues,
  advancedDraft: GoalFormValues,
): GoalFormValues {
  return {
    ...advancedDraft,
    goalType: savedBase.goalType,
    startDate: savedBase.startDate,
    calories: savedBase.calories,
    protein: savedBase.protein,
    carbs: savedBase.carbs,
    fat: savedBase.fat,
    fiber: savedBase.fiber,
    targetWeight: savedBase.targetWeight,
    targetDate: savedBase.targetDate,
    calculatorSnapshot: "",
    calculatorUpdateMode: "PRESERVE",
  };
}

export function goalFormValuesFromGoal(goal: GoalResponseDto): GoalFormValues {
  const activePlan = goal.activePlan;
  const targets = activePlan?.baseTargets;

  return {
    goalType: activePlan?.goalType ?? "MAINTAIN_WEIGHT",
    startDate: activePlan?.startDate ?? new Date().toISOString().slice(0, 10),
    calories: formatInputNumber(targets?.calories ?? 2000),
    protein: formatInputNumber(targets?.protein ?? 120),
    carbs: formatInputNumber(targets?.carbs ?? 220),
    fat: formatInputNumber(targets?.fat ?? 65),
    fiber: targets?.fiber == null ? "" : formatInputNumber(targets.fiber),
    targetWeight:
      goal.goal?.targetWeight == null
        ? ""
        : formatInputNumber(goal.goal.targetWeight.value),
    targetDate: goal.goal?.targetDate ?? "",
    calculatorSnapshot: "",
    calculatorUpdateMode: activePlan?.calculator ? "PRESERVE" : "CLEAR",
    advancedSchedule: activePlan?.schedule
      ? JSON.stringify({
          type: activePlan.schedule.type,
          activeTo: activePlan.schedule.activeTo,
          weeklyCalorieBudget: activePlan.schedule.weeklyCalorieBudget,
          weekdayTargets: activePlan.schedule.weekdayTargets,
          dateOverrides: activePlan.schedule.dateOverrides,
          macroAdjustmentMode: activePlan.schedule.macroAdjustmentMode,
          dietMode: activePlan.schedule.dietMode,
        })
      : "",
    planningPattern: planningPatternFromSchedule(activePlan?.schedule),
    scheduleType: activePlan?.schedule?.type ?? "FLAT",
    macroStrategy: macroStrategyFromSchedule(activePlan?.schedule?.dietMode),
    minProtein: formatInputNumber(targets?.protein ?? 120),
    fatMin: formatInputNumber(Math.max(35, (targets?.fat ?? 65) - 10)),
    fatMax: formatInputNumber((targets?.fat ?? 65) + 10),
    carbPreference: "MODERATE",
    mealsPerDay: scheduleMetadataValue(
      activePlan?.schedule?.dietMode,
      "mealsPerDay",
      "4",
    ),
    breakfastShare: scheduleMetadataValue(
      activePlan?.schedule?.dietMode,
      "breakfastShare",
      "25",
    ),
    dinnerShare: scheduleMetadataValue(
      activePlan?.schedule?.dietMode,
      "dinnerShare",
      "30",
    ),
    trainingDayCalories: scheduleMetadataValue(
      activePlan?.schedule?.dietMode,
      "trainingDayCalories",
      formatInputNumber((targets?.calories ?? 2000) + 150),
    ),
    restDayCalories: scheduleMetadataValue(
      activePlan?.schedule?.dietMode,
      "restDayCalories",
      formatInputNumber((targets?.calories ?? 2000) - 100),
    ),
    trainingDays: scheduleMetadataValue(
      activePlan?.schedule?.dietMode,
      "trainingDays",
      "SATURDAY,MONDAY,WEDNESDAY",
    ),
    refeedFrequency: refeedFrequencyFromSchedule(
      activePlan?.schedule?.dietMode,
    ),
    refeedDay: scheduleMetadataValue(
      activePlan?.schedule?.dietMode,
      "refeedDay",
      "FRIDAY",
    ),
    refeedIncrease: scheduleMetadataValue(
      activePlan?.schedule?.dietMode,
      "refeedIncrease",
      "10",
    ),
    manualDailyTargets: scheduleMetadataValue(
      activePlan?.schedule?.dietMode,
      "manualDailyTargets",
      "",
    ),
  };
}

function formatInputNumber(value: number) {
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 3,
    useGrouping: false,
  });
}

function refeedFrequencyFromSchedule(dietMode: string | null | undefined) {
  return scheduleMetadataValue(dietMode, "refeedFrequency", "NONE") === "WEEKLY"
    ? "WEEKLY"
    : "NONE";
}

function scheduleMetadataValue(
  dietMode: string | null | undefined,
  key: string,
  fallback: string,
) {
  const metadata = parseAdvancedDietMode(dietMode);
  const value = metadata?.[key];
  if (Array.isArray(value)) return value.filter(Boolean).join(",");
  if (typeof value === "number" && Number.isFinite(value)) {
    return formatInputNumber(value);
  }
  return typeof value === "string" && value ? value : fallback;
}

function planningPatternFromSchedule(
  schedule: PlanScheduleDto | null | undefined,
): PlanningPatternId {
  const metadataValue = scheduleMetadataValue(
    schedule?.dietMode,
    "planningPattern",
    "",
  );
  if (
    metadataValue === "CUSTOM" &&
    !scheduleMetadataValue(schedule?.dietMode, "manualDailyTargets", "") &&
    scheduleMetadataValue(schedule?.dietMode, "trainingDays", "")
  ) {
    return "TRAINING_REST";
  }
  if (
    metadataValue === "UNIFORM" ||
    metadataValue === "TRAINING_REST" ||
    metadataValue === "CUSTOM" ||
    metadataValue === "ZIGZAG" ||
    metadataValue === "HIGH_WEEKEND" ||
    metadataValue === "LOW_WEEKEND"
  ) {
    return metadataValue;
  }

  if (schedule?.type === "ZIGZAG") return "ZIGZAG";
  if (schedule?.type === "CUSTOM") return "CUSTOM";
  return !schedule || schedule.type === "FLAT" ? "UNIFORM" : "CUSTOM";
}

function macroStrategyFromSchedule(
  dietMode: string | null | undefined,
): MacroStrategyId {
  const value = scheduleMetadataValue(dietMode, "macroStrategy", "");
  if (
    value === "CUSTOM" ||
    value === "BALANCED" ||
    value === "HIGH_PROTEIN" ||
    value === "BODYBUILDING" ||
    value === "KETOGENIC" ||
    value === "CARNIVORE_STYLE"
  ) {
    return value;
  }

  return "CUSTOM";
}

function parseAdvancedDietMode(dietMode: string | null | undefined) {
  if (!dietMode?.startsWith("ADVANCED_NUTRITION:")) return null;

  try {
    const parsed = JSON.parse(dietMode.slice("ADVANCED_NUTRITION:".length));
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
