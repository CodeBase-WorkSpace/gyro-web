import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
	ChefHatIcon,
	ClipboardListIcon,
	EyeIcon,
	FlameIcon,
	InfoIcon,
	UtensilsIcon,
} from "lucide-react";

import { AppTopBar } from "@/components/design-system/app-top-bar";
import type { DashboardData } from "@/components/dashboard/dashboard-data";
import { DiaryEntryEditControl } from "@/components/foods/diary-entry-edit-control";
import { DiaryEntryDeleteControl } from "@/components/foods/diary-entry-delete-control";
import { DiaryEntryRepeatControl } from "@/components/foods/diary-entry-repeat-control";
import { DiaryCopyFromDateControl } from "@/components/foods/diary-copy-from-date-control";
import { DiaryCopyToDateControl } from "@/components/foods/diary-copy-to-date-control";
// import { NutritionOverviewCarousel } from "@/components/foods/nutrition-overview-carousel";
// import {
// 	NutritionRangeAreaChart,
// 	type NutritionRangeAreaChartPoint,
// } from "@/components/foods/nutrition-range-area-chart";
import { QuickAddClient } from "@/components/dashboard/quick-add-client";
import {
	MacroNutrient,
	MacroNutrientIcon,
	type MacroNutrientKind,
} from "@/components/foods/macro-nutrient";
import { buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { type FoodSearchItem, searchFoods } from "@/lib/api/foods";
import { listMeals, type MealSummaryDto } from "@/lib/api/meals";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-api";
import { getSession } from "@/lib/auth/session";
import { diaryDateHref, shiftDiaryDate } from "@/lib/diary/date";
import {
	loadDashboardDiary,
	resolveDiaryDate,
} from "@/lib/diary/dashboard-loader";
import { formatPersianNumber, localizedServingUnit } from "@/lib/format";
import { diaryEntryDetailHref } from "@/lib/diary/entry-detail";
// import { formatNutritionRangeChartDate } from "@/lib/progress/nutrition-chart";

export const metadata: Metadata = {
	title: "غذاها | جیرو",
	description: "مدیریت غذاهای سفارشی و مسیرهای ساخت غذا در Gyro",
};

export default async function FoodsPage({
	searchParams,
}: {
	searchParams: Promise<{ date?: string }>;
}) {
	const params = await searchParams;
	const session = await getSession();

	if (!session.isAuthenticated) {
		const nextPath = params.date ? `/foods?date=${params.date}` : "/foods";
		redirect(`/auth/login?next=${encodeURIComponent(nextPath)}&expired=1`);
	}

	const today = resolveDiaryDate(undefined, session.user.timezone);
	const selectedDate = resolveDiaryDate(params.date, session.user.timezone);
	const nextPath = `/foods?date=${selectedDate}`;
	// This page reads one day. It used to fetch the whole surrounding week and
	// then discard six of the seven days: the only use of the result was to find
	// the selected date inside it, and `localWeekDates` always contains its own
	// argument, so the six extra reads could never contribute anything. They
	// were roughly 80% of all diary traffic in production.
	const [customFoods, customMeals, dashboardData] = await Promise.all([
		loadCustomFoods(nextPath),
		loadCustomMeals(nextPath),
		loadDashboardDiary(selectedDate, nextPath),
	]);

	return (
		<main
			id="main-content"
			className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8"
			aria-label="غذاها و دفتر غذایی"
		>
			<AppTopBar
				title="غذاها"
				description="مدیریت غذاها و وعده‌ها"
				dateLabel={dashboardData.day.label}
				dateNavigation={{
					previousHref: diaryDateHref(
						shiftDiaryDate(selectedDate, -1),
						"/foods",
					),
					nextHref: diaryDateHref(
						shiftDiaryDate(selectedDate, 1),
						"/foods",
					),
					todayHref: diaryDateHref(today, "/foods"),
					isToday: selectedDate === today,
				}}
				backLink={{
					href: "/dashboard",
					label: "بازگشت به داشبورد امروز",
				}}
				mobileDatePicker={{
					value: selectedDate,
					today,
					path: "/foods",
				}}
			/>

			<FoodDiary data={dashboardData} />
			<CustomFoodList foods={customFoods} date={dashboardData.day.date} />
			<CustomMealList meals={customMeals} date={dashboardData.day.date} />
		</main>
	);
}

function FoodDiary({ data }: { data: DashboardData }) {
	const visibleMeals = data.meals.filter((meal) => meal.title !== "سفارشی");
	const entryCount = visibleMeals.reduce(
		(total, meal) => total + meal.entries.length,
		0,
	);

	return (
		<Card id="food-diary" className="rounded-3xl border bg-card shadow-sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg font-semibold">
					<ClipboardListIcon
						className="size-5 text-primary"
						aria-hidden="true"
					/>
					دفتر غذایی
				</CardTitle>
				<CardDescription className="leading-7">
					همه ثبت‌های {data.day.label}
				</CardDescription>
				<CardAction
					className="flex flex-row items-center gap-2"
					dir="rtl"
				>
					<DiaryCopyFromDateControl
						targetDate={data.day.date}
						disabled={!data.day.canWriteDiary}
						label="کپی از تاریخ دیگر به این روز"
						size="lg"
						buttonClassName="h-10 rounded-full px-3 text-sm max-sm:h-10"
						labelClassName="max-sm:sr-only"
					/>
					<DiaryCopyToDateControl
						sourceDate={data.day.date}
						disabled={entryCount === 0 || !data.day.canWriteDiary}
					/>
					<QuickAddClient
						surface="responsive"
						trigger="food"
						date={data.day.date}
						canWriteDiary={data.day.canWriteDiary}
					/>
				</CardAction>
			</CardHeader>
			<CardContent className="grid gap-3 md:grid-cols-2">
				<DiaryNutritionStatus data={data} />
				{entryCount === 0 ? (
					<Empty className="min-h-40 md:col-span-2">
						<EmptyHeader>
							<EmptyTitle>
								این روز هنوز ثبت غذایی ندارد
							</EmptyTitle>
							<EmptyDescription>
								اولین غذا را اضافه کنید تا جمع ارزش غذایی این
								روز محاسبه شود.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				) : (
					visibleMeals.map((meal) => (
						<section
							key={meal.title}
							className="rounded-2xl border bg-muted/25 p-4"
							aria-label={meal.title}
						>
							<div className="mb-3 flex items-center justify-between gap-3">
								<strong>{meal.title}</strong>
								<span className="text-xs font-bold text-muted-foreground">
									{meal.target}
								</span>
							</div>
							<div className="flex flex-col gap-2">
								{meal.entries.map((entry) => {
									const detailHref = diaryEntryDetailHref(
										entry.entry,
									);

									return (
										<div
											key={entry.id}
											className="grid gap-2 rounded-xl bg-background/55 px-3 py-2.5"
										>
											<span className="flex shrink-0 items-center justify-end gap-1">
												<strong className="text-sm tabular-nums">
													{formatPersianNumber(
														entry.calories,
													)}{" "}
													<small className="text-xs text-muted-foreground">
														کالری
													</small>
												</strong>
												{detailHref ? (
													<Link
														href={detailHref}
														className={buttonVariants(
															{
																variant:
																	"ghost",
																size: "icon-sm",
															},
														)}
														aria-label={`مشاهده جزئیات ${entry.name}`}
														title="مشاهده جزئیات"
													>
														<EyeIcon />
													</Link>
												) : null}
												<DiaryEntryEditControl
													date={data.day.date}
													entry={entry.entry}
													disabled={
														!data.day.canWriteDiary
													}
												/>
												<DiaryEntryDeleteControl
													date={data.day.date}
													dateLabel={data.day.label}
													entry={entry.entry}
													disabled={
														!data.day.canWriteDiary
													}
												/>
												<DiaryEntryRepeatControl
													date={data.day.date}
													entry={entry.entry}
													disabled={
														!data.day.canWriteDiary
													}
												/>
											</span>

											{detailHref ? (
												<Link
													href={detailHref}
													className="min-w-0 rounded-md outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
												>
													<strong className="block text-sm">
														{entry.name}
													</strong>
													<small className="block text-xs leading-5 text-muted-foreground">
														{entry.detail}
													</small>
												</Link>
											) : (
												<span className="min-w-0">
													<strong className="block text-sm">
														{entry.name}
													</strong>
													<small className="block text-xs leading-5 text-muted-foreground">
														{entry.detail}
													</small>
												</span>
											)}
										</div>
									);
								})}
							</div>
						</section>
					))
				)}
			</CardContent>
		</Card>
	);
}

function DiaryNutritionStatus({ data }: { data: DashboardData }) {
	const items: Array<{
		label: string;
		value: number;
		target: number | null;
		unit: string;
		kind: MacroNutrientKind | null;
	}> = [
		{
			label: "کالری",
			value: data.day.consumedCalories,
			target: data.day.targetCalories,
			unit: "کالری",
			kind: null,
		},
		...data.macros.map((macro) => ({
			label: macro.label,
			value: macro.consumed,
			target: macro.target,
			unit: macro.unit,
			kind: macro.tone,
		})),
	];

	return (
		<section
			className="grid grid-cols-2 gap-2 md:col-span-2 sm:grid-cols-4"
			aria-label="خلاصه کالری و درشت‌مغذی‌های امروز"
		>
			{items.map((item) => (
				<div
					key={item.label}
					className="relative flex min-h-16 items-center gap-2 rounded-xl border bg-background/45 p-2.5 pt-3 sm:min-h-24 sm:flex-col sm:items-start sm:justify-between sm:gap-2 sm:rounded-2xl sm:p-3 sm:pt-7"
				>
					<span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted/60 sm:size-9 sm:rounded-xl">
						{item.kind ? (
							<MacroNutrientIcon
								kind={item.kind}
								className="size-4 sm:size-5"
							/>
						) : (
							<FlameIcon
								className="size-4 text-primary sm:size-5"
								aria-hidden="true"
							/>
						)}
					</span>
					<small className="hidden absolute inset-e-2 top-2 rounded-full bg-muted px-2 py-1 text-[0.65rem] font-semibold leading-none text-muted-foreground sm:inset-e-3 sm:top-3 sm:text-xs sm:block">
						{item.label}
					</small>
					<span className="min-w-0">
						<span className="mt-0.5 flex flex-wrap items-baseline gap-x-1 tabular-nums">
							<strong className="text-base font-black leading-none sm:text-lg">
								{formatPersianNumber(item.value)}
							</strong>
						</span>
						<small className="text-[0.68rem] text-muted-foreground">
							{` ${item.unit} `}
						</small>
						{data.day.hasConfiguredGoal && item.target != null ? (
							<small className="mt-1 text-[0.68rem] text-muted-foreground">
								از {formatPersianNumber(item.target)}
							</small>
						) : null}
					</span>
				</div>
			))}
		</section>
	);
}

async function loadCustomFoods(nextPath: string) {
	const response = await authenticatedServerRequest(
		(accessToken) =>
			searchFoods({ type: "CUSTOM", page: 0, size: 5 }, accessToken),
		{ nextPath, retryPolicy: "idempotent" },
	);
	return response.items;
}

async function loadCustomMeals(nextPath: string) {
	const response = await authenticatedServerRequest(
		(accessToken) => listMeals({ page: 0, size: 5 }, accessToken),
		{ nextPath, retryPolicy: "idempotent" },
	);
	return response.items;
}

function CustomMealList({
	meals,
	date,
}: {
	meals: MealSummaryDto[];
	date: string;
}) {
	return (
		<Card className="rounded-3xl border bg-card shadow-sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg font-semibold">
					<ChefHatIcon
						className="size-5 text-primary"
						aria-hidden="true"
					/>
					وعده‌های سفارشی شما
				</CardTitle>
				<CardDescription className="leading-7">
					ترکیب‌های ذخیره‌شده برای استفاده دوباره، بدون ثبت خودکار در
					دفتر غذایی.
				</CardDescription>
				<CardAction className="flex items-center gap-2" dir="rtl">
					<QuickAddClient
						surface="responsive"
						trigger="custom-meal"
						date={date}
					/>
				</CardAction>
			</CardHeader>
			<CardContent>
				{meals.length ? (
					<div className="grid gap-3 sm:grid-cols-2">
						{meals.slice(0, 5).map((meal) => (
							<LibraryItemCard
								key={meal.id}
								name={meal.name}
								description={`${meal.itemCount.toLocaleString("fa-IR")} جزء`}
								calories={meal.calories}
								protein={meal.protein}
								carbs={meal.carbs}
								fat={meal.fat}
								detailHref={`/foods/meals/${encodeURIComponent(meal.id)}`}
							/>
						))}
					</div>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>هنوز وعده سفارشی ندارید</EmptyTitle>
							<EmptyDescription>
								از دکمه ساخت وعده سفارشی در همین کارت شروع کنید.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
				<Link
					href="/foods/meals"
					className={buttonVariants({
						variant: "outline",
						size: "lg",
						className: "mt-4 w-full rounded-full",
					})}
				>
					<EyeIcon data-icon="inline-start" />
					دیدن همه وعده‌های سفارشی
				</Link>
			</CardContent>
		</Card>
	);
}

function CustomFoodList({
	foods,
	date,
}: {
	foods: FoodSearchItem[];
	date: string;
}) {
	return (
		<Card
			id="custom-foods"
			className="rounded-3xl border bg-card shadow-sm"
		>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg font-semibold">
					<UtensilsIcon
						className="size-5 text-primary"
						aria-hidden="true"
					/>
					غذاهای سفارشی شما
				</CardTitle>
				<CardDescription className="leading-7">
					برای دیدن ارزش غذایی، سروینگ‌ها و اقدام‌های مالک، وارد
					جزئیات غذا شوید.
				</CardDescription>
				<CardAction className="flex items-center gap-2" dir="rtl">
					<QuickAddClient
						surface="responsive"
						trigger="custom-food"
						date={date}
					/>
				</CardAction>
			</CardHeader>
			<CardContent>
				{foods.length ? (
					<div className="grid gap-3 sm:grid-cols-2">
						{foods.slice(0, 5).map((food) => (
							<LibraryItemCard
								key={food.id}
								name={food.displayName}
								description={`${food.servingQuantity.toLocaleString("fa-IR")} ${localizedServingUnit(food.servingUnit.code, food.servingUnit.label)}`}
								calories={food.calories}
								protein={food.protein}
								carbs={food.carbs}
								fat={food.fat}
								detailHref={`/foods/${encodeURIComponent(food.id)}`}
							/>
						))}
					</div>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>هنوز غذای سفارشی ندارید</EmptyTitle>
							<EmptyDescription>
								از دکمه ساخت غذای سفارشی در همین کارت شروع کنید.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
				<Link
					href="/foods/custom"
					className={buttonVariants({
						variant: "outline",
						size: "lg",
						className: "mt-4 w-full rounded-full",
					})}
				>
					<EyeIcon data-icon="inline-start" />
					دیدن همه غذاهای سفارشی
				</Link>
			</CardContent>
		</Card>
	);
}

function LibraryItemCard({
	name,
	description,
	calories,
	protein,
	carbs,
	fat,
	detailHref,
}: {
	name: string;
	description: string;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	detailHref: string;
}) {
	return (
		<Card size="sm" className="border bg-muted/25 shadow-none">
			<CardHeader>
				<CardTitle className="truncate">{name}</CardTitle>
				<CardDescription>{description}</CardDescription>
				<CardAction>
					<strong className="text-sm tabular-nums">
						{calories.toLocaleString("fa-IR")} کالری
					</strong>
				</CardAction>
			</CardHeader>
			<CardContent className="flex items-end justify-between gap-3">
				<div className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground max-sm:text-[0.675rem]">
					<MacroNutrient
						kind="protein"
						value={protein.toLocaleString("fa-IR")}
					/>
					<MacroNutrient
						kind="carbs"
						value={carbs.toLocaleString("fa-IR")}
					/>
					<MacroNutrient
						kind="fat"
						value={fat.toLocaleString("fa-IR")}
					/>
				</div>
				<Link
					href={detailHref}
					className={buttonVariants({
						variant: "outline",
						size: "sm",
					})}
				>
					<InfoIcon
						className="hidden max-sm:block"
						aria-hidden="true"
					/>
					<span className="max-sm:sr-only">جزئیات</span>
				</Link>
			</CardContent>
		</Card>
	);
}
