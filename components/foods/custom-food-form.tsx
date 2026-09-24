"use client";

import Link from "next/link";
import {
	AlertCircleIcon,
	CheckCircle2Icon,
	PlusIcon,
	SaveIcon,
	WifiOffIcon,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
	createCustomFoodAction,
	type CustomFoodActionState,
} from "@/app/(app)/foods/custom/actions";
import { updateCustomFoodAction } from "@/app/(app)/foods/[foodId]/actions";
import { WizardFooter } from "@/components/foods/wizard/wizard-footer";
import { WizardStepper } from "@/components/foods/wizard/wizard-stepper";
import { CustomServingField } from "@/components/foods/custom-serving-field";
import { FormSelect } from "@/components/ui/form-select";
import { PlanLimitDialog } from "@/components/subscription/plan-limit-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSet,
	FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
	CUSTOM_FOOD_PORTIONS_FIELD,
	CUSTOM_FOOD_PORTIONS_MAX,
	type CustomFoodPortionDraft,
	serializeCustomFoodPortionDrafts,
	validateCustomFoodPortionDraft,
} from "@/lib/foods/custom-food-portions";
import {
	customFoodBasicsSchema,
	customFoodFieldErrors,
	type CustomFoodFormValues,
	customFoodNutritionSchema,
	customFoodSchema,
	normalizeDecimalInput,
} from "@/lib/foods/custom-food-validation";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

const servingUnits = [
	{ value: "GRAM", label: "گرم" },
	{ value: "MILLILITER", label: "میلی‌لیتر" },
	{ value: "PIECE", label: "عدد" },
	{ value: "SERVING", label: "وعده" },
] as const;

const nutritionFields = [
	{
		name: "calories",
		label: "کالری",
		suffix: "کالری",
		step: "0.01",
		optional: false,
	},
	{
		name: "protein",
		label: "پروتئین",
		suffix: "گرم",
		step: "0.01",
		optional: false,
	},
	{
		name: "carbs",
		label: "کربوهیدرات",
		suffix: "گرم",
		step: "0.01",
		optional: false,
	},
	{
		name: "fat",
		label: "چربی",
		suffix: "گرم",
		step: "0.01",
		optional: false,
	},
	{
		name: "fiber",
		label: "فیبر",
		suffix: "گرم",
		step: "0.01",
		optional: true,
	},
	{
		name: "sugar",
		label: "قند",
		suffix: "گرم",
		step: "0.01",
		optional: true,
	},
	{
		name: "sodium",
		label: "سدیم",
		suffix: "میلی‌گرم",
		step: "0.01",
		optional: true,
	},
] as const;

type NutritionFieldName = (typeof nutritionFields)[number]["name"];
type DraftValues = Record<NutritionFieldName, string> & {
	name: string;
	servingQuantity: string;
	servingUnit: (typeof servingUnits)[number]["value"];
};
type DraftErrors = Partial<
	Record<keyof CustomFoodFormValues | "portions", string>
>;

type WizardStepId = "basics" | "nutrition" | "servings" | "review";

const wizardStepLabels: Record<WizardStepId, string> = {
	basics: "مشخصات",
	nutrition: "مواد مغذی",
	servings: "سروینگ‌ها",
	review: "بازبینی",
};

const initialDraft: DraftValues = {
	name: "",
	servingQuantity: "",
	servingUnit: "GRAM",
	calories: "",
	protein: "",
	carbs: "",
	fat: "",
	fiber: "",
	sugar: "",
	sodium: "",
};

const initialActionState: CustomFoodActionState = {};

export function CustomFoodForm({
	onSaved,
	initialValues,
	initialPortions,
	submitLabel = "ذخیره غذا",
	nextPath = "/foods",
	mode = "create",
	foodId,
}: {
	onSaved?: (createdFoodId?: string) => void;
	initialValues?: Record<keyof CustomFoodFormValues, string>;
	initialPortions?: CustomFoodPortionDraft[];
	submitLabel?: string;
	nextPath?: string;
	mode?: "create" | "edit";
	foodId?: string;
}) {
	const [draft, setDraft] = useState<DraftValues>(() =>
		draftFromInitialValues(initialValues),
	);
	const [portions, setPortions] = useState<CustomFoodPortionDraft[]>(
		() => initialPortions ?? [],
	);
	const [stepIndex, setStepIndex] = useState(0);
	const [errors, setErrors] = useState<DraftErrors>({});
	const [validated, setValidated] = useState(false);
	const [offlineMessage, setOfflineMessage] = useState<string | null>(null);
	const [actionState, setActionState] =
		useState<CustomFoodActionState>(initialActionState);
	const [planLimitDialogOpen, setPlanLimitDialogOpen] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const lastToastKeyRef = useRef<string | undefined>(undefined);
	const portionIdRef = useRef(0);
	const selectedServingUnit =
		servingUnits.find((unit) => unit.value === draft.servingUnit) ??
		servingUnits[0];
	const errorCount = Object.keys(errors).length;
	const hasBackendError = Boolean(actionState.message && !errorCount);
	const hasValidationError = Boolean(actionState.message && errorCount);

	const supportsPortions = draft.servingUnit === "GRAM";
	const stepIds = useMemo<WizardStepId[]>(
		() =>
			supportsPortions
				? ["basics", "nutrition", "servings", "review"]
				: ["basics", "nutrition", "review"],
		[supportsPortions],
	);
	const safeStepIndex = Math.min(stepIndex, stepIds.length - 1);
	const activeStep = stepIds[safeStepIndex];
	const isLastStep = safeStepIndex === stepIds.length - 1;

	const macroCalories = useMemo(() => {
		const proteinCalories = numericValue(draft.protein) * 4;
		const carbCalories = numericValue(draft.carbs) * 4;
		const fatCalories = numericValue(draft.fat) * 9;
		return proteinCalories + carbCalories + fatCalories;
	}, [draft.protein, draft.carbs, draft.fat]);

	const caloriesPerGram = useMemo(() => {
		const quantity = numericValue(draft.servingQuantity);
		const calories = numericValue(draft.calories);
		if (quantity <= 0 || calories <= 0) return null;
		return calories / quantity;
	}, [draft.servingQuantity, draft.calories]);

	useEffect(() => {
		if (actionState.formValues) {
			setDraft({
				...initialDraft,
				...actionState.formValues,
				servingUnit: servingUnits.some(
					(unit) =>
						unit.value === actionState.formValues?.servingUnit,
				)
					? (actionState.formValues
							.servingUnit as DraftValues["servingUnit"])
					: initialDraft.servingUnit,
			});
		}

		setErrors(actionState.fieldErrors ?? {});
		setValidated(Boolean(actionState.successMessage));

		const toastKey = actionState.successMessage
			? `success:${actionState.createdFoodId ?? actionState.successMessage}`
			: actionState.message
				? `error:${actionState.message}`
				: undefined;

		if (toastKey && lastToastKeyRef.current !== toastKey) {
			lastToastKeyRef.current = toastKey;

			if (actionState.successMessage) {
				toast.success(actionState.successMessage);
				onSaved?.(actionState.createdFoodId);
			} else if (actionState.message) {
				toast.error(actionState.message);
				if (actionState.planLimit) {
					setPlanLimitDialogOpen(true);
				}
			}
		}
	}, [actionState, onSaved]);

	function updateDraft(name: keyof DraftValues, value: string) {
		setDraft((current) => ({ ...current, [name]: value }));
		setValidated(false);
		setOfflineMessage(null);
		setErrors((current) => {
			if (!current[name]) return current;
			const { [name]: _removed, ...next } = current;
			return next;
		});
	}

	function clearPortionsError() {
		setErrors((current) => {
			if (!current.portions) return current;
			const { portions: _removed, ...next } = current;
			return next;
		});
	}

	function addPortion() {
		if (portions.length >= CUSTOM_FOOD_PORTIONS_MAX) return;
		portionIdRef.current += 1;
		setPortions((current) => [
			...current,
			{
				id: `draft-portion-${portionIdRef.current}`,
				name: "",
				gramWeightInput: "",
			},
		]);
		clearPortionsError();
	}

	function updatePortion(
		id: string,
		patch: Partial<Omit<CustomFoodPortionDraft, "id">>,
	) {
		setPortions((current) =>
			current.map((portion) =>
				portion.id === id ? { ...portion, ...patch } : portion,
			),
		);
		clearPortionsError();
	}

	function removePortion(id: string) {
		setPortions((current) =>
			current.filter((portion) => portion.id !== id),
		);
		clearPortionsError();
	}

	function validateStep(step: WizardStepId): boolean {
		if (step === "basics") {
			const parsed = customFoodBasicsSchema.safeParse(draft);
			if (!parsed.success) {
				setErrors(customFoodFieldErrors(parsed.error));
				return false;
			}
		}

		if (step === "nutrition") {
			const parsed = customFoodNutritionSchema.safeParse(draft);
			if (!parsed.success) {
				setErrors(customFoodFieldErrors(parsed.error));
				return false;
			}
		}

		if (step === "servings") {
			const portionsError = portionsValidationMessage(portions);
			if (portionsError) {
				setErrors((current) => ({
					...current,
					portions: portionsError,
				}));
				return false;
			}
		}

		setErrors({});
		return true;
	}

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (isPending) return;

		if (!isLastStep) {
			if (validateStep(activeStep)) {
				setStepIndex(safeStepIndex + 1);
			}
			return;
		}

		if (typeof navigator !== "undefined" && !navigator.onLine) {
			setValidated(false);
			setOfflineMessage(
				"اتصال اینترنت قطع است. پیش‌نویس شما حفظ شده و با بازگشت اتصال می‌توانید ذخیره کنید.",
			);
			toast.error("اتصال اینترنت قطع است.");
			return;
		}

		const parsed = customFoodSchema.safeParse(draft);

		if (!parsed.success) {
			setValidated(false);
			const fieldErrors = customFoodFieldErrors(parsed.error);
			setErrors(fieldErrors);
			setStepIndex(0);
			toast.error("اطلاعات غذای سفارشی را بررسی کنید.");
			return;
		}

		const portionsError = supportsPortions
			? portionsValidationMessage(portions)
			: null;
		if (portionsError) {
			setValidated(false);
			setErrors({ portions: portionsError });
			setStepIndex(Math.max(stepIds.indexOf("servings"), 0));
			toast.error("سروینگ‌های سفارشی را بررسی کنید.");
			return;
		}

		setErrors({});
		setValidated(true);
		setOfflineMessage(null);
		setIsPending(true);

		const formData = new FormData(event.currentTarget);
		const runAction =
			mode === "edit"
				? updateCustomFoodAction(initialActionState, formData)
				: createCustomFoodAction(actionState, formData);

		runAction
			.then((nextState) => {
				setActionState(nextState);
			})
			.catch((error) => {
				const message =
					error instanceof Error
						? error.message
						: "غذای سفارشی ذخیره نشد.";
				setActionState({
					message,
					formValues: draft,
				});
			})
			.finally(() => setIsPending(false));
	}

	return (
		<form
			className="flex flex-col gap-5"
			dir="rtl"
			noValidate
			onSubmit={submit}
		>
			<input type="hidden" name="nextPath" value={nextPath} />
			{mode === "edit" && foodId ? (
				<input type="hidden" name="foodId" value={foodId} />
			) : null}
			<input
				type="hidden"
				name={CUSTOM_FOOD_PORTIONS_FIELD}
				value={
					supportsPortions
						? serializeCustomFoodPortionDrafts(portions)
						: "[]"
				}
			/>

			<WizardStepper
				steps={stepIds.map((id) => ({
					id,
					label: wizardStepLabels[id],
				}))}
				activeIndex={safeStepIndex}
				onStepSelect={(index) => {
					if (!isPending) setStepIndex(index);
				}}
			/>

			<div hidden={activeStep !== "basics"}>
				<FieldSet className="rounded-2xl border bg-muted/25 p-4">
					<FieldTitle className="mb-1.5 text-base font-medium">
						مشخصات غذا
					</FieldTitle>
					<FieldGroup className="gap-4">
						<Field data-invalid={Boolean(errors.name)}>
							<FieldLabel htmlFor="custom-food-name">
								نام غذا
							</FieldLabel>
							<Input
								id="custom-food-name"
								name="name"
								value={draft.name}
								disabled={isPending}
								aria-invalid={Boolean(errors.name)}
								placeholder="مثلاً خوراک مرغ خانگی"
								className="h-11 rounded-2xl bg-background"
								autoComplete="new-password"
								data-1p-ignore
								data-lpignore="true"
								onChange={(event) =>
									updateDraft(
										"name",
										event.currentTarget.value,
									)
								}
							/>
							<FieldError>{errors.name}</FieldError>
						</Field>

						<FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Field
								data-invalid={Boolean(errors.servingQuantity)}
							>
								<FieldLabel htmlFor="custom-food-serving-quantity">
									مقدار سروینگ
								</FieldLabel>
								<Input
									id="custom-food-serving-quantity"
									name="servingQuantity"
									type="text"
									inputMode="decimal"
									value={draft.servingQuantity}
									disabled={isPending}
									aria-invalid={Boolean(
										errors.servingQuantity,
									)}
									className="h-11 rounded-2xl bg-background text-left tabular-nums"
									dir="ltr"
									placeholder="۱۰۰"
									onChange={(event) =>
										updateDraft(
											"servingQuantity",
											event.currentTarget.value,
										)
									}
								/>
								<FieldError>
									{errors.servingQuantity}
								</FieldError>
							</Field>

							<Field data-invalid={Boolean(errors.servingUnit)}>
								<FieldLabel htmlFor="custom-food-serving-unit">
									واحد سروینگ
								</FieldLabel>
								<FormSelect
									id="custom-food-serving-unit"
									value={draft.servingUnit}
									disabled={isPending}
									invalid={Boolean(errors.servingUnit)}
									className={cn(
										"rounded-2xl",
										errors.servingUnit &&
											"border-destructive focus-visible:ring-destructive/20",
									)}
									options={servingUnits}
									onValueChange={(value) =>
										updateDraft("servingUnit", value)
									}
								/>
								<FieldError>{errors.servingUnit}</FieldError>
							</Field>
						</FieldGroup>
					</FieldGroup>
					<FieldDescription>
						مقدارها به صورت عدد استاندارد ذخیره می‌شوند؛ نمایش خلاصه
						با ارقام فارسی است.
					</FieldDescription>
				</FieldSet>
			</div>

			<div hidden={activeStep !== "nutrition"}>
				<FieldSet className="rounded-2xl border bg-muted/25 p-4">
					<FieldTitle className="mb-1.5 text-base font-medium">
						مواد مغذی در هر سروینگ
					</FieldTitle>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{nutritionFields.map((field) => (
							<NutritionInput
								key={field.name}
								name={field.name}
								label={field.label}
								suffix={field.suffix}
								step={field.step}
								optional={field.optional}
								value={draft[field.name]}
								error={errors[field.name]}
								disabled={isPending}
								onChange={(value) =>
									updateDraft(field.name, value)
								}
							/>
						))}
					</div>
					<FieldDescription>
						کالری از ماکروها:{" "}
						{toPersianDigits(Math.round(macroCalories))} کالری
					</FieldDescription>
				</FieldSet>
			</div>

			{supportsPortions ? (
				<div hidden={activeStep !== "servings"}>
					<FieldSet className="rounded-2xl border bg-muted/25 p-4">
						<FieldTitle className="mb-1.5 text-base font-medium">
							سروینگ‌های سفارشی
							<span className="ms-2 text-xs font-normal text-muted-foreground">
								اختیاری
							</span>
						</FieldTitle>
						<FieldDescription className="mb-3">
							اگر عمده آماده می‌کنید، اندازه هر وعده مصرف را تعریف
							کنید؛ مثلاً «یک تکه» با وزن ۱۰ گرم. موقع ثبت غذا
							همین گزینه‌ها را می‌بینید.
						</FieldDescription>
						<div className="flex flex-col gap-3">
							{portions.map((portion, index) => (
								<PortionRow
									key={portion.id}
									index={index}
									portion={portion}
									disabled={isPending}
									caloriesPerGram={caloriesPerGram}
									onChange={(patch) =>
										updatePortion(portion.id, patch)
									}
									onRemove={() => removePortion(portion.id)}
								/>
							))}
							{portions.length === 0 ? (
								<p className="rounded-2xl border border-dashed bg-background/60 p-4 text-center text-sm text-muted-foreground">
									هنوز سروینگ سفارشی تعریف نکرده‌اید.
									می‌توانید این مرحله را رد کنید.
								</p>
							) : null}
							<Button
								type="button"
								variant="outline"
								size="lg"
								className="h-11 self-start rounded-full"
								disabled={
									isPending ||
									portions.length >= CUSTOM_FOOD_PORTIONS_MAX
								}
								onClick={addPortion}
							>
								<PlusIcon data-icon="inline-start" />
								افزودن سروینگ
							</Button>
						</div>
						{errors.portions ? (
							<p
								className="mt-2 text-sm text-destructive"
								role="alert"
							>
								{errors.portions}
							</p>
						) : null}
					</FieldSet>
				</div>
			) : null}

			<div hidden={activeStep !== "review"}>
				<div className="flex flex-col gap-4">
					<div className="rounded-2xl border bg-muted/25 p-4">
						<p className="text-xs font-bold text-muted-foreground">
							نام غذا
						</p>
						<p className="mt-1 text-lg font-black">
							{draft.name || "—"}
						</p>
					</div>
					<div className="grid grid-cols-1 gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-3">
						<ReadOnlyMetric
							label="سروینگ"
							value={`${toPersianDigits(draft.servingQuantity || 0)} ${selectedServingUnit.label}`}
						/>
						<ReadOnlyMetric
							label="کالری واردشده"
							value={`${toPersianDigits(draft.calories || 0)} کالری`}
						/>
						<ReadOnlyMetric
							label="کالری از ماکروها"
							value={`${toPersianDigits(Math.round(macroCalories))} کالری`}
						/>
					</div>
					{supportsPortions && portions.length > 0 ? (
						<div className="rounded-2xl border bg-muted/25 p-4">
							<p className="text-xs font-bold text-muted-foreground">
								سروینگ‌های سفارشی
							</p>
							<ul className="mt-2 flex flex-col gap-1.5">
								{portions.map((portion) => (
									<li
										key={portion.id}
										className="flex items-center justify-between gap-2 text-sm"
									>
										<span className="truncate font-medium">
											{portion.name || "—"}
										</span>
										<span className="shrink-0 tabular-nums text-muted-foreground">
											{toPersianDigits(
												portion.gramWeightInput || 0,
											)}{" "}
											گرم
											{caloriesPerGram !== null &&
											numericValue(
												portion.gramWeightInput,
											) > 0
												? ` · ≈ ${toPersianDigits(Math.round(numericValue(portion.gramWeightInput) * caloriesPerGram))} کالری`
												: ""}
										</span>
									</li>
								))}
							</ul>
						</div>
					) : null}
				</div>
			</div>

			{isLastStep ? (
				<FormStatusAlert
					successMessage={actionState.successMessage}
					errorMessage={actionState.message}
					requestId={actionState.requestId}
					createdFoodId={
						mode === "create"
							? actionState.createdFoodId
							: undefined
					}
					errorCount={errorCount}
					hasBackendError={hasBackendError}
					hasValidationError={hasValidationError}
					offlineMessage={offlineMessage}
				/>
			) : null}

			<WizardFooter
				canGoBack={safeStepIndex > 0}
				isLastStep={isLastStep}
				disabled={isPending}
				onBack={() => setStepIndex(Math.max(safeStepIndex - 1, 0))}
				submitButton={
					<Button
						type="submit"
						size="lg"
						className="h-11 rounded-full"
						disabled={isPending}
					>
						{isPending ? (
							<Spinner data-icon="inline-start" />
						) : mode === "edit" ? (
							<SaveIcon data-icon="inline-start" />
						) : (
							<PlusIcon data-icon="inline-start" />
						)}
						{isPending ? "در حال ذخیره..." : submitLabel}
					</Button>
				}
			/>
			<p
				className={cn(
					"text-xs leading-6 text-muted-foreground",
					(validated || actionState.successMessage) &&
						"font-bold text-primary",
					actionState.message && "font-bold text-destructive",
				)}
				aria-live="polite"
			>
				{actionState.successMessage ??
					actionState.message ??
					"مراحل را کامل کنید و در پایان ذخیره را بزنید."}
			</p>
			<PlanLimitDialog
				notice={actionState.planLimit}
				open={planLimitDialogOpen}
				onOpenChange={setPlanLimitDialogOpen}
			/>
		</form>
	);
}

function PortionRow({
	index,
	portion,
	disabled,
	caloriesPerGram,
	onChange,
	onRemove,
}: {
	index: number;
	portion: CustomFoodPortionDraft;
	disabled?: boolean;
	caloriesPerGram: number | null;
	onChange: (patch: Partial<Omit<CustomFoodPortionDraft, "id">>) => void;
	onRemove: () => void;
}) {
	const rowError = validateCustomFoodPortionDraft(portion);
	const gramWeight = numericValue(portion.gramWeightInput);
	const showPreview = !rowError && caloriesPerGram !== null && gramWeight > 0;

	return (
		<CustomServingField
			idPrefix={`custom-food-portion-${portion.id}`}
			index={index}
			name={portion.name}
			weight={portion.gramWeightInput}
			disabled={disabled}
			preview={
				showPreview
					? `${portion.name || "این سروینگ"} ≈ ${toPersianDigits(Math.round(gramWeight * caloriesPerGram))} کالری`
					: null
			}
			onNameChange={(name) => onChange({ name })}
			onWeightChange={(gramWeightInput) => onChange({ gramWeightInput })}
			onRemove={onRemove}
		/>
	);
}

function portionsValidationMessage(
	portions: CustomFoodPortionDraft[],
): string | null {
	for (const portion of portions) {
		const error = validateCustomFoodPortionDraft(portion);
		if (error) return error;
	}

	const names = portions.map((portion) => portion.name.trim());
	if (new Set(names).size !== names.length) {
		return "نام سروینگ‌ها نباید تکراری باشد.";
	}

	return null;
}

function NutritionInput({
	name,
	label,
	suffix,
	step,
	optional,
	value,
	error,
	disabled,
	onChange,
}: {
	name: NutritionFieldName;
	label: string;
	suffix: string;
	step: string;
	optional?: boolean;
	value: string;
	error?: string;
	disabled?: boolean;
	onChange: (value: string) => void;
}) {
	return (
		<Field data-invalid={Boolean(error)}>
			<FieldLabel htmlFor={`custom-food-${name}`}>
				{label}
				{optional ? (
					<span className="text-xs font-normal text-muted-foreground">
						اختیاری
					</span>
				) : null}
			</FieldLabel>
			<div className="relative">
				<Input
					id={`custom-food-${name}`}
					name={name}
					type="text"
					inputMode="decimal"
					data-step={step}
					value={value}
					disabled={disabled}
					aria-invalid={Boolean(error)}
					className="h-11 rounded-2xl bg-background pl-16 text-left tabular-nums"
					dir="ltr"
					placeholder={optional ? "اختیاری" : "0"}
					onChange={(event) => onChange(event.currentTarget.value)}
				/>
				<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
					{suffix}
				</span>
			</div>
			<FieldError>{error}</FieldError>
		</Field>
	);
}

function ReadOnlyMetric({ label, value }: { label: string; value: string }) {
	return (
		<div
			className={cn(
				"rounded-2xl bg-muted/40 p-3",
				"motion-safe:transition-colors motion-safe:duration-200",
			)}
		>
			<p className="text-xs font-bold text-muted-foreground">{label}</p>
			<p className="mt-1 text-lg font-black tabular-nums">{value}</p>
		</div>
	);
}

function FormStatusAlert({
	successMessage,
	errorMessage,
	requestId,
	createdFoodId,
	errorCount,
	hasBackendError,
	hasValidationError,
	offlineMessage,
}: {
	successMessage?: string;
	errorMessage?: string;
	requestId?: string;
	createdFoodId?: string;
	errorCount: number;
	hasBackendError: boolean;
	hasValidationError: boolean;
	offlineMessage: string | null;
}) {
	if (successMessage) {
		return (
			<Alert>
				<CheckCircle2Icon />
				<AlertTitle>ذخیره انجام شد</AlertTitle>
				<AlertDescription className="flex flex-wrap items-center gap-2">
					<span>{successMessage}</span>
					{createdFoodId ? (
						<Link
							href={`/foods/${encodeURIComponent(createdFoodId)}`}
							className={buttonVariants({
								variant: "outline",
								size: "sm",
							})}
						>
							مشاهده جزئیات
						</Link>
					) : null}
				</AlertDescription>
			</Alert>
		);
	}

	if (offlineMessage) {
		return (
			<Alert variant="destructive">
				<WifiOffIcon />
				<AlertTitle>آفلاین هستید</AlertTitle>
				<AlertDescription>{offlineMessage}</AlertDescription>
			</Alert>
		);
	}

	if (hasValidationError) {
		return (
			<Alert variant="destructive">
				<AlertCircleIcon />
				<AlertTitle>فرم نیاز به اصلاح دارد</AlertTitle>
				<AlertDescription>
					{errorMessage} {toPersianDigits(errorCount)} فیلد را بررسی
					کنید.
				</AlertDescription>
			</Alert>
		);
	}

	if (hasBackendError) {
		return (
			<Alert variant="destructive">
				<AlertCircleIcon />
				<AlertTitle>پاسخ سرور ناموفق بود</AlertTitle>
				<AlertDescription>
					{errorMessage}
					{requestId ? (
						<span
							className="mt-1 block font-mono text-xs"
							dir="ltr"
						>
							requestId: {requestId}
						</span>
					) : null}
				</AlertDescription>
			</Alert>
		);
	}

	return null;
}

function draftFromInitialValues(
	initialValues?: Record<keyof CustomFoodFormValues, string>,
): DraftValues {
	const servingUnit = initialValues?.servingUnit;
	return {
		...initialDraft,
		...initialValues,
		servingUnit: servingUnits.some((unit) => unit.value === servingUnit)
			? (servingUnit as DraftValues["servingUnit"])
			: initialDraft.servingUnit,
	};
}

function numericValue(value: string) {
	const parsed = Number.parseFloat(normalizeDecimalInput(value));
	return Number.isFinite(parsed) ? parsed : 0;
}
