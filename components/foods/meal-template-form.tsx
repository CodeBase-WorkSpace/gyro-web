"use client";

import {AlertCircleIcon, PlusIcon, SearchIcon, Trash2Icon,} from "lucide-react";
import type {FormEvent} from "react";
import {startTransition, useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";

import {createCustomMealAction, duplicateCustomMealAction, updateCustomMealAction,} from "@/app/_actions/custom-meals";
import {FoodSearchResults} from "@/components/foods/food-search-results";
import {ServingDefinitionFields, servingDefinitionSummaryText,} from "@/components/foods/serving-definition-fields";
import {WizardFooter} from "@/components/foods/wizard/wizard-footer";
import {WizardStepper} from "@/components/foods/wizard/wizard-stepper";
import {PlanLimitDialog} from "@/components/subscription/plan-limit-dialog";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
	FieldTitle,
} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {FormSelect} from "@/components/ui/form-select";
import {Spinner} from "@/components/ui/spinner";
import {type FoodSearchItem, foodSearchProxyPath, type FoodSearchResponseDto,} from "@/lib/api/foods";
import type {CreateMealRequestDto} from "@/lib/api/meals";
import {parseQuickAddAmount} from "@/lib/diary/quick-add";
import {toPersianDigits} from "@/lib/format";
import {
	type MealTemplateFormItem,
	mealTemplateIngredientWeight,
	mealTemplateItemFromFood,
	mealTemplateItemWeight,
	mealTemplateRequestItemFrom,
} from "@/lib/foods/meal-editor";
import {
	emptyServingDefinitionDraft,
	parseServingDefinitionDraft,
	type ServingDefinitionDraft,
} from "@/lib/foods/serving-definition";
import type {PlanLimitNotice} from "@/lib/subscription/plan-limits";

type WizardStepId = "name" | "select" | "amounts" | "servings" | "review";

const wizardSteps: Array<{ id: WizardStepId; label: string }> = [
	{id: "name", label: "نام وعده"},
	{id: "select", label: "انتخاب"},
	{id: "amounts", label: "مقدارها"},
	{id: "servings", label: "سروینگ‌بندی"},
	{id: "review", label: "بازبینی"},
];

export function MealTemplateForm({
	mode,
	mealId,
	initialName,
	initialItems,
	originalName,
																	 initialServingDefinition,
																	 onSaved,
}: {
	mode: "create" | "edit" | "duplicate";
	mealId: string;
	initialName: string;
	initialItems: MealTemplateFormItem[];
	originalName?: string;
	initialServingDefinition?: ServingDefinitionDraft;
	onSaved?: (mealId: string) => void;
}) {
	const router = useRouter();
	const [name, setName] = useState(initialName);
	const [items, setItems] = useState(initialItems);
	const [servingDefinition, setServingDefinition] =
		useState<ServingDefinitionDraft>(
			initialServingDefinition ?? emptyServingDefinitionDraft,
		);
	const [servingDefinitionError, setServingDefinitionError] = useState<
		string | null
	>(null);
	const [stepIndex, setStepIndex] = useState(0);
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [foods, setFoods] = useState<FoodSearchItem[]>([]);
	const [page, setPage] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [isSearching, setIsSearching] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);
	const [searchRetryNonce, setSearchRetryNonce] = useState(0);
	const [formError, setFormError] = useState<string | null>(null);
	const [planLimit, setPlanLimit] = useState<PlanLimitNotice | undefined>();
	const [planLimitDialogOpen, setPlanLimitDialogOpen] = useState(false);
	const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
	const [intentId] = useState(() => createIntentId());
	const [isPending, setIsPending] = useState(false);
	const selectedFoodIds = useMemo(
		() => items.map((item) => item.foodId),
		[items],
	);
	const canLoadMore = !isSearching && !isLoadingMore && page + 1 < totalPages;
	const activeStep = wizardSteps[stepIndex].id;
	const isLastStep = stepIndex === wizardSteps.length - 1;
  const totalBatchWeight = useMemo(
    () => mealTemplateIngredientWeight(items),
    [items],
  );
	const servingSummary = servingDefinitionSummaryText(
    parseServingDefinitionDraft(servingDefinition, totalBatchWeight).values ??
    null,
	);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setDebouncedQuery(query.trim());
			setPage(0);
		}, 300);
		return () => window.clearTimeout(timeoutId);
	}, [query]);

	useEffect(() => {
		const controller = new AbortController();
		const firstPage = page === 0;
		if (firstPage) setIsSearching(true);
		else setIsLoadingMore(true);
		setSearchError(null);

		fetch(
			foodSearchProxyPath({
				query: debouncedQuery || undefined,
        locale: "fa",
				page,
				size: 10,
			}),
			{signal: controller.signal},
		)
			.then(async (response) => {
				if (!response.ok)
					throw new Error(`Food search failed: ${response.status}`);
				return response.json() as Promise<FoodSearchResponseDto>;
			})
			.then((response) => {
				setFoods((current) =>
					firstPage
						? response.items
						: [...current, ...response.items],
				);
				setTotalPages(response.totalPages);
			})
			.catch((error) => {
				if (
					error instanceof DOMException &&
					error.name === "AbortError"
				)
					return;
				setSearchError("جستجوی غذا ناموفق بود. دوباره تلاش کنید.");
			})
			.finally(() => {
				setIsSearching(false);
				setIsLoadingMore(false);
			});

		return () => controller.abort();
	}, [debouncedQuery, page, searchRetryNonce]);

	function toggleFood(food: FoodSearchItem) {
    setItems((current) => {
      if (current.some((item) => item.foodId === food.id)) {
        return current.filter((item) => item.foodId !== food.id);
      }
      if (current.length >= 50) {
        toast.error("هر وعده می‌تواند حداکثر ۵۰ غذا داشته باشد.");
        return current;
      }
      return [...current, mealTemplateItemFromFood(food)];
    });
		setFormError(null);
	}

	function retryFoodSearch() {
		setSearchRetryNonce((current) => current + 1);
	}

	function updateItem(
		key: string,
		change: Partial<
      Pick<MealTemplateFormItem, "quantityInput" | "servingOptionId">
		>,
	) {
		setItems((current) =>
			current.map((item) =>
				item.key === key ? {...item, ...change} : item,
			),
		);
		setRowErrors((current) => {
      const next = {...current};
      delete next[key];
			return next;
		});
		setFormError(null);
	}

	function removeItem(key: string) {
		setItems((current) => current.filter((item) => item.key !== key));
		setFormError(null);
	}

	function validateStep(step: WizardStepId): boolean {
		if (step === "name") {
			if (!name.trim()) {
				setFormError("نام وعده سفارشی را وارد کنید.");
				return false;
			}
			if (
				mode === "duplicate" &&
				originalName &&
				name.trim() === originalName.trim()
			) {
				setFormError(
					"برای نسخه جدید، نامی متفاوت از وعده اصلی وارد کنید.",
				);
				return false;
			}
		}

		if (step === "select" && items.length === 0) {
			setFormError("حداقل یک غذا به وعده اضافه کنید.");
			return false;
		}

		if (step === "amounts") {
			const validation = validateMealTemplate(name, items, undefined);
			setRowErrors(validation.rowErrors);
			if (
				Object.keys(validation.rowErrors).length ||
				items.length === 0
			) {
				setFormError(
					items.length === 0
						? "حداقل یک غذا به وعده اضافه کنید."
						: "مقدار اجزای وعده را بررسی کنید.",
				);
				return false;
			}
		}

		if (step === "servings") {
      const parsed = parseServingDefinitionDraft(
        servingDefinition,
        totalBatchWeight,
      );
			if (parsed.error) {
				setServingDefinitionError(parsed.error);
				return false;
			}
			setServingDefinitionError(null);
		}

		setFormError(null);
		return true;
	}

	function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (isPending) return;

		if (!isLastStep) {
			if (validateStep(activeStep)) setStepIndex(stepIndex + 1);
			return;
		}

		submit();
	}

	function submit() {
		const validation = validateMealTemplate(
			name,
			items,
			mode === "duplicate" ? originalName : undefined,
		);
		setRowErrors(validation.rowErrors);
		setFormError(validation.message);
		if (validation.message || Object.keys(validation.rowErrors).length) {
			setStepIndex(validation.message && !items.length ? 1 : 0);
			if (Object.keys(validation.rowErrors).length) setStepIndex(2);
			toast.error(
				validation.message ?? "مقدار اجزای وعده را بررسی کنید.",
			);
			return;
		}

    const parsedServing = parseServingDefinitionDraft(
      servingDefinition,
      totalBatchWeight,
    );
    const servingValues = parsedServing.values;
    if (!servingValues) {
      const error = parsedServing.error ?? "سروینگ‌بندی را بررسی کنید.";
      setServingDefinitionError(error);
			setStepIndex(3);
      toast.error(error);
			return;
		}

		if (typeof navigator !== "undefined" && !navigator.onLine) {
			setFormError(
				"اتصال اینترنت قطع است. پیش‌نویس شما در این صفحه حفظ شده است.",
			);
			toast.error("اتصال اینترنت قطع است.");
			return;
		}

    const requestItems = items.map(mealTemplateRequestItemFrom);
    if (requestItems.some((item) => item === null)) {
      setStepIndex(2);
      setFormError("مقدار و واحد اجزای وعده را بررسی کنید.");
      return;
    }

		const request: CreateMealRequestDto = {
			name: name.trim(),
      items: requestItems as NonNullable<(typeof requestItems)[number]>[],
      totalBatchWeight: servingValues.totalBatchWeight,
      servingWeight: servingValues.servingWeight,
		};

		setIsPending(true);
		(async () => {
			const result =
				mode === "edit"
					? await updateCustomMealAction({
						mealId,
						request,
						nextPath: `/foods/meals/${mealId}`,
					})
					: mode === "duplicate"
						? await duplicateCustomMealAction({
							request,
							idempotencyKey: intentId,
							nextPath: `/foods/meals/${mealId}/duplicate`,
							sourceMealId: mealId,
						})
						: await createCustomMealAction({
							request,
							idempotencyKey: intentId,
							nextPath: "/foods/meals",
						});

			if (!result.ok) {
				setIsPending(false);
				setFormError(result.message);
				setPlanLimit(result.planLimit);
				if (result.planLimit) setPlanLimitDialogOpen(true);
				toast.error(result.message);
				return;
			}

			setIsPending(false);
			toast.success(
				mode === "edit"
					? "وعده سفارشی به‌روزرسانی شد."
					: mode === "duplicate"
						? "نسخه جدید وعده سفارشی ساخته شد."
						: "وعده سفارشی ساخته شد.",
			);
			if (onSaved) {
				onSaved(result.meal.id);
				startTransition(() => router.refresh());
			} else {
				startTransition(() => {
					router.push(`/foods/meals/${result.meal.id}`);
					router.refresh();
				});
			}
		})().catch((error) => {
			const message =
				error instanceof Error
					? error.message
					: "وعده سفارشی ذخیره نشد.";
			setIsPending(false);
			setFormError(message);
			toast.error(message);
		});
	}

	return (
		<form
			className="flex flex-col gap-5"
			dir="rtl"
			noValidate
			onSubmit={handleFormSubmit}
		>
			<WizardStepper
				steps={wizardSteps}
				activeIndex={stepIndex}
				onStepSelect={(index) => {
					if (!isPending) setStepIndex(index);
				}}
			/>

			<div hidden={activeStep !== "name"}>
				<FieldGroup>
					<Field data-invalid={Boolean(!name.trim() && formError)}>
						<FieldLabel htmlFor="meal-template-name">
							{mode === "duplicate"
								? "نام وعده جدید"
								: "نام وعده"}
						</FieldLabel>
						<Input
							id="meal-template-name"
							value={name}
							maxLength={160}
							disabled={isPending}
							placeholder={
								mode === "duplicate"
									? "یک نام جدید وارد کنید"
									: "نام وعده سفارشی"
							}
							className="h-11 rounded-xl"
							onChange={(event) => {
								setName(event.currentTarget.value);
								setFormError(null);
							}}
						/>
						<FieldDescription>
							{mode === "duplicate"
								? "نسخه جدید مستقل است و نام آن باید با الگوی اصلی متفاوت باشد."
								: mode === "edit"
									? "ویرایش این الگو، ثبت‌های قدیمی دفتر غذایی را تغییر نمی‌دهد."
									: "این الگو در کتابخانه ذخیره می‌شود و خودکار به دفتر غذایی اضافه نمی‌شود."}
						</FieldDescription>
					</Field>
				</FieldGroup>
			</div>

			<div
				hidden={activeStep !== "select"}
				className="flex flex-col gap-5"
			>
				<FieldSet className="min-w-0 w-full max-w-full gap-3 overflow-hidden rounded-2xl border bg-muted/20 p-4">
					<FieldLegend>افزودن غذا</FieldLegend>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="meal-food-search">
								جستجوی غذای موجود
							</FieldLabel>
							<div className="relative">
								<SearchIcon
									className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
									aria-hidden="true"
								/>
								<Input
									id="meal-food-search"
									type="search"
									value={query}
									className="h-11 rounded-xl pr-10"
									placeholder="نام غذا"
									onChange={(event) =>
										setQuery(event.currentTarget.value)
									}
									onKeyDown={(event) => {
										if (event.key === "Enter")
											event.preventDefault();
									}}
								/>
							</div>
						</Field>
					</FieldGroup>
					<FoodSearchResults
						foods={foods}
						selectedFoodIds={selectedFoodIds}
						isSearching={isSearching}
						isLoadingMore={isLoadingMore}
						searchError={searchError}
						canLoadMore={canLoadMore}
						autoLoadMore={false}
						viewportClassName="max-h-80"
						onLoadMore={() => setPage((current) => current + 1)}
						onRetry={retryFoodSearch}
						onSelect={toggleFood}
					/>
				</FieldSet>
			</div>

			<div
				hidden={activeStep !== "amounts"}
				className="flex flex-col gap-5"
			>
				<FieldSet className="gap-3">
					<FieldLegend>
						اجزای وعده ({items.length.toLocaleString("fa-IR")})
					</FieldLegend>
					<div className="flex flex-col gap-3">
						{items.length === 0 ? (
							<p className="py-6 text-center text-sm text-muted-foreground">
								هنوز غذایی اضافه نشده است. از جستجوی بالا انتخاب
								کنید.
							</p>
						) : null}
						{items.map((item) => (
							<FieldSet
								key={item.key}
								className="relative min-w-0 rounded-2xl border bg-muted/25 p-4"
							>
								<FieldTitle className="mb-1.5 truncate pe-10 text-base font-medium">
									{item.foodName}
								</FieldTitle>
								<FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<Field data-invalid={Boolean(rowErrors[item.key])}>
										<FieldLabel htmlFor={`quantity-${item.key}`}>
											مقدار سروینگ
										</FieldLabel>
										<Input
											id={`quantity-${item.key}`}
											value={item.quantityInput}
											inputMode="decimal"
											dir="ltr"
											aria-invalid={Boolean(rowErrors[item.key])}
											placeholder="مثلاً ۱۰۰"
											className="h-11 rounded-2xl bg-background text-left tabular-nums"
											onChange={(event) =>
												updateItem(item.key, {
													quantityInput: event.currentTarget.value,
												})
											}
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor={`serving-option-${item.key}`}>
											واحد سروینگ
										</FieldLabel>
										<FormSelect
											id={`serving-option-${item.key}`}
											value={item.servingOptionId}
											className="h-11 rounded-2xl bg-background text-sm"
											options={item.servingOptions.map((option) => ({
												value: option.id,
												label: option.label,
											}))}
											onValueChange={(servingOptionId) =>
												updateItem(item.key, {servingOptionId})
											}
										/>
									</Field>
								</FieldGroup>
								<FieldError className="mt-3">
									{rowErrors[item.key]}
								</FieldError>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="absolute left-3 top-3 rounded-full text-muted-foreground hover:text-destructive"
									aria-label={`حذف ${item.foodName}`}
									onClick={() => removeItem(item.key)}
								>
									<Trash2Icon />
								</Button>
							</FieldSet>
						))}
					</div>
				</FieldSet>
			</div>

			<div hidden={activeStep !== "servings"}>
				<ServingDefinitionFields
					idPrefix={`meal-template-${mealId || "new"}`}
					draft={servingDefinition}
          totalBatchWeight={totalBatchWeight}
					disabled={isPending}
					error={servingDefinitionError}
					onChange={(draft) => {
						setServingDefinition(draft);
						setServingDefinitionError(null);
					}}
				/>
			</div>

			<div hidden={activeStep !== "review"}>
				<div className="flex flex-col gap-4">
					<div className="rounded-2xl border bg-muted/25 p-4">
						<p className="text-xs font-bold text-muted-foreground">
							نام وعده
						</p>
						<p className="mt-1 text-lg font-black">
							{name.trim() || "—"}
						</p>
					</div>
					<div className="rounded-2xl border bg-muted/25 p-4">
						<p className="text-xs font-bold text-muted-foreground">
							اجزای وعده ({items.length.toLocaleString("fa-IR")})
						</p>
						<ul className="mt-2 flex flex-col gap-1.5">
							{items.map((item) => (
								<li
									key={item.key}
									className="flex items-center justify-between gap-2 text-sm"
								>
									<span className="truncate font-medium">
										{item.foodName}
									</span>
									<span
										className="shrink-0 tabular-nums text-muted-foreground"
										dir="rtl"
									>
										{toPersianDigits(
											item.quantityInput || 0,
										)}{" "}
                    {item.servingOptions.find(
                      (option) =>
                        option.id === item.servingOptionId,
                    )?.label ?? "—"}
									</span>
								</li>
							))}
						</ul>
					</div>
					{servingSummary ? (
						<div className="rounded-2xl border bg-muted/25 p-4">
							<p className="text-xs font-bold text-muted-foreground">
								سروینگ‌بندی
							</p>
							<p className="mt-1 text-sm font-medium tabular-nums">
								{servingSummary}
							</p>
						</div>
					) : null}
				</div>
			</div>

			{formError ? (
				<Alert variant="destructive">
					<AlertCircleIcon aria-hidden="true" />
					<AlertTitle>ذخیره انجام نشد</AlertTitle>
					<AlertDescription>{formError}</AlertDescription>
				</Alert>
			) : null}

			<WizardFooter
				canGoBack={stepIndex > 0}
				isLastStep={isLastStep}
				disabled={isPending}
				onBack={() => setStepIndex(Math.max(stepIndex - 1, 0))}
				submitButton={
					<Button
						type="submit"
						size="lg"
						className="h-11 rounded-full"
						disabled={isPending}
					>
						{isPending ? (
							<Spinner data-icon="inline-start"/>
						) : (
							<PlusIcon data-icon="inline-start"/>
						)}
						{isPending
							? "در حال ذخیره"
							: mode === "edit"
								? "ذخیره تغییرات"
								: mode === "duplicate"
									? "ساخت نسخه جدید"
									: "ساخت وعده سفارشی"}
					</Button>
				}
			/>
			<PlanLimitDialog
				notice={planLimit}
				open={planLimitDialogOpen}
				onOpenChange={setPlanLimitDialogOpen}
			/>
		</form>
	);
}

function validateMealTemplate(
	name: string,
	items: MealTemplateFormItem[],
	originalName?: string,
) {
	const rowErrors: Record<string, string> = {};
	if (!name.trim())
		return {message: "نام وعده سفارشی را وارد کنید.", rowErrors};
	if (originalName && name.trim() === originalName.trim())
		return {
			message: "برای نسخه جدید، نامی متفاوت از وعده اصلی وارد کنید.",
			rowErrors,
		};
	if (items.length === 0)
		return {message: "حداقل یک غذا به وعده اضافه کنید.", rowErrors};
  if (items.length > 50)
    return {message: "هر وعده می‌تواند حداکثر ۵۰ غذا داشته باشد.", rowErrors};
	for (const item of items) {
		const amount = parseQuickAddAmount(item.quantityInput);
		if (amount.value === null || amount.value < 0.001)
			rowErrors[item.key] = "مقدار باید حداقل ۰٫۰۰۱ باشد.";
    if (!item.servingOptionId)
			rowErrors[item.key] = "واحد سروینگ را انتخاب کنید.";
    else if (mealTemplateItemWeight(item) === null)
      rowErrors[item.key] =
        "این واحد معادل وزن گرم ندارد؛ واحد دیگری انتخاب کنید.";
	}
	return { message: null, rowErrors };
}

function createIntentId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto)
		return crypto.randomUUID();
	return `duplicate-meal-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
