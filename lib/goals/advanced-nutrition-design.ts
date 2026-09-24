import type {
  GoalScheduleType,
  MacroTargetAdjustmentMode,
  NutritionTargetsDto,
  SaveGoalRequestDto,
  Weekday,
} from "../api/goals";
import type {
  GoalFormValues,
  MacroStrategyId,
  PlanningPatternId,
} from "./goal-form";
import {
  applyCompensatedRefeed,
  effectiveManualDailyTargets,
  flatScheduleRefeedError,
  manualDailyTargetsAreValid,
  parseTrainingDays,
  reconcileWeeklyCalories,
  scheduleTypeForPlanningPattern,
} from "./advanced-nutrition-planner";

export type PlanningOption = {
  id: PlanningPatternId;
  backendType: GoalScheduleType;
  label: string;
  description: string;
};

export type MacroStrategyOption = {
  id: MacroStrategyId;
  label: string;
  description: string;
  dietMode: string | null;
  macroAdjustmentMode: MacroTargetAdjustmentMode;
};

export const planningPatternOptions: PlanningOption[] = [
  {
    id: "UNIFORM",
    backendType: "FLAT",
    label: "یکسان در تمام روزها",
    description: "کالری هدف در تمام روزهای هفته یکسان است.",
  },
  {
    id: "TRAINING_REST",
    backendType: "CUSTOM",
    label: "براساس تمرین و استراحت",
    description:
      "روزهای تمرین کالری بیشتری می‌گیرند و روزهای استراحت سبک‌تر تنظیم می‌شوند، بدون تغییر مجموع بودجه هفتگی.",
  },
  {
    id: "CUSTOM",
    backendType: "CUSTOM",
    label: "تنظیم دستی",
    description: "کالری هر روز را مستقیماً تنظیم کنید.",
  },
];

export const weekdayPatternOptions: PlanningOption[] = [
  {
    id: "ZIGZAG",
    backendType: "ZIGZAG",
    label: "ریتم کاری هفته",
    description: "کالری روزها به‌صورت یک ریتم کنترل‌شده بالا و پایین می‌شود.",
  },
  {
    id: "HIGH_WEEKEND",
    backendType: "WEEKDAY_WEEKEND",
    label: "آخر هفته پرمصرف",
    description: "پنجشنبه و جمعه سهم بیشتری از بودجه هفتگی می‌گیرند.",
  },
  {
    id: "LOW_WEEKEND",
    backendType: "WEEKDAY_WEEKEND",
    label: "آخر هفته کم‌مصرف",
    description: "پنجشنبه و جمعه سبک‌تر و روزهای کاری کمی پرکالری‌تر می‌شوند.",
  },
];

export const macroStrategyOptions: MacroStrategyOption[] = [
  {
    id: "CUSTOM",
    label: "ماکرو سفارشی",
    description:
      "پروتئین حداقلی، بازه چربی و ترجیح کربوهیدرات را دستی تنظیم می‌کنید.",
    dietMode: "CUSTOM_MACROS",
    macroAdjustmentMode: "FIXED_PROTEIN_FLEXIBLE_CARBS_FAT",
  },
  {
    id: "BALANCED",
    label: "متعادل",
    description:
      "پروتئین کافی، چربی میانه و کربوهیدرات مناسب انرژی روزانه حفظ می‌شود.",
    dietMode: "BALANCED",
    macroAdjustmentMode: "SCALE_WITH_CALORIES",
  },
  {
    id: "HIGH_PROTEIN",
    label: "پروتئین بالا",
    description:
      "پروتئین حداقلی بالاتر می‌رود و کربوهیدرات و چربی با کالری باقی‌مانده تنظیم می‌شوند.",
    dietMode: "HIGH_PROTEIN",
    macroAdjustmentMode: "FIXED_PROTEIN_FLEXIBLE_CARBS_FAT",
  },
  {
    id: "BODYBUILDING",
    label: "بدنسازی",
    description:
      "پروتئین و کربوهیدرات تمرینی بیشتر می‌شوند و چربی در بازه کنترل‌شده می‌ماند.",
    dietMode: "BODYBUILDING",
    macroAdjustmentMode: "FIXED_PROTEIN_FLEXIBLE_CARBS_FAT",
  },
  {
    id: "KETOGENIC",
    label: "کتوژنیک",
    description:
      "کربوهیدرات بسیار پایین، چربی بالا و پروتئین متوسط‌تر برای الگوی کتو تنظیم می‌شود.",
    dietMode: "KETOGENIC",
    macroAdjustmentMode: "FIXED_GRAMS",
  },
  {
    id: "CARNIVORE_STYLE",
    label: "کارنیور-استایل",
    description:
      "کربوهیدرات نزدیک صفر، پروتئین بالا و چربی متناسب با کالری باقی‌مانده پیشنهاد می‌شود.",
    dietMode: "CARNIVORE_STYLE",
    macroAdjustmentMode: "FIXED_GRAMS",
  },
];

export const weekdays: Array<{ key: Weekday; label: string; weekend: boolean }> = [
  { key: "SATURDAY", label: "شنبه", weekend: false },
  { key: "SUNDAY", label: "یکشنبه", weekend: false },
  { key: "MONDAY", label: "دوشنبه", weekend: false },
  { key: "TUESDAY", label: "سه‌شنبه", weekend: false },
  { key: "WEDNESDAY", label: "چهارشنبه", weekend: false },
  { key: "THURSDAY", label: "پنجشنبه", weekend: true },
  { key: "FRIDAY", label: "جمعه", weekend: true },
];

export function buildNutritionPreview(values: GoalFormValues) {
  const calories = numeric(values.calories, 2000);
  const strategy = macroStrategyOptions.find(
    (item) => item.id === values.macroStrategy,
  );
  const macros = macroTargetsFor(values, calories);
  const mealsPerDay = clamp(Math.round(numeric(values.mealsPerDay, 4)), 2, 8);
  const breakfastShare = clamp(numeric(values.breakfastShare, 25), 5, 50);
  const dinnerShare = clamp(numeric(values.dinnerShare, 30), 10, 60);

  return {
    calories,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
    macroCalories: macros.protein * 4 + macros.carbs * 4 + macros.fat * 9,
    strategy,
    weeklyPlan: weeklyPlanFor(values, calories),
    weeklyBudget: Math.round(calories * 7),
    breakfastCalories: Math.round(calories * (breakfastShare / 100)),
    dinnerCalories: Math.round(calories * (dinnerShare / 100)),
    averageMealCalories: Math.round(calories / mealsPerDay),
  };
}

export function designerValuesFromPreview(
  values: GoalFormValues,
): Partial<GoalFormValues> {
  const preview = buildNutritionPreview(values);
  return {
    scheduleType: scheduleTypeForPlanningPattern(values.planningPattern),
    trainingDayCalories: inputNumber(
      trainingDayCaloriesFor(values, preview.calories),
    ),
    restDayCalories: inputNumber(restDayCaloriesFor(values, preview.calories)),
  };
}

export function schedulePayloadForDesigner(
  values: GoalFormValues,
): NonNullable<SaveGoalRequestDto["activePlan"]["schedule"]> {
  const strategy = macroStrategyOptions.find(
    (item) => item.id === values.macroStrategy,
  );
  const preview = buildNutritionPreview(values);
  const weekdayTargets = Object.fromEntries(
    preview.weeklyPlan.map((day) => [
      day.key,
      targetForCalories(day.calories, preview),
    ]),
  ) as Partial<Record<Weekday, NutritionTargetsDto>>;

  return {
    type: scheduleTypeForPlanningPattern(values.planningPattern),
    activeTo: null,
    weeklyCalorieBudget: preview.weeklyPlan.reduce(
      (total, day) => total + day.calories,
      0,
    ),
    weekdayTargets,
    dateOverrides: {},
    macroAdjustmentMode: strategy?.macroAdjustmentMode ?? "FIXED_GRAMS",
    dietMode: advancedDietModeFor(values, strategy?.dietMode ?? null),
  };
}

export function rebaseAdvancedSchedule(
  current: GoalFormValues,
  nextBase: Partial<GoalFormValues>,
) {
  const merged = { ...current, ...nextBase };
  const oldCalories = numeric(current.calories, 2000);
  const newCalories = numeric(merged.calories, oldCalories);
  const calorieRatio = newCalories / Math.max(oldCalories, 1);
  const rebasedValues = {
    ...merged,
    trainingDayCalories: inputNumber(
      numeric(current.trainingDayCalories, oldCalories + 150) * calorieRatio,
    ),
    restDayCalories: inputNumber(
      numeric(current.restDayCalories, oldCalories - 100) * calorieRatio,
    ),
  };

  if (current.planningPattern === "CUSTOM") {
    const manual = effectiveManualDailyTargets(
      current.manualDailyTargets,
      oldCalories,
    );
    const reconciled = reconcileWeeklyCalories(
      weekdays.map((day) => manual[day.key] ?? oldCalories),
      Math.round(newCalories * 7),
    );
    rebasedValues.manualDailyTargets = JSON.stringify(
      Object.fromEntries(
        weekdays.map((day, index) => [day.key, reconciled[index]]),
      ),
    );
  }

  const rebased = schedulePayloadForDesigner(rebasedValues);
  const previous = parseSavedSchedule(current.advancedSchedule);
  if (previous?.dateOverrides) {
    rebased.dateOverrides = Object.fromEntries(
      Object.entries(previous.dateOverrides).map(([date, targets]) => [
        date,
        scaleOverride(targets, current, merged),
      ]),
    );
  }
  return rebased;
}

function parseSavedSchedule(value: string) {
  try {
    return JSON.parse(value) as {
      dateOverrides?: Record<string, NutritionTargetsDto>;
    };
  } catch {
    return null;
  }
}

function scaleOverride(
  target: NutritionTargetsDto,
  current: GoalFormValues,
  next: GoalFormValues,
): NutritionTargetsDto {
  const ratio = (field: "calories" | "protein" | "carbs" | "fat") =>
    numeric(next[field], target[field]) /
    Math.max(numeric(current[field], target[field]), 1);
  return {
    calories: Math.round(target.calories * ratio("calories")),
    protein: Math.round(target.protein * ratio("protein")),
    carbs: Math.round(target.carbs * ratio("carbs")),
    fat: Math.round(target.fat * ratio("fat")),
    fiber:
      target.fiber == null
        ? null
        : Math.round(
            target.fiber *
              (numeric(next.fiber, target.fiber) /
                Math.max(numeric(current.fiber, target.fiber), 1)),
          ),
  };
}

function weeklyPlanFor(values: GoalFormValues, calories: number) {
  const trainingDays = new Set(trainingDaysFrom(values.trainingDays));
  const manualTargets = manualTargetsFrom(values.manualDailyTargets, calories);
  const rawPlan = weekdays.map((day, index) => {
    let target = calories;
    if (values.planningPattern === "TRAINING_REST") {
      target = trainingDays.has(day.key)
        ? trainingDayCaloriesFor(values, calories)
        : restDayCaloriesFor(values, calories);
    } else if (values.planningPattern === "ZIGZAG")
      target = calories * (index % 2 === 0 ? 1.1 : 0.9);
    else if (values.planningPattern === "HIGH_WEEKEND")
      target = calories * (day.weekend ? 1.18 : 0.93);
    else if (values.planningPattern === "LOW_WEEKEND")
      target = calories * (day.weekend ? 0.86 : 1.06);
    else if (values.planningPattern === "CUSTOM")
      target = manualTargets[day.key];
    return { ...day, calories: target };
  });

  const primaryPlan =
    values.planningPattern === "CUSTOM"
      ? rawPlan.map((day) => ({ ...day, calories: Math.round(day.calories) }))
      : reconcileWeeklyRounding(rawPlan, Math.round(calories * 7));
  return applyRefeed(primaryPlan, values, Math.round(calories * 7));
}

function reconcileWeeklyRounding<T extends { calories: number }>(
  plan: T[],
  budget: number,
): T[] {
  const reconciled = reconcileWeeklyCalories(
    plan.map((day) => day.calories),
    budget,
  );
  return plan.map((day, index) => ({ ...day, calories: reconciled[index] }));
}

function applyRefeed<T extends { key: Weekday; calories: number }>(
  plan: T[],
  values: GoalFormValues,
  budget: number,
): T[] {
  if (values.refeedFrequency === "NONE") return plan;
  const primaryTotal = plan.reduce((sum, day) => sum + day.calories, 0);
  if (Math.abs(primaryTotal - budget) > 2) return plan;
  const refeedDay = weekdayKeys.has(values.refeedDay as Weekday)
    ? (values.refeedDay as Weekday)
    : "FRIDAY";
  const increase = clamp(numeric(values.refeedIncrease, 10), 5, 15) / 100;
  const selected = plan.find((day) => day.key === refeedDay);
  if (!selected) return plan;
  const selectedIndex = plan.indexOf(selected);
  const adjusted = applyCompensatedRefeed(
    plan.map((day) => day.calories),
    selectedIndex,
    increase * 100,
    budget,
  );
  return plan.map((day, index) => ({ ...day, calories: adjusted[index] }));
}

export const manualTargetsFrom = effectiveManualDailyTargets;

export function validateMacroConfiguration(
  values: GoalFormValues,
  calories: number,
) {
  if (values.macroStrategy !== "CUSTOM")
    return { valid: true, errors: [] as string[] };
  const errors: string[] = [];
  const protein = numeric(values.minProtein, 0);
  const fatMin = numeric(values.fatMin, 0);
  const fatMax = numeric(values.fatMax, 0);
  if (protein < 40 || protein > 300)
    errors.push("پروتئین باید بین ۴۰ تا ۳۰۰ گرم باشد.");
  if (fatMin > fatMax)
    errors.push("حداقل چربی نمی‌تواند بیشتر از حداکثر چربی باشد.");
  const macros = macroTargetsFor(values, calories);
  const delta = Math.abs(
    macros.protein * 4 + macros.carbs * 4 + macros.fat * 9 - calories,
  );
  if (delta > 20)
    errors.push(
      "کالری ماکروها باید با هدف روزانه، با حداکثر ۲۰ کالری اختلاف، برابر باشد.",
    );
  return { valid: errors.length === 0, errors };
}

export function validateWeeklyPlan(
  values: GoalFormValues,
  plan: Array<{ calories: number }>,
  budget: number,
) {
  const total = plan.reduce((sum, day) => sum + day.calories, 0);
  const difference = Math.round(total - budget);
  const errors: string[] = [];
  const refeedError = flatScheduleRefeedError(
    values.planningPattern,
    values.refeedFrequency,
  );
  if (refeedError) errors.push(refeedError);
  if (values.planningPattern === "TRAINING_REST") {
    const count = trainingDaysFrom(values.trainingDays).length;
    if (count < 1 || count > 6)
      errors.push("حداقل یک روز تمرین و یک روز استراحت انتخاب کنید.");
  }
  if (
    values.planningPattern === "CUSTOM" &&
    !manualDailyTargetsAreValid(values.manualDailyTargets)
  )
    errors.push("مقادیر دستی ناقص یا نامعتبر است؛ هر هفت روز را بررسی کنید.");
  if (plan.some((day) => day.calories < 800 || day.calories > 6000))
    errors.push("کالری روزانه خارج از بازه قابل قبول است.");
  if (Math.abs(difference) > 2)
    errors.push("مجموع کالری هفت روز باید برابر بودجه کالری هفتگی باشد.");
  return { valid: errors.length === 0, errors, difference };
}

export function validateMealConfiguration(values: GoalFormValues) {
  const errors: string[] = [];
  const meals = Math.round(numeric(values.mealsPerDay, 0));
  const breakfast = numeric(values.breakfastShare, 0);
  const dinner = numeric(values.dinnerShare, 0);
  if (meals < 2 || meals > 8)
    errors.push("تعداد وعده‌ها باید بین ۲ تا ۸ باشد.");
  if (breakfast < 5 || breakfast > 50)
    errors.push("سهم صبحانه باید بین ۵ تا ۵۰ درصد باشد.");
  if (dinner < 10 || dinner > 60)
    errors.push("سهم شام باید بین ۱۰ تا ۶۰ درصد باشد.");
  if (breakfast + dinner >= 100)
    errors.push("برای وعده‌های دیگر نیز باید سهم کالری باقی بماند.");
  return { valid: errors.length === 0, errors };
}

function macroTargetsFor(values: GoalFormValues, calories: number) {
  const customProtein = clamp(
    numeric(values.minProtein, numeric(values.protein, 120)),
    0,
    400,
  );
  const customFatMin = clamp(numeric(values.fatMin, 45), 0, 300);
  const customFatMax = clamp(numeric(values.fatMax, 80), customFatMin, 300);

  switch (values.macroStrategy) {
    case "BALANCED":
      return fromProteinFat(
        calories,
        Math.round((calories * 0.22) / 4),
        Math.round((calories * 0.28) / 9),
      );
    case "HIGH_PROTEIN":
      return fromProteinFat(
        calories,
        Math.max(customProtein, Math.round((calories * 0.32) / 4)),
        Math.round((calories * 0.24) / 9),
      );
    case "BODYBUILDING":
      return fromProteinFat(
        calories,
        Math.max(customProtein, Math.round((calories * 0.3) / 4)),
        Math.round((calories * 0.22) / 9),
      );
    case "KETOGENIC":
      return fromProteinCarbs(calories, Math.round((calories * 0.25) / 4), 30);
    case "CARNIVORE_STYLE":
      return fromProteinCarbs(calories, Math.round((calories * 0.38) / 4), 8);
    default: {
      const carbBias =
        values.carbPreference === "HIGH"
          ? -8
          : values.carbPreference === "LOW"
            ? 8
            : 0;
      const fat = clamp(
        Math.round((customFatMin + customFatMax) / 2) + carbBias,
        customFatMin,
        customFatMax,
      );
      return fromProteinFat(calories, customProtein, fat);
    }
  }
}

function fromProteinFat(calories: number, protein: number, fat: number) {
  const remaining = calories - protein * 4 - fat * 9;
  return {
    protein,
    fat,
    carbs: Math.max(0, Math.round(remaining / 4)),
  };
}

function fromProteinCarbs(calories: number, protein: number, carbs: number) {
  const remaining = calories - protein * 4 - carbs * 4;
  return {
    protein,
    carbs,
    fat: Math.max(0, Math.round(remaining / 9)),
  };
}

export function targetForCalories(
  calories: number,
  preview: ReturnType<typeof buildNutritionPreview>,
): NutritionTargetsDto {
  const scale = calories / Math.max(preview.calories, 1);
  return {
    calories,
    protein: Math.round(preview.protein * scale),
    carbs: Math.round(preview.carbs * scale),
    fat: Math.round(preview.fat * scale),
    fiber: null,
  };
}

export function carbPreferenceLabel(value: string) {
  if (value === "LOW") return "کم";
  if (value === "HIGH") return "زیاد";
  return "متوسط";
}

const weekdayKeys = new Set<Weekday>(weekdays.map((day) => day.key));

export function trainingDaysFrom(value: string): Weekday[] {
  return parseTrainingDays(value);
}

export function weekdayLabel(value: string) {
  return weekdays.find((day) => day.key === value)?.label ?? "جمعه";
}

function trainingDayCaloriesFor(values: GoalFormValues, calories: number) {
  return Math.round(numeric(values.trainingDayCalories, calories + 150));
}

function restDayCaloriesFor(values: GoalFormValues, calories: number) {
  return Math.round(numeric(values.restDayCalories, calories - 100));
}

function advancedDietModeFor(
  values: GoalFormValues,
  strategyMode: string | null,
) {
  return `ADVANCED_NUTRITION:${JSON.stringify({
    strategy: strategyMode,
    macroStrategy: values.macroStrategy,
    planningPattern: values.planningPattern,
    mealsPerDay: Math.round(numeric(values.mealsPerDay, 4)),
    breakfastShare: numeric(values.breakfastShare, 25),
    dinnerShare: numeric(values.dinnerShare, 30),
    trainingDays: trainingDaysFrom(values.trainingDays),
    trainingDayCalories: trainingDayCaloriesFor(
      values,
      numeric(values.calories, 2000),
    ),
    restDayCalories: restDayCaloriesFor(values, numeric(values.calories, 2000)),
    refeedFrequency: values.refeedFrequency,
    refeedDay: values.refeedDay,
    refeedIncrease: numeric(values.refeedIncrease, 10),
    manualDailyTargets:
      values.planningPattern === "CUSTOM"
        ? JSON.stringify(
            effectiveManualDailyTargets(
              values.manualDailyTargets,
              numeric(values.calories, 2000),
            ),
          )
        : values.manualDailyTargets,
  })}`;
}

export function refeedLabel(value: string) {
  if (value === "WEEKLY") return "هر هفته";
  return "خاموش";
}

export function numeric(value: string, fallback: number) {
  const normalized = value
    .trim()
    .replace(/[۰-۹٠-٩]/g, (digit) => {
      const digits = "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩";
      const mapped = "01234567890123456789";
      return mapped[digits.indexOf(digit)] ?? digit;
    })
    .replace(/[٫٬،]/g, ".")
    .replace(/,/g, ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function inputNumber(value: number) {
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 3,
    useGrouping: false,
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
