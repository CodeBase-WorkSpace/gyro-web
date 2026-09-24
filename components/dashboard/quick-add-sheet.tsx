"use client";

import {AlertCircleIcon, CheckCircle2Icon, FlameIcon, SearchIcon, Trash2Icon, WifiOffIcon,} from "lucide-react";
import {memo, startTransition, useCallback, useEffect, useMemo, useState,} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";

import {
	revalidateDiaryPathsAction,
	saveBatchQuickAddEntriesAction,
	saveQuickAddEntryAction,
	type QuickAddEntryResult,
} from "@/app/_actions/quick-add";
import {FoodSearchResults} from "@/components/foods/food-search-results";
import {CustomFoodForm} from "@/components/foods/custom-food-form";
import {MacroNutrientIcon, type MacroNutrientKind} from "@/components/foods/macro-nutrient";
import {MealTemplateForm} from "@/components/foods/meal-template-form";
import {WizardStepper} from "@/components/foods/wizard/wizard-stepper";
import {WeightEntrySheet} from "@/components/progress/weight-entry-sheet";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet,} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger,} from "@/components/ui/select";
import {Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,} from "@/components/ui/sheet";
import {Spinner} from "@/components/ui/spinner";
import {diaryMealOptions, type DiaryMealType, quickAddMealTypeByLabel, type QuickAddSaveStatus,} from "@/lib/api/diary";
import type {
	FoodSearchRequestDto,
	FoodSearchResponseDto,
	FoodServingPortionDto,
	QuickAddFoodFilter,
	QuickAddSearchItem,
} from "@/lib/api/foods";
import {quickAddFoodSearchRequest} from "@/lib/api/foods";
import type {MealListResponseDto, MealServingDefinitionDto, MealSummaryDto} from "@/lib/api/meals";
import {
	parseQuickAddAmount,
	quickAddBatchEntryFrom,
	quickAddEntryInputFrom,
	quickAddEstimatedCalories,
	quickAddMealIdempotencyKey,
	quickAddPreviewNutritionFor,
	type QuickAddSelectedFood,
	quickAddSelectedFoodFrom,
	quickAddServingOptions,
	quickAddValidationMessageForSelection,
} from "@/lib/diary/quick-add";
import {toPersianDigits} from "@/lib/format";
import {cn} from "@/lib/utils";

const defaultMealLabel = "ناهار";
const searchPageSize = 10;
const quickAddFoodWizardSteps = [
  {id: "search", label: "انتخاب غذا"},
  {id: "edit", label: "بازبینی"},
];
const filters = [
	{ label: "همه", value: "all" },
	{ label: "اخیر", value: "recent" },
	{ label: "علاقه‌مندی‌ها", value: "favorite" },
	{ label: "سفارشی", value: "custom" },
] as const;

const mealTypeByLabel = quickAddMealTypeByLabel;

type QuickAddMode = "food" | "custom-food" | "custom-meal";
export type QuickDashboardAction = QuickAddMode | "weight";
export type QuickAddSurface = "desktop" | "mobile" | "responsive";
type QuickAddStep = "search" | "edit";

// A trigger click from QuickAddClient; the nonce re-fires the open effect when
// the same action is requested twice in a row.
export type QuickAddSheetRequest = {
	action: QuickDashboardAction;
	nonce: number;
};

export function QuickAddSheet({
	surface = "desktop",
	date,
	canWriteDiary = true,
	request,
}: {
	surface?: QuickAddSurface;
	date: string;
	canWriteDiary?: boolean;
	request: QuickAddSheetRequest;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
  const [weightEntryOpen, setWeightEntryOpen] = useState(false);
	const [mode, setMode] = useState<QuickAddMode>("food");
	const [step, setStep] = useState<QuickAddStep>("search");
	const [selectedMeal, setSelectedMeal] = useState(defaultMealLabel);
	const [selectedFoods, setSelectedFoods] = useState<QuickAddSelectedFood[]>(
		[],
	);
	const [intentId, setIntentId] = useState(() => createQuickAddIntentId());
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [selectedFilter, setSelectedFilter] =
		useState<QuickAddFoodFilter>("all");
	const [page, setPage] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [apiFoods, setApiFoods] = useState<QuickAddSearchItem[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);
	const [searchRetryNonce, setSearchRetryNonce] = useState(0);
	const [saveStatus, setSaveStatus] = useState<QuickAddSaveStatus>("idle");
	const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isDesktopViewport, setIsDesktopViewport] = useState(
    surface === "desktop",
  );

	const canLoadMore = !isSearching && !isLoadingMore && page + 1 < totalPages;
	const isSaving = saveStatus === "saving";
	const isDiaryFoodMode = mode === "food";
  const usesFoodSearch = mode === "food";
	const idPrefix = `quick-add-${surface}`;
  const sheetSide =
    surface === "responsive"
      ? isDesktopViewport
        ? "left"
        : "bottom"
      : surface === "desktop"
        ? "left"
        : "bottom";
	const selectedFoodIds = useMemo(
		() => selectedFoods.map((food) => food.source.sourceId),
		[selectedFoods],
	);
	const estimatedCalories = useMemo(
		() => quickAddEstimatedCalories(selectedFoods),
		[selectedFoods],
	);
	const selectedNutrition = useMemo(
		() => selectedFoods.reduce(
			(totals, selectedFood) => {
				const option = quickAddServingOptions(selectedFood.food).find(
					(candidate) => candidate.id === selectedFood.servingOptionId,
				);
				const amount = parseQuickAddAmount(selectedFood.amountInput).value;
				const preview = option && amount !== null
					? quickAddPreviewNutritionFor(selectedFood.food, option, amount)
					: null;

				return {
					calories: totals.calories + (preview?.calories ?? 0),
					protein: totals.protein + (preview?.protein ?? 0),
					carbs: totals.carbs + (preview?.carbs ?? 0),
					fat: totals.fat + (preview?.fat ?? 0),
				};
			},
			{calories: 0, protein: 0, carbs: 0, fat: 0},
		),
		[selectedFoods],
	);

	useEffect(() => {
		if (!open || !usesFoodSearch) return;

		const timeoutId = window.setTimeout(() => {
			setDebouncedQuery(query.trim());
			setPage(0);
		}, 300);

		return () => window.clearTimeout(timeoutId);
	}, [open, query, usesFoodSearch]);

	useEffect(() => {
		if (!open || !usesFoodSearch) return;

		const controller = new AbortController();
		const firstPage = page === 0;

		if (firstPage) {
			setIsSearching(true);
		} else {
			setIsLoadingMore(true);
		}

		setSearchError(null);

		searchQuickAddFoods(
			quickAddFoodSearchRequest({
				query: debouncedQuery || undefined,
				filter: selectedFilter,
				locale: "fa",
				page,
				size: searchPageSize,
			}),
			controller.signal,
			{ includeMeals: mode === "food" },
		)
			.then((response) => {
				setApiFoods((current) =>
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
				) {
					return;
				}

				setSearchError(
					"جستجوی غذا ناموفق بود. لطفاً دوباره تلاش کنید.",
				);
			})
			.finally(() => {
				setIsSearching(false);
				setIsLoadingMore(false);
			});

		return () => controller.abort();
	}, [
		debouncedQuery,
		open,
		page,
		searchRetryNonce,
		selectedFilter,
		mode,
		usesFoodSearch,
	]);

	useEffect(() => {
		if (step === "edit" && selectedFoods.length === 0) setStep("search");
	}, [selectedFoods.length, step]);

  useEffect(() => {
    if (surface !== "responsive") return;

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateViewport = () => setIsDesktopViewport(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, [surface]);

	function openSheet(nextMode: QuickAddMode) {
		setMode(nextMode);
		setSaveStatus("idle");
		setSaveMessage(null);
    if (nextMode === "food") {
			setSelectedFoods([]);
			setStep("search");
			setIntentId(createQuickAddIntentId());
			setQuery("");
			setDebouncedQuery("");
			setSelectedFilter("all");
			setPage(0);
		}
		setOpen(true);
	}

	function openDashboardAction(action: QuickDashboardAction) {
		if (action === "food" && !canWriteDiary) {
			toast.error("این تاریخ فقط برای مشاهده است؛ ثبت غذایی برای کاربران رایگان در این روز فعال نیست.");
			return;
		}
		if (action === "weight") {
			setWeightEntryOpen(true);
			return;
		}

		openSheet(action);
	}

	// Each trigger click from the QuickAddClient shell arrives as a new request.
	useEffect(() => {
		openDashboardAction(request.action);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [request]);

	function changeFilter(filter: QuickAddFoodFilter) {
		setSelectedFilter(filter);
		setPage(0);
		setSaveStatus("idle");
		setSaveMessage(null);
	}

	function retryFoodSearch() {
		setSearchRetryNonce((current) => current + 1);
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen && isSaving) return;
		setOpen(nextOpen);
	}

	function handleFoodSelect(food: QuickAddSearchItem) {
		setSelectedFoods((current) => {
			const selected = current.some(
				(item) => item.source.sourceId === food.id,
			);
			if (selected)
				return current.filter(
					(item) => item.source.sourceId !== food.id,
				);
      const selectionLimit = 100;
			if (current.length >= selectionLimit) {
				toast.error(
					`حداکثر ${selectionLimit.toLocaleString("fa-IR")} غذا را می‌توانید انتخاب کنید.`,
				);
				return current;
			}
      const selectedFood = quickAddSelectedFoodFrom(food);
			return [
				...current,
        {
          ...selectedFood,
          mealLabel: selectedMeal,
        },
			];
		});
		setSaveStatus("idle");
		setSaveMessage(null);
	}

	const handleSelectedFoodRemove = useCallback((foodId: string) => {
		setSelectedFoods((current) =>
			current.filter((food) => food.source.sourceId !== foodId),
		);
		setSaveStatus("idle");
		setSaveMessage(null);
	}, []);

	const handleSelectedFoodChange = useCallback(
		(
			foodId: string,
			change: Partial<
				Pick<QuickAddSelectedFood, "amountInput" | "servingOptionId" | "mealLabel">
			>,
		) => {
			setSelectedFoods((current) =>
				current.map((food) =>
					food.source.sourceId === foodId
						? { ...food, ...change }
						: food,
				),
			);
			setSaveStatus("idle");
			setSaveMessage(null);
    },
    [],
  );

	async function submitFood() {
		if (!canWriteDiary) {
			toast.error("این تاریخ فقط برای مشاهده است؛ ثبت غذایی برای کاربران رایگان در این روز فعال نیست.");
			return;
		}
		const validationMessage = quickAddValidationMessageForSelection({
			selectedFoods,
			selectedMealForFood: (selectedFood) =>
				mealTypeByLabel[selectedFood.mealLabel],
		});

		if (validationMessage) {
			setSaveStatus("validation-error");
			setSaveMessage(validationMessage);
			toast.error(validationMessage);
			return;
		}

		if (
			selectedFoods.some(
				(selectedFood) =>
					!mealTypeByLabel[selectedFood.mealLabel] ||
					mealTypeByLabel[selectedFood.mealLabel] === "CUSTOM",
			) ||
			selectedFoods.length === 0
		) {
			setSaveStatus("validation-error");
			setSaveMessage("اطلاعات ثبت سریع کامل نیست.");
			toast.error("اطلاعات ثبت سریع کامل نیست.");
			return;
		}

		if (typeof navigator !== "undefined" && !navigator.onLine) {
			setSaveStatus("offline");
			setSaveMessage(
				"اتصال اینترنت قطع است. دفتر روزانه در حالت فقط‌خواندنی می‌ماند.",
			);
			toast.error("اتصال اینترنت قطع است.");
			return;
		}

		setSaveStatus("saving");
		setSaveMessage(null);

		try {
			const foodSelections = selectedFoods.filter(
				(selectedFood) => selectedFood.source.sourceType === "FOOD",
			);
			const mealSelections = selectedFoods.filter(
				(selectedFood) => selectedFood.source.sourceType === "MEAL",
			);

			// Collect the writes so revalidation can happen once at the end. Each
			// revalidation makes Next re-render the whole route, so revalidating
			// per write turned a five-item meal into five full page renders —
			// five chances for a transient read to fail after the food was
			// already saved. Meal templates still need one write each: the batch
			// endpoint only accepts sourceType "FOOD".
			const writes: Array<() => Promise<QuickAddEntryResult>> = [];

			for (const [mealType, mealEntries] of groupSelectedFoodsByMeal(
				foodSelections,
			)) {
				writes.push(() =>
					saveBatchQuickAddEntriesAction({
						date,
						nextPath: `/dashboard?date=${date}`,
						mealType,
						entries: mealEntries.map(quickAddBatchEntryFrom),
						idempotencyKey: `${intentId}:${mealType}`,
						revalidate: false,
					}),
				);
			}

			for (const selectedFood of mealSelections) {
				const option = quickAddServingOptions(selectedFood.food).find(
					(candidate) => candidate.id === selectedFood.servingOptionId,
				);
				if (!option) continue;

				writes.push(() =>
					saveQuickAddEntryAction({
						...quickAddEntryInputFrom({
							date,
							nextPath: `/dashboard?date=${date}`,
							selectedMeal:
								mealTypeByLabel[selectedFood.mealLabel] ?? "SNACK",
							selectedSource: selectedFood.source,
							selectedOption: option,
							amountInput: selectedFood.amountInput,
						}),
						idempotencyKey: quickAddMealIdempotencyKey(
							intentId,
							selectedFood.source.sourceId,
						),
						revalidate: false,
					}),
				);
			}

			const saveResults: QuickAddEntryResult[] = [];

			for (const write of writes) {
				saveResults.push(await write());
			}

			// One revalidation for the whole gesture, and the only one. Calling it
			// inside a Server Function re-renders the route the user is on as part
			// of the action's response, so a following `router.refresh()` would
			// just fetch the same page a second time.
			//
			// Runs on partial failure too: whatever landed before the failure is
			// real, and the diary has to show it.
			if (saveResults.some((result) => result.ok)) {
				await revalidateDiaryPathsAction();
			}

			const response =
				saveResults.find((result) => !result.ok) ??
				saveResults.at(-1) ??
				{
					ok: false,
					message: "هیچ موردی برای ثبت انتخاب نشده است.",
				};

			if (!response?.ok) {
				setSaveStatus(
					response.reason === "source-unavailable"
						? "source-unavailable"
						: "backend-error",
				);
				setSaveMessage(response.message);
				toast.error(response.message);
				return;
			}

			const successToastMessage = `${selectedFoods.length.toLocaleString("fa-IR")} غذا در دفتر روزانه ثبت شد.`;
			setSaveStatus("success");
			setSaveMessage(
				"دفتر روزانه با پاسخ ذخیره‌شده backend به‌روزرسانی شد.",
			);
			toast.success(successToastMessage);
			setSelectedFoods([]);
			setIntentId(createQuickAddIntentId());
			setOpen(false);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "ثبت غذا در دفتر روزانه ناموفق بود.";
			setSaveStatus("backend-error");
			setSaveMessage(message);
			toast.error(message);
		}
	}

	return (
		<>
			<Sheet open={open} onOpenChange={handleOpenChange}>
				<SheetContent
          side={sheetSide}
          className="p-4 sm:p-5"
					dir="rtl"
				>
          <SheetHeader className="gap-1 pl-10">
            <SheetTitle className="text-sm sm:text-base">{sheetTitle(mode)}</SheetTitle>
            <SheetDescription className="text-xs leading-5 sm:text-sm sm:leading-6">
							{sheetDescription(mode)}
						</SheetDescription>
					</SheetHeader>
          {isDiaryFoodMode ? (
            <WizardStepper
              steps={quickAddFoodWizardSteps}
              activeIndex={step === "search" ? 0 : 1}
              onStepSelect={(index) => {
                if (index === 0) setStep("search");
              }}
            />
          ) : null}

					{isDiaryFoodMode ? (
						<ScrollArea
							viewportClassName="flex min-h-full flex-col gap-4 pb-2"
							className="min-h-0 flex-1"
						>
							{step === "search" ? (
								<>
									<section className="sticky top-0 z-10 -mx-1 rounded-[1.75rem] border border-border/70 bg-background/92 p-3 shadow-[0_14px_40px_color-mix(in_oklch,var(--background)_84%,transparent)] backdrop-blur-sm">
										<div className="flex flex-col gap-3">
											<QuickAddSearchInput
												id={`${idPrefix}-food-search`}
												label="جستجوی غذا"
												value={query}
												placeholder="نام غذا یا وعده ذخیره‌شده"
												onChange={setQuery}
											/>
											<QuickAddFilters
												selectedFilter={selectedFilter}
												onFilterChange={changeFilter}
											/>
										</div>
									</section>

									<section className="border-y border-border/70 py-2">
										<FoodSearchResults
											foods={apiFoods}
											selectedFoodIds={selectedFoodIds}
											isSearching={isSearching}
											isLoadingMore={isLoadingMore}
											searchError={searchError}
											canLoadMore={canLoadMore}
											autoLoadMore={false}
											scrollable={false}
											viewportClassName="pe-1"
											onLoadMore={() =>
												setPage(
													(current) => current + 1,
												)
											}
											onRetry={retryFoodSearch}
											onSelect={handleFoodSelect}
										/>
									</section>
								</>
							) : (
								<BatchQuickAddEditor
									selectedMeal={selectedMeal}
									selectedFoods={selectedFoods}
									selectedNutrition={selectedNutrition}
									showValidationErrors={saveStatus === "validation-error"}
									onMealChange={(meal) => {
										setSelectedMeal(meal);
										setSelectedFoods((current) =>
											current.map((food) => ({
												...food,
												mealLabel: meal,
											})),
										);
										setSaveStatus("idle");
										setSaveMessage(null);
									}}
									onRemoveFood={handleSelectedFoodRemove}
									onFoodChange={handleSelectedFoodChange}
								/>
							)}
							{step === "edit" ? (
								<QuickAddSaveFeedback
									status={saveStatus}
									message={saveMessage}
									onRetry={submitFood}
									onReviewSelection={() => setStep("search")}
								/>
							) : null}
						</ScrollArea>
					) : (
						<ScrollArea
							viewportClassName="flex min-h-0 flex-1 flex-col gap-4 pb-2"
							className="flex min-h-0 flex-1"
						>
							{mode === "custom-food" ? (
								<CustomFoodForm
									onSaved={() => {
										setOpen(false);
										startTransition(() => router.refresh());
									}}
								/>
							) : (
                <MealTemplateForm
                  key={`create-meal-${request.nonce}`}
                  mode="create"
                  mealId=""
                  initialName=""
                  initialItems={[]}
                  onSaved={() => {
                    setOpen(false);
                    startTransition(() => router.refresh());
                  }}
								/>
							)}
						</ScrollArea>
					)}

					{isDiaryFoodMode && step === "search" ? (
						<SheetFooter
							className="border-t bg-background/95 pt-3 backdrop-blur supports-[backdrop-filter]:bg-background/80"
							aria-live="polite"
						>
							<div className="flex items-center justify-between gap-3">
								<strong className="text-sm">
									{selectedFoods.length.toLocaleString(
										"fa-IR",
									)}{" "}
									غذا انتخاب شده
								</strong>
								<div className="flex gap-2">
									<Button
										type="button"
										variant="ghost"
										disabled={selectedFoods.length === 0}
										onClick={() => setSelectedFoods([])}
									>
										لغو
									</Button>
									<Button
										type="button"
										disabled={selectedFoods.length === 0}
										onClick={() => setStep("edit")}
									>
										ادامه
									</Button>
								</div>
							</div>
						</SheetFooter>
					) : null}

					{isDiaryFoodMode && step === "edit" ? (
						<SheetFooter>
							<div className="flex items-end justify-between border-t pt-3">
								<div>
									<p className="text-xs text-muted-foreground">
										کالری تخمینی
									</p>
									<strong className="text-xl tabular-nums">
										{toPersianDigits(
											formatQuickAddNumber(
												estimatedCalories,
											),
										)}{" "}
										کالری
									</strong>
								</div>
								<Button
									type="button"
									variant="ghost"
									onClick={() => setStep("search")}
								>
									بازگشت
								</Button>
							</div>
							<div className="grid grid-cols-[auto_1fr] gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => handleOpenChange(false)}
								>
									لغو
								</Button>
								<Button
									type="button"
									size="lg"
									className="h-12 rounded-full text-sm font-bold"
									disabled={isSaving}
									onClick={submitFood}
								>
									{isSaving ? (
										<Spinner data-icon="inline-start" />
									) : null}
									{isSaving ? "در حال ثبت" : "افزودن همه"}
								</Button>
							</div>
						</SheetFooter>
					) : null}
				</SheetContent>
			</Sheet>
      <WeightEntrySheet
        defaultDate={date}
        nextPath={`/dashboard?date=${date}`}
        open={weightEntryOpen}
        onOpenChange={setWeightEntryOpen}
      />
		</>
	);
}
function sheetTitle(mode: QuickAddMode) {
	return {
		food: "افزودن غذا به دفتر روزانه",
		"custom-food": "افزودن غذای سفارشی",
		"custom-meal": "افزودن وعده سفارشی",
	}[mode];
}

function sheetDescription(mode: QuickAddMode) {
	return {
		food: "غذا را جستجو کنید و در وعده انتخاب‌شده دفتر روزانه ثبت کنید.",
		"custom-food":
			"یک غذا با اطلاعات تغذیه‌ای دلخواه بسازید تا در کتابخانه غذای شما ذخیره شود.",
		"custom-meal":
			"برای ذخیره یک ترکیب تکرارشونده از چند غذا در کتابخانه شما.",
	}[mode];
}

function QuickAddSaveFeedback({
	status,
	message,
	onRetry,
	onReviewSelection,
}: {
	status: QuickAddSaveStatus;
	message: string | null;
	onRetry: () => void;
	onReviewSelection?: () => void;
}) {
	if (status === "idle" || status === "saving") return null;

	if (status === "success") {
		return (
			<Alert className="rounded-2xl border-primary/30 bg-primary/10 text-right">
				<CheckCircle2Icon className="text-primary" aria-hidden="true" />
				<AlertTitle>ثبت کامل شد</AlertTitle>
				<AlertDescription>{message}</AlertDescription>
			</Alert>
		);
	}

	const isOffline = status === "offline";
	const isSourceUnavailable = status === "source-unavailable";

	return (
		<Alert variant="destructive" className="rounded-2xl text-right">
			{isOffline ? (
				<WifiOffIcon aria-hidden="true" />
			) : (
				<AlertCircleIcon aria-hidden="true" />
			)}
			<AlertTitle>
				{status === "validation-error"
					? "اطلاعات ناقص است"
					: isOffline
						? "آفلاین هستید"
						: isSourceUnavailable
							? "غذای انتخاب‌شده در دسترس نیست"
							: "خطای backend"}
			</AlertTitle>
			<AlertDescription className="flex flex-col gap-2">
				<span>{message}</span>
				{isSourceUnavailable && onReviewSelection ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-9 w-fit rounded-full"
						onClick={onReviewSelection}
					>
						بازگشت به جستجو
					</Button>
				) : status === "backend-error" ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-9 w-fit rounded-full"
						onClick={onRetry}
					>
						تلاش دوباره
					</Button>
				) : null}
			</AlertDescription>
		</Alert>
	);
}

function QuickAddSearchInput({
	id,
	label,
	value,
	placeholder,
	onChange,
}: {
	id: string;
	label: string;
	value: string;
	placeholder?: string;
	onChange: (value: string) => void;
}) {
	return (
		<FieldGroup className="gap-4">
			<Field>
				<FieldLabel htmlFor={id}>{label}</FieldLabel>
				<div className="relative">
					<SearchIcon
						className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
						aria-hidden="true"
					/>
					<Input
						id={id}
						type="search"
						value={value}
						placeholder={placeholder}
						onChange={(event) =>
							onChange(event.currentTarget.value)
						}
						className="h-12 rounded-2xl bg-input pr-10"
					/>
				</div>
			</Field>
		</FieldGroup>
	);
}

function QuickAddFilters({
	selectedFilter,
	onFilterChange,
}: {
	selectedFilter: QuickAddFoodFilter;
	onFilterChange: (filter: QuickAddFoodFilter) => void;
}) {
	return (
		<div
			className="flex flex-wrap gap-1.5 rounded-2xl border bg-muted/35 p-1"
			aria-label="فیلتر غذا"
			role="group"
		>
			{filters.map((filter) => (
				<Button
					key={filter.value}
					type="button"
					variant="ghost"
					aria-pressed={selectedFilter === filter.value}
					className={cn(
						"h-9 flex-1 rounded-xl px-3 text-xs font-black text-muted-foreground motion-safe:transition-[background-color,color,box-shadow,transform] motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none sm:flex-none",
						selectedFilter === filter.value
							? "bg-primary text-primary-foreground shadow-[0_8px_20px_color-mix(in_oklch,var(--primary)_16%,transparent)]"
							: "hover:bg-background/70 hover:text-foreground active:scale-[0.98]",
					)}
					onClick={() => onFilterChange(filter.value)}
				>
					{filter.label}
				</Button>
			))}
		</div>
	);
}

function BatchQuickAddEditor({
	selectedMeal,
	selectedFoods,
	selectedNutrition,
	showValidationErrors,
	onMealChange,
	onRemoveFood,
	onFoodChange,
}: {
	selectedMeal: string;
	selectedFoods: QuickAddSelectedFood[];
	selectedNutrition: {
		calories: number;
		protein: number;
		carbs: number;
		fat: number;
	};
	showValidationErrors: boolean;
	onMealChange: (meal: string) => void;
	onRemoveFood: (foodId: string) => void;
	onFoodChange: (
		foodId: string,
		change: Partial<
			Pick<QuickAddSelectedFood, "amountInput" | "servingOptionId">
		>,
	) => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<FieldSet className="gap-3 border-b pb-4">
				<FieldLegend className="text-sm">وعده ثبت</FieldLegend>
				<p className="text-xs leading-5 text-muted-foreground">
					این وعده برای همه غذاهای انتخاب‌شده اعمال می‌شود.
				</p>
				<Select
					value={selectedMeal}
					onValueChange={(meal) => {
						if (meal) onMealChange(meal);
					}}
				>
					<SelectTrigger
						aria-label="انتخاب وعده برای غذاهای انتخاب‌شده"
						className="h-11 w-full rounded-2xl bg-input text-sm font-bold"
					>
						<span>{selectedMeal}</span>
					</SelectTrigger>
					<SelectContent align="end">
						<SelectGroup>
							{diaryMealOptions.map((meal) => (
								<SelectItem key={meal.label} value={meal.label}>
									<span>{meal.label}</span>
									<span className="text-muted-foreground">
										{meal.description}
									</span>
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
				<QuickAddNutritionSummary nutrition={selectedNutrition} />
			</FieldSet>
			<div className="divide-y border-y" aria-label="غذاهای انتخاب‌شده">
				{selectedFoods.map((food, index) => (
					<BatchQuickAddRow
						key={food.source.sourceId}
						index={index}
						selectedFood={food}
						error={
							showValidationErrors && !food.amountInput.trim()
								? "مقدار را وارد کنید."
								: undefined
						}
						onChange={onFoodChange}
						onRemove={onRemoveFood}
					/>
				))}
			</div>
			{/*
				Quick plate modes are intentionally disabled for now. Every selected
				food is persisted as its own diary entry, rather than saved as a meal.
			*/}
		</div>
	);
}

function QuickAddNutritionSummary({
	nutrition,
}: {
	nutrition: {
		calories: number;
		protein: number;
		carbs: number;
		fat: number;
	};
}) {
	const items: Array<{
		label: string;
		value: number;
		unit: string;
		kind: MacroNutrientKind | null;
	}> = [
		{label: "کالری", value: nutrition.calories, unit: "کالری", kind: null},
		{label: "پروتئین", value: nutrition.protein, unit: "گرم", kind: "protein"},
		{label: "کربوهیدرات", value: nutrition.carbs, unit: "گرم", kind: "carbs"},
		{label: "چربی", value: nutrition.fat, unit: "گرم", kind: "fat"},
	];

	return (
		<section
			className="grid grid-cols-2 gap-2 sm:grid-cols-4"
			aria-label="خلاصه تغذیه غذاهای انتخاب‌شده"
		>
			{items.map((item) => (
				<div
					key={item.label}
					className="relative flex min-h-16 items-center gap-2 rounded-xl border bg-background/45 p-2.5 pt-3 sm:min-h-24 sm:flex-col sm:items-start sm:justify-between sm:gap-2 sm:rounded-2xl sm:p-3 sm:pt-7"
				>
					<span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted/60 sm:size-9 sm:rounded-xl">
						{item.kind ? (
							<MacroNutrientIcon kind={item.kind} className="size-4 sm:size-5" />
						) : (
							<FlameIcon className="size-4 text-primary sm:size-5" aria-hidden="true" />
						)}
					</span>
					<small className="absolute inset-e-2 top-2 rounded-full bg-muted px-2 py-1 text-[0.65rem] font-semibold leading-none text-muted-foreground sm:inset-e-3 sm:top-3 sm:text-xs">
						{item.label}
					</small>
					<span className="min-w-0 pt-4 sm:pt-0">
						<strong className="text-base font-black leading-none tabular-nums sm:text-lg">
							{toPersianDigits(formatQuickAddNumber(item.value))}
						</strong>
						<small className="mr-1 text-[0.68rem] text-muted-foreground">
							{item.unit}
						</small>
					</span>
				</div>
			))}
		</section>
	);
}

const BatchQuickAddRow = memo(function BatchQuickAddRow({
	index,
	selectedFood,
																													showMealType = true,
	error,
	onChange,
	onRemove,
}: {
	index: number;
	selectedFood: QuickAddSelectedFood;
	showMealType?: boolean;
	error?: string;
	onChange: (
		foodId: string,
		change: Partial<
			Pick<QuickAddSelectedFood, "amountInput" | "servingOptionId" | "mealLabel">
		>,
	) => void;
	onRemove: (foodId: string) => void;
}) {
	const [amountTouched, setAmountTouched] = useState(false);
	const foodId = selectedFood.source.sourceId;
	const servingOptions = quickAddServingOptions(selectedFood.food);
	const option = servingOptions.find(
		(item) => item.id === selectedFood.servingOptionId,
	);
	const amount = parseQuickAddAmount(selectedFood.amountInput).value;
	const preview =
		option && amount !== null
			? quickAddPreviewNutritionFor(selectedFood.food, option, amount)
			: null;
	const amountId = `quick-add-amount-${index}`;
	const unitId = `quick-add-unit-${index}`;
	const mealId = `quick-add-meal-${index}`;
	const amountError =
		error ??
		(amountTouched && !selectedFood.amountInput.trim()
			? "مقدار را وارد کنید."
			: undefined);

	return (
		<div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2 py-3 [contain-intrinsic-size:auto_76px] [content-visibility:auto]">
			<div className="min-w-0">
				<div className="flex items-center justify-between gap-2">
					<strong className="truncate text-sm">
						{selectedFood.food.displayName}
					</strong>
					<span className="shrink-0 text-xs tabular-nums text-muted-foreground">
						{preview
							? `${toPersianDigits(formatQuickAddNumber(preview.calories))} کالری`
							: "—"}
					</span>
				</div>
				<div
					className={cn("mt-2 grid grid-cols-1 gap-2", showMealType ? "min-[480px]:grid-cols-[minmax(4.5rem,0.7fr)_minmax(7rem,1.1fr)_minmax(8rem,1.2fr)]" : "min-[420px]:grid-cols-[minmax(5rem,0.7fr)_minmax(8rem,1.3fr)]")}>
					<div>
						<FieldLabel className="sr-only" htmlFor={amountId}>
							مقدار {selectedFood.food.displayName}
						</FieldLabel>
						<Input
							id={amountId}
							type="text"
							inputMode="decimal"
							dir="ltr"
							aria-invalid={Boolean(amountError)}
							aria-describedby={amountError ? `${amountId}-error` : undefined}
							placeholder="مثلاً ۱"
							className="h-9 rounded-xl text-left tabular-nums"
							value={selectedFood.amountInput}
							onBlur={() => setAmountTouched(true)}
							onChange={(event) => {
								setAmountTouched(true);
								onChange(foodId, {
									amountInput: event.currentTarget.value,
								});
							}}
						/>
					</div>
					{showMealType ? <Field>
						<FieldLabel className="sr-only">
							واحد {selectedFood.food.displayName}
						</FieldLabel>
						<Select
							value={selectedFood.servingOptionId}
							onValueChange={(servingOptionId) => {
								if (servingOptionId)
									onChange(foodId, { servingOptionId });
							}}
						>
							<SelectTrigger
								id={unitId}
								aria-label={`واحد ${selectedFood.food.displayName}`}
								aria-invalid={Boolean(error)}
								className="h-9 w-full rounded-xl text-xs"
							>
								<span>
									{option?.label ?? "واحد را انتخاب کنید"}
								</span>
							</SelectTrigger>
							<SelectContent align="end">
								<SelectGroup>
									{servingOptions.map((servingOption) => (
										<SelectItem
											key={servingOption.id}
											value={servingOption.id}
										>
											<span>{servingOption.label}</span>
											{servingOption.gramEquivalent ? (
												<span className="text-muted-foreground">
													(
													{formatQuickAddNumber(
														servingOption.gramEquivalent,
													)}{" "}
													گرم)
												</span>
											) : null}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</Field> : null}
					<Field>
						<FieldLabel className="sr-only">
							وعده {selectedFood.food.displayName}
						</FieldLabel>
						<Select
							value={selectedFood.mealLabel}
							onValueChange={(mealLabel) => {
								if (mealLabel) onChange(foodId, { mealLabel });
							}}
						>
							<SelectTrigger
								id={mealId}
								aria-label={`وعده ${selectedFood.food.displayName}`}
								className="h-9 w-full rounded-xl text-xs"
							>
								<span>{selectedFood.mealLabel}</span>
							</SelectTrigger>
							<SelectContent align="end">
								<SelectGroup>
									{diaryMealOptions.map((meal) => (
										<SelectItem key={meal.label} value={meal.label}>
											<span>{meal.label}</span>
											<span className="text-muted-foreground">
												{meal.description}
											</span>
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</Field>
				</div>
				<FieldError id={`${amountId}-error`}>{amountError}</FieldError>
			</div>
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				className="mt-5 rounded-full text-muted-foreground hover:text-destructive"
				aria-label={`حذف ${selectedFood.food.displayName}`}
				onClick={() => onRemove(foodId)}
			>
				<Trash2Icon />
			</Button>
		</div>
	);
});

function formatQuickAddNumber(value: number) {
	return Number.isInteger(value)
		? String(value)
		: value.toFixed(2).replace(/\.?0+$/, "");
}

function groupSelectedFoodsByMeal(selectedFoods: QuickAddSelectedFood[]) {
	const grouped = new Map<Exclude<DiaryMealType, "CUSTOM">, QuickAddSelectedFood[]>();

	for (const selectedFood of selectedFoods) {
		const mealType = mealTypeByLabel[selectedFood.mealLabel];
		if (!mealType || mealType === "CUSTOM") continue;
		grouped.set(mealType, [...(grouped.get(mealType) ?? []), selectedFood]);
	}

	return Array.from(grouped.entries());
}

function createQuickAddIntentId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto)
		return crypto.randomUUID();
	return `batch-quick-add-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function searchQuickAddFoods(
	request: FoodSearchRequestDto,
	signal: AbortSignal,
	options: { includeMeals?: boolean } = {},
): Promise<FoodSearchResponseDto> {
	const searchParams = new URLSearchParams();

	if (request.query) searchParams.set("query", request.query);
	if (request.type) searchParams.set("type", request.type);
	if (request.favorite !== undefined)
		searchParams.set("favorite", String(request.favorite));
	if (request.recent !== undefined)
		searchParams.set("recent", String(request.recent));
	if (request.locale) searchParams.set("locale", request.locale);
	searchParams.set("page", String(request.page ?? 0));
	searchParams.set("size", String(request.size ?? searchPageSize));

	const shouldSearchMeals =
		Boolean(options.includeMeals) &&
		!request.recent &&
		!request.favorite &&
		request.type !== "SYSTEM";

	const [foodResponse, mealResponse] = await Promise.all([
		fetch(`/api/foods/search?${searchParams.toString()}`, {
			method: "GET",
			signal,
		}),
		shouldSearchMeals
			? fetch(`/api/meals/search?${searchParams.toString()}`, {
					method: "GET",
					signal,
				})
			: Promise.resolve(null),
	]);

	if (!foodResponse.ok) {
		throw new Error(`Food search failed with status ${foodResponse.status}`);
	}

	if (mealResponse && !mealResponse.ok) {
		throw new Error(`Meal search failed with status ${mealResponse.status}`);
	}

	const foodResult = (await foodResponse.json()) as FoodSearchResponseDto;
	const mealResult = mealResponse
		? ((await mealResponse.json()) as MealListResponseDto)
		: null;
	const mealItems = mealResult?.items.map(mealSummaryToQuickAddItem) ?? [];

	return {
		...foodResult,
		items:
			(request.page ?? 0) === 0
				? [...mealItems, ...foodResult.items]
				: [...foodResult.items, ...mealItems],
		totalItems: foodResult.totalItems + (mealResult?.totalItems ?? 0),
		totalPages: Math.max(foodResult.totalPages, mealResult?.totalPages ?? 0),
	};
}

function mealSummaryToQuickAddItem(meal: MealSummaryDto): QuickAddSearchItem {
  const definition = meal.servingDefinition ?? null;
  // For serving-defined meals the pseudo-food nutrition is one serving, and the
  // posted quantity means "number of servings"; otherwise it stays "whole recipes".
  const nutrition = definition ? definition.perServing : meal;

	return {
		id: meal.id,
		type: "CUSTOM",
		name: meal.name,
		displayName: meal.name,
		locale: "fa",
		servingQuantity: 1,
		servingUnit: {
			id: "meal-serving",
			code: "SERVING",
			label: "وعده",
		},
    portions: definition ? mealServingPortions(definition) : [],
		favorite: false,
		recent: false,
		source: "MEAL",
		dataQuality: "OWNER_MEAL",
		quickAddSourceType: "MEAL",
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    fiber: nutrition.fiber,
    sugar: nutrition.sugar,
    sodium: nutrition.sodium,
	};
}

function mealServingPortions(definition: MealServingDefinitionDto): FoodServingPortionDto[] {
  const servingLabel = `سروینگ (${toPersianDigits(formatQuickAddNumber(definition.servingWeight))} گرم)`;
  const batchLabel = `کل وعده (${toPersianDigits(formatQuickAddNumber(definition.servingsPerBatch))} سروینگ)`;

  return [
    {
      amount: 1,
      unitName: servingLabel,
      displayText: servingLabel,
      gramWeight: definition.servingWeight,
      servingUnitId: "meal-serving",
      servingUnitCode: "SERVING",
    },
    {
      amount: definition.servingsPerBatch,
      unitName: batchLabel,
      displayText: batchLabel,
      gramWeight: definition.totalBatchWeight,
      servingUnitId: "meal-serving",
      servingUnitCode: "SERVING",
    },
  ];
}
