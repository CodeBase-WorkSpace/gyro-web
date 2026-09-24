import {
	ActivityIcon,
	BeefIcon,
	BookOpenCheckIcon,
	ClipboardPenLineIcon,
	CrownIcon,
	Droplets,
	FlameIcon,
	GrapeIcon,
	type LucideIcon,
	TrendingDownIcon,
} from "lucide-react";
import {type ReactNode, Suspense} from "react";
import Link from "next/link";

import {AppTopBar} from "@/components/design-system/app-top-bar";
import type {DashboardData} from "@/components/dashboard/dashboard-data";
import {InteractiveLineChart} from "@/components/dashboard/interactive-line-chart";
import {NutritionRingTooltipGrid} from "@/components/dashboard/nutrition-ring-tooltip-grid";
import {NutritionRingChart} from "@/components/dashboard/nutrition-ring-chart";
import {NutritionRingStage} from "@/components/dashboard/nutrition-ring-stage";
import {QuickAddClient} from "@/components/dashboard/quick-add-client";
import {PwaUpdateButton} from "@/components/pwa/pwa-update-button";
import {TodayNutritionCarousel} from "@/components/dashboard/today-nutrition-carousel";
import {DiaryCopyFromDateControl} from "@/components/foods/diary-copy-from-date-control";
import {AdvancedPlanBadge} from "@/components/subscription/advanced-plan-badge";
import {RecalibrationCard} from "@/components/dashboard/recalibration-card";
import {NutritionCoachCard} from "@/components/dashboard/nutrition-coach-card";
import {getNutritionCoachPresentation} from "@/lib/nutrition-coach/presentation";
import {shouldShowCalculatorRerunPrompt} from "@/lib/nutrition-coach/calculator-rerun";
import type {NutritionCoachState} from "@/lib/api/nutrition-coach";
import type {RecalibrationSuggestionDto} from "@/lib/api/recalibration";
import {DashboardPromptCoordinator} from "@/components/onboarding/dashboard-prompt-coordinator";
import {SectionErrorBoundary} from "@/components/feedback/section-error-boundary";
import {WeightNudge} from "@/components/progress/weight-nudge";
import {shouldShowWeightNudge} from "@/lib/progress/weight-staleness";
import {TrialBanner} from "@/components/subscription/trial-banner";
import {Avatar, AvatarBadge, AvatarFallback} from "@/components/ui/avatar";
import {buttonVariants} from "@/components/ui/button";
import {Skeleton} from "@/components/ui/skeleton";
import {Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card";
import type {
	NutritionProgressPoint,
	NutritionProgressResponseDto,
	WeeklyProgressResponseDto,
	WeightProgressResponseDto,
} from "@/lib/api/progress";
import type {Session} from "@/lib/auth/types";
import {diaryDateHref, shiftDiaryDate} from "@/lib/diary/date";
import {formatPersianNumber, toPersianDigits} from "@/lib/format";
import {assessNutritionRange} from "@/lib/nutrition/ring-status";
import {isDashboardLoggedDay} from "@/lib/progress/dashboard";
import {canUseEntitlement, type SubscriptionState,} from "@/lib/subscription/entitlements";
import {cn} from "@/lib/utils";

type DashboardProgressData = {
	weekly: WeeklyProgressResponseDto;
	nutritionWeek: NutritionProgressResponseDto;
	weightMonth: WeightProgressResponseDto;
};

export function GyroDashboard({
	session,
	data,
	progressPromise,
	date,
	today,
	subscription,
	recalibration = null,
	nutritionCoach = null,
	recentSignup = false,
	notificationEducationEnabled = false,
	hasEnabledReminderPromise,
}: {
	session: Session;
	data: DashboardData;
	progressPromise: Promise<DashboardProgressData>;
	date: string;
	today: string;
	subscription: SubscriptionState;
	recalibration?: RecalibrationSuggestionDto | null;
	nutritionCoach?: NutritionCoachState | null;
	recentSignup?: boolean;
	notificationEducationEnabled?: boolean;
	hasEnabledReminderPromise: Promise<boolean>;
}) {
	const entryCount = data.meals.reduce(
		(count, meal) => count + meal.entries.length,
		0,
	);
	// Recomputed here rather than lifted out of the card: the card is a server
	// component and cannot report upward, and the presentation function is pure.
	const coachPriority = nutritionCoach
		? (getNutritionCoachPresentation(nutritionCoach)?.priority ?? false)
		: false;

	return (
		<>
			{/* Renders nothing until it picks a prompt, so it can wait on the
			    deferred data without a fallback — and onboarding nudges are
			    never worth failing the dashboard over. */}
			<SectionErrorBoundary label="dashboard_prompts" fallback={null}>
				<Suspense fallback={null}>
					<DashboardPrompts
						userId={session.user.id}
						hasActiveGoal={data.day.hasConfiguredGoal}
						entryCount={entryCount}
						progressPromise={progressPromise}
						hasEnabledReminderPromise={hasEnabledReminderPromise}
						notificationEducationEnabled={notificationEducationEnabled}
						recentSignup={recentSignup}
					/>
				</Suspense>
			</SectionErrorBoundary>
			<div className="mx-auto flex w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-8">
				<main
					id="main-content"
					className="flex min-w-0 flex-1 flex-col gap-6"
					aria-label="داشبورد روزانه"
				>
					<DashboardHeader
						data={data}
						displayName={session.user.displayName}
						date={date}
						today={today}
						subscription={subscription}
						quickAddControl={
							<QuickAddClient
								surface="desktop"
								date={date}
								canWriteDiary={data.day.canWriteDiary}
								coachTarget="quick-add"
							/>
						}
					/>

					{!nutritionCoach && recalibration ? (
						<RecalibrationCard suggestion={recalibration} />
					) : null}
					<TrialBanner subscription={subscription} />

					<DashboardCommandCenter
						data={data}
						progressPromise={progressPromise}
						viewedDate={date}
						today={today}
						coachPriority={coachPriority}
						coachCard={
							nutritionCoach ? (
								<NutritionCoachCard
									coach={nutritionCoach}
									date={date}
									timeZone={session.user.timezone}
									hasConfiguredGoal={
										data.day.hasConfiguredGoal
									}
									canWriteDiary={data.day.canWriteDiary}
									showCalculatorRerunPrompt={
										shouldShowCalculatorRerunPrompt(
											nutritionCoach.mode,
											session.user.calculatorRerunPromptAcknowledgedAt,
											nutritionCoach.calculatorProvenanceComplete,
										)
									}
								/>
							) : null
						}
					/>
				</main>
			</div>
			<QuickAddClient
				surface="mobile"
				date={date}
				canWriteDiary={data.day.canWriteDiary}
				coachTarget="quick-add"
			/>
			<PwaUpdateButton surface="mobile" />
		</>
	);
}

function DashboardHeader({
	data,
	displayName,
	date,
	today,
	subscription,
	quickAddControl,
}: {
	data: DashboardData;
	displayName?: string | null;
	date: string;
	today: string;
	subscription: SubscriptionState;
	quickAddControl: ReactNode;
}) {
	// const greetingName = displayName?.trim() || "دوست جیرو";
	const initials = (displayName?.trim()?.[0] ?? "?").toUpperCase();
	const isBypassed = subscription.premiumGatingDisabled === true;
	const isAdvanced =
		isBypassed || canUseEntitlement(subscription, "premium_schedules");

	return (
		<AppTopBar
			title={"داشبورد"}
			description={""}
			dateLabel={data.day.label}
			dateNavigation={{
				previousHref: diaryDateHref(
					shiftDiaryDate(date, -1),
					"/dashboard",
				),
				nextHref: diaryDateHref(shiftDiaryDate(date, 1), "/dashboard"),
				todayHref: diaryDateHref(today, "/dashboard"),
				isToday: date === today,
			}}
			mobileDatePicker={{
				value: date,
				today,
				path: "/dashboard",
			}}
			quickAddControl={quickAddControl}
			planBadge={
				isAdvanced ? null : (
					<Link
						href="/profile/billing"
						className="inline-flex transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
					>
						<AdvancedPlanBadge label="ارتقا" compact />
					</Link>
				)
			}
			leadingAvatar={
				<Link
					href={isAdvanced ? "/profile" : "/profile/billing"}
					className="relative shrink-0"
					aria-label={
						isAdvanced
							? "اشتراک پیشرفته فعال است"
							: "ارتقا به طرح پیشرفته"
					}
				>
					<Avatar
						size="lg"
						className={
							isAdvanced
								? "ring-2 ring-border"
								: "ring-2 ring-amber-500/35"
						}
					>
						<AvatarFallback
							className={
								isAdvanced
									? "bg-primary/10 font-black text-primary"
									: "bg-amber-500/10 font-black text-amber-600 dark:text-amber-500"
							}
						>
							{initials}
						</AvatarFallback>
					</Avatar>
					{isAdvanced ? (
						<AvatarBadge className="bg-primary" />
					) : (
						<AvatarBadge className="bg-amber-500 text-amber-50">
							<CrownIcon className="size-2" />
						</AvatarBadge>
					)}
				</Link>
			}
		/>
	);
}

function DashboardCommandCenter({
	data,
	progressPromise,
	viewedDate,
	today,
	coachCard,
	coachPriority,
}: {
	data: DashboardData;
	progressPromise: Promise<DashboardProgressData>;
	viewedDate: string;
	today: string;
	coachCard: ReactNode;
	coachPriority: boolean;
}) {
	return (
		<div className="grid gap-4" aria-label="نمای کلی تغذیه و هدف">
			<TodayNutritionOverview
				data={data}
				coachCard={coachCard}
				coachPriority={coachPriority}
			/>
			<section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
				<FoodDiarySummaryCard data={data} />
				{/* The two progress cards are the only part of the dashboard
				    that needs the three progress calls, so they stream in
				    while today's diary is already on screen. The error
				    boundary keeps a failed progress read from discarding the
				    diary the user came for. */}
				<SectionErrorBoundary
					label="dashboard_progress"
					fallback={<ProgressCardsUnavailable />}
				>
					<Suspense fallback={<ProgressCardsFallback />}>
						<DashboardProgressCards
							progressPromise={progressPromise}
							viewedDate={viewedDate}
							today={today}
							hasConfiguredGoal={data.day.hasConfiguredGoal}
						/>
					</Suspense>
				</SectionErrorBoundary>
			</section>
		</div>
	);
}

async function DashboardProgressCards({
	progressPromise,
	viewedDate,
	today,
	hasConfiguredGoal,
}: {
	progressPromise: Promise<DashboardProgressData>;
	viewedDate: string;
	today: string;
	hasConfiguredGoal: boolean;
}) {
	const progress = await progressPromise;

	return (
		<>
			<WeeklyProgressCard
				weekly={progress.weekly}
				nutritionWeek={progress.nutritionWeek}
			/>
			<WeightProgressCard
				weekly={progress.weekly}
				month={progress.weightMonth}
				viewedDate={viewedDate}
				today={today}
				hasConfiguredGoal={hasConfiguredGoal}
			/>
		</>
	);
}

function ProgressCardsFallback() {
	return (
		<>
			<Skeleton className="h-96 rounded-2xl" />
			<Skeleton className="h-96 rounded-2xl" />
		</>
	);
}

function ProgressCardsUnavailable() {
	return (
		<Card className="rounded-2xl border bg-card/80 shadow-sm xl:col-span-2">
			<CardHeader>
				<CardTitle className="text-base font-semibold">
					نمودارهای پیشرفت بارگذاری نشد
				</CardTitle>
				<CardDescription>
					ثبت‌های امروز شما سالم است. برای دیدن روند هفته و وزن، صفحه را
					دوباره باز کنید.
				</CardDescription>
			</CardHeader>
		</Card>
	);
}

async function DashboardPrompts({
	progressPromise,
	hasEnabledReminderPromise,
	...props
}: {
	userId: string;
	hasActiveGoal: boolean;
	entryCount: number;
	progressPromise: Promise<DashboardProgressData>;
	hasEnabledReminderPromise: Promise<boolean>;
	notificationEducationEnabled: boolean;
	recentSignup: boolean;
}) {
	const [progress, hasEnabledReminder] = await Promise.all([
		progressPromise,
		hasEnabledReminderPromise,
	]);

	return (
		<DashboardPromptCoordinator
			{...props}
			loggedDayCount={progress.weekly.nutrition.loggedDayCount}
			hasEnabledReminder={hasEnabledReminder}
		/>
	);
}

function TodayNutritionOverview({
	data,
	coachCard,
	coachPriority,
}: {
	data: DashboardData;
	coachCard: ReactNode;
	coachPriority: boolean;
}) {
	const summaryCard = (
		<DailyNutritionSummaryCard
			data={data}
			showGoalCta={!data.day.hasConfiguredGoal}
		/>
	);
	const ringsCard = <NutritionRingsCard data={data}/>;
	const coachCards = coachCard
		? [{ key: "coach", content: coachCard }]
		: [];
	const cards = data.day.hasConfiguredGoal
		? [
				{ key: "rings", content: ringsCard },
				...coachCards,
				{ key: "summary", content: summaryCard },
			]
		: [
				{ key: "summary", content: summaryCard },
				...coachCards,
				{ key: "rings", content: ringsCard },
			];

	// The carousel shows one card at a time, so a coach state that is asking for a
	// decision leads. The desktop grid keeps its stable column order — nothing is
	// hidden there, and shuffling columns between page loads is its own problem.
	const carouselCards = coachPriority
		? [
				...cards.filter((card) => card.key === "coach"),
				...cards.filter((card) => card.key !== "coach"),
			]
		: cards;

	return (
		<section aria-label="نمای تغذیه امروز">
			<div
				className={cn(
					"hidden gap-4 xl:grid xl:items-start",
					coachCard ? "xl:grid-cols-3" : "xl:grid-cols-2",
				)}
			>
				{cards.map(({ key, content }) => (
					<div key={key} className="min-w-0">
						{content}
					</div>
				))}
			</div>
			<TodayNutritionCarousel>
				{carouselCards.map(({ content }) => content)}
			</TodayNutritionCarousel>
		</section>
	);
}

function DailyNutritionSummaryCard({
	data,
	className,
	showGoalCta = false,
}: {
	data: DashboardData;
	className?: string;
	showGoalCta?: boolean;
}) {
	const totals = data.macros.reduce(
		(summary, macro) => ({ ...summary, [macro.tone]: macro.consumed }),
		{} as Record<"protein" | "carbs" | "fat", number>,
	);
	const caloriesDelta = data.day.targetCalories
		? Math.round(data.day.consumedCalories - data.day.targetCalories)
		: null;
	const metricItems = [
		{
			label: "کالری",
			value: data.day.consumedCalories,
			unit: "کالری",
			icon: FlameIcon,
			toneClass:
				"border-nutrient-calories/25 bg-nutrient-calories/10 text-nutrient-calories",
			accentClass: "bg-nutrient-calories",
		},
		{
			label: "پروتئین",
			value: totals.protein ?? 0,
			unit: "گرم",
			icon: BeefIcon,
			toneClass:
				"border-nutrient-protein/25 bg-nutrient-protein/10 text-nutrient-protein",
			accentClass: "bg-nutrient-protein",
		},
		{
			label: "کربوهیدرات",
			value: totals.carbs ?? 0,
			unit: "گرم",
			icon: GrapeIcon,
			toneClass:
				"border-nutrient-carbs/25 bg-nutrient-carbs/10 text-nutrient-carbs",
			accentClass: "bg-nutrient-carbs",
		},
		{
			label: "چربی",
			value: totals.fat ?? 0,
			unit: "گرم",
			icon: Droplets,
			toneClass:
				"border-nutrient-fat/25 bg-nutrient-fat/10 text-nutrient-fat",
			accentClass: "bg-nutrient-fat",
		},
	] satisfies Array<{
		label: string;
		value: number;
		unit: string;
		icon: LucideIcon;
		toneClass: string;
		accentClass: string;
	}>;

	return (
		<Card
			className={cn(
				"flex h-full min-h-128 flex-col overflow-hidden rounded-2xl border bg-card/90 shadow-sm",
				className,
			)}
		>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-sm font-semibold">
					<ActivityIcon
						className="size-4 text-primary"
						aria-hidden="true"
					/>
					خلاصه امروز
				</CardTitle>
				{showGoalCta ? (
					<CardAction>
						<Link
							href="/progress/goals"
							className={buttonVariants({
								variant: "outline",
								size: "lg",
								className:
									"h-10 rounded-full px-4 text-sm font-black",
							})}
						>
							دریافت برنامه من
						</Link>
					</CardAction>
				) : null}
			</CardHeader>
			<CardContent className="grid flex-1 grid-rows-[1fr_auto] gap-3">
				<div className="grid grid-cols-2 gap-3">
					{metricItems.map((item) => {
						const Icon = item.icon;
						return (
							<div
								key={item.label}
								className={cn(
									"relative grid min-h-32 content-between overflow-hidden rounded-xl border px-4 py-4",
									item.toneClass,
								)}
							>
								<span
									className={cn(
										"absolute inset-s-4 top-0 h-0.5 w-7 rounded-full",
										item.accentClass,
									)}
									aria-hidden="true"
								/>
								<div className="mb-4 flex items-center justify-between gap-2">
									<Icon
										className="size-5"
										aria-hidden="true"
									/>
									<span className="text-[1.1rem] font-bold leading-4 text-current/80">
										{item.unit}
									</span>
								</div>
								<strong className="text-3xl font-black leading-none tabular-nums tracking-normal">
									{toPersianDigits(
										formatMetricValue(item.value),
									)}
								</strong>
								<span className="mt-3 text-[1.1rem] font-bold leading-5">
									{item.label}
								</span>
							</div>
						);
					})}
				</div>
				<div className="rounded-xl border bg-background/45 px-3 py-2 text-center text-xs font-bold leading-5 text-muted-foreground">
					{caloriesDelta === null ? (
						<span>
							هدف روزانه تنظیم نشده؛{" "}
							{formatPersianNumber(data.day.consumedCalories)}{" "}
							کالری ثبت شده است.
						</span>
					) : caloriesDelta <= 0 ? (
						<span>
							<span className="text-primary">
								▲ {toPersianDigits(Math.abs(caloriesDelta))}
							</span>{" "}
							کالری تا سقف هدف امروز باقی مانده است.
						</span>
					) : (
						<span>
							<span className="text-destructive">
								▲ {toPersianDigits(caloriesDelta)}
							</span>{" "}
							کالری بیشتر از هدف امروز ثبت شده است.
						</span>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function FoodDiarySummaryCard({ data }: { data: DashboardData }) {
	const entries = data.meals.flatMap((meal) => meal.entries);
	const visibleMeals = data.meals.filter((meal) => meal.title !== "سفارشی");

	return (
		<Card className="rounded-2xl border bg-card/80 shadow-sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base font-semibold">
					<BookOpenCheckIcon
						className="size-4 text-primary"
						aria-hidden="true"
					/>
					دفتر غذایی امروز
				</CardTitle>
				<CardDescription>
					پیش‌نمایش {toPersianDigits(entries.length)} ثبت در{" "}
					{toPersianDigits(visibleMeals.length)} وعده
				</CardDescription>
				<CardAction>
					<Link
						href={`/foods?date=${data.day.date}#food-diary`}
						className={buttonVariants({
							variant: "default",
							size: "sm",
						})}
					>
						<ClipboardPenLineIcon data-icon="inline-start" />
						ویرایش دفتر
					</Link>
				</CardAction>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{entries.length === 0 ? (
					<div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-3 py-4 text-center text-sm text-muted-foreground">
						<p>
							برای این روز هنوز غذایی ثبت نشده است؛ از جستجوی
							غذاها یا افزودن سریع شروع کن.
						</p>
						<Link
							href={`/foods?date=${data.day.date}`}
							className={buttonVariants({
								variant: "outline",
								size: "sm",
							})}
						>
							ثبت اولین وعده
						</Link>
					</div>
				) : null}
				{visibleMeals.map((meal) => (
					<div
						key={meal.title}
						className="flex items-center justify-between gap-3 rounded-xl border bg-background/45 px-3 py-2.5"
					>
						<span className="min-w-0">
							<strong className="block text-sm">
								{meal.title}
							</strong>
							<small className="block truncate text-xs text-muted-foreground">
								{meal.entries.length
									? meal.entries
											.map((entry) => entry.name)
											.join("، ")
									: "بدون ثبت"}
							</small>
						</span>
						<strong className="shrink-0 text-sm tabular-nums">
							{formatPersianNumber(
								meal.entries.reduce(
									(total, entry) => total + entry.calories,
									0,
								),
							)}
							<small className="mr-1 text-xs text-muted-foreground">
								کالری
							</small>
						</strong>
					</div>
				))}
				<div className="mt-1 grid gap-2 sm:grid-cols-2">
					<QuickAddClient
						surface="responsive"
						trigger="food-card"
						date={data.day.date}
						triggerSize="lg"
						triggerClassName="h-9 rounded-xl"
					/>
					<DiaryCopyFromDateControl
						targetDate={data.day.date}
						size="lg"
						buttonClassName="h-9 rounded-xl"
						label="کپی از تاریخ دیگر به این روز"
						labelClassName=""
					/>
				</div>
			</CardContent>
		</Card>
	);
}

function NutritionRingsCard({data}: { data: DashboardData }) {
	const macros = data.macros;
	const calorieAssessment = assessNutritionRange(
		"calories",
		data.day.consumedCalories,
		data.day.targetCalories,
	);
	const rings = [
		{
			label: "کالری",
			consumed: data.day.consumedCalories,
			target: data.day.targetCalories,
			unit: "کالری",
			progress: calorieAssessment.chartProgress,
			percentage: calorieAssessment.percentage,
			status: calorieAssessment.status,
			distance: calorieAssessment.distance,
			rangeStart: calorieAssessment.rangeStart,
			rangeEnd: calorieAssessment.rangeEnd,
			targetRangeStart: calorieAssessment.rangeStart,
			stroke: "stroke-primary",
			dot: "bg-primary",
			radius: 105,
		},
		...macros.map((macro, index) => {
			const assessment = assessNutritionRange(
				macro.tone,
				macro.consumed,
				macro.target,
			);

			return {
				label: macro.label,
				consumed: macro.consumed,
				target: macro.target,
				unit: macro.unit,
				progress: assessment.chartProgress,
				percentage: assessment.percentage,
				status: assessment.status,
				distance: assessment.distance,
				rangeStart: assessment.rangeStart,
				rangeEnd: assessment.rangeEnd,
				targetRangeStart: assessment.rangeStart,
				stroke: [
					"stroke-nutrient-protein",
					"stroke-nutrient-carbs",
					"stroke-nutrient-fat",
				][index],
				dot: [
					"bg-nutrient-protein",
					"bg-nutrient-carbs",
					"bg-nutrient-fat",
				][index],
				radius: [90, 75, 60][index],
			};
		}),
	];

	return (
		<Card className="flex h-full min-h-128 flex-col rounded-2xl border bg-card/80 shadow-sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base font-semibold">
					<FlameIcon
						className="size-4 text-primary"
						aria-hidden="true"
					/>
					هدف امروز
				</CardTitle>
				<CardDescription>
					کالری، پروتئین، کربوهیدرات و چربی نسبت به هدف روزانه
				</CardDescription>
				<CardAction>
					<Link
						href="/progress/goals"
						className={buttonVariants({
							variant: "outline",
							size: "sm",
						})}
					>
						مدیریت هدف
					</Link>
				</CardAction>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col items-center justify-between gap-4">
				<NutritionRingStage
					className="relative grid size-64 place-items-center sm:size-72"
					ariaLabel={`پیشرفت امروز: ${toPersianDigits(rings[0].percentage)} درصد کالری، ${toPersianDigits(rings[1].percentage)} درصد پروتئین، ${toPersianDigits(rings[2].percentage)} درصد کربوهیدرات و ${toPersianDigits(rings[3].percentage)} درصد چربی`}
				>
					<NutritionRingChart rings={rings} />
					<div className="absolute grid size-24 place-items-center rounded-full bg-background/85 text-center shadow-sm">
						<span>
							<strong className="block text-[1.5rem] font-black leading-none tracking-normal">
								{toPersianDigits(data.day.consumedCalories)}
							</strong>
							<small className="mt-1 block text-[0.75rem] font-bold text-foreground">
								کالری مصرف‌شده
							</small>
							{data.day.hasConfiguredGoal ? (
								<small className="mt-0.5 block text-[0.75rem] text-muted-foreground">
									از{" "}
									{toPersianDigits(
										data.day.targetCalories ?? 0,
									)}
									{data.day.targetIsDegradedAverage
										? " (میانگین هفتگی)"
										: ""}
								</small>
							) : null}
						</span>
					</div>
				</NutritionRingStage>
				{data.day.hasConfiguredGoal ? null : (
					<div className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-3 py-3 text-center text-sm text-muted-foreground">
						<p>
							هدف روزانه تنظیم نشده است؛ فعلاً فقط مصرف ثبت‌شده
							نمایش داده می‌شود.
						</p>
						<Link
							href="/progress/goals"
							className={buttonVariants({
								variant: "outline",
								size: "sm",
							})}
						>
							دریافت برنامه من
						</Link>
					</div>
				)}
				<NutritionRingTooltipGrid
					items={rings}
					hasConfiguredGoal={data.day.hasConfiguredGoal}
				/>
			</CardContent>
		</Card>
	);
}

function formatMetricValue(value: number) {
	if (Math.abs(value) >= 100)
		return Math.round(value).toLocaleString("en-US");
	return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

function WeeklyProgressCard({
	weekly,
	nutritionWeek,
}: {
	weekly: WeeklyProgressResponseDto;
	nutritionWeek: NutritionProgressResponseDto;
}) {
	const caloriePercent = weekly.nutrition.calories.goalAveragePercent;
	const macroRows = weeklyMacroRows(weekly, nutritionWeek.points);
	const displayedLoggedDayCount =
		nutritionWeek.points.filter(isDashboardLoggedDay).length;
	const displayedMissingDayCount = Math.max(
		nutritionWeek.points.length - displayedLoggedDayCount,
		0,
	);
	const hasLoggedDay = displayedLoggedDayCount > 0;

	return (
		<Card id="progress" className="rounded-2xl border bg-card/80 shadow-sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base font-semibold">
					<ActivityIcon
						className="size-4 text-primary"
						aria-hidden="true"
					/>
					پیشرفت هفتگی
				</CardTitle>
				<CardDescription>
					از {formatShortDate(weekly.from)} تا{" "}
					{formatShortDate(weekly.to)} ·{" "}
					{toPersianDigits(displayedLoggedDayCount)} روز فعال
				</CardDescription>
				<CardAction>
					<Link
						href="/progress"
						className={buttonVariants({
							variant: "outline",
							size: "sm",
						})}
					>
						جزئیات پیشرفت
					</Link>
				</CardAction>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<div className="grid grid-cols-2 gap-3">
					<ProgressStat
						label="روزهای ثبت‌شده"
						value={toPersianDigits(displayedLoggedDayCount)}
						helper={`${toPersianDigits(displayedMissingDayCount)} روز بدون ثبت`}
					/>
					<ProgressStat
						label="میانگین کالری"
						value={formatNumber(weekly.nutrition.calories.average)}
						helper={
							caloriePercent === null
								? "بدون هدف فعال"
								: `${toPersianDigits(Math.round(caloriePercent))}٪ هدف`
						}
					/>
				</div>
				<div
					className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,3.75rem),1fr))] gap-2"
					role="list"
					aria-label={`خلاصه ثبت غذایی هفته؛ ${toPersianDigits(displayedLoggedDayCount)} روز ثبت‌شده و ${toPersianDigits(displayedMissingDayCount)} روز بدون ثبت`}
				>
					{nutritionWeek.points.map((day) => (
						<WeeklyDayCell key={day.date} day={day} />
					))}
				</div>
				{hasLoggedDay ? null : (
					<p className="rounded-xl border border-dashed bg-muted/30 px-3 py-2 text-center text-sm text-muted-foreground">
						پس از ثبت غذا، ردیف هفته با داده‌های واقعی پر می‌شود.
					</p>
				)}

				{weekly.warnings.length ? (
					<p className="rounded-xl border border-dashed bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
						{weekly.warnings.join(" ")}
					</p>
				) : null}
			</CardContent>
		</Card>
	);
}

function ProgressStat({
	label,
	value,
	helper,
}: {
	label: string;
	value: string;
	helper: string;
}) {
	return (
		<div className="rounded-xl border bg-background/45 p-3 text-center">
			<p className="text-xs font-bold text-muted-foreground">{label}</p>
			<strong className="mt-1 block text-2xl font-black tabular-nums tracking-normal">
				{value}
			</strong>
			<p className="mt-1 text-xs text-muted-foreground">{helper}</p>
		</div>
	);
}

function WeeklyDayCell({ day }: { day: NutritionProgressPoint }) {
	const isLogged = isDashboardLoggedDay(day);
	const calorieAssessment = day.goal?.targets?.calories
		? assessNutritionRange(
				"calories",
				day.totals.calories,
				day.goal.targets.calories,
			)
		: null;
	const caloriePercent = calorieAssessment?.percentage ?? null;
	const isAboveCalorieRange = calorieAssessment?.status === "above";
	const calorieLabel = isLogged
		? `${toPersianDigits(day.totals.calories)} کالری`
		: "بدون ثبت";
	const calorieStatus = isAboveCalorieRange ? "، بالاتر از محدوده مناسب" : "";

	return (
		<div
			className={cn(
				"grid min-h-24 place-items-center rounded-xl border p-2 text-center transition-colors",
				isLogged
					? isAboveCalorieRange
						? "border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/25"
						: "border-primary/55 bg-primary/10 ring-1 ring-primary/20"
					: "border-dashed bg-muted/20 opacity-75",
			)}
			role="listitem"
			aria-label={`${formatWeekday(day.date)}: ${calorieLabel}${calorieStatus}`}
		>
			<span
				className={cn(
					"text-[0.8rem] font-bold",
					isLogged ? "text-foreground" : "text-muted-foreground",
				)}
			>
				{formatWeekday(day.date)}
			</span>
			<span
				className={cn(
					"grid size-10 place-items-center rounded-full border text-[0.6rem] font-black",
					isLogged
						? isAboveCalorieRange
							? "border-amber-500 bg-amber-500 text-amber-950"
							: "border-primary bg-primary text-primary-foreground"
						: "border-dashed text-muted-foreground",
				)}
			>
				{isLogged ? toPersianDigits(day.totals.calories) : "—"}
			</span>
			<span
				className={cn(
					"text-[0.7rem] font-bold",
					isLogged
						? isAboveCalorieRange
							? "text-amber-600 dark:text-amber-400"
							: "text-primary"
						: "text-muted-foreground",
				)}
			>
				{isLogged
					? caloriePercent === null
						? "ثبت‌شده"
						: `${toPersianDigits(caloriePercent)}٪ هدف`
					: "ثبت نشده"}
			</span>
		</div>
	);
}

function WeightProgressCard({
	weekly,
	month,
	viewedDate,
	today,
	hasConfiguredGoal,
}: {
	weekly: WeeklyProgressResponseDto;
	month: WeightProgressResponseDto;
	viewedDate: string;
	today: string;
	hasConfiguredGoal: boolean;
}) {
	const measuredPoints = month.points.filter(
		(point) => point.hasMeasurement && point.weightKg !== null,
	);
	const values = measuredPoints.map((point) => point.weightKg ?? 0);
	const hasWeight = measuredPoints.length > 0;
	const highest = values.length ? Math.max(...values) : null;
	const lowest = values.length ? Math.min(...values) : null;
	const trendLabel =
		month.summary.absoluteChangeKg === null ||
		month.summary.absoluteChangeKg === undefined
			? "بدون تغییر قابل محاسبه"
			: `${month.summary.absoluteChangeKg > 0 ? "+" : ""}${toPersianDigits(month.summary.absoluteChangeKg.toFixed(1))} kg`;

	return (
		<Card className="rounded-2xl border bg-card/80 shadow-sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base font-semibold">
					<TrendingDownIcon
						className="size-4 text-primary"
						aria-hidden="true"
					/>
					روند وزن
				</CardTitle>
				<CardDescription>
					{hasWeight
						? `از ${formatShortDate(month.from)} تا ${formatShortDate(month.to)}`
						: "هنوز وزن ثبت‌شده‌ای برای این ماه وجود ندارد."}
				</CardDescription>
				<CardAction>
					<span className="rounded-full border bg-background/50 px-3 py-1 text-xs font-bold">
						{hasWeight ? trendLabel : "بدون داده"}
					</span>
				</CardAction>
			</CardHeader>
			<CardContent className="grid gap-4">
				{shouldShowWeightNudge(
					month.latestMeasurementDate,
					today,
					viewedDate,
				) ? (
					<WeightNudge
						date={today}
						hasConfiguredGoal={hasConfiguredGoal}
					/>
				) : null}
				<div className="grid grid-cols-3 gap-2">
					<WeightMiniStat
						label="بیشترین"
						value={formatWeight(highest)}
					/>
					<WeightMiniStat
						label="کمترین"
						value={formatWeight(lowest)}
					/>
					<WeightMiniStat
						label="ثبت‌ها"
						value={toPersianDigits(month.summary.measurementCount)}
					/>
				</div>
				{hasWeight && values.length ? (
					<InteractiveLineChart
						series={[
							{
								label: "وزن",
								values,
								strokeClass: "stroke-primary",
								dotClass: "bg-primary",
								unit: "kg",
							},
						]}
						labels={measuredPoints.map((point) =>
							formatShortDate(point.date),
						)}
						height={210}
						target={weekly.weight?.targetWeightKg ?? undefined}
						ariaLabel="نمودار روند وزن این ماه"
					/>
				) : (
					<div className="grid min-h-52 place-items-center rounded-xl border border-dashed bg-muted/30 px-4 py-6 text-center">
						<p className="text-sm text-muted-foreground">
							پس از ثبت وزن، روند و فاصله تا وزن هدف در این بخش
							نمایش داده می‌شود.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function WeightMiniStat({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl border bg-background/45 p-2 text-center">
			<p className="text-[0.7rem] font-bold text-muted-foreground">
				{label}
			</p>
			<strong className="mt-1 block text-sm font-black tabular-nums tracking-normal">
				{value}
			</strong>
		</div>
	);
}

function weeklyMacroRows(
	weekly: WeeklyProgressResponseDto,
	points: NutritionProgressPoint[],
) {
	const averageGoals = averageLoggedGoals(points);
	return [
		{
			label: "پروتئین",
			value: weekly.nutrition.macros.protein.goalAveragePercent,
			averageHelper: macroAverageHelper(
				weekly.nutrition.macros.protein.average,
			),
			goalHelper: macroGoalHelper(averageGoals.protein),
			className: "bg-nutrient-protein",
		},
		{
			label: "کربوهیدرات",
			value: weekly.nutrition.macros.carbs.goalAveragePercent,
			averageHelper: macroAverageHelper(
				weekly.nutrition.macros.carbs.average,
			),
			goalHelper: macroGoalHelper(averageGoals.carbs),
			className: "bg-nutrient-carbs",
		},
		{
			label: "چربی",
			value: weekly.nutrition.macros.fat.goalAveragePercent,
			averageHelper: macroAverageHelper(
				weekly.nutrition.macros.fat.average,
			),
			goalHelper: macroGoalHelper(averageGoals.fat),
			className: "bg-nutrient-fat",
		},
	];
}

function averageLoggedGoals(points: NutritionProgressPoint[]) {
	const loggedTargets = points
		.filter((point) => point.logged)
		.map((point) => point.goal?.targets)
		.filter(
			(
				target,
			): target is NonNullable<
				NonNullable<NutritionProgressPoint["goal"]>["targets"]
			> => Boolean(target),
		);

	return {
		protein: averageOf(loggedTargets.map((target) => target.protein)),
		carbs: averageOf(loggedTargets.map((target) => target.carbs)),
		fat: averageOf(loggedTargets.map((target) => target.fat)),
	};
}

function averageOf(values: number[]) {
	if (!values.length) return null;
	return values.reduce((total, value) => total + value, 0) / values.length;
}

function macroAverageHelper(average: number | null) {
	if (average === null) return "میانگین: بدون داده";
	return `میانگین: ${toPersianDigits(Math.round(average))} گرم`;
}

function macroGoalHelper(target: number | null) {
	if (target === null) return "هدف: بدون هدف";
	return `هدف: ${toPersianDigits(Math.round(target))} گرم`;
}

function formatNumber(value: number | null | undefined) {
	if (value === null || value === undefined) return "—";
	return toPersianDigits(Math.round(value));
}

function formatWeight(value: number | null | undefined) {
	if (value === null || value === undefined) return "—";
	return `${toPersianDigits(value.toFixed(1))} kg`;
}

function formatShortDate(value: string) {
	return new Intl.DateTimeFormat("fa-IR", {
		month: "short",
		day: "numeric",
	}).format(new Date(`${value}T12:00:00Z`));
}

function formatWeekday(value: string) {
	return new Intl.DateTimeFormat("fa-IR", {
		weekday: "short",
	}).format(new Date(`${value}T12:00:00Z`));
}
