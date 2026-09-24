"use client";

import {useActionState, useMemo, useRef, useState} from "react";
import {useFormStatus} from "react-dom";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalculatorIcon,
  CheckCircle2Icon,
  InfoIcon,
  TriangleAlertIcon,
} from "lucide-react";

import {
  type GoalPreviewFormState,
  type GoalPreviewFormValues,
  previewGoalAction,
} from "@/app/(app)/progress/goals/actions";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {DropdownDatePicker} from "@/components/progress/dropdown-date-picker";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger,} from "@/components/ui/select";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,} from "@/components/ui/sheet";
import {Spinner} from "@/components/ui/spinner";
import type {GoalPreviewResponseDto, GoalType,} from "@/lib/api/goals";
import {formatPersianDayLabel, toPersianDigits} from "@/lib/format";
import {calculatorSnapshotFromPreview, type GoalFormValues} from "@/lib/goals/goal-form";
import {cn} from "@/lib/utils";

type GoalCalculatorApplyValues = Pick<
  GoalFormValues,
  | "goalType"
  | "calories"
  | "protein"
  | "carbs"
  | "fat"
  | "targetWeight"
  | "targetDate"
  | "calculatorSnapshot"
>;

type StepId = "about" | "goal" | "lifestyle" | "speed" | "result";

const steps: Array<{ id: StepId; label: string; description: string }> = [
  {id: "about", label: "اطلاعات پایه", description: "برای برآورد نیاز روزانه بدنت"},
  {id: "goal", label: "هدف من", description: "می‌خوای به چه تغییری برسی؟"},
  {id: "lifestyle", label: "فعالیت", description: "تحرک روزمره و تمرین هفتگی"},
  {id: "speed", label: "ریتم تغییر", description: "سرعتی که می‌تونی ادامه بدهی"},
  {id: "result", label: "پیشنهاد من", description: "کالری، ماکروها و بازه زمانی"},
];

const defaultPreviewValues: GoalPreviewFormValues = {
  sex: "MALE",
  birthDate: "1990-01-01",
  heightCm: "175",
  currentWeightKg: "80",
  targetWeightKg: "",
  dailyMovementLevel: "MODERATE",
  workoutFrequency: "THREE_TO_FOUR_DAYS",
  goalType: "LOSE_WEIGHT",
  speed: "BALANCED",
};

const sexOptions = [
  {value: "MALE", label: "مرد"},
  {value: "FEMALE", label: "زن"},
] as const;

const goalTypeOptions = [
  {value: "LOSE_WEIGHT", label: "کاهش وزن"},
  {value: "MAINTAIN_WEIGHT", label: "حفظ وزن"},
  {value: "GAIN_WEIGHT", label: "افزایش وزن"},
] as const;

const movementOptions = [
  {value: "SEDENTARY", label: "کم‌تحرک"},
  {value: "LIGHT", label: "سبک"},
  {value: "MODERATE", label: "متوسط"},
  {value: "ACTIVE", label: "فعال"},
  {value: "VERY_ACTIVE", label: "بسیار فعال"},
] as const;

const workoutOptions = [
  {value: "ZERO_DAYS", label: "بدون تمرین"},
  {value: "ONE_TO_TWO_DAYS", label: "۱ تا ۲ روز"},
  {value: "THREE_TO_FOUR_DAYS", label: "۳ تا ۴ روز"},
  {value: "FIVE_TO_SIX_DAYS", label: "۵ تا ۶ روز"},
  {value: "DAILY", label: "هر روز"},
] as const;

const speedOptions = [
  {
    value: "CONSERVATIVE",
    label: "محافظه‌کارانه",
    description:
      "کسری یا مازاد کالری کمتر؛ تغییر وزن کندتر، فشار کمتر، حفظ انرژی و پایبندی آسان‌تر.",
  },
  {
    value: "BALANCED",
    label: "متعادل",
    description:
      "کسری یا مازاد متوسط؛ تعادل بین سرعت نتیجه، انرژی روزانه و قابل‌ادامه بودن برنامه.",
  },
  {
    value: "AGGRESSIVE",
    label: "تهاجمی",
    description:
      "کسری یا مازاد بیشتر؛ نتیجه سریع‌تر، اما احتمال گرسنگی، افت انرژی یا هشدار ایمنی بیشتر است.",
  },
] as const;

export function GoalCalculatorWizard({
                                       initialGoalType,
                                       onApply,
                                       open: controlledOpen,
                                       onOpenChange,
                                       hideLauncher = false,
                                     }: {
  initialGoalType: GoalType;
  onApply: (values: GoalCalculatorApplyValues) => void | Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideLauncher?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [step, setStep] = useState<StepId>("about");
  const [values, setValues] = useState<GoalPreviewFormValues>({
    ...defaultPreviewValues,
    goalType: initialGoalType,
  });
  const [clientErrors, setClientErrors] = useState<
    Partial<Record<keyof GoalPreviewFormValues, string>>
  >({});
  const [applying, setApplying] = useState(false);
  const [maintenanceSource, setMaintenanceSource] = useState<
    "FORMULA" | "OBSERVED"
  >("FORMULA");
  const [state, formAction, previewPending] = useActionState<
    GoalPreviewFormState,
    FormData
  >(previewGoalAction, {
    formValues: {...defaultPreviewValues, goalType: initialGoalType},
  });
  const previewFormRef = useRef<HTMLFormElement>(null);
  const stepIndex = steps.findIndex((item) => item.id === step);
  const currentStep = steps[stepIndex] ?? steps[0];
  const observedAvailable =
    state.preview?.observedCalibration?.status === "AVAILABLE" &&
    state.preview.observedCalibration.recommendation != null;
  const effectiveMaintenanceSource =
    maintenanceSource === "OBSERVED" && observedAvailable
      ? "OBSERVED"
      : "FORMULA";
  const blockingWarnings = useMemo(() => {
    const warnings =
      effectiveMaintenanceSource === "OBSERVED"
        ? state.preview?.observedCalibration?.recommendation?.warnings
        : state.preview?.warnings;
    return warnings?.filter((warning) => warning.blocking) ?? [];
  }, [effectiveMaintenanceSource, state.preview]);
  const fieldErrors = {...state.fieldErrors, ...clientErrors};

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange?.(nextOpen);
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    if (nextOpen) {
      setStep("about");
      setClientErrors({});
    }
  }

  function updateValue(name: keyof GoalPreviewFormValues, value: string) {
    setClientErrors((current) => ({...current, [name]: undefined}));
    setValues((current) => {
      const nextValues = {
        ...current,
        [name]: value,
      };

      return {
        ...nextValues,
        targetWeightKg:
          name === "goalType" && value === "MAINTAIN_WEIGHT"
            ? ""
            : nextValues.targetWeightKg,
      };
    });
  }

  function goBack() {
    const previousStep = steps[Math.max(0, stepIndex - 1)]?.id;
    if (previousStep) setStep(previousStep);
  }

  function goNext() {
    const validation = validateStep(step, values);
    setClientErrors(validation.errors);
    if (!validation.ok) return;

    const nextStep = steps[Math.min(steps.length - 1, stepIndex + 1)]?.id;
    if (!nextStep) return;
    setStep(nextStep);
    if (nextStep === "result") {
      window.requestAnimationFrame(() =>
        previewFormRef.current?.requestSubmit(),
      );
    }
  }

  async function handleApply() {
    if (!state.preview || blockingWarnings.length > 0) return;
    setApplying(true);
    try {
      await onApply(
        previewToGoalValues(
          state.preview,
          values,
          effectiveMaintenanceSource,
        ),
      );
      handleOpenChange(false);
    } catch {
      // The parent owns the user-facing error toast and keeps the sheet open.
    } finally {
      setApplying(false);
    }
  }

  return (
    <>
      {hideLauncher ? null : (
      <div className="rounded-2xl border bg-muted/25 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="block text-sm">
                برنامه پیشنهادی برای هدف تو
              </strong>
            </div>
            <p className="mt-1 text-sm leading-7 text-muted-foreground">
              با چند پاسخ کوتاه، یک هدف روزانه قابل‌ویرایش بساز.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 rounded-full"
            onClick={() => handleOpenChange(true)}
          >
            <CalculatorIcon data-icon="inline-start"/>
            ساخت برنامه پیشنهادی
          </Button>
        </div>
      </div>
      )}

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="mx-auto w-full max-w-2xl p-4 sm:p-5"
          dir="rtl"
        >
          <SheetHeader className="pl-10">
            <SheetTitle className="flex flex-wrap items-center gap-2">
              ساخت برنامه شخصی
            </SheetTitle>
            <SheetDescription>
              {currentStep.label}، مرحله{" "}
              {toPersianDigits(stepIndex + 1)} از{" "}
              {toPersianDigits(steps.length)}:{" "}
              {currentStep.description}
            </SheetDescription>
          </SheetHeader>

          <GoalStepIndicator currentStep={step}/>

          <PreviewHiddenForm
            ref={previewFormRef}
            action={formAction}
            values={values}
          />

          <ScrollArea
            className="min-h-0 flex-1"
            viewportClassName="flex min-h-0 flex-1 flex-col gap-4 py-4 pe-1"
          >
            <StepPanel step={step}>
              {step === "about" ? (
                <AboutStep
                  values={values}
                  errors={fieldErrors}
                  onChange={updateValue}
                />
              ) : null}
              {step === "goal" ? (
                <GoalStep
                  values={values}
                  errors={fieldErrors}
                  onChange={updateValue}
                />
              ) : null}
              {step === "lifestyle" ? (
                <LifestyleStep
                  values={values}
                  errors={fieldErrors}
                  onChange={updateValue}
                />
              ) : null}
              {step === "speed" ? (
                <SpeedStep
                  values={values}
                  errors={fieldErrors}
                  onChange={updateValue}
                />
              ) : null}
              {step === "result" ? (
                <ResultStep
                  preview={state.preview}
                  pending={previewPending}
                  message={state.message}
                  blockingWarnings={blockingWarnings}
                  maintenanceSource={effectiveMaintenanceSource}
                  onMaintenanceSourceChange={setMaintenanceSource}
                />
              ) : null}
            </StepPanel>
          </ScrollArea>

          <SheetFooter className="shrink-0 border-t pb-[max(0rem,env(safe-area-inset-bottom))] pt-3">
            <div aria-live="polite" className="sr-only">
              {previewPending
                ? "در حال به‌روزرسانی پیشنهاد هدف"
                : state.message}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="h-11 rounded-full"
                disabled={stepIndex === 0 || previewPending}
                onClick={goBack}
              >
                <ArrowRightIcon data-icon="inline-start"/>
                بازگشت
              </Button>
              {step === "result" ? (
                <Button
                  type="button"
                  size="lg"
                  className="h-11 rounded-full"
                  disabled={
                    previewPending ||
                    applying ||
                    !state.preview ||
                    blockingWarnings.length > 0
                  }
                  onClick={handleApply}
                >
                  {applying ? <Spinner/> : <CheckCircle2Icon data-icon="inline-start"/>}
                  {applying ? "در حال ذخیره هدف" : "ذخیره این هدف"}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  className="h-11 rounded-full"
                  onClick={goNext}
                >
                  ادامه
                  <ArrowLeftIcon data-icon="inline-end"/>
                </Button>
              )}
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

function AboutStep({values, errors, onChange}: StepProps) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <FieldGroup>
      <FieldSet className="gap-4">
        <FieldTitle>اطلاعات پایه</FieldTitle>
        <FieldDescription className="text-right">
          سن، قد و وزن به ما کمک می‌کنند نیاز انرژی روزانه بدنت را بهتر تخمین
          بزنیم.
        </FieldDescription>
        <GoalCalculatorSelect
          name="sex"
          label="جنسیت مورد استفاده در محاسبه"
          value={values.sex}
          options={sexOptions}
          error={errors.sex}
          description="فرمول برآورد متابولیسم پایه به این گزینه نیاز دارد."
          onChange={onChange}
        />
        <Field data-invalid={Boolean(errors.birthDate)}>
          <FieldLabel>تاریخ تولد</FieldLabel>
          <input
            type="hidden"
            name="birthDate"
            value={values.birthDate}
          />
          <DropdownDatePicker
            value={values.birthDate}
            today={today}
            invalid={Boolean(errors.birthDate)}
            onChange={(date) => onChange("birthDate", date)}
            ariaLabel="انتخاب تاریخ تولد"
          />
          <FieldDescription className="text-right">
            سن روی برآورد متابولیسم پایه اثر دارد. تاریخ انتخاب‌شده:{" "}
            {formatGoalDate(values.birthDate)}
          </FieldDescription>
          <FieldError>{errors.birthDate}</FieldError>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <GoalCalculatorInput
            name="heightCm"
            label="قد"
            value={values.heightCm}
            error={errors.heightCm}
            suffix="سانتی‌متر"
            description="قد را بدون کفش وارد کن."
            onChange={onChange}
          />
          <GoalCalculatorInput
            name="currentWeightKg"
            label="وزن فعلی"
            value={values.currentWeightKg}
            error={errors.currentWeightKg}
            suffix="کیلوگرم"
            description="نزدیک‌ترین وزن فعلی‌ات کافی است."
            onChange={onChange}
          />
        </div>
      </FieldSet>
    </FieldGroup>
  );
}

function GoalStep({values, errors, onChange}: StepProps) {
  return (
    <FieldGroup>
      <FieldSet className="gap-4">
        <FieldTitle>نوع هدف</FieldTitle>
        <FieldDescription className="text-right">
          هدفت را انتخاب کن تا کالری روزانه و بازه زمانی متناسب با آن محاسبه
          شود.
        </FieldDescription>
        <div className="grid gap-2">
          {goalTypeOptions.map((option) => (
            <ChoiceButton
              key={option.value}
              selected={values.goalType === option.value}
              label={option.label}
              onClick={() => onChange("goalType", option.value)}
            />
          ))}
        </div>
        <FieldError>{errors.goalType}</FieldError>
        <GoalCalculatorInput
          name="targetWeightKg"
          label="وزن هدف"
          value={values.targetWeightKg}
          error={errors.targetWeightKg}
          suffix="کیلوگرم"
          disabled={values.goalType === "MAINTAIN_WEIGHT"}
          description={
            values.goalType === "MAINTAIN_WEIGHT"
              ? "برای حفظ وزن، همین وزن فعلی مبنای محاسبه است."
              : "وزنی واقع‌بینانه وارد کن؛ بعداً می‌تونی آن را تغییر بدهی."
          }
          onChange={onChange}
        />
      </FieldSet>
    </FieldGroup>
  );
}

function LifestyleStep({values, errors, onChange}: StepProps) {
  return (
    <FieldGroup>
      <FieldSet className="gap-4">
        <FieldTitle>فعالیت روزانه و تمرین</FieldTitle>
        <GoalCalculatorSelect
          name="dailyMovementLevel"
          label="تحرک روزانه"
          value={values.dailyMovementLevel}
          options={movementOptions}
          error={errors.dailyMovementLevel}
          description="تحرک یک روز معمولی را بدون ورزش حساب کن؛ مثل نشستن، راه‌رفتن و نوع کارت."
          onChange={onChange}
        />
        <GoalCalculatorSelect
          name="workoutFrequency"
          label="تمرین هفتگی"
          value={values.workoutFrequency}
          options={workoutOptions}
          error={errors.workoutFrequency}
          description="فقط تمرین برنامه‌ریزی‌شده مثل باشگاه، دویدن یا ورزش در خانه را در نظر بگیر."
          onChange={onChange}
        />
      </FieldSet>
    </FieldGroup>
  );
}

function SpeedStep({values, errors, onChange}: StepProps) {
  return (
    <FieldGroup>
      <FieldSet className="gap-4">
        <FieldTitle>سرعت تغییر وزن</FieldTitle>
        <FieldDescription className="text-right">
          سرعت بیشتر همیشه بهتر نیست. گزینه‌ای را انتخاب کن که با انرژی، اشتها
          و سبک زندگی‌ات سازگارتر است.
        </FieldDescription>
        <div className="grid gap-2">
          {speedOptions.map((option) => (
            <ChoiceButton
              key={option.value}
              selected={values.speed === option.value}
              label={option.label}
              description={option.description}
              onClick={() => onChange("speed", option.value)}
            />
          ))}
        </div>
        <FieldError>{errors.speed}</FieldError>
        <Alert className="text-start">
          <InfoIcon aria-hidden="true"/>
          <AlertTitle>این نتیجه یک تخمین اولیه است</AlertTitle>
          <AlertDescription>
            این برنامه جای تشخیص یا توصیه پزشکی را نمی‌گیرد. اگر بیماری، بارداری
            یا شرایط تغذیه‌ای خاصی داری، قبل از تغییر جدی با متخصص مشورت کن.
          </AlertDescription>
        </Alert>
      </FieldSet>
    </FieldGroup>
  );
}

function ResultStep({
                      preview,
                      pending,
                      message,
                      blockingWarnings,
                      maintenanceSource,
                      onMaintenanceSourceChange,
                    }: {
  preview?: GoalPreviewResponseDto;
  pending: boolean;
  message?: string;
  blockingWarnings: GoalPreviewResponseDto["warnings"];
  maintenanceSource: "FORMULA" | "OBSERVED";
  onMaintenanceSourceChange: (source: "FORMULA" | "OBSERVED") => void;
}) {
  if (pending && !preview) {
    return (
      <div
        className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-2xl border bg-muted/25 p-6 text-center">
        <Spinner/>
        <strong>در حال آماده‌سازی پیشنهاد هدف</strong>
        <p className="text-sm leading-7 text-muted-foreground">
          داریم اطلاعات بدنی، میزان فعالیت و ریتم انتخابی‌ات را کنار هم
          می‌گذاریم.
        </p>
      </div>
    );
  }

  if (!preview) {
    return (
      <Alert variant="destructive">
        <TriangleAlertIcon aria-hidden="true"/>
        <AlertTitle>پیشنهاد آماده نشد</AlertTitle>
        <AlertDescription>
          {message ??
            "ورودی‌ها را بررسی کن و دوباره به مرحله نتیجه برو."}
        </AlertDescription>
      </Alert>
    );
  }

  const observed = preview.observedCalibration?.recommendation;
  const selected = maintenanceSource === "OBSERVED" && observed
    ? observed
    : preview;

  return (
    <div className="flex flex-col gap-4">
      {pending ? (
        <Alert>
          <Spinner/>
          <AlertTitle>در حال به‌روزرسانی پیشنهاد</AlertTitle>
          <AlertDescription>
            پیشنهاد قبلی تا آماده شدن محاسبه تازه نمایش داده می‌شود.
          </AlertDescription>
        </Alert>
      ) : null}
      <p className="rounded-2xl border bg-muted/25 p-3 text-sm leading-7 text-muted-foreground">
        این عددها تخمینی‌اند و بر اساس اطلاعاتی که وارد کردی محاسبه شده‌اند.
        می‌تونی بعد از ذخیره هم هدفت را ویرایش کنی.
      </p>
      {preview.observedCalibration?.status === "AVAILABLE" && observed ? (
        <fieldset className="grid grid-cols-2 gap-2" aria-label="انتخاب روش محاسبه کالری">
          <button
            type="button"
            className={cn(
              "rounded-2xl border p-3 text-right transition-colors",
              maintenanceSource === "FORMULA"
                ? "border-primary bg-primary/8"
                : "bg-card/60 hover:bg-muted/50",
            )}
            aria-pressed={maintenanceSource === "FORMULA"}
            onClick={() => onMaintenanceSourceChange("FORMULA")}
          >
            <strong className="block text-sm">برآورد فرمولی</strong>
            <span className="mt-1 block text-xs leading-6 text-muted-foreground">
              بر اساس اطلاعات بدنی و فعالیتی که وارد کردی
            </span>
          </button>
          <button
            type="button"
            className={cn(
              "rounded-2xl border p-3 text-right transition-colors",
              maintenanceSource === "OBSERVED"
                ? "border-primary bg-primary/8"
                : "bg-card/60 hover:bg-muted/50",
            )}
            aria-pressed={maintenanceSource === "OBSERVED"}
            onClick={() => onMaintenanceSourceChange("OBSERVED")}
          >
            <strong className="block text-sm">بر اساس ثبت‌های اخیر</strong>
            <span className="mt-1 block text-xs leading-6 text-muted-foreground">
              پیشنهاد دقیق‌تر از روند غذا و وزن ثبت‌شده
            </span>
          </button>
        </fieldset>
      ) : null}
      {preview.observedCalibration?.status === "LOCKED" ? (
        <Alert>
          <InfoIcon aria-hidden="true" />
          <AlertTitle>تحلیل ثبت‌های اخیرت آماده است</AlertTitle>
          <AlertDescription>
            با اشتراک پیشرفته می‌توانی پیشنهاد شخصی‌شده بر اساس روند غذا و وزن را ببینی.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <ResultMetric
          label="کالری حفظ وزن"
          value={selected.maintenanceCalories}
          unit="kcal"
        />
        <ResultMetric
          label="کالری پیشنهادی"
          value={selected.targetCalories}
          unit="kcal"
        />
        <ResultMetric
          label="تفاوت با حفظ وزن"
          value={selected.dailyEnergyDelta}
          unit="kcal"
        />
        <ResultMetric
          label="تغییر وزن هفتگی"
          value={selected.weeklyWeightChangeKg}
          unit="kg"
        />
      </div>

      <div className="grid gap-2 rounded-2xl border bg-background/45 p-3">
        <strong className="text-sm">ماکروهای پیشنهادی</strong>
        <div className="grid grid-cols-3 gap-2">
          <ResultMetric
            label="پروتئین"
            value={selected.macros.proteinGrams}
            unit="گرم"
            compact
          />
          <ResultMetric
            label="کربوهیدرات"
            value={selected.macros.carbsGrams}
            unit="گرم"
            compact
          />
          <ResultMetric
            label="چربی"
            value={selected.macros.fatGrams}
            unit="گرم"
            compact
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-background/45 p-3 text-sm leading-7">
        <strong className="block">بازه زمانی تخمینی</strong>
        <span className="text-muted-foreground">
          {toPersianDigits(selected.timeline.estimatedWeeksMin)} تا{" "}
          {toPersianDigits(selected.timeline.estimatedWeeksMax)} هفته
          {selected.timeline.estimatedTargetDate
            ? `، تاریخ تخمینی ${formatIsoDateFa(selected.timeline.estimatedTargetDate)}`
            : ""}
				</span>
      </div>

      <div className="rounded-2xl border bg-background/45 p-3 text-sm leading-7">
        <strong className="block">روش محاسبه</strong>
        <span className="text-muted-foreground">
					{preview.formula.name} نسخه {preview.formula.version}، تاریخ
					محاسبه {formatIsoDateFa(preview.calculationDate)}، ضریب فعالیت{" "}
          {toPersianDigits(formatNumber(preview.activityFactor))}
				</span>
      </div>

      {selected.warnings.length ? (
        <div className="grid gap-2">
          {selected.warnings.map((warning) => {
            const copy = goalWarningCopy(warning);

            return (
              <Alert
                key={warning.code}
                dir="rtl"
                className="text-right"
                variant={
                  warning.blocking ? "destructive" : "default"
                }
              >
                <TriangleAlertIcon aria-hidden="true"/>
                <AlertTitle>{copy.title}</AlertTitle>
                <AlertDescription>
                  {copy.description}
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      ) : (
        <Alert className="text-start">
          <CheckCircle2Icon aria-hidden="true"/>
          <AlertTitle>پیشنهاد آماده ذخیره است</AlertTitle>
          <AlertDescription>
            عددها را یک‌بار مرور کن. اگر مناسب‌اند، این هدف را ذخیره کن؛ بعداً
            هم می‌تونی تغییرشان بدهی.
          </AlertDescription>
        </Alert>
      )}

      {blockingWarnings.length > 0 ? (
        <Alert variant="destructive" className="text-start">
          <TriangleAlertIcon aria-hidden="true"/>
          <AlertTitle>ذخیره پیشنهاد متوقف شد</AlertTitle>
          <AlertDescription>
            به مرحله‌های قبل برگرد و ورودی‌هایی را که هشدار دارند تغییر بده.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

function GoalStepIndicator({currentStep}: { currentStep: StepId }) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  const progress =
    steps.length <= 1 ? 0 : (currentIndex / (steps.length - 1)) * 100;

  return (
    <div className="grid gap-3 rounded-2xl border bg-muted/25 p-3">
      <div className="flex items-center justify-between gap-2 text-xs font-bold">
				<span>
					مرحله {toPersianDigits(currentIndex + 1)} از{" "}
          {toPersianDigits(steps.length)}
				</span>
        <span className="text-muted-foreground">
					{steps[currentIndex]?.label}
				</span>
      </div>
      <div className="relative pb-1 pt-2">
        <div
          className="absolute inset-x-0 mx-8 top-9 h-2 rounded-full bg-border"
          aria-hidden="true"
        />
        <div
          className="absolute mx-8 top-9 h-2 bg-primary rounded-full transition-[width] duration-300 motion-reduce:transition-none"
          style={{width: `calc((100% - 4rem) * ${progress / 100})`}}
          aria-hidden="true"
        />
        <ol className="relative grid grid-cols-5 gap-1">
          {steps.map((step, index) => {
            const active = index === currentIndex;
            const complete = index < currentIndex;
            return (
              <li
                key={step.id}
                className="grid min-w-0 justify-items-center gap-4 text-center"
              >
								<span
                  className="max-w-full pb-3 truncate text-[0.65rem] font-bold leading-5 text-muted-foreground"
                  title={step.label}
                >
									{step.label}
								</span>
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border bg-background text-xs font-bold transition-colors",
                    active &&
                    "border-primary bg-primary text-primary-foreground",
                    complete &&
                    "border-primary/60 bg-primary/15 text-primary",
                    !active &&
                    !complete &&
                    "border-border text-muted-foreground",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {complete ? (
                    <CheckCircle2Icon
                      className="size-4"
                      aria-hidden="true"
                    />
                  ) : (
                    toPersianDigits(index + 1)
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function StepPanel({
                     step,
                     children,
                   }: {
  step: StepId;
  children: React.ReactNode;
}) {
  return (
    <div
      key={step}
      className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-2 motion-safe:duration-200"
    >
      {children}
    </div>
  );
}

type StepProps = {
  values: GoalPreviewFormValues;
  errors: Partial<Record<keyof GoalPreviewFormValues, string>>;
  onChange: (name: keyof GoalPreviewFormValues, value: string) => void;
};

function GoalCalculatorInput({
                               name,
                               label,
                               value,
                               error,
                               suffix,
                               disabled = false,
                               description,
                               onChange,
                             }: {
  name: keyof GoalPreviewFormValues;
  label: string;
  value: string;
  error?: string;
  suffix?: string;
  disabled?: boolean;
  description?: string;
  onChange: (name: keyof GoalPreviewFormValues, value: string) => void;
}) {
  function handleValueChange(event: React.FormEvent<HTMLInputElement>) {
    onChange(name, event.currentTarget.value);
  }

  return (
    <Field data-invalid={Boolean(error)} data-disabled={disabled}>
      <FieldLabel htmlFor={`goal-calculator-${name}`}>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <Input
          id={`goal-calculator-${name}`}
          name={name}
          type="text"
          value={value}
          inputMode="decimal"
          pattern="[0-9۰-۹٠-٩.,٫٬]*"
          dir="ltr"
          disabled={disabled || undefined}
          aria-invalid={Boolean(error)}
          className="h-11 rounded-xl text-left tabular-nums"
          onChange={handleValueChange}
        />
        {suffix ? (
          <span className="shrink-0 text-xs font-bold text-muted-foreground">
						{suffix}
					</span>
        ) : null}
      </div>
      {description ? (
        <FieldDescription className="text-right">{description}</FieldDescription>
      ) : null}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

function GoalCalculatorSelect<TValue extends string>({
                                                       name,
                                                       label,
                                                       value,
                                                       options,
                                                       error,
                                                       description,
                                                       onChange,
                                                     }: {
  name: keyof GoalPreviewFormValues;
  label: string;
  value: TValue;
  options: ReadonlyArray<{ value: TValue; label: string }>;
  error?: string;
  description?: string;
  onChange: (name: keyof GoalPreviewFormValues, value: string) => void;
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel>{label}</FieldLabel>
      <Select
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue) onChange(name, nextValue);
        }}
      >
        <SelectTrigger
          aria-invalid={Boolean(error)}
          className="h-11 w-full rounded-xl text-right"
        >
					<span>
						{
              options.find((option) => option.value === value)
                ?.label
            }
					</span>
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {description ? (
        <FieldDescription className="text-right">{description}</FieldDescription>
      ) : null}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

function ChoiceButton({
                        selected,
                        label,
                        description,
                        onClick,
                      }: {
  selected: boolean;
  label: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={selected ? "choice-selected" : "choice"}
      size="xl"
      aria-pressed={selected}
      className="h-auto min-h-12 w-full min-w-0 justify-start overflow-hidden whitespace-normal rounded-2xl px-3 py-3 text-right"
      onClick={onClick}
    >
			<span className="flex w-full min-w-0 flex-col items-stretch gap-1 text-right">
				<span className="whitespace-normal break-words">{label}</span>
        {description ? (
          <span
            className="block max-w-full whitespace-normal break-words text-right text-xs font-normal leading-6 text-muted-foreground">
						{description}
					</span>
        ) : null}
			</span>
    </Button>
  );
}

const PreviewHiddenForm = ({
                             action,
                             values,
                             ref,
                           }: {
  action: (payload: FormData) => void;
  values: GoalPreviewFormValues;
  ref: React.Ref<HTMLFormElement>;
}) => (
  <form ref={ref} action={action} className="hidden" aria-hidden="true">
    {Object.entries(values).map(([name, value]) => (
      <input key={name} type="hidden" name={name} value={value}/>
    ))}
    <PreviewSubmitButton/>
  </form>
);

function PreviewSubmitButton() {
  const {pending} = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      preview
    </button>
  );
}

function ResultMetric({
                        label,
                        value,
                        unit,
                        compact = false,
                      }: {
  label: string;
  value: number;
  unit: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card/60 p-3">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <div
        className="mt-1 flex items-baseline justify-end gap-1"
        dir="ltr"
      >
        <strong className={compact ? "text-sm" : "text-lg"}>
          {toPersianDigits(formatNumber(value))}
        </strong>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function previewToGoalValues(
  preview: GoalPreviewResponseDto,
  values: GoalPreviewFormValues,
  maintenanceSource: "FORMULA" | "OBSERVED",
): GoalCalculatorApplyValues {
  const calculatorSnapshot = calculatorSnapshotFromPreview(
    preview,
    values,
    maintenanceSource,
  );
  const selected =
    maintenanceSource === "OBSERVED"
      ? preview.observedCalibration?.recommendation ?? preview
      : preview;

  return {
    goalType: values.goalType,
    calories: formatInputNumber(selected.targetCalories),
    protein: formatInputNumber(selected.macros.proteinGrams),
    carbs: formatInputNumber(selected.macros.carbsGrams),
    fat: formatInputNumber(selected.macros.fatGrams),
    targetWeight: values.targetWeightKg,
    targetDate: selected.timeline.estimatedTargetDate ?? "",
    calculatorSnapshot: JSON.stringify(calculatorSnapshot),
  };
}

function validateStep(step: StepId, values: GoalPreviewFormValues) {
  const errors: Partial<Record<keyof GoalPreviewFormValues, string>> = {};

  if (step === "about") {
    if (
      !values.birthDate ||
      !/^\d{4}-\d{2}-\d{2}$/.test(values.birthDate)
    ) {
      errors.birthDate = "تاریخ تولد معتبر نیست.";
    }
    if (!numberInRange(values.heightCm, 50, 260)) {
      errors.heightCm = "قد باید بین ۵۰ و ۲۶۰ سانتی‌متر باشد.";
    }
    if (!numberInRange(values.currentWeightKg, 20, 500)) {
      errors.currentWeightKg = "وزن هدف را به‌درستی وارد کنید.";
    }
  }

  if (step === "goal") {
    if (
      values.goalType !== "MAINTAIN_WEIGHT" &&
      !numberInRange(values.targetWeightKg, 20, 500)
    ) {
      errors.targetWeightKg = "وزن هدف را به‌درستی وارد کنید.";
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
}

function numberInRange(value: string, min: number, max: number) {
  const parsed = Number(normalizeNumberInput(value));
  return Number.isFinite(parsed) && parsed >= min && parsed <= max;
}

function normalizeNumberInput(value: string) {
  return value
    .trim()
    .replace(/[۰-۹٠-٩]/g, (digit) => {
      const digits = "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩";
      const mapped = "01234567890123456789";
      return mapped[digits.indexOf(digit)] ?? digit;
    })
    .replace(/[٫٬،]/g, ".")
    .replace(/,/g, ".");
}

function goalWarningCopy(warning: GoalPreviewResponseDto["warnings"][number]) {
  const warningCopies: Record<
    string,
    { title: string; description: string }
  > = {
    UNDER_18: {
      title: "سن کمتر از ۱۸ سال",
      description:
        "این محاسبه‌گر برای افراد زیر ۱۸ سال مناسب نیست و نباید به عنوان برنامه تغذیه استفاده شود.",
    },
    LOW_CURRENT_BMI: {
      title: "شاخص توده بدنی فعلی پایین است",
      description:
        "وزن فعلی نسبت به قد پایین است. هدف کاهش وزن می‌تواند ناایمن باشد.",
    },
    LOW_TARGET_BMI: {
      title: "وزن هدف بیش از حد پایین است",
      description:
        "وزن هدف واردشده شاخص توده بدنی را پایین‌تر از محدوده سالم می‌برد.",
    },
    LOW_TARGET_CALORIES: {
      title: "کالری هدف خیلی پایین است",
      description:
        "کالری پیشنهادی کمتر از حد ایمن محاسبه شده است. ورودی‌ها یا سرعت هدف را تغییر بده.",
    },
    AGGRESSIVE_WEIGHT_LOSS: {
      title: "سرعت کاهش وزن تهاجمی است",
      description:
        "این سرعت کاهش وزن می‌تواند گرسنگی، افت انرژی یا ریسک برگشت‌پذیری برنامه را بیشتر کند.",
    },
    UNREALISTIC_TARGET_WEIGHT_CHANGE: {
      title: "تغییر وزن هدف واقع‌بینانه نیست",
      description:
        "تغییر وزن هدف خارج از بازه پیشنهادی برنامه‌ریزی است. یک هدف نزدیک‌تر و مرحله‌ای انتخاب کن.",
    },
  };

  return (
    warningCopies[warning.code] ?? {
      title: "هشدار محاسبه‌گر",
      description: warning.message || "هشدار محاسبه‌گر را بررسی کنید.",
    }
  );
}

function formatGoalDate(value: string) {
  if (!value) return "انتخاب نشده";
  return formatIsoDateFa(value);
}

function formatIsoDateFa(value: string) {
  return formatPersianDayLabel(new Date(`${value}T12:00:00Z`));
}

function formatNumber(value: number) {
  const formatted = Math.abs(Number(value)).toLocaleString("en-US", {
    maximumFractionDigits: 1,
    useGrouping: false,
  });

  return value < 0 ? `−${formatted}` : formatted;
}

function formatInputNumber(value: number) {
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 3,
    useGrouping: false,
  });
}
