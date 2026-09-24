"use client";

import type React from "react";
import {useEffect, useMemo} from "react";
import {CalendarDaysIcon, CheckIcon, ClipboardCheckIcon, DumbbellIcon, SlidersHorizontalIcon, UtensilsIcon,} from "lucide-react";
import {CartesianGrid, Legend, Line, LineChart, XAxis, YAxis} from "recharts";

import {LockedFeature} from "@/components/subscription/locked-feature";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldTitle,} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger,} from "@/components/ui/select";
import type {Weekday} from "@/lib/api/goals";
import type {GoalFormValues, PlanningPatternId} from "@/lib/goals/goal-form";
import {advancedPlannerControlAccess} from "@/lib/goals/advanced-nutrition-planner";
import {
  buildNutritionPreview,
  carbPreferenceLabel,
  designerValuesFromPreview,
  macroStrategyOptions,
  manualTargetsFrom,
  numeric,
  planningPatternOptions,
  refeedLabel,
  targetForCalories,
  trainingDaysFrom,
  validateMacroConfiguration,
  validateMealConfiguration,
  validateWeeklyPlan,
  weekdayLabel,
  weekdayPatternOptions,
  weekdays,
} from "@/lib/goals/advanced-nutrition-design";
import {canUseEntitlement, type Entitlement, type SubscriptionState,} from "@/lib/subscription/entitlements";
import {toPersianDigits} from "@/lib/format";
import {NUTRITION_CALORIE_VISUAL_DIVISOR} from "@/lib/progress/nutrition-chart";
import {cn} from "@/lib/utils";

type AdvancedNutritionDesignerProps = {
  values: GoalFormValues;
  subscription: SubscriptionState;
  step: AdvancedStepId;
  onChange: (name: keyof GoalFormValues, value: string) => void;
  onApplyPreview: (values: Partial<GoalFormValues>) => void;
  onStepChange: (step: AdvancedStepId) => void;
  onCurrentStepValidityChange?: (valid: boolean) => void;
  onValidityChange?: (valid: boolean) => void;
};


export type AdvancedStepId = "macro" | "weekly" | "meals" | "result";

const advancedSteps: Array<{
  id: AdvancedStepId;
  label: string;
  description: string;
}> = [
  { id: "macro", label: "استراتژی تغذیه", description: "ترکیب درشت‌مغذی‌ها" },
  {
    id: "weekly",
    label: "کالری روزهای هفته",
    description: "توزیع کالری هفتگی",
  },
  {
    id: "meals",
    label: "ساختار وعده‌ها",
    description: "تقسیم کالری بین وعده‌ها",
  },
  { id: "result", label: "بررسی و ذخیره", description: "مرور برنامه نهایی" },
];

export function AdvancedNutritionDesigner({
  values,
  subscription,
  step,
  onChange,
  onApplyPreview,
  onStepChange,
  onCurrentStepValidityChange,
  onValidityChange,
}: AdvancedNutritionDesignerProps) {
  const unlocked = canUseEntitlement(subscription, "premium_schedules");
  const workoutUnlocked = canUseEntitlement(
    subscription,
    "TRAINING_REST_DAY_TARGETS",
  );
  const refeedUnlocked = canUseEntitlement(subscription, "REFEED_STRATEGY");
  const controlAccess = advancedPlannerControlAccess({
    plannerUnlocked: unlocked,
    workoutUnlocked,
    refeedUnlocked,
  });
  const customMacros = values.macroStrategy === "CUSTOM";
  const primaryMode = weekdayPatternOptions.some(
    (item) => item.id === values.planningPattern,
  )
    ? "WEEKDAY"
    : values.planningPattern;
  const flatSchedule = values.planningPattern === "UNIFORM";
  const refeedControlsDisabled =
    controlAccess.refeedDisabled || flatSchedule;
  const {preview, macroValidation, weeklyValidation, mealValidation} = useMemo(() => {
    const preview = buildNutritionPreview(values);
    return {
      preview,
      macroValidation: validateMacroConfiguration(values, preview.calories),
      weeklyValidation: validateWeeklyPlan(
        values,
        preview.weeklyPlan,
        preview.calories * 7,
      ),
      mealValidation: validateMealConfiguration(values),
    };
  }, [values]);
  const planValid =
    macroValidation.valid && weeklyValidation.valid && mealValidation.valid;
  const currentStepValid =
    step === "macro"
      ? macroValidation.valid
      : step === "weekly"
        ? weeklyValidation.valid
        : true;

  useEffect(() => {
    onValidityChange?.(planValid);
  }, [onValidityChange, planValid]);

  useEffect(() => {
    onCurrentStepValidityChange?.(currentStepValid);
  }, [currentStepValid, onCurrentStepValidityChange]);

  function update(name: keyof GoalFormValues, value: string) {
    if (!unlocked) return;
    applyPatch({ [name]: value });
  }

  function applyPatch(patch: Partial<GoalFormValues>) {
    if (!unlocked) return;
    Object.entries(patch).forEach(([name, value]) => {
      onChange(name as keyof GoalFormValues, String(value));
    });
    const nextValues = { ...values, ...patch };
    onApplyPreview(designerValuesFromPreview(nextValues));
  }

  function toggleTrainingDay(day: Weekday) {
    const selected = new Set(trainingDaysFrom(values.trainingDays));
    if (selected.has(day)) {
      selected.delete(day);
    } else {
      selected.add(day);
    }

    const nextTrainingDays = weekdays
      .map((item) => item.key)
      .filter((key) => selected.has(key));
    applyPatch({ trainingDays: nextTrainingDays.join(",") });
  }

  function selectPrimaryMode(mode: string) {
    if (mode === "WEEKDAY") {
      update("planningPattern", weekdayPatternOptions[0]?.id ?? "ZIGZAG");
      return;
    }
    if (mode === "UNIFORM") {
      applyPatch({
        planningPattern: "UNIFORM",
        refeedFrequency: "NONE",
      });
      return;
    }
    update("planningPattern", mode as PlanningPatternId);
  }

  function updateManualTarget(day: Weekday, value: string) {
    const targets = manualTargetsFrom(
      values.manualDailyTargets,
      preview.calories,
    );
    targets[day] = Math.round(numeric(value, targets[day]));
    update("manualDailyTargets", JSON.stringify(targets));
  }

  return (
    <section className="flex flex-col gap-4" aria-label="طراح پیشرفته تغذیه">
      <div className="flex flex-col gap-4">
        <AdvancedStepIndicator currentStep={step} onStepChange={onStepChange} />
        {step === "macro" ? (
          <DesignerPanel
            locked={!unlocked}
            title="استراتژی تغذیه"
            description="ترکیب پروتئین، کربوهیدرات و چربی را با هدف شما هماهنگ می‌کند."
            entitlement="MACRO_STRATEGY_PRESETS"
          >
            <OptionGrid
              value={values.macroStrategy}
              options={macroStrategyOptions}
              disabled={!unlocked}
              onChange={(value) => update("macroStrategy", value)}
            />
            <div className="grid gap-3 rounded-2xl border bg-background/35 p-3">
              <FieldTitle>
                محدودیت‌های محاسبه‌شده برای الگوی انتخاب‌شده
              </FieldTitle>
              <FieldGroup className="rounded-2xl border bg-background/35 p-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <DesignerInput
                    label="حداقل پروتئین"
                    value={values.minProtein}
                    suffix="گرم"
                    disabled={!unlocked || !customMacros}
                    onChange={(value) => update("minProtein", value)}
                  />
                  <DesignerInput
                    label="حداقل چربی"
                    value={values.fatMin}
                    suffix="گرم"
                    disabled={!unlocked || !customMacros}
                    onChange={(value) => update("fatMin", value)}
                  />
                  <DesignerInput
                    label="حداکثر چربی"
                    value={values.fatMax}
                    suffix="گرم"
                    disabled={!unlocked || !customMacros}
                    onChange={(value) => update("fatMax", value)}
                  />
                </div>
                <Field>
                  <FieldLabel>ترجیح کربوهیدرات</FieldLabel>
                  <Select
                    value={values.carbPreference}
                    onValueChange={(value) => {
                      if (value) update("carbPreference", value);
                    }}
                    disabled={!unlocked || !customMacros}
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl text-right">
                      <span>{carbPreferenceLabel(values.carbPreference)}</span>
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectGroup>
                        <SelectItem value="LOW">کم</SelectItem>
                        <SelectItem value="MODERATE">متوسط</SelectItem>
                        <SelectItem value="HIGH">زیاد</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              {!customMacros ? (
                <FieldDescription>
                  برای ویرایش دستی این مقادیر، «ماکرو سفارشی» را انتخاب کنید.
                </FieldDescription>
              ) : null}
              {macroValidation.errors.map((error) => (
                <FieldError key={error}>{error}</FieldError>
              ))}
            </div>
            <div className="grid gap-2 rounded-2xl border bg-background/35 p-3 sm:grid-cols-4">
              <PreviewMetric
                label="پروتئین روزانه"
                value={preview.protein}
                unit="گرم"
              />
              <PreviewMetric
                label="چربی روزانه"
                value={preview.fat}
                unit="گرم"
              />
              <PreviewMetric
                label="کربوهیدرات روزانه"
                value={preview.carbs}
                unit="گرم"
              />
              <PreviewMetric
                label="کالری محاسبه‌شده از ماکروها"
                value={preview.macroCalories}
                unit="kcal"
              />
            </div>
          </DesignerPanel>
        ) : null}

        {step === "weekly" ? (
          <DesignerPanel
            locked={!unlocked}
            title="کالری روزهای هفته"
            description="بودجه هفتگی را بدون تغییر مجموع، بین روزهای هفته تقسیم می‌کند."
            entitlement="WEEKLY_CALORIE_PLANNING"
          >
            <div className="grid gap-2 rounded-2xl border bg-background/35 p-3 sm:grid-cols-2">
              <PreviewMetric
                label="میانگین کالری روزانه"
                value={preview.calories}
                unit="kcal"
              />
              <PreviewMetric
                label="مجموع کالری هفتگی"
                value={preview.weeklyBudget}
                unit="kcal"
              />
            </div>
            <div className="grid gap-2">
              <FieldTitle>روش تعیین کالری روزها</FieldTitle>
              <div className="grid gap-2 md:grid-cols-2">
                {[
                  ...planningPatternOptions,
                  {
                    id: "WEEKDAY",
                    label: "براساس روزهای هفته",
                    description: "کالری براساس روزهای مشخص هفته توزیع می‌شود.",
                  },
                ].map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    size="xl"
                    variant={
                      primaryMode === option.id ? "choice-selected" : "choice"
                    }
                    aria-pressed={primaryMode === option.id}
                    disabled={
                      !unlocked ||
                      (option.id === "TRAINING_REST" && !workoutUnlocked)
                    }
                    className="h-auto min-h-20 items-start justify-start whitespace-normal rounded-2xl px-3 py-3 text-right"
                    onClick={() => selectPrimaryMode(option.id)}
                  >
                    <span className="grid gap-1">
                      <strong>{option.label}</strong>
                      <span className="text-xs font-normal leading-6 text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </Button>
                ))}
              </div>
            </div>
            {primaryMode === "TRAINING_REST" ? (
              <LockedFeature
                locked={!workoutUnlocked}
                featureName="تقسیم تمرین و استراحت"
                reasonCode="SUBSCRIPTION_MISSING"
              >
                <div className="grid gap-3 rounded-2xl border bg-background/35 p-3">
                  <div className="grid grid-cols-7 gap-1">
                    {weekdays.map((day) => {
                      const selected = trainingDaysFrom(
                        values.trainingDays,
                      ).includes(day.key);
                      return (
                        <Button
                          key={day.key}
                          type="button"
                          variant={selected ? "choice-selected" : "choice"}
                          size="sm"
                          disabled={!unlocked || !workoutUnlocked}
                          aria-pressed={selected}
                          className="h-auto min-h-14 flex-col gap-1 rounded-xl px-1 py-2 text-[0.68rem]"
                          onClick={() => toggleTrainingDay(day.key)}
                        >
                          <span className="truncate">{day.label}</span>
                          <span className="text-[0.6rem] font-normal text-muted-foreground">
                            {selected ? "تمرین" : "استراحت"}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DesignerInput
                      label="کالری روز تمرین"
                      value={values.trainingDayCalories}
                      suffix="kcal"
                      disabled={!unlocked || !workoutUnlocked}
                      onChange={(value) => update("trainingDayCalories", value)}
                    />
                    <DesignerInput
                      label="کالری روز استراحت"
                      value={values.restDayCalories}
                      suffix="kcal"
                      disabled={!unlocked || !workoutUnlocked}
                      onChange={(value) => update("restDayCalories", value)}
                    />
                  </div>
                </div>
              </LockedFeature>
            ) : null}
            {primaryMode === "WEEKDAY" ? (
              <OptionGrid
                value={values.planningPattern}
                options={weekdayPatternOptions}
                disabled={!unlocked}
                onChange={(value) => update("planningPattern", value)}
              />
            ) : null}
            {primaryMode === "CUSTOM" ? (
              <div className="grid gap-3 rounded-2xl border bg-background/35 p-3">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {weekdays.map((day) => (
                    <DesignerInput
                      key={day.key}
                      label={day.label}
                      value={String(
                        manualTargetsFrom(
                          values.manualDailyTargets,
                          preview.calories,
                        )[day.key],
                      )}
                      suffix="kcal"
                      disabled={controlAccess.manualDisabled}
                      onChange={(value) => updateManualTarget(day.key, value)}
                    />
                  ))}
                </div>
                <div className="grid gap-2 text-sm sm:grid-cols-3">
                  <span>
                    بودجه هفتگی: {toPersianDigits(preview.weeklyBudget)}
                  </span>
                  <span>
                    مجموع فعلی:{" "}
                    {toPersianDigits(
                      preview.weeklyPlan.reduce(
                        (sum, day) => sum + day.calories,
                        0,
                      ),
                    )}
                  </span>
                  <span>
                    اختلاف: {toPersianDigits(weeklyValidation.difference)} کالری
                  </span>
                </div>
              </div>
            ) : null}
            <div className="grid grid-cols-7 gap-1 rounded-2xl border bg-background/35 p-2">
              {preview.weeklyPlan.map((day) => (
                <div key={day.key} className="grid min-w-0 gap-1 text-center">
                  <span className="truncate text-[0.65rem] text-muted-foreground">
                    {day.label}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-1 py-1 text-[0.68rem] font-bold tabular-nums",
                      day.weekend
                        ? "bg-primary/15 text-primary"
                        : "bg-muted/45",
                    )}
                  >
                    {toPersianDigits(day.calories)}
                  </span>
                </div>
              ))}
            </div>
            <LockedFeature
              locked={!refeedUnlocked}
              featureName="روز پرکالری برنامه‌ریزی‌شده"
              reasonCode="SUBSCRIPTION_MISSING"
            >
              <div
                className={cn(
                  "grid gap-3 rounded-2xl border bg-background/35 p-3",
                  flatSchedule && "bg-muted/25",
                )}
              >
                <div>
                  <FieldTitle>روز ریفید</FieldTitle>
                  <FieldDescription>
                    یک روز را پرکالری‌تر می‌کند و بودجه هفتگی را ثابت نگه
                    می‌دارد.
                  </FieldDescription>
                </div>
                {flatSchedule ? (
                  <FieldDescription className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-foreground">
                    برای افزودن روز ریفید، روش «یکسان در تمام روزها» را تغییر
                    بده.
                  </FieldDescription>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>تناوب ریفید</FieldLabel>
                    <Select
                      value={values.refeedFrequency}
                      onValueChange={(value) => {
                        if (value) update("refeedFrequency", value);
                      }}
                      disabled={refeedControlsDisabled}
                    >
                      <SelectTrigger className="h-11 w-full rounded-xl text-right">
                        <span>{refeedLabel(values.refeedFrequency)}</span>
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectGroup>
                          <SelectItem value="NONE">خاموش</SelectItem>
                          <SelectItem value="WEEKLY">هر هفته</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>روز ریفید</FieldLabel>
                    <Select
                      value={values.refeedDay}
                      onValueChange={(value) => {
                        if (value) update("refeedDay", value);
                      }}
                      disabled={
                        !unlocked ||
                        !refeedUnlocked ||
                        flatSchedule ||
                        values.refeedFrequency === "NONE"
                      }
                    >
                      <SelectTrigger className="h-11 w-full rounded-xl text-right">
                        <span>{weekdayLabel(values.refeedDay)}</span>
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectGroup>
                          {weekdays.map((day) => (
                            <SelectItem key={day.key} value={day.key}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  {values.refeedFrequency !== "NONE" ? (
                    <Field>
                      <FieldLabel>میزان افزایش</FieldLabel>
                      <Select
                        value={values.refeedIncrease}
                        onValueChange={(value) =>
                          value && update("refeedIncrease", value)
                        }
                        disabled={refeedControlsDisabled}
                      >
                        <SelectTrigger className="h-11 w-full rounded-xl text-right">
                          <span>{toPersianDigits(values.refeedIncrease)}٪</span>
                        </SelectTrigger>
                        <SelectContent align="end">
                          <SelectGroup>
                            <SelectItem value="5">افزایش ملایم: ۵٪</SelectItem>
                            <SelectItem value="10">
                              افزایش استاندارد: ۱۰٪
                            </SelectItem>
                            <SelectItem value="15">
                              افزایش بیشتر: ۱۵٪
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  ) : null}
                </div>
                {values.refeedFrequency !== "NONE" ? (
                  <FieldDescription>
                    در روز رفید کالری بیشتری دریافت می‌کنید و این مقدار از سایر
                    روزهای همان هفته کم می‌شود؛ بنابراین مجموع کالری هفتگی تغییر
                    نمی‌کند.
                  </FieldDescription>
                ) : null}
                {values.refeedFrequency !== "NONE" &&
                !weeklyValidation.valid ? (
                  <FieldDescription>
                    پس از برابر شدن مجموع روزها با بودجه هفتگی، اثر رفید در
                    پیش‌نمایش اعمال می‌شود.
                  </FieldDescription>
                ) : null}
              </div>
            </LockedFeature>
            {weeklyValidation.errors.map((error) => (
              <FieldError key={error}>{error}</FieldError>
            ))}
          </DesignerPanel>
        ) : null}

        {step === "meals" ? (
          <DesignerPanel
            locked={!unlocked}
            title="ساختار وعده‌ها"
            description="کالری هر روز را بین وعده‌های انتخاب‌شده تقسیم می‌کند."
            entitlement="MEAL_DISTRIBUTION_DESIGNER"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <DesignerInput
                label="وعده در روز"
                value={values.mealsPerDay}
                suffix="وعده"
                disabled={!unlocked}
                onChange={(value) => update("mealsPerDay", value)}
              />
              <DesignerInput
                label="سهم صبحانه"
                value={values.breakfastShare}
                suffix="٪"
                disabled={!unlocked}
                onChange={(value) => update("breakfastShare", value)}
              />
              <DesignerInput
                label="سهم شام"
                value={values.dinnerShare}
                suffix="٪"
                disabled={!unlocked}
                onChange={(value) => update("dinnerShare", value)}
              />
            </div>
            <MealDistributionPreview preview={preview} />
            {mealValidation.errors.map((error) => (
              <FieldError key={error}>{error}</FieldError>
            ))}
          </DesignerPanel>
        ) : null}
        {step === "result" ? (
          <DesignerResultPanel preview={preview} unlocked={unlocked} />
        ) : null}
      </div>
    </section>
  );
}

function AdvancedStepIndicator({
  currentStep,
  onStepChange,
}: {
  currentStep: AdvancedStepId;
  onStepChange: (step: AdvancedStepId) => void;
}) {
  const currentIndex = advancedSteps.findIndex(
    (item) => item.id === currentStep,
  );
  const progress =
    advancedSteps.length <= 1
      ? 0
      : (currentIndex / (advancedSteps.length - 1)) * 100;

  return (
    <div className="grid gap-3 rounded-2xl border bg-muted/25 p-3">
      <div className="flex items-center justify-between gap-2 text-xs font-bold">
        <span>
          مرحله {toPersianDigits(currentIndex + 1)} از{" "}
          {toPersianDigits(advancedSteps.length)}
        </span>
        <span className="text-muted-foreground">
          {advancedSteps[currentIndex]?.description}
        </span>
      </div>
      <div className="relative pb-1 pt-2">
        <div
          className="absolute inset-x-8 top-12 h-1.5 rounded-full bg-border"
          aria-hidden
        />
        <div
          className="absolute right-8 top-12 h-1.5 rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `calc((100% - 4rem) * ${progress / 100})` }}
          aria-hidden
        />
        <ol className="relative grid grid-cols-4 gap-1">
          {advancedSteps.map((item, index) => {
            const active = item.id === currentStep;
            const complete = index < currentIndex;

            return (
              <li
                key={item.id}
                className="grid min-w-0 justify-items-center gap-3 text-center"
              >
                <span className="grid max-w-full gap-0.5 pb-3 leading-5">
                  <span
                    className={cn(
                      "text-[0.65rem] font-bold",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="hidden text-[0.58rem] text-muted-foreground sm:block">
                    {item.description}
                  </span>
                </span>
                <button
                  type="button"
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border bg-background text-xs font-bold transition-colors",
                    active &&
                      "border-primary bg-primary text-primary-foreground",
                    complete && "border-primary/60 bg-primary/15 text-primary",
                    !active &&
                      !complete &&
                      "border-border text-muted-foreground",
                  )}
                  aria-current={active ? "step" : undefined}
                  disabled={!active && !complete}
                  onClick={() => onStepChange(item.id)}
                >
                  {complete ? (
                    <CheckIcon className="size-4" aria-hidden />
                  ) : (
                    toPersianDigits(index + 1)
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function DesignerPanel({
  locked,
  title,
  description,
  entitlement,
  children,
  compact = false,
}: {
  locked: boolean;
  title: string;
  description: string;
  entitlement: Entitlement;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <LockedFeature
      locked={locked}
      featureName={title}
      requiredTier="ADVANCED"
      reasonCode="SUBSCRIPTION_MISSING"
      description="برای فعال‌سازی و ذخیره این بخش، پلن پیشرفته لازم است."
    >
      <Card className="rounded-3xl border bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {iconForEntitlement(entitlement)}
            {title}
          </CardTitle>
          <CardDescription className="leading-7">{description}</CardDescription>
        </CardHeader>
        <CardContent className={cn("grid gap-3", compact && "gap-2")}>
          {children}
        </CardContent>
      </Card>
    </LockedFeature>
  );
}

function OptionGrid<TValue extends string>({
  value,
  options,
  disabled,
  onChange,
}: {
  value: TValue;
  options: ReadonlyArray<{ id: TValue; label: string; description: string }>;
  disabled: boolean;
  onChange: (value: TValue) => void;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {options.map((option) => (
        <Button
          key={option.id}
          type="button"
          variant={value === option.id ? "choice-selected" : "choice"}
          size="xl"
          disabled={disabled}
          aria-pressed={value === option.id}
          className="h-auto min-h-20 items-start justify-start whitespace-normal rounded-2xl px-3 py-3 text-right"
          onClick={() => onChange(option.id)}
        >
          <span className="flex min-w-0 flex-col items-start gap-1 whitespace-normal">
            <span className="whitespace-normal leading-6">{option.label}</span>
            <span className="whitespace-normal text-xs font-normal leading-6 text-muted-foreground">
              {option.description}
            </span>
          </span>
        </Button>
      ))}
    </div>
  );
}

function DesignerInput({
  label,
  value,
  suffix,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  suffix: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field data-disabled={disabled}>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={value}
          inputMode="decimal"
          pattern="[0-9۰-۹٠-٩.,٫٬]*"
          dir="ltr"
          disabled={disabled || undefined}
          className="h-11 rounded-xl text-left tabular-nums"
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        <span className="shrink-0 text-xs font-bold text-muted-foreground">
          {suffix}
        </span>
      </div>
    </Field>
  );
}

function MealDistributionPreview({
  preview,
}: {
  preview: ReturnType<typeof buildNutritionPreview>;
}) {
  return (
    <div className="grid gap-2 rounded-2xl border bg-background/35 p-3">
      <FieldTitle>پیش‌نمایش وعده‌ها</FieldTitle>
      <div className="grid gap-2 sm:grid-cols-3">
        <PreviewMetric
          label="صبحانه"
          value={preview.breakfastCalories}
          unit="kcal"
        />
        <PreviewMetric label="شام" value={preview.dinnerCalories} unit="kcal" />
        <PreviewMetric
          label="میانگین هر وعده"
          value={preview.averageMealCalories}
          unit="kcal"
        />
      </div>
    </div>
  );
}

function PreviewMetric({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="rounded-2xl border bg-background/45 p-3">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-baseline justify-end gap-1" dir="ltr">
        <strong className="text-lg tabular-nums">
          {toPersianDigits(Math.round(value))}
        </strong>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function DesignerResultPanel({
  preview,
  unlocked,
}: {
  preview: ReturnType<typeof buildNutritionPreview>;
  unlocked: boolean;
}) {
  return (
    <Card className="rounded-3xl border bg-card/85 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheckIcon data-icon="inline-start" />
          بررسی و ذخیره
        </CardTitle>
        <CardDescription className="leading-7">
          {unlocked
            ? "این خلاصه با انتخاب‌های همین ویزارد ساخته شده و با ذخیره برنامه اعمال می‌شود."
            : "خلاصه قابل مشاهده است؛ ذخیره برنامه برای اشتراک پیشرفته فعال می‌شود."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid gap-2 rounded-2xl border bg-background/35 p-3 text-sm leading-7">
          <FieldTitle>قوانین اعمال‌شده</FieldTitle>
          <span>
            ترکیب درشت‌مغذی‌ها براساس استراتژی انتخاب‌شده محاسبه شده است.
          </span>
          <span>
            کالری هر روز فقط در بخش «کالری روزهای هفته» تعیین شده است.
          </span>
          <span>مجموع کالری هفتگی بدون تغییر باقی مانده است.</span>
          <span>کالری هر روز طبق سهم وعده‌های انتخاب‌شده تقسیم شده است.</span>
        </div>
        <WeeklyNutritionPreviewChart preview={preview} />
        <MealDistributionPreview preview={preview} />
      </CardContent>
    </Card>
  );
}

const nutritionPreviewChartConfig = {
  caloriesVisual: {
    label: "کالری",
    color: "var(--nutrient-calories)",
  },
  protein: {
    label: "پروتئین",
    color: "var(--nutrient-protein)",
  },
  carbs: {
    label: "کربوهیدرات",
    color: "var(--nutrient-carbs)",
  },
  fat: {
    label: "چربی",
    color: "var(--nutrient-fat)",
  },
} satisfies ChartConfig;

const persianNumberFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 0,
});

function WeeklyNutritionPreviewChart({
  preview,
}: {
  preview: ReturnType<typeof buildNutritionPreview>;
}) {
  const chartPoints = preview.weeklyPlan.map((day) => {
    const targets = targetForCalories(day.calories, preview);

    return {
      day: day.label,
      ...targets,
      caloriesVisual: targets.calories / NUTRITION_CALORIE_VISUAL_DIVISOR,
    };
  });

  return (
    <div className="grid gap-2 rounded-2xl border bg-background/35 p-3">
      <FieldTitle>پیش‌نمایش هفتگی هدف</FieldTitle>
      <ChartContainer
        config={nutritionPreviewChartConfig}
        className="h-64 w-full aspect-auto"
        dir="ltr"
      >
        <LineChart
          accessibilityLayer
          data={chartPoints}
          margin={{ left: 8, right: 8, top: 12 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            interval="preserveStartEnd"
          />
          <YAxis
            hide
            domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.12)]}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
            content={
              <ChartTooltipContent
                indicator="dot"
                formatter={(value, name, item) => {
                  const valueKey =
                    name as keyof typeof nutritionPreviewChartConfig;
                  const displayValue =
                    valueKey === "caloriesVisual"
                      ? item.payload.calories
                      : value;

                  return (
                    <div
                      className="flex w-full items-center justify-between gap-3 font-sans"
                      dir="rtl"
                    >
                      <span className="text-muted-foreground">
                        {nutritionPreviewChartConfig[valueKey]?.label ?? name}
                      </span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {persianNumberFormatter.format(Number(displayValue))}
                      </span>
                    </div>
                  );
                }}
              />
            }
          />
          <Legend content={<ChartLegendContent />} />
          <Line
            dataKey="caloriesVisual"
            type="natural"
            stroke="var(--color-caloriesVisual)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            dataKey="protein"
            type="natural"
            stroke="var(--color-protein)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            dataKey="carbs"
            type="natural"
            stroke="var(--color-carbs)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            dataKey="fat"
            type="natural"
            stroke="var(--color-fat)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}


function iconForEntitlement(entitlement: Entitlement) {
  if (entitlement === "WEEKLY_CALORIE_PLANNING")
    return <CalendarDaysIcon data-icon="inline-start" />;
  if (entitlement === "TRAINING_REST_DAY_TARGETS")
    return <DumbbellIcon data-icon="inline-start" />;
  if (entitlement === "MEAL_DISTRIBUTION_DESIGNER")
    return <UtensilsIcon data-icon="inline-start" />;
  return <SlidersHorizontalIcon data-icon="inline-start" />;
}
