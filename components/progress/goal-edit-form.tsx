"use client";

import {
	startTransition,
	useActionState,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useFormStatus } from "react-dom";
import {
	CrosshairIcon,
	FlagIcon,
	SaveIcon,
	SlidersHorizontalIcon,
	Trash2Icon,
	TrendingDownIcon,
	TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
	deleteGoalAction,
	type GoalFormState,
	saveGoalAction,
} from "@/app/(app)/progress/goals/actions";
import dynamic from "next/dynamic";

import type { AdvancedStepId } from "@/components/progress/advanced-nutrition-designer";
import {
	rebaseAdvancedSchedule,
	schedulePayloadForDesigner,
} from "@/lib/goals/advanced-nutrition-design";

const advancedDesignerStepOrder: AdvancedStepId[] = [
	"macro",
	"weekly",
	"meals",
	"result",
];

// The designer pulls in recharts; load it only when the advanced sheet opens.
const AdvancedNutritionDesigner = dynamic(
	() =>
		import("@/components/progress/advanced-nutrition-designer").then(
			(module) => module.AdvancedNutritionDesigner,
		),
	{
		ssr: false,
		loading: () => (
			<div className="h-96 w-full animate-pulse rounded-xl bg-muted/40" />
		),
	},
);
import { AdvancedPlanBadge } from "@/components/subscription/advanced-plan-badge";
import { DropdownDatePicker } from "@/components/progress/dropdown-date-picker";
import { GoalCalculatorWizard } from "@/components/progress/goal-calculator-wizard";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	FieldSet,
	FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import type { GoalResponseDto, GoalType } from "@/lib/api/goals";
import { toPersianDigits } from "@/lib/format";
import {
	advancedOverlayFormValues,
	hasAdvancedScheduleOverlay,
	hasSavedCalculatorBase,
	type GoalFormValues,
} from "@/lib/goals/goal-form";
import { onboardingDestinationAfterGoalSave } from "@/lib/onboarding";
import {
	canUseEntitlement,
	type SubscriptionState,
} from "@/lib/subscription/entitlements";
import { cn } from "@/lib/utils";

const goalTypeOptions: Array<{ value: GoalType; label: string }> = [
	{ value: "MAINTAIN_WEIGHT", label: "حفظ وزن" },
	{ value: "LOSE_WEIGHT", label: "کاهش وزن" },
	{ value: "GAIN_WEIGHT", label: "افزایش وزن" },
];

export function GoalEditForm({
	goal,
	initialValues,
	initialConfigured,
	subscription,
	onboarding = false,
	openWizard = false,
}: {
	goal: GoalResponseDto;
	initialValues: GoalFormValues;
	initialConfigured: boolean;
	subscription: SubscriptionState;
	onboarding?: boolean;
	openWizard?: boolean;
}) {
	const router = useRouter();
	const [state, formAction] = useActionState<GoalFormState, FormData>(
		saveGoalAction,
		{ formValues: initialValues },
	);
	const values = state.formValues ?? initialValues;
	const [targets, setTargets] = useState(values);
	const [savedTargets, setSavedTargets] = useState(values);
	const [configured, setConfigured] = useState(initialConfigured);
	const [calculatorDowngrade, setCalculatorDowngrade] =
		useState<FormData | null>(null);
	const [calculatorDowngradeSaving, setCalculatorDowngradeSaving] =
		useState(false);
	const handleSuccessfulSave = useCallback(
		(result: GoalFormState, fallbackMessage: string) => {
			if (result.formValues) {
				setTargets(result.formValues);
				setSavedTargets(result.formValues);
			}
			setConfigured(true);
			toast.success(result.message ?? fallbackMessage);

			const destination = onboardingDestinationAfterGoalSave(onboarding);
			if (destination) {
				router.replace(destination);
				return;
			}

			startTransition(() => router.refresh());
		},
		[onboarding, router],
	);

	useEffect(() => {
		if (!state.formValues) return;
		setTargets(state.formValues);
	}, [state.formValues]);

	useEffect(() => {
		if (!state.ok) return;
		handleSuccessfulSave(state, "هدف تغذیه ذخیره شد.");
	}, [handleSuccessfulSave, state]);

	const macroCalories = useMemo(
		() =>
			numberOrZero(targets.protein) * 4 +
			numberOrZero(targets.carbs) * 4 +
			numberOrZero(targets.fat) * 9,
		[targets.protein, targets.carbs, targets.fat],
	);
	const targetCalories = numberOrZero(targets.calories);
	const macroDelta = macroCalories - targetCalories;
	const macroDeltaPercent =
		targetCalories > 0
			? Math.round((macroDelta / targetCalories) * 100)
			: 0;
	const advancedDesignerUnlocked = canUseEntitlement(
		subscription,
		"premium_schedules",
	);
	const advancedBaseReady = hasSavedCalculatorBase(configured, savedTargets);
	const advancedDesignerAvailable =
		advancedDesignerUnlocked && advancedBaseReady;
	const sheetSide = useResponsiveSheetSide();
	const [basicSheetOpen, setBasicSheetOpen] = useState(false);
	const [advancedSheetOpen, setAdvancedSheetOpen] = useState(false);
	const [goalWizardOpen, setGoalWizardOpen] = useState(openWizard);
	const [advancedSaving, setAdvancedSaving] = useState(false);
	const [advancedDesignerStep, setAdvancedDesignerStep] =
		useState<AdvancedStepId>("macro");
	const [advancedDesignerStepValid, setAdvancedDesignerStepValid] =
		useState(true);
	const [advancedDesignerValid, setAdvancedDesignerValid] = useState(false);
	const advancedDesignerStepIndex =
		advancedDesignerStepOrder.indexOf(advancedDesignerStep);

	function updateValue(name: keyof GoalFormValues, value: string) {
		setTargets((current) => ({
			...current,
			[name]: value,
			...(name === "calculatorSnapshot"
				? { calculatorSnapshot: value }
				: current.calculatorUpdateMode === "REPLACE"
					? { calculatorSnapshot: "", calculatorUpdateMode: "CLEAR" as const }
					: {}),
		}));
	}

	function applyDesignerValues(nextValues: Partial<GoalFormValues>) {
		setTargets((current) => ({
			...current,
			...nextValues,
			...(current.calculatorUpdateMode === "REPLACE"
				? { calculatorSnapshot: "", calculatorUpdateMode: "CLEAR" as const }
				: {}),
		}));
	}

	async function applyAndSaveWizardGoal(nextValues: Partial<GoalFormValues>) {
		const hasAdvancedOverlay = hasAdvancedScheduleOverlay(
			targets.advancedSchedule,
		);
		if (
			hasAdvancedOverlay &&
			!window.confirm(
				"با ذخیره هدف جدید، برنامه پیشرفته‌ات بر پایه کالری و ماکروهای تازه بازتنظیم می‌شود. الگوی روزها و تنظیمات آینده حفظ می‌شوند. ادامه می‌دهی؟",
			)
		) {
			throw new Error("ADVANCED_REBASE_CANCELLED");
		}
		const advancedSchedule = hasAdvancedOverlay
			? JSON.stringify(rebaseAdvancedSchedule(targets, nextValues))
			: "";
		const nextTargets = {
			...targets,
			...nextValues,
			advancedSchedule,
			calculatorUpdateMode: "REPLACE" as const,
		};
		setTargets(nextTargets);

		const result = await saveGoalAction(
			{ formValues: targets },
			goalFormDataFromTargets(nextTargets, "basic"),
		);

		if (!result.ok) {
			const message = result.message ?? "هدف ذخیره نشد.";
			toast.error(message);
			throw new Error(message);
		}

		handleSuccessfulSave(result, "هدف تغذیه ذخیره شد.");
	}

	function handleGoalDeleted(result: GoalFormState) {
		if (result.formValues) setTargets(result.formValues);
		setConfigured(false);
		startTransition(() => router.refresh());
	}

	async function saveAdvancedDesignerGoal() {
		if (!advancedDesignerAvailable || !advancedDesignerValid) return;
		const overlayTargets = advancedOverlayFormValues(savedTargets, targets);
		const formData = goalFormDataFromTargets(overlayTargets, "advanced");

		setAdvancedSaving(true);
		let result: GoalFormState;
		try {
			result = await saveGoalAction(
				{ formValues: overlayTargets },
				formData,
			);
		} finally {
			setAdvancedSaving(false);
		}

		if (!result.ok) {
			toast.error(result.message ?? "برنامه پیشرفته ذخیره نشد.");
			return;
		}

		setAdvancedSheetOpen(false);
		handleSuccessfulSave(result, "برنامه پیشرفته ذخیره شد.");
	}

	async function confirmCalculatorDowngrade() {
		if (!calculatorDowngrade) return;
		setCalculatorDowngradeSaving(true);
		let result: GoalFormState;
		try {
			result = await saveGoalAction(
				{ formValues: targets },
				calculatorDowngrade,
			);
		} finally {
			setCalculatorDowngradeSaving(false);
		}

		if (!result.ok) {
			toast.error(result.message ?? "هدف ذخیره نشد.");
			return;
		}

		setCalculatorDowngrade(null);
		setBasicSheetOpen(false);
		handleSuccessfulSave(result, "هدف تغذیه ذخیره شد.");
	}

	const inactivePremiumSchedule =
		!advancedDesignerUnlocked &&
		goal.status === "CONFIGURED" &&
		goal.activePlan?.schedule != null &&
		goal.activePlan.schedule.type !== "FLAT";

	return (
		<div className="flex flex-col gap-4">
			<GoalCalculatorWizard
				initialGoalType={targets.goalType}
				open={goalWizardOpen}
				onOpenChange={setGoalWizardOpen}
				hideLauncher
				onApply={applyAndSaveWizardGoal}
			/>
			{inactivePremiumSchedule ? (
				<section
					className="flex flex-col gap-3 rounded-2xl border border-dashed bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
					aria-label="برنامه پیشرفته غیرفعال"
				>
					<div className="min-w-0 text-sm leading-7">
						<strong className="flex items-center gap-2">
							<AdvancedPlanBadge icon="lock" label="پیشرفته" compact />
							برنامه پیشرفته (غیرفعال)
						</strong>
						<p className="mt-1 text-muted-foreground">
							برنامه هفتگی‌ات حفظ شده اما اجرا نمی‌شود؛ هدف روزانه
							فعلاً میانگین هفتگی همان برنامه است. با فعال‌سازی
							دوباره اشتراک، دقیقاً همان برنامه ادامه می‌یابد.
						</p>
					</div>
					<Link
						href="/profile/billing"
						className={cn(
							"shrink-0 rounded-full border px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-accent",
						)}
					>
						فعال‌سازی دوباره
					</Link>
				</section>
			) : null}
			<section className="grid gap-4 lg:grid-cols-2">
				<CurrentGoalCard
					goal={goal}
					onDeleted={handleGoalDeleted}
					onOpenBasic={() => setBasicSheetOpen(true)}
				/>
				<GoalDesignCard
					targets={targets}
					advancedUnlocked={advancedDesignerUnlocked}
					advancedBaseReady={advancedBaseReady}
					onOpenWizard={() => setGoalWizardOpen(true)}
					onOpenAdvanced={() => {
						if (advancedDesignerAvailable) setAdvancedSheetOpen(true);
					}}
				/>
			</section>

			<Sheet open={basicSheetOpen} onOpenChange={setBasicSheetOpen}>
				<SheetContent
					side={sheetSide}
					className={sheetPanelClassName(sheetSide)}
					dir="rtl"
				>
					<SheetHeader className="pl-10">
						<SheetTitle>ویرایش پایه هدف</SheetTitle>
						<SheetDescription>
							محاسبه‌گر هدف، کالری روزانه و ماکروهای اصلی را اینجا
							تنظیم کنید.
						</SheetDescription>
					</SheetHeader>
					<form
						action={formAction}
						onSubmit={(event) => {
							if (!requiresCalculatorClear(savedTargets, targets)) return;
							event.preventDefault();
							const formData = new FormData(event.currentTarget);
							formData.set("calculatorUpdateMode", "CLEAR");
							formData.set("calculatorSnapshot", "");
							formData.set("advancedSchedule", "");
							setCalculatorDowngrade(formData);
						}}
						className="flex min-h-0 flex-1 flex-col"
					>
						<HiddenGoalInputs
							targets={targets}
						/>
						<ScrollArea
							className="min-h-0 flex-1"
							viewportClassName="flex min-h-full flex-col gap-5 py-4 pe-1"
						>
							<GoalCalculatorWizard
								initialGoalType={targets.goalType}
								onApply={(nextValues) => {
									setTargets((current) => ({
										...current,
										...nextValues,
										calculatorUpdateMode: "REPLACE",
									}));
									toast.success(
										"پیشنهاد محاسبه‌گر در فرم هدف اعمال شد.",
									);
								}}
							/>
							<GoalFormMessage state={state} />
							<BasicGoalFields
								targets={targets}
								fieldErrors={state.fieldErrors}
								macroCalories={macroCalories}
								macroDelta={macroDelta}
								macroDeltaPercent={macroDeltaPercent}
								onChange={updateValue}
							/>
						</ScrollArea>
						<SheetFooter className="border-t pt-3">
							<div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
								<DeleteGoalButton
									disabled={!configured}
									onDeleted={handleGoalDeleted}
								/>
								<GoalSubmitButton />
							</div>
						</SheetFooter>
					</form>
				</SheetContent>
			</Sheet>

			<Sheet open={advancedSheetOpen} onOpenChange={setAdvancedSheetOpen}>
				<SheetContent
					side={sheetSide}
					className={cn(
						sheetPanelClassName(sheetSide),
						"md:max-w-4xl xl:max-w-5xl",
					)}
					dir="rtl"
				>
					<SheetHeader className="pl-10">
						<SheetTitle>طراح پیشرفته تغذیه</SheetTitle>
						<SheetDescription>
							ماکرو، کالری هفتگی، تمرین، ریفید و وعده‌ها را در یک
							برنامه ذخیره کنید.
						</SheetDescription>
					</SheetHeader>
					<ScrollArea
						className="min-h-0 flex-1"
						viewportClassName="flex min-h-full flex-col gap-4 py-4 pe-1"
					>
						<AdvancedNutritionDesigner
							values={targets}
							subscription={subscription}
							step={advancedDesignerStep}
							onChange={updateValue}
							onApplyPreview={applyDesignerValues}
							onStepChange={setAdvancedDesignerStep}
							onCurrentStepValidityChange={
								setAdvancedDesignerStepValid
							}
							onValidityChange={setAdvancedDesignerValid}
						/>
					</ScrollArea>
					<SheetFooter className="border-t bg-background/95 pt-3 backdrop-blur">
						<div className="flex w-full items-center justify-between gap-3">
							<Button
								type="button"
								variant="ghost"
								size="lg"
								className="h-11 shrink-0 rounded-full"
								disabled={advancedDesignerStepIndex === 0}
								onClick={() => {
									const previous =
										advancedDesignerStepOrder[
											Math.max(
												0,
												advancedDesignerStepIndex - 1,
											)
										];
									if (previous)
										setAdvancedDesignerStep(previous);
								}}
							>
								مرحله قبل
							</Button>
							{advancedDesignerStep === "result" ? (
								<div className="flex min-w-0 items-center justify-end gap-3">
									<p className="hidden text-xs leading-6 text-muted-foreground sm:block">
										با ذخیره، هدف فعلی و برنامه هفتگی‌ات
										به‌روزرسانی می‌شود.
									</p>
									<Button
										type="button"
										size="lg"
										className="h-11 shrink-0 rounded-full"
									disabled={
										!advancedDesignerAvailable ||
											!advancedDesignerValid ||
											advancedSaving
										}
										onClick={saveAdvancedDesignerGoal}
									>
										{advancedSaving ? (
											<Spinner />
										) : (
											<SaveIcon data-icon="inline-start" />
										)}
										{advancedSaving
											? "در حال ذخیره"
											: "ذخیره برنامه پیشرفته"}
									</Button>
								</div>
							) : (
								<Button
									type="button"
									size="lg"
									className="h-11 shrink-0 rounded-full"
									disabled={!advancedDesignerStepValid}
									onClick={() => {
										const next =
											advancedDesignerStepOrder[
												Math.min(
													advancedDesignerStepOrder.length -
														1,
													advancedDesignerStepIndex +
														1,
												)
											];
										if (next)
											setAdvancedDesignerStep(next);
									}}
								>
									مرحله بعد
								</Button>
							)}
						</div>
					</SheetFooter>
				</SheetContent>
			</Sheet>

			<AlertDialog
				open={calculatorDowngrade !== null}
				onOpenChange={(open) => {
					if (!open && !calculatorDowngradeSaving) setCalculatorDowngrade(null);
				}}
			>
				<AlertDialogContent dir="rtl" className="text-right">
					<AlertDialogHeader>
						<AlertDialogTitle>تغییر به هدف دستی؟</AlertDialogTitle>
						<AlertDialogDescription>
							این تغییر، اطلاعات محاسبه‌گر و برنامه پیشرفته وابسته به آن را کنار می‌گذارد و بررسی هدف در مربی را غیرفعال می‌کند. برای حفظ تحلیل هدف، تغییرات را لغو کن یا محاسبه‌گر را دوباره اجرا کن.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={calculatorDowngradeSaving}>
							انصراف
						</AlertDialogCancel>
						<Button
							type="button"
							variant="destructive"
							disabled={calculatorDowngradeSaving}
							onClick={confirmCalculatorDowngrade}
						>
							{calculatorDowngradeSaving ? <Spinner /> : null}
							{calculatorDowngradeSaving ? "در حال ذخیره" : "ذخیره به‌صورت دستی"}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function HiddenGoalInputs({
	targets,
}: {
	targets: GoalFormValues;
}) {
	return (
		<>
			<input
				type="hidden"
				name="calculatorSnapshot"
				value={targets.calculatorSnapshot}
			/>
			<input
				type="hidden"
				name="calculatorUpdateMode"
				value={targets.calculatorUpdateMode}
			/>
			<input
				type="hidden"
				name="advancedSchedule"
				value={targets.advancedSchedule}
			/>
			<input
				type="hidden"
				name="planningPattern"
				value={targets.planningPattern}
			/>
			<input
				type="hidden"
				name="scheduleType"
				value={targets.scheduleType}
			/>
			<input
				type="hidden"
				name="macroStrategy"
				value={targets.macroStrategy}
			/>
			<input type="hidden" name="minProtein" value={targets.minProtein} />
			<input type="hidden" name="fatMin" value={targets.fatMin} />
			<input type="hidden" name="fatMax" value={targets.fatMax} />
			<input
				type="hidden"
				name="carbPreference"
				value={targets.carbPreference}
			/>
			<input
				type="hidden"
				name="mealsPerDay"
				value={targets.mealsPerDay}
			/>
			<input
				type="hidden"
				name="breakfastShare"
				value={targets.breakfastShare}
			/>
			<input
				type="hidden"
				name="dinnerShare"
				value={targets.dinnerShare}
			/>
			<input
				type="hidden"
				name="trainingDayCalories"
				value={targets.trainingDayCalories}
			/>
			<input
				type="hidden"
				name="restDayCalories"
				value={targets.restDayCalories}
			/>
			<input
				type="hidden"
				name="trainingDays"
				value={targets.trainingDays}
			/>
			<input
				type="hidden"
				name="refeedFrequency"
				value={targets.refeedFrequency}
			/>
			<input type="hidden" name="refeedDay" value={targets.refeedDay} />
			<input type="hidden" name="refeedIncrease" value={targets.refeedIncrease} />
			<input type="hidden" name="manualDailyTargets" value={targets.manualDailyTargets} />
		</>
	);
}

function goalFormDataFromTargets(
	targets: GoalFormValues,
	saveMode: "basic" | "advanced",
) {
	const formData = new FormData();
	formData.set("goalType", targets.goalType);
	formData.set("startDate", targets.startDate);
	formData.set("calories", targets.calories);
	formData.set("protein", targets.protein);
	formData.set("carbs", targets.carbs);
	formData.set("fat", targets.fat);
	formData.set("fiber", targets.fiber);
	formData.set("targetWeight", targets.targetWeight);
	formData.set("targetDate", targets.targetDate);
	formData.set("calculatorSnapshot", targets.calculatorSnapshot);
	formData.set("calculatorUpdateMode", targets.calculatorUpdateMode);
	formData.set(
		"advancedSchedule",
		saveMode === "advanced"
			? JSON.stringify(schedulePayloadForDesigner(targets))
			: targets.advancedSchedule,
	);
	formData.set("planningPattern", targets.planningPattern);
	formData.set("scheduleType", targets.scheduleType);
	formData.set("macroStrategy", targets.macroStrategy);
	formData.set("minProtein", targets.minProtein);
	formData.set("fatMin", targets.fatMin);
	formData.set("fatMax", targets.fatMax);
	formData.set("carbPreference", targets.carbPreference);
	formData.set("mealsPerDay", targets.mealsPerDay);
	formData.set("breakfastShare", targets.breakfastShare);
	formData.set("dinnerShare", targets.dinnerShare);
	formData.set("trainingDayCalories", targets.trainingDayCalories);
	formData.set("restDayCalories", targets.restDayCalories);
	formData.set("trainingDays", targets.trainingDays);
	formData.set("refeedFrequency", targets.refeedFrequency);
	formData.set("refeedDay", targets.refeedDay);
	formData.set("refeedIncrease", targets.refeedIncrease);
	formData.set("manualDailyTargets", targets.manualDailyTargets);
	return formData;
}

const calculatorAffectingFields: Array<keyof GoalFormValues> = [
	"goalType",
	"startDate",
	"calories",
	"protein",
	"carbs",
	"fat",
	"fiber",
	"targetWeight",
	"targetDate",
];

function requiresCalculatorClear(
	saved: GoalFormValues,
	next: GoalFormValues,
) {
	if (saved.calculatorUpdateMode !== "PRESERVE") return false;
	return calculatorAffectingFields.some((field) => saved[field] !== next[field]);
}

function GoalDesignCard({
	targets,
	advancedUnlocked,
	advancedBaseReady,
	onOpenWizard,
	onOpenAdvanced,
}: {
	targets: GoalFormValues;
	advancedUnlocked: boolean;
	advancedBaseReady: boolean;
	onOpenWizard: () => void;
	onOpenAdvanced: () => void;
}) {
	return (
		<Card className="rounded-3xl border bg-card/85 shadow-sm">
			<CardHeader className="grid grid-cols-[1fr_auto] items-start gap-3">
				<div className="min-w-0 space-y-1 text-right">
					<CardTitle className="flex items-center justify-start gap-2 text-lg font-semibold">
						<CrosshairIcon data-icon="inline-start" />
						طراحی هدف
						{advancedUnlocked ? null : (
							<AdvancedPlanBadge
								icon="lock"
								label="پیشرفته"
								compact
							/>
						)}
					</CardTitle>
					<CardDescription className="leading-7">
						هدف پایه، محاسبه‌گر و طراحی پیشرفته را از همین بخش تنظیم
						کن.
					</CardDescription>
				</div>
				<CardAction className="justify-self-end">
					<span className="rounded-full border bg-muted/35 px-3 py-1 text-xs font-bold text-muted-foreground">
						{!advancedBaseReady
							? "ابتدا هدف پایه"
							: advancedUnlocked
								? "پیشرفته فعال"
								: "پیشرفته قفل"}
					</span>
				</CardAction>
			</CardHeader>
			<CardContent className="grid gap-3">
				<div className="grid grid-cols-3 gap-2">
					<SummaryValue
						label="کالری"
						value={targets.calories}
						unit="kcal"
					/>
					<SummaryValue
						label="پروتئین"
						value={targets.protein}
						unit="گرم"
					/>
					<SummaryValue label="چربی" value={targets.fat} unit="گرم" />
				</div>
				<div className="grid gap-2 sm:grid-cols-3">
					<Button
						type="button"
						variant="default"
						size="lg"
						className="h-11 rounded-full"
						onClick={onOpenWizard}
					>
						<CrosshairIcon data-icon="inline-start" />
						طراحی هدف
					</Button>

					<Button
						type="button"
						size="lg"
						className="h-11 rounded-full"
						disabled={!advancedUnlocked || !advancedBaseReady}
						onClick={onOpenAdvanced}
					>
						<SlidersHorizontalIcon data-icon="inline-start" />
						{advancedBaseReady ? "طراحی پیشرفته" : "ابتدا هدف پایه را بساز"}
					</Button>
				</div>
				<p className="rounded-2xl border bg-muted/25 px-3 py-2 text-sm leading-7 text-muted-foreground">
					ابتدا هدف پایه را با محاسبه‌گر بساز. طراحی پیشرفته بعد از آن،
					بدون تغییر محاسبه هدف، برنامه هفتگی و روزهای تمرین را اضافه می‌کند.
				</p>
			</CardContent>
		</Card>
	);
}

function CurrentGoalCard({
	goal,
	onDeleted,
	onOpenBasic,
}: {
	goal: GoalResponseDto;
	onDeleted: (result: GoalFormState) => void;
	onOpenBasic: () => void;
}) {
	const configured = goal.status === "CONFIGURED" && goal.activePlan;
	const targets = goal.todayTarget?.targets ?? goal.activePlan?.baseTargets;

	return (
		<Card className="rounded-3xl border bg-card shadow-sm">
			<CardHeader className="grid grid-cols-[1fr_auto] items-start gap-3">
				<div className="min-w-0 space-y-1 text-right">
					<CardTitle className="flex items-center justify-start gap-2 text-lg font-semibold">
						<FlagIcon data-icon="inline-start" />
						هدف فعلی
					</CardTitle>
					<CardDescription className="leading-7">
						{configured
							? `شروع از ${formatShortDate(goal.activePlan!.startDate)}`
							: "هنوز هدفی ذخیره نشده است."}
					</CardDescription>
				</div>
				<CardAction className="flex items-center gap-2 justify-self-end">
					{configured ? (
						<DeleteGoalButton
							disabled={false}
							onDeleted={onDeleted}
							size="sm"
						/>
					) : (
						<Button
							type="button"
							variant="outline"
							size="lg"
							className="h-11 rounded-full"
							onClick={onOpenBasic}
						>
							<SlidersHorizontalIcon data-icon="inline-start" />
							ویرایش پایه
						</Button>
					)}
				</CardAction>
			</CardHeader>
			<CardContent className="grid gap-3">
				{targets ? (
					<div className="grid grid-cols-2 gap-2">
						<GoalMetric
							label="کالری"
							value={targets.calories}
							unit="kcal"
						/>
						<GoalMetric
							label="پروتئین"
							value={targets.protein}
							unit="گرم"
						/>
						<GoalMetric
							label="کربوهیدرات"
							value={targets.carbs}
							unit="گرم"
						/>
						<GoalMetric
							label="چربی"
							value={targets.fat}
							unit="گرم"
						/>
						{targets.fiber == null ? null : (
							<GoalMetric
								label="فیبر"
								value={targets.fiber}
								unit="گرم"
							/>
						)}
					</div>
				) : (
					<p className="rounded-2xl border border-dashed bg-muted/25 px-3 py-4 text-sm leading-7 text-muted-foreground">
						فرم را ذخیره کنید تا داشبورد و دفتر غذایی با هدف روزانه
						همسو شوند.
					</p>
				)}
				<div className="grid gap-2 rounded-2xl border bg-background/45 p-3 text-sm leading-7">
					<span className="font-bold">
						{goalTypeLabel(goal.activePlan?.goalType)}
					</span>
					<span className="text-muted-foreground">
						وزن هدف:{" "}
						{goal.goal?.targetWeight
							? `${formatNumber(goal.goal.targetWeight.value)} kg`
							: "ثبت نشده"}
					</span>
					<span className="text-muted-foreground">
						تاریخ هدف:{" "}
						{goal.goal?.targetDate
							? formatShortDate(goal.goal.targetDate)
							: "ثبت نشده"}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}

function GoalMetric({
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
			<span className="text-xs font-bold text-muted-foreground">
				{label}
			</span>
			<strong className="mt-1 block text-xl font-black tabular-nums tracking-normal">
				{formatNumber(value)}
			</strong>
			<span className="text-xs text-muted-foreground">{unit}</span>
		</div>
	);
}

function goalTypeLabel(type?: GoalType | null) {
	switch (type) {
		case "LOSE_WEIGHT":
			return (
				<span className="inline-flex items-center gap-1">
					<TrendingDownIcon aria-hidden="true" />
					کاهش وزن
				</span>
			);
		case "GAIN_WEIGHT":
			return (
				<span className="inline-flex items-center gap-1">
					<TrendingUpIcon aria-hidden="true" />
					افزایش وزن
				</span>
			);
		default:
			return "حفظ وزن";
	}
}

function formatNumber(value: number) {
	return toPersianDigits(
		Number(value).toLocaleString("en-US", {
			maximumFractionDigits: 1,
		}),
	);
}

function formatShortDate(value?: string | null) {
	if (!value) return "نامشخص";
	return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(new Date(`${value}T12:00:00Z`));
}

function BasicGoalFields({
	targets,
	fieldErrors,
	macroCalories,
	macroDelta,
	macroDeltaPercent,
	onChange,
}: {
	targets: GoalFormValues;
	fieldErrors: GoalFormState["fieldErrors"];
	macroCalories: number;
	macroDelta: number;
	macroDeltaPercent: number;
	onChange: (name: keyof GoalFormValues, value: string) => void;
}) {
	return (
		<>
			<FieldSet className="gap-4 rounded-3xl border bg-card/65 p-4">
				<FieldTitle>هدف و زمان‌بندی</FieldTitle>
				<Field className="gap-3">
					<FieldLabel>نوع هدف</FieldLabel>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
						{goalTypeOptions.map((option) => (
							<label
								key={option.value}
								className="flex cursor-pointer items-center gap-2 rounded-xl border bg-background/45 px-3 py-2 text-sm font-bold has-[:checked]:border-primary/70 has-[:checked]:bg-primary/15"
							>
								<input
									type="radio"
									name="goalType"
									value={option.value}
									checked={targets.goalType === option.value}
									onChange={(event) =>
										onChange(
											"goalType",
											event.currentTarget.value,
										)
									}
								/>
								{option.label}
							</label>
						))}
					</div>
					<FieldError>{fieldErrors?.goalType}</FieldError>
				</Field>

				<div className="grid gap-4 sm:grid-cols-2">
					<GoalDateInput
						name="startDate"
						label="تاریخ شروع"
						value={targets.startDate}
						error={fieldErrors?.startDate}
						onChange={onChange}
					/>
					<GoalDateInput
						name="targetDate"
						label="تاریخ هدف اختیاری"
						value={targets.targetDate}
						error={fieldErrors?.targetDate}
						onChange={onChange}
					/>
				</div>
			</FieldSet>

			<FieldSet className="gap-4 rounded-3xl border bg-card/65 p-4">
				<FieldTitle>هدف روزانه</FieldTitle>
				<div className="grid gap-4 sm:grid-cols-2">
					<GoalInput
						name="calories"
						label="کالری"
						value={targets.calories}
						error={fieldErrors?.calories}
						suffix="kcal"
						onChange={onChange}
					/>
					<GoalInput
						name="protein"
						label="پروتئین"
						value={targets.protein}
						error={fieldErrors?.protein}
						suffix="گرم"
						onChange={onChange}
					/>
					<GoalInput
						name="carbs"
						label="کربوهیدرات"
						value={targets.carbs}
						error={fieldErrors?.carbs}
						suffix="گرم"
						onChange={onChange}
					/>
					<GoalInput
						name="fat"
						label="چربی"
						value={targets.fat}
						error={fieldErrors?.fat}
						suffix="گرم"
						onChange={onChange}
					/>
					<GoalInput
						name="fiber"
						label="فیبر اختیاری"
						value={targets.fiber}
						error={fieldErrors?.fiber}
						suffix="گرم"
						onChange={onChange}
					/>
					<GoalInput
						name="targetWeight"
						label="وزن هدف اختیاری"
						value={targets.targetWeight}
						error={fieldErrors?.targetWeight}
						suffix="kg"
						onChange={onChange}
					/>
				</div>
				<FieldDescription className="text-right">
					کالری ماکروها: {toPersianDigits(Math.round(macroCalories))}{" "}
					کالری ({toPersianDigits(signedNumber(macroDelta))}،{" "}
					{toPersianDigits(signedNumber(macroDeltaPercent))}٪ نسبت به
					هدف)
				</FieldDescription>
				<FieldError>{fieldErrors?.baseTargets}</FieldError>
			</FieldSet>
		</>
	);
}

function GoalFormMessage({ state }: { state: GoalFormState }) {
	if (!state.message) return null;

	return (
		<p
			className={
				state.ok
					? "rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm leading-6 text-primary"
					: "rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive"
			}
			role="status"
		>
			{state.message}
		</p>
	);
}

function SummaryValue({
	label,
	value,
	unit,
}: {
	label: string;
	value: string;
	unit?: string;
}) {
	return (
		<div className="min-w-0 rounded-2xl border bg-background/45 p-3">
			<span className="block truncate text-xs text-muted-foreground">
				{label}
			</span>
			<strong className="mt-1 block truncate text-lg tabular-nums">
				{toPersianDigits(value)}
			</strong>
			{unit ? (
				<span className="text-xs text-muted-foreground">{unit}</span>
			) : null}
		</div>
	);
}

function sheetPanelClassName(side: "bottom" | "right") {
	return cn(
		"p-4 sm:p-5",
		side === "bottom"
			? "mx-auto w-full max-w-2xl"
			: "h-svh w-full max-w-2xl",
	);
}

function GoalDateInput({
	name,
	label,
	value,
	error,
	onChange,
}: {
	name: "startDate" | "targetDate";
	label: string;
	value: string;
	error?: string;
	onChange: (name: keyof GoalFormValues, value: string) => void;
}) {
	const today = new Date().toISOString().slice(0, 10);

	function chooseDate(nextDate: string) {
		onChange(name, nextDate);
	}

	return (
		<Field data-invalid={Boolean(error)}>
			<FieldLabel htmlFor={`goal-${name}`}>{label}</FieldLabel>
			<input
				id={`goal-${name}`}
				type="hidden"
				name={name}
				value={value}
			/>
			<DropdownDatePicker
				value={value}
				today={today}
				invalid={Boolean(error)}
				placeholder="انتخاب تاریخ"
				ariaLabel={`انتخاب ${label}`}
				onChange={chooseDate}
			/>
			{name === "targetDate" && value ? (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="w-fit justify-self-end"
					onClick={() => chooseDate("")}
				>
					پاک کردن تاریخ هدف
				</Button>
			) : null}
			<FieldError>{error}</FieldError>
		</Field>
	);
}

function GoalInput({
	name,
	label,
	value,
	error,
	suffix,
	type = "text",
	onChange,
}: {
	name: keyof GoalFormValues;
	label: string;
	value: string;
	error?: string;
	suffix?: string;
	type?: "date" | "text";
	onChange: (name: keyof GoalFormValues, value: string) => void;
}) {
	return (
		<Field data-invalid={Boolean(error)}>
			<FieldLabel htmlFor={`goal-${name}`}>{label}</FieldLabel>
			<div className="flex items-center gap-2">
				<Input
					id={`goal-${name}`}
					name={name}
					type={type}
					value={value}
					inputMode={type === "date" ? undefined : "decimal"}
					dir="ltr"
					aria-invalid={Boolean(error)}
					className="h-11 rounded-xl text-left tabular-nums"
					onChange={(event) =>
						onChange(name, event.currentTarget.value)
					}
				/>
				{suffix ? (
					<span className="shrink-0 text-xs font-bold text-muted-foreground">
						{suffix}
					</span>
				) : null}
			</div>
			<FieldError>{error}</FieldError>
		</Field>
	);
}

function GoalSubmitButton() {
	const { pending } = useFormStatus();

	return (
		<Button
			type="submit"
			size="lg"
			className="h-11 rounded-full"
			disabled={pending}
		>
			{pending ? <Spinner /> : <SaveIcon data-icon="inline-start" />}
			{pending ? "در حال ذخیره" : "ذخیره هدف"}
		</Button>
	);
}

function DeleteGoalButton({
	disabled,
	onDeleted,
	size = "lg",
}: {
	disabled: boolean;
	onDeleted: (result: GoalFormState) => void;
	size?: "sm" | "lg";
}) {
	const [open, setOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	async function confirmDelete() {
		setDeleting(true);
		setMessage(null);
		const result = await deleteGoalAction();
		setDeleting(false);

		if (!result.ok) {
			const errorMessage = result.message ?? "هدف حذف نشد.";
			setMessage(errorMessage);
			toast.error(errorMessage);
			return;
		}

		setOpen(false);
		toast.success(result.message ?? "هدف تغذیه حذف شد.");
		onDeleted(result);
	}

	return (
		<AlertDialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!deleting) setOpen(nextOpen);
			}}
		>
			<Button
				type="button"
				variant="destructive"
				size={size}
				className={cn(
					size === "sm"
						? "h-8 rounded-full px-3"
						: "h-11 rounded-full",
				)}
				disabled={disabled || deleting}
				onClick={() => {
					setMessage(null);
					setOpen(true);
				}}
			>
				<Trash2Icon data-icon="inline-start" />
				حذف هدف
			</Button>
			<AlertDialogContent dir="rtl" className="text-right">
				<AlertDialogHeader>
					<AlertDialogTitle>حذف هدف تغذیه؟</AlertDialogTitle>
					<AlertDialogDescription>
						هدف کالری، ماکروها و برنامه فعال حذف می‌شود. این عمل
						قابل بازگشت نیست.
					</AlertDialogDescription>
				</AlertDialogHeader>
				{message ? (
					<p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive">
						{message}
					</p>
				) : null}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={deleting}>
						انصراف
					</AlertDialogCancel>
					<Button
						type="button"
						variant="destructive"
						disabled={deleting}
						onClick={confirmDelete}
					>
						{deleting ? (
							<>
								<Spinner /> در حال حذف
							</>
						) : (
							"حذف هدف"
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function numberOrZero(value: string) {
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
	return Number.isFinite(parsed) ? parsed : 0;
}

function signedNumber(value: number) {
	if (value > 0) return `+${Math.round(value)}`;
	return String(Math.round(value));
}

function useResponsiveSheetSide() {
	const [side, setSide] = useState<"bottom" | "right">("bottom");

	useEffect(() => {
		const query = window.matchMedia("(min-width: 768px)");
		setSide(query.matches ? "right" : "bottom");

		function handleChange(event: MediaQueryListEvent) {
			setSide(event.matches ? "right" : "bottom");
		}

		query.addEventListener("change", handleChange);
		return () => query.removeEventListener("change", handleChange);
	}, []);

	return side;
}
