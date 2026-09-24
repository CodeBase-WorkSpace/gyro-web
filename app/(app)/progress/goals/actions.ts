"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { getCurrentEntitlement } from "@/lib/api/entitlement";
import { ApiClientError, localizedApiErrorMessage } from "@/lib/api/errors";
import {
  type DailyMovementLevel,
  deleteGoal,
  type GoalCalculatorSex,
  type GoalChangeSpeed,
  type GoalPreviewResponseDto,
  type GoalResponseDto,
  type GoalScheduleType,
  type GoalType,
  type MacroTargetAdjustmentMode,
  previewGoal,
  saveGoal,
  type SaveGoalRequestDto,
  type Weekday,
  type WorkoutFrequency,
} from "@/lib/api/goals";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-api";
import { normalizeDecimalInput } from "@/lib/foods/custom-food-validation";
import {
  type GoalFormValues,
  goalOutcomeForSave,
  goalFormValuesFromGoal,
} from "@/lib/goals/goal-form";
import { goalSaveRequiresPremiumAccess } from "@/lib/goals/goal-access";
import { canUseEntitlement } from "@/lib/subscription/entitlements";

export type GoalFormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Partial<Record<keyof GoalFormValues | "baseTargets", string>>;
  formValues?: GoalFormValues;
  goal?: GoalResponseDto;
  requestId?: string;
};

export type GoalPreviewFormValues = {
  sex: GoalCalculatorSex;
  birthDate: string;
  heightCm: string;
  currentWeightKg: string;
  targetWeightKg: string;
  dailyMovementLevel: DailyMovementLevel;
  workoutFrequency: WorkoutFrequency;
  goalType: GoalType;
  speed: GoalChangeSpeed;
};

export type GoalPreviewFormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Partial<Record<keyof GoalPreviewFormValues, string>>;
  formValues?: GoalPreviewFormValues;
  preview?: GoalPreviewResponseDto;
  requestId?: string;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const GOAL_TYPES = new Set<GoalType>([
  "LOSE_WEIGHT",
  "MAINTAIN_WEIGHT",
  "GAIN_WEIGHT",
]);
const SEXES = new Set<GoalCalculatorSex>(["FEMALE", "MALE"]);
const DAILY_MOVEMENT_LEVELS = new Set<DailyMovementLevel>([
  "SEDENTARY",
  "LIGHT",
  "MODERATE",
  "ACTIVE",
  "VERY_ACTIVE",
]);
const WORKOUT_FREQUENCIES = new Set<WorkoutFrequency>([
  "ZERO_DAYS",
  "ONE_TO_TWO_DAYS",
  "THREE_TO_FOUR_DAYS",
  "FIVE_TO_SIX_DAYS",
  "DAILY",
]);
const GOAL_CHANGE_SPEEDS = new Set<GoalChangeSpeed>([
  "CONSERVATIVE",
  "BALANCED",
  "AGGRESSIVE",
]);
const GOAL_SCHEDULE_TYPES = new Set<GoalScheduleType>([
  "FLAT",
  "WEEKDAY_WEEKEND",
  "ZIGZAG",
  "CUSTOM",
]);
const MACRO_ADJUSTMENT_MODES = new Set<MacroTargetAdjustmentMode>([
  "FIXED_GRAMS",
  "SCALE_WITH_CALORIES",
  "FIXED_PROTEIN_FLEXIBLE_CARBS_FAT",
]);
const WEEKDAYS = new Set<Weekday>([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);
const PLANNING_PATTERNS = new Set([
  "UNIFORM",
  "TRAINING_REST",
  "CUSTOM",
  "ZIGZAG",
  "HIGH_WEEKEND",
  "LOW_WEEKEND",
]);
const MACRO_STRATEGIES = new Set([
  "CUSTOM",
  "BALANCED",
  "HIGH_PROTEIN",
  "BODYBUILDING",
  "KETOGENIC",
  "CARNIVORE_STYLE",
]);
const CALCULATOR_UPDATE_MODES = new Set([
  "PRESERVE",
  "REPLACE",
  "CLEAR",
] as const);

export async function previewGoalAction(
  _prevState: GoalPreviewFormState,
  formData: FormData,
): Promise<GoalPreviewFormState> {
  const formValues = goalPreviewFormValuesFrom(formData);
  const parsed = parseGoalPreviewFormValues(formValues);

  if (!parsed.ok) {
    return {
      message: "اطلاعات محاسبه‌گر را بررسی کنید.",
      fieldErrors: parsed.fieldErrors,
      formValues,
    };
  }

  try {
    const preview = await authenticatedServerRequest(
      (accessToken) => previewGoal(parsed.value, accessToken),
      { nextPath: "/progress/goals", retryPolicy: "idempotent" },
    );

    return {
      ok: true,
      message: "پیشنهاد هدف آماده است.",
      formValues,
      preview,
    };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiClientError) {
      return {
        message: goalPreviewApiErrorMessage(error),
        fieldErrors: mapGoalPreviewFieldErrors(error.fieldErrors),
        formValues,
        requestId: error.requestId,
      };
    }

    return {
      message: "محاسبه هدف انجام نشد. کمی بعد دوباره تلاش کنید.",
      formValues,
    };
  }
}

export async function saveGoalAction(
  _prevState: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  const formValues = goalFormValuesFrom(formData);
  const parsed = parseGoalFormValues(formValues);

  if (!parsed.ok) {
    return {
      message: firstGoalFieldError(parsed.fieldErrors) ?? "اطلاعات هدف کامل نیست.",
      fieldErrors: parsed.fieldErrors,
      formValues,
    };
  }

  try {
    const requiresPremiumAccess = goalSaveRequiresPremiumAccess(parsed.value);
    const subscription = requiresPremiumAccess
      ? await authenticatedServerRequest(
          (accessToken) => getCurrentEntitlement(accessToken),
          { nextPath: "/progress/goals", retryPolicy: "idempotent" },
        )
      : null;

    if (requiresPremiumAccess && parsed.value.advancedSchedule) {
      if (
        !subscription ||
        !canUseEntitlement(subscription, "premium_schedules")
      ) {
        return {
          message: "برای ذخیره برنامه‌ریزی پیشرفته اشتراک فعال لازم است.",
          fieldErrors: {
            baseTargets: "این قابلیت برای طرح پیشرفته فعال است.",
          },
          formValues,
        };
      }

      const plannerMetadata = parseAdvancedPlannerMetadata(
        parsed.value.advancedSchedule.dietMode,
      );
      if (
        plannerMetadata?.planningPattern === "TRAINING_REST" &&
        !canUseEntitlement(subscription, "TRAINING_REST_DAY_TARGETS")
      ) {
        return advancedFeatureDenied(
          formValues,
          "تقسیم کالری روزهای تمرین و استراحت",
        );
      }
      if (
        plannerMetadata?.refeedFrequency === "WEEKLY" &&
        !canUseEntitlement(subscription, "REFEED_STRATEGY")
      ) {
        return advancedFeatureDenied(formValues, "روز پرکالری برنامه‌ریزی‌شده");
      }
    }

    const request = goalSaveRequestFrom(parsed.value);
    const goal = await authenticatedServerRequest(
      (accessToken) => saveGoal(request, accessToken),
      { nextPath: "/progress/goals", retryPolicy: "idempotent" },
    );

    revalidatePath("/dashboard");
    revalidatePath("/foods");
    revalidatePath("/progress");
    revalidatePath("/progress/goals");

    return {
      ok: true,
      message: "هدف تغذیه ذخیره شد.",
      formValues: goalFormValuesFromGoal(goal),
      goal,
    };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiClientError) {
      const fieldErrors = mapGoalFieldErrors(error.fieldErrors);
      return {
        message: firstGoalFieldError(fieldErrors) ?? goalApiErrorMessage(error),
        fieldErrors,
        formValues,
        requestId: error.requestId,
      };
    }

    return {
      message: "هدف ذخیره نشد. کمی بعد دوباره تلاش کنید.",
      formValues,
    };
  }
}

function advancedFeatureDenied(
  formValues: GoalFormValues,
  featureName: string,
): GoalFormState {
  return {
    message: `برای ذخیره «${featureName}» دسترسی فعال لازم است.`,
    fieldErrors: {
      baseTargets: "این قابلیت در اشتراک فعلی شما فعال نیست.",
    },
    formValues,
  };
}

export async function deleteGoalAction(): Promise<GoalFormState> {
  try {
    const goal = await authenticatedServerRequest(
      (accessToken) => deleteGoal(accessToken),
      { nextPath: "/progress/goals", retryPolicy: "idempotent" },
    );

    revalidatePath("/dashboard");
    revalidatePath("/foods");
    revalidatePath("/progress");
    revalidatePath("/progress/goals");

    return {
      ok: true,
      message: "هدف تغذیه حذف شد.",
      formValues: goalFormValuesFromGoal(goal),
      goal,
    };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiClientError) {
      return {
        message: error.message || "هدف حذف نشد.",
        requestId: error.requestId,
      };
    }

    return {
      message: "هدف حذف نشد. کمی بعد دوباره تلاش کنید.",
    };
  }
}

function goalFormValuesFrom(formData: FormData): GoalFormValues {
  return {
    goalType: String(formData.get("goalType") ?? "MAINTAIN_WEIGHT") as GoalType,
    startDate: String(formData.get("startDate") ?? ""),
    calories: String(formData.get("calories") ?? ""),
    protein: String(formData.get("protein") ?? ""),
    carbs: String(formData.get("carbs") ?? ""),
    fat: String(formData.get("fat") ?? ""),
    fiber: String(formData.get("fiber") ?? ""),
    targetWeight: String(formData.get("targetWeight") ?? ""),
    targetDate: String(formData.get("targetDate") ?? ""),
    calculatorSnapshot: String(formData.get("calculatorSnapshot") ?? ""),
    calculatorUpdateMode: String(
      formData.get("calculatorUpdateMode") ?? "CLEAR",
    ) as GoalFormValues["calculatorUpdateMode"],
    advancedSchedule: String(formData.get("advancedSchedule") ?? ""),
    planningPattern: String(
      formData.get("planningPattern") ?? "CUSTOM",
    ) as GoalFormValues["planningPattern"],
    scheduleType: String(
      formData.get("scheduleType") ?? "FLAT",
    ) as GoalScheduleType,
    macroStrategy: String(
      formData.get("macroStrategy") ?? "CUSTOM",
    ) as GoalFormValues["macroStrategy"],
    minProtein: String(formData.get("minProtein") ?? ""),
    fatMin: String(formData.get("fatMin") ?? ""),
    fatMax: String(formData.get("fatMax") ?? ""),
    carbPreference: String(formData.get("carbPreference") ?? "MODERATE"),
    mealsPerDay: String(formData.get("mealsPerDay") ?? "4"),
    breakfastShare: String(formData.get("breakfastShare") ?? "25"),
    dinnerShare: String(formData.get("dinnerShare") ?? "30"),
    trainingDayCalories: String(formData.get("trainingDayCalories") ?? ""),
    restDayCalories: String(formData.get("restDayCalories") ?? ""),
    trainingDays: String(
      formData.get("trainingDays") ?? "SATURDAY,MONDAY,WEDNESDAY",
    ),
    refeedFrequency: String(formData.get("refeedFrequency") ?? "NONE"),
    refeedDay: String(formData.get("refeedDay") ?? "FRIDAY"),
    refeedIncrease: String(formData.get("refeedIncrease") ?? "10"),
    manualDailyTargets: String(formData.get("manualDailyTargets") ?? ""),
  };
}

type ParsedGoalValues = {
  goalType: GoalType;
  startDate: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  targetWeight: number | null;
  targetDate: string | null;
  calculatorSnapshot: SaveGoalRequestDto["activePlan"]["calculator"];
  calculatorUpdateMode: NonNullable<
    SaveGoalRequestDto["activePlan"]["calculatorUpdateMode"]
  >;
  advancedSchedule: NonNullable<
    SaveGoalRequestDto["activePlan"]["schedule"]
  > | null;
  acceptedWarningCodes: string[];
};

function parseGoalFormValues(values: GoalFormValues):
  | { ok: true; value: ParsedGoalValues }
  | {
      ok: false;
      fieldErrors: GoalFormState["fieldErrors"];
    } {
  const fieldErrors: GoalFormState["fieldErrors"] = {};

  if (!GOAL_TYPES.has(values.goalType)) {
    fieldErrors.goalType = "نوع هدف معتبر نیست.";
  }
  if (!ISO_DATE.test(values.startDate)) {
    fieldErrors.startDate = "تاریخ شروع را با قالب YYYY-MM-DD وارد کنید.";
  }
  if (values.targetDate && !ISO_DATE.test(values.targetDate)) {
    fieldErrors.targetDate = "تاریخ هدف را با قالب YYYY-MM-DD وارد کنید.";
  }

  const calories = requiredNumber(values.calories, "کالری", 800, 6000);
  const protein = requiredNumber(values.protein, "پروتئین", 0, 400);
  const carbs = requiredNumber(values.carbs, "کربوهیدرات", 0, 800);
  const fat = requiredNumber(values.fat, "چربی", 0, 300);
  const fiber = optionalNumber(values.fiber, "فیبر", 0, 150);
  const targetWeight = optionalNumber(values.targetWeight, "وزن هدف", 20, 500);
  const calculatorSnapshot = optionalCalculatorSnapshot(
    values.calculatorSnapshot,
  );
  const advancedSchedule = optionalAdvancedSchedule(values.advancedSchedule);

  if (!calories.ok) fieldErrors.calories = calories.message;
  if (!protein.ok) fieldErrors.protein = protein.message;
  if (!carbs.ok) fieldErrors.carbs = carbs.message;
  if (!fat.ok) fieldErrors.fat = fat.message;
  if (!fiber.ok) fieldErrors.fiber = fiber.message;
  if (!targetWeight.ok) fieldErrors.targetWeight = targetWeight.message;
  if (!calculatorSnapshot.ok)
    fieldErrors.baseTargets = calculatorSnapshot.message;
  if (!CALCULATOR_UPDATE_MODES.has(values.calculatorUpdateMode)) {
    fieldErrors.baseTargets = "روش به‌روزرسانی محاسبه‌گر معتبر نیست.";
  }
  if (!advancedSchedule.ok) fieldErrors.baseTargets = advancedSchedule.message;

  if (
    calories.ok &&
    protein.ok &&
    carbs.ok &&
    fat.ok &&
    !macroCaloriesWithinTolerance(
      calories.value,
      protein.value,
      carbs.value,
      fat.value,
    )
  ) {
    fieldErrors.baseTargets =
      "کالری ماکروها باید حداکثر ۲۵٪ با کالری هدف تفاوت داشته باشد.";
  }

  if (Object.keys(fieldErrors).length) {
    return { ok: false, fieldErrors };
  }

  if (
    !calories.ok ||
    !protein.ok ||
    !carbs.ok ||
    !fat.ok ||
    !fiber.ok ||
    !targetWeight.ok ||
    !calculatorSnapshot.ok ||
    !advancedSchedule.ok
  ) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    value: {
      goalType: values.goalType,
      startDate: values.startDate,
      calories: calories.value,
      protein: protein.value,
      carbs: carbs.value,
      fat: fat.value,
      fiber: fiber.value,
      targetWeight: targetWeight.value,
      targetDate: values.targetDate || null,
      calculatorSnapshot: calculatorSnapshot.value,
      calculatorUpdateMode: values.calculatorUpdateMode,
      advancedSchedule: advancedSchedule.value,
      acceptedWarningCodes:
        calculatorSnapshot.value?.warningCodes.filter(Boolean) ?? [],
    },
  };
}

function optionalAdvancedSchedule(input: string):
  | {
      ok: true;
      value: NonNullable<SaveGoalRequestDto["activePlan"]["schedule"]> | null;
    }
  | { ok: false; message: string } {
  if (!input.trim()) return { ok: true, value: null };

  try {
    const parsed = JSON.parse(input) as NonNullable<
      SaveGoalRequestDto["activePlan"]["schedule"]
    >;

    if (!parsed || !GOAL_SCHEDULE_TYPES.has(parsed.type)) {
      return { ok: false, message: "الگوی برنامه هفتگی معتبر نیست." };
    }
    if (
      parsed.macroAdjustmentMode &&
      !MACRO_ADJUSTMENT_MODES.has(parsed.macroAdjustmentMode)
    ) {
      return { ok: false, message: "روش تنظیم ماکرو معتبر نیست." };
    }
    if (
      parsed.weeklyCalorieBudget != null &&
      (typeof parsed.weeklyCalorieBudget !== "number" ||
        parsed.weeklyCalorieBudget < 800 ||
        parsed.weeklyCalorieBudget > 140000)
    ) {
      return { ok: false, message: "بودجه کالری هفتگی معتبر نیست." };
    }
    if (
      parsed.dietMode != null &&
      (typeof parsed.dietMode !== "string" ||
        parsed.dietMode.length > 10_000 ||
        !validAdvancedDietModeMetadata(parsed.dietMode))
    ) {
      return { ok: false, message: "تنظیمات برنامه پیشرفته معتبر نیست." };
    }

    const weekdayTargets = parsed.weekdayTargets ?? {};
    for (const [day, target] of Object.entries(weekdayTargets)) {
      if (!WEEKDAYS.has(day as Weekday) || !validNutritionTarget(target)) {
        return { ok: false, message: "هدف روزهای هفته معتبر نیست." };
      }
    }
    if (parsed.weeklyCalorieBudget != null) {
      if (Object.keys(weekdayTargets).length !== WEEKDAYS.size) {
        return { ok: false, message: "هدف هر هفت روز هفته لازم است." };
      }
      const weeklyTotal = Object.values(weekdayTargets).reduce(
        (total, target) => total + (target?.calories ?? 0),
        0,
      );
      if (Math.abs(weeklyTotal - parsed.weeklyCalorieBudget) > 2) {
        return {
          ok: false,
          message: "مجموع روزها باید با بودجه هفتگی برابر باشد.",
        };
      }
    }

    return { ok: true, value: parsed };
  } catch {
    return { ok: false, message: "برنامه پیشرفته معتبر نیست." };
  }
}

type AdvancedPlannerMetadata = {
  planningPattern: string;
  macroStrategy: string;
  mealsPerDay: number;
  breakfastShare: number;
  dinnerShare: number;
  trainingDays: Weekday[];
  trainingDayCalories: number;
  restDayCalories: number;
  refeedFrequency: "NONE" | "WEEKLY";
  refeedDay: Weekday;
  refeedIncrease: number;
  manualDailyTargets: string;
};

function validAdvancedDietModeMetadata(value: string) {
  return parseAdvancedPlannerMetadata(value) !== null;
}

function parseAdvancedPlannerMetadata(
  value: string | null | undefined,
): AdvancedPlannerMetadata | undefined | null {
  if (!value?.startsWith("ADVANCED_NUTRITION:")) return undefined;

  try {
    const metadata = JSON.parse(
      value.slice("ADVANCED_NUTRITION:".length),
    ) as Partial<AdvancedPlannerMetadata>;
    if (!metadata || typeof metadata !== "object") return null;
    if (!PLANNING_PATTERNS.has(String(metadata.planningPattern))) return null;
    if (!MACRO_STRATEGIES.has(String(metadata.macroStrategy))) return null;
    if (!integerInRange(metadata.mealsPerDay, 2, 8)) return null;
    if (!numberInRange(metadata.breakfastShare, 5, 50)) return null;
    if (!numberInRange(metadata.dinnerShare, 10, 60)) return null;
    if (Number(metadata.breakfastShare) + Number(metadata.dinnerShare) >= 100)
      return null;
    if (!Array.isArray(metadata.trainingDays)) return null;
    const trainingDays = metadata.trainingDays.filter((day): day is Weekday =>
      WEEKDAYS.has(day as Weekday),
    );
    if (
      trainingDays.length !== metadata.trainingDays.length ||
      new Set(trainingDays).size !== trainingDays.length
    )
      return null;
    if (
      metadata.planningPattern === "TRAINING_REST" &&
      (trainingDays.length < 1 || trainingDays.length > 6)
    )
      return null;
    if (!numberInRange(metadata.trainingDayCalories, 800, 6000)) return null;
    if (!numberInRange(metadata.restDayCalories, 800, 6000)) return null;
    if (
      metadata.refeedFrequency !== "NONE" &&
      metadata.refeedFrequency !== "WEEKLY"
    )
      return null;
    if (!WEEKDAYS.has(metadata.refeedDay as Weekday)) return null;
    if (![5, 10, 15].includes(Number(metadata.refeedIncrease))) return null;
    if (typeof metadata.manualDailyTargets !== "string") return null;
    if (
      metadata.planningPattern === "CUSTOM" &&
      !validManualDailyTargets(metadata.manualDailyTargets)
    )
      return null;

    return { ...metadata, trainingDays } as AdvancedPlannerMetadata;
  } catch {
    return null;
  }
}

function validManualDailyTargets(value: string) {
  try {
    const targets = JSON.parse(value) as Record<string, unknown>;
    return (
      targets != null &&
      typeof targets === "object" &&
      Object.keys(targets).length === WEEKDAYS.size &&
      Array.from(WEEKDAYS).every((day) =>
        numberInRange(targets[day], 800, 6000),
      )
    );
  } catch {
    return false;
  }
}

function numberInRange(value: unknown, min: number, max: number) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  );
}

function integerInRange(value: unknown, min: number, max: number) {
  return Number.isInteger(value) && numberInRange(value, min, max);
}

function validNutritionTarget(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const target = value as {
    calories?: unknown;
    protein?: unknown;
    carbs?: unknown;
    fat?: unknown;
    fiber?: unknown;
  };

  return (
    typeof target.calories === "number" &&
    target.calories >= 800 &&
    target.calories <= 6000 &&
    typeof target.protein === "number" &&
    target.protein >= 0 &&
    target.protein <= 400 &&
    typeof target.carbs === "number" &&
    target.carbs >= 0 &&
    target.carbs <= 800 &&
    typeof target.fat === "number" &&
    target.fat >= 0 &&
    target.fat <= 300 &&
    (target.fiber === null ||
      target.fiber === undefined ||
      (typeof target.fiber === "number" &&
        target.fiber >= 0 &&
        target.fiber <= 150))
  );
}

function goalPreviewFormValuesFrom(formData: FormData): GoalPreviewFormValues {
  return {
    sex: String(formData.get("sex") ?? "MALE") as GoalCalculatorSex,
    birthDate: String(formData.get("birthDate") ?? ""),
    heightCm: String(formData.get("heightCm") ?? ""),
    currentWeightKg: String(formData.get("currentWeightKg") ?? ""),
    targetWeightKg: String(formData.get("targetWeightKg") ?? ""),
    dailyMovementLevel: String(
      formData.get("dailyMovementLevel") ?? "MODERATE",
    ) as DailyMovementLevel,
    workoutFrequency: String(
      formData.get("workoutFrequency") ?? "THREE_TO_FOUR_DAYS",
    ) as WorkoutFrequency,
    goalType: String(formData.get("goalType") ?? "MAINTAIN_WEIGHT") as GoalType,
    speed: String(formData.get("speed") ?? "BALANCED") as GoalChangeSpeed,
  };
}

function parseGoalPreviewFormValues(values: GoalPreviewFormValues):
  | {
      ok: true;
      value: Parameters<typeof previewGoal>[0];
    }
  | {
      ok: false;
      fieldErrors: GoalPreviewFormState["fieldErrors"];
    } {
  const fieldErrors: GoalPreviewFormState["fieldErrors"] = {};

  if (!SEXES.has(values.sex)) fieldErrors.sex = "جنسیت معتبر نیست.";
  if (!ISO_DATE.test(values.birthDate))
    fieldErrors.birthDate = "تاریخ تولد را با قالب YYYY-MM-DD وارد کنید.";
  if (!DAILY_MOVEMENT_LEVELS.has(values.dailyMovementLevel))
    fieldErrors.dailyMovementLevel = "سطح فعالیت روزانه معتبر نیست.";
  if (!WORKOUT_FREQUENCIES.has(values.workoutFrequency))
    fieldErrors.workoutFrequency = "تعداد تمرین هفتگی معتبر نیست.";
  if (!GOAL_TYPES.has(values.goalType))
    fieldErrors.goalType = "نوع هدف معتبر نیست.";
  if (!GOAL_CHANGE_SPEEDS.has(values.speed))
    fieldErrors.speed = "سرعت تغییر هدف معتبر نیست.";

  const heightCm = requiredNumber(values.heightCm, "قد", 50, 260);
  const currentWeightKg = requiredNumber(
    values.currentWeightKg,
    "وزن فعلی",
    20,
    500,
  );
  const targetWeightKg = optionalNumber(
    values.targetWeightKg,
    "وزن هدف",
    20,
    500,
  );

  if (!heightCm.ok) fieldErrors.heightCm = heightCm.message;
  if (!currentWeightKg.ok)
    fieldErrors.currentWeightKg = currentWeightKg.message;
  if (!targetWeightKg.ok) fieldErrors.targetWeightKg = targetWeightKg.message;

  if (Object.keys(fieldErrors).length) {
    return { ok: false, fieldErrors };
  }

  if (!heightCm.ok || !currentWeightKg.ok || !targetWeightKg.ok) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    value: {
      sex: values.sex,
      birthDate: values.birthDate,
      heightCm: heightCm.value,
      currentWeightKg: currentWeightKg.value,
      targetWeightKg: targetWeightKg.value,
      dailyMovementLevel: values.dailyMovementLevel,
      workoutFrequency: values.workoutFrequency,
      goalType: values.goalType,
      speed: values.speed,
    },
  };
}

function requiredNumber(
  input: string,
  label: string,
  min: number,
  max: number,
): { ok: true; value: number } | { ok: false; message: string } {
  const normalized = normalizeDecimalInput(input);
  const value = Number(normalized);

  if (!normalized) return { ok: false, message: `${label} را وارد کنید.` };
  if (!Number.isFinite(value))
    return { ok: false, message: `${label} باید عدد معتبر باشد.` };
  if (value < min || value > max)
    return {
      ok: false,
      message: `${label} باید بین ${min} و ${max} باشد.`,
    };

  return { ok: true, value };
}

function optionalNumber(
  input: string,
  label: string,
  min: number,
  max: number,
): { ok: true; value: number | null } | { ok: false; message: string } {
  const normalized = normalizeDecimalInput(input);
  if (!normalized) return { ok: true, value: null };

  const value = Number(normalized);
  if (!Number.isFinite(value))
    return { ok: false, message: `${label} باید عدد معتبر باشد.` };
  if (value < min || value > max)
    return {
      ok: false,
      message: `${label} باید بین ${min} و ${max} باشد.`,
    };

  return { ok: true, value };
}

function optionalCalculatorSnapshot(
  input: string,
):
  | { ok: true; value: SaveGoalRequestDto["activePlan"]["calculator"] }
  | { ok: false; message: string } {
  if (!input.trim()) return { ok: true, value: null };

  try {
    const parsed = JSON.parse(
      input,
    ) as SaveGoalRequestDto["activePlan"]["calculator"];
    const estimatedTargetDate = parsed?.timeline?.estimatedTargetDate ?? null;
    if (
      !parsed ||
      !parsed.formula ||
      typeof parsed.formula.name !== "string" ||
      typeof parsed.formula.version !== "string" ||
      typeof parsed.maintenanceCalories !== "number" ||
      typeof parsed.targetCalories !== "number" ||
      typeof parsed.activityFactor !== "number" ||
      typeof parsed.dailyEnergyDelta !== "number" ||
      typeof parsed.weeklyWeightChangeKg !== "number" ||
      (parsed.maintenanceSource !== undefined &&
        parsed.maintenanceSource !== "FORMULA" &&
        parsed.maintenanceSource !== "OBSERVED") ||
      (parsed.formulaMaintenanceCalories !== undefined &&
        typeof parsed.formulaMaintenanceCalories !== "number") ||
      (parsed.maintenanceSource === "OBSERVED" &&
        (!parsed.observationBasis ||
          typeof parsed.observationBasis !== "object")) ||
      !parsed.timeline ||
      typeof parsed.timeline.estimatedWeeksMin !== "number" ||
      typeof parsed.timeline.estimatedWeeksMax !== "number" ||
      !(
        typeof estimatedTargetDate === "string" ||
        estimatedTargetDate === null
      ) ||
      !Array.isArray(parsed.warningCodes)
    ) {
      return {
        ok: false,
        message: "خروجی محاسبه‌گر معتبر نیست. دوباره محاسبه کنید.",
      };
    }

    return {
      ok: true,
      value: {
        ...parsed,
        timeline: {
          ...parsed.timeline,
          estimatedTargetDate,
        },
      },
    };
  } catch {
    return {
      ok: false,
      message: "خروجی محاسبه‌گر معتبر نیست. دوباره محاسبه کنید.",
    };
  }
}

function macroCaloriesWithinTolerance(
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
) {
  const macroCalories = protein * 4 + carbs * 4 + fat * 9;
  const tolerance = calories * 0.25;
  return Math.abs(macroCalories - calories) <= tolerance;
}

function goalSaveRequestFrom(values: ParsedGoalValues): SaveGoalRequestDto {
  return {
    goal: goalOutcomeForSave(
      values.goalType,
      values.targetWeight,
      values.targetDate,
    ),
    activePlan: {
      startDate: values.startDate,
      baseTargets: {
        calories: values.calories,
        protein: values.protein,
        carbs: values.carbs,
        fat: values.fat,
        fiber: values.fiber,
      },
      schedule: values.advancedSchedule ?? {
        type: "FLAT",
        activeTo: null,
      },
      calculator: values.calculatorSnapshot,
      calculatorUpdateMode: values.calculatorUpdateMode,
    },
    acceptedWarningCodes: values.acceptedWarningCodes,
    blockingWarningCodes: [],
  };
}

function firstGoalFieldError(fieldErrors?: GoalFormState["fieldErrors"]) {
  if (!fieldErrors) return undefined;
  return Object.values(fieldErrors).find(
    (message): message is string => Boolean(message?.trim()),
  );
}

function goalPreviewApiErrorMessage(error: ApiClientError) {
  if (error.code === "VALIDATION_ERROR")
    return "اطلاعات محاسبه‌گر را بررسی کنید.";
  return localizedApiErrorMessage(error) || "محاسبه هدف انجام نشد.";
}

function goalApiErrorMessage(error: ApiClientError) {
  if (error.code === "VALIDATION_ERROR") {
    if (error.message.includes("FLAT schedules cannot include")) {
      return "برای افزودن برنامه هفتگی یا روز ریفید، روش «یکسان در تمام روزها» را تغییر بده.";
    }
    if (error.message.includes("activeTo must be on or after activeFrom")) {
      return "تاریخ پایان برنامه باید بعد از تاریخ شروع باشد.";
    }
    if (error.message.includes("weekdayTargets contains an invalid day")) {
      return "یکی از روزهای برنامه معتبر نیست. روزهای هفته را دوباره انتخاب کن.";
    }
    return "هدف ذخیره نشد. اطلاعات برنامه را بررسی کن و دوباره تلاش کن.";
  }
  if (error.code === "SUBSCRIPTION_REQUIRED")
    return "برای برنامه‌های غیر تخت اشتراک فعال لازم است.";
  if (error.code === "SUBSCRIPTION_EXPIRED")
    return "اشتراک شما برای برنامه‌های غیر تخت منقضی شده است.";
  return localizedApiErrorMessage(error) || "هدف ذخیره نشد.";
}

function mapGoalFieldErrors(fieldErrors?: Record<string, string>) {
  if (!fieldErrors) return undefined;

  const mapped: GoalFormState["fieldErrors"] = {};
  for (const [field, message] of Object.entries(fieldErrors)) {
    const mappedField = goalFieldMap[field] ?? field;
    mapped[mappedField as keyof NonNullable<GoalFormState["fieldErrors"]>] =
      message;
  }
  return mapped;
}

const goalFieldMap: Record<string, keyof GoalFormValues | "baseTargets"> = {
  "goal.type": "goalType",
  "goal.targetWeight.value": "targetWeight",
  "goal.targetDate": "targetDate",
  "activePlan.startDate": "startDate",
  "activePlan.baseTargets": "baseTargets",
  "activePlan.calculator": "baseTargets",
  "activePlan.calculatorUpdateMode": "baseTargets",
  "activePlan.baseTargets.calories": "calories",
  "activePlan.baseTargets.protein": "protein",
  "activePlan.baseTargets.carbs": "carbs",
  "activePlan.baseTargets.fat": "fat",
  "activePlan.baseTargets.fiber": "fiber",
};

function mapGoalPreviewFieldErrors(fieldErrors?: Record<string, string>) {
  if (!fieldErrors) return undefined;

  const mapped: GoalPreviewFormState["fieldErrors"] = {};
  for (const [field, message] of Object.entries(fieldErrors)) {
    const mappedField = goalPreviewFieldMap[field] ?? field;
    mapped[mappedField as keyof GoalPreviewFormValues] = message;
  }
  return mapped;
}

const goalPreviewFieldMap: Record<string, keyof GoalPreviewFormValues> = {
  sex: "sex",
  birthDate: "birthDate",
  heightCm: "heightCm",
  currentWeightKg: "currentWeightKg",
  targetWeightKg: "targetWeightKg",
  dailyMovementLevel: "dailyMovementLevel",
  workoutFrequency: "workoutFrequency",
  goalType: "goalType",
  speed: "speed",
};
