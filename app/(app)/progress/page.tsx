import {
	ActivityIcon,
	BarChart3Icon,
	CheckCircle2Icon,
	type LucideIcon,
	ScaleIcon,
	TargetIcon,
	TrendingDownIcon,
	TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { InteractiveLineChart } from "@/components/dashboard/interactive-line-chart";
import { NutritionRangeAreaChart } from "@/components/foods/nutrition-range-area-chart-lazy";
import type { NutritionRangeAreaChartPoint } from "@/components/foods/nutrition-range-area-chart";
import { AppTopBar } from "@/components/design-system/app-top-bar";
import { ActivityHeatmapCell } from "@/components/progress/activity-heatmap-cell";
import { ActivityHeatmapGrid } from "@/components/progress/activity-heatmap-grid";
import {
	NutritionBalanceCard,
} from "@/components/progress/nutrition-balance-card";
import { buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
	NutritionProgressPoint,
	WeightProgressResponseDto,
} from "@/lib/api/progress";
import {
	type ActivityHeatmapDayResponseDto,
	getActivityHeatmap,
} from "@/lib/api/users";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-api";
import { getSession } from "@/lib/auth/session";
import {
	loadDashboardProgress,
	resolveDiaryDate,
} from "@/lib/diary/dashboard-loader";
import { toPersianDigits } from "@/lib/format";
import { formatNutritionRangeChartDate } from "@/lib/progress/nutrition-chart";
import { cn } from "@/lib/utils";

type ProgressPageProps = {
	searchParams: Promise<{
		date?: string;
	}>;
};

export default async function ProgressPage({
	searchParams,
}: ProgressPageProps) {
	const sessionPromise = getSession();
	const paramsPromise = searchParams;
	const session = await sessionPromise;

	if (!session.isAuthenticated) {
		redirect("/auth/login?next=%2Fprogress&expired=1");
	}

	const params = await paramsPromise;
	const date = resolveDiaryDate(params?.date, session.user.timezone);
	const heatmapRange = {
		from: shiftDayDate(date, -365),
		to: date,
	};
	const [progress, activityHeatmap] = await Promise.all([
		loadDashboardProgress(date, "/progress"),
		authenticatedServerRequest(
			(accessToken) => getActivityHeatmap(heatmapRange, accessToken),
			{ nextPath: "/progress", retryPolicy: "idempotent" },
		),
	]);
	const calorieAdherence =
		progress.weekly.nutrition.calories.goalAveragePercent;
	const measuredWeightPoints = progress.weightMonth.points.filter(
		(point) => point.hasMeasurement && point.weightKg !== null,
	);
	const weightValues = measuredWeightPoints.map(
		(point) => point.weightKg ?? 0,
	);
	const hasWeightTrend = weightValues.length > 1;
	const activeFoodLogDays = activityHeatmap.days.filter(
		(day) => day.entryCount > 0,
	).length;
	const summaryItems = [
		{
			icon: CheckCircle2Icon,
			label: "روزهای فعال",
			value: toPersianDigits(activeFoodLogDays),
			helper: `${toPersianDigits(activityHeatmap.days.length)} روز در سال`,
		},
		{
			icon: TargetIcon,
			label: "میانگین کالری",
			value: formatNumber(progress.weekly.nutrition.calories.average),
			helper: formatPercentHelper(calorieAdherence),
		},
		{
			icon: BarChart3Icon,
			label: "ثبت وزن",
			value: toPersianDigits(
				progress.weightMonth.summary.measurementCount,
			),
			helper: `از ${formatShortDate(progress.weightMonth.from)} تا ${formatShortDate(progress.weightMonth.to)}`,
		},
		{
			icon: ScaleIcon,
			label: "تغییر وزن",
			value: formatSignedWeight(
				progress.weightMonth.summary.absoluteChangeKg,
			),
			helper: trendLabel(progress.weightMonth.summary.trendDirection),
		},
	];

	return (
		<div className="mx-auto flex w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10">
			<main
				id="main-content"
				className="flex min-w-0 flex-1 flex-col gap-6"
				aria-label="پیشرفت و اهداف"
			>
				<AppTopBar
					title="پیشرفت و اهداف"
					description={`گزارش ${formatShortDate(progress.weekly.from)} تا ${formatShortDate(progress.weekly.to)}`}
					backLink={{ href: "/dashboard", label: "بازگشت به امروز" }}
					showDateControl={false}
					showMobileDateAction={false}
				/>

				<div className="order-1 flex justify-end md:order-1">
					<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
						<Link
							href={`/progress/nutrition?period=WEEK&date=${date}`}
							className={buttonVariants({
								variant: "outline",
								size: "lg",
								className: "w-full sm:w-auto",
							})}
						>
							تحلیل تغذیه
						</Link>
						<Link
							href="/progress/weight"
							className={buttonVariants({
								variant: "outline",
								size: "lg",
								className: "w-full sm:w-auto",
							})}
						>
							تحلیل وزن
						</Link>
						<Link
							href="/progress/goals"
							className={buttonVariants({
								variant: "default",
								size: "lg",
								className: "w-full sm:w-auto",
							})}
						>
							مدیریت اهداف تغذیه
						</Link>
					</div>
				</div>

				<section className="order-2 hidden grid-cols-1 gap-4 md:order-1 md:grid md:grid-cols-2 xl:grid-cols-4">
					{summaryItems.map((item) => (
						<SummaryTile key={item.label} {...item} />
					))}
				</section>

				<section className="order-1 grid grid-cols-1 gap-4 md:order-2 sm:grid-cols-1 lg:grid-cols-2">
					<Card className="rounded-2xl border bg-card/80 shadow-sm">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base font-semibold">
								<ActivityIcon
									className="size-4 text-primary"
									aria-hidden="true"
								/>
								نقشه امتیاز روزانه
							</CardTitle>
							<CardDescription>
								امتیاز هدف یا تداوم ثبت در سال اخیر
							</CardDescription>
							<CardAction>
								<span className="rounded-full border bg-background/50 px-3 py-1 text-xs font-bold">
									{toPersianDigits(activeFoodLogDays)} روز
									فعال
								</span>
							</CardAction>
						</CardHeader>
						<CardContent>
							<FoodLoggingHeatmap
								days={activityHeatmap.days}
								locale={session.user.locale}
							/>
						</CardContent>
					</Card>

					<WeeklyNutrientChartCard
						points={progress.nutritionWeek.points}
						from={progress.weekly.from}
						to={progress.weekly.to}
					/>
				</section>

				<CompactSummaryCard items={summaryItems} />

				<section className="order-4 grid grid-cols-1 gap-4"></section>

				<section className="order-5 grid grid-cols-1 gap-4 md:grid-cols-2">
					<WeightTrendCard
						hasWeightTrend={hasWeightTrend}
						measuredWeightPoints={measuredWeightPoints}
						targetWeightKg={progress.weekly.weight?.targetWeightKg}
						trendDirection={
							progress.weightMonth.summary.trendDirection
						}
						weightValues={weightValues}
					/>
					<NutritionBalanceCard days={progress.nutritionWeek.points} />
				</section>
			</main>
		</div>
	);
}

function WeightTrendCard({
	hasWeightTrend,
	measuredWeightPoints,
	targetWeightKg,
	trendDirection,
	weightValues,
}: {
	hasWeightTrend: boolean;
	measuredWeightPoints: WeightProgressResponseDto["points"];
	targetWeightKg: number | null | undefined;
	trendDirection: string | null | undefined;
	weightValues: number[];
}) {
	return (
		<Card className="rounded-2xl border bg-card/80 shadow-sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base font-semibold">
					{trendIcon(trendDirection)}
					روند وزن
				</CardTitle>
				<CardDescription>
					{hasWeightTrend
						? "مسیر ثبت‌های وزن در ماه جاری"
						: "برای نمایش روند، حداقل دو ثبت وزن نیاز است."}
				</CardDescription>
				<CardAction>
					<span className="rounded-full border bg-background/50 px-3 py-1 text-xs font-bold">
						{formatWeight(targetWeightKg)} هدف
					</span>
				</CardAction>
			</CardHeader>
			<CardContent>
				{hasWeightTrend ? (
					<InteractiveLineChart
						series={[
							{
								label: "وزن",
								values: weightValues,
								strokeClass: "stroke-primary",
								dotClass: "bg-primary",
								unit: "kg",
							},
						]}
						labels={measuredWeightPoints.map((point) =>
							formatShortDate(point.date),
						)}
						height={240}
						target={targetWeightKg ?? undefined}
						ariaLabel="نمودار پیشرفت وزن"
					/>
				) : (
					<div className="grid min-h-60 place-items-center rounded-xl border border-dashed bg-muted/30 px-4 py-8 text-center">
						<p className="max-w-sm text-sm leading-7 text-muted-foreground">
							پس از اضافه شدن داده کافی، نمودار مسیر و فاصله تا
							هدف اینجا نمایش داده می‌شود.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function SummaryTile({
	icon: Icon,
	label,
	value,
	helper,
}: {
	icon: LucideIcon;
	label: string;
	value: string;
	helper: string;
}) {
	return (
		<Card className="rounded-2xl border bg-card/80 shadow-sm">
			<CardContent className="flex min-h-32 items-center gap-3">
				<span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
					<Icon className="size-5" aria-hidden="true" />
				</span>
				<span className="min-w-0">
					<span className="block text-xs font-bold text-muted-foreground">
						{label}
					</span>
					<strong className="mt-1 block truncate text-2xl font-black tabular-nums tracking-normal">
						{value}
					</strong>
					<span className="mt-1 block truncate text-xs text-muted-foreground">
						{helper}
					</span>
				</span>
			</CardContent>
		</Card>
	);
}

function CompactSummaryCard({
	items,
}: {
	items: Array<{
		icon: LucideIcon;
		label: string;
		value: string;
		helper: string;
	}>;
}) {
	return (
		<Card className="order-3 rounded-2xl border bg-card/80 shadow-sm md:hidden">
			<CardContent className="grid grid-cols-2 gap-3 py-3">
				{items.map((item) => (
					<div
						key={item.label}
						className="flex min-w-0 items-center gap-2 rounded-xl border bg-background/45 p-2.5"
					>
						<span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
							<item.icon className="size-4" aria-hidden="true" />
						</span>
						<span className="min-w-0">
							<span className="block truncate text-[0.68rem] font-bold text-muted-foreground">
								{item.label}
							</span>
							<strong className="mt-0.5 block truncate text-lg font-black leading-none tabular-nums tracking-normal">
								{item.value}
							</strong>
							<span className="mt-1 block truncate text-[0.65rem] text-muted-foreground">
								{item.helper}
							</span>
						</span>
					</div>
				))}
			</CardContent>
		</Card>
	);
}

function FoodLoggingHeatmap({
	days,
	locale,
}: {
	days: ActivityHeatmapDayResponseDto[];
	locale: string;
}) {
	const isPersian = locale.toLowerCase().startsWith("fa");
	const weeks = buildHeatmapWeeks(days, locale);
	const monthLabels = buildHeatmapMonthLabels(weeks, locale);
	const weekdayLabels = heatmapWeekdayLabels(isPersian);

	return (
		<div className="grid gap-3">
			<ScrollArea orientation="horizontal" viewportClassName="pb-1">
				<div
					className="grid w-max grid-cols-[2.25rem_max-content] gap-x-2"
					dir="ltr"
				>
					<div aria-hidden="true" />
					<div
						className="grid gap-1"
						style={{
							gridTemplateColumns: `repeat(${weeks.length}, 0.75rem)`,
						}}
						aria-hidden="true"
					>
						{monthLabels.map((label) => (
							<span
								key={`${label.label}-${label.weekIndex}`}
								className="h-4 truncate text-[0.65rem] font-bold leading-4 text-muted-foreground"
								style={{
									gridColumn: `${label.weekIndex + 1} / span ${label.span}`,
								}}
							>
								{label.label}
							</span>
						))}
					</div>

					<div className="grid grid-rows-7 gap-1" dir="rtl">
						{weekdayLabels.map((label, index) => (
							<span
								key={`${label}-${index}`}
								className="h-3 text-[0.62rem] font-bold leading-3 text-muted-foreground"
							>
								{label}
							</span>
						))}
					</div>
					<ActivityHeatmapGrid
						className="grid grid-flow-col grid-rows-7 gap-1"
						ariaLabel="نقشه امتیاز روزانه سال اخیر"
					>
						{weeks.flatMap((week, weekIndex) =>
							week.map((day, dayIndex) =>
								day ? (
									<FoodLoggingHeatmapCell
										key={day.date}
										day={day}
									/>
								) : (
									<span
										key={`empty-${weekIndex}-${dayIndex}`}
										className="size-3 rounded-[3px]"
										aria-hidden="true"
									/>
								),
							),
						)}
					</ActivityHeatmapGrid>
				</div>
			</ScrollArea>
			<div className="flex items-center justify-end gap-2 text-[0.68rem] font-bold text-muted-foreground">
				<span>{isPersian ? "ضعیف‌تر" : "Lower"}</span>
				<div className="flex items-center gap-1" aria-hidden="true">
					{[0, 1, 2, 3, 4].map((level) => (
						<span
							key={level}
							className={cn(
								"size-3 rounded-[3px] border",
								heatmapLevelClassName(level),
							)}
						/>
					))}
				</div>
				<span>{isPersian ? "بهتر" : "Better"}</span>
			</div>
		</div>
	);
}

function FoodLoggingHeatmapCell({
	day,
}: {
	day: ActivityHeatmapDayResponseDto;
}) {
	const status = heatmapDayStatus(day);
	const isDisabled = isDisabledHeatmapScore(day.score);
	const tooltip = `${formatLongDate(day.date)}: ${status}`;

	return (
		<ActivityHeatmapCell
			className={cn(
				"block size-3 rounded-[3px] border transition-colors motion-safe:duration-150",
				heatmapScoreClassName(day.score),
			)}
			ariaLabel={`${formatShortDate(day.date)}: ${status}`}
			disabled={isDisabled}
			tooltip={tooltip}
		/>
	);
}

function buildHeatmapWeeks(
	days: ActivityHeatmapDayResponseDto[],
	locale: string,
) {
	const sortedDays = days.toSorted((first, second) =>
		first.date.localeCompare(second.date),
	);
	const weeks: Array<Array<ActivityHeatmapDayResponseDto | null>> = [];
	const startDate = sortedDays[0]?.date;
	const startOffset = startDate
		? weekdayIndexForLocale(startDate, locale)
		: 0;

	sortedDays.forEach((day) => {
		const weekIndex = Math.floor(
			(daysBetween(startDate ?? day.date, day.date) + startOffset) / 7,
		);
		const dayIndex = weekdayIndexForLocale(day.date, locale);

		if (!weeks[weekIndex]) {
			weeks[weekIndex] = Array.from({ length: 7 }, () => null);
		}

		weeks[weekIndex][dayIndex] = day;
	});

	return weeks;
}

function buildHeatmapMonthLabels(
	weeks: Array<Array<ActivityHeatmapDayResponseDto | null>>,
	locale: string,
) {
	const labels: Array<{ label: string; weekIndex: number; span: number }> =
		[];

	weeks.forEach((week, weekIndex) => {
		const firstDay = week.find(Boolean);
		if (!firstDay) return;

		const month = formatMonthLabel(firstDay.date, locale);
		const previous = labels[labels.length - 1];

		if (previous?.label === month) {
			previous.span += 1;
			return;
		}

		labels.push({ label: month, weekIndex, span: 1 });
	});

	return labels;
}

function daysBetween(from: string, to: string) {
	const fromDate = new Date(`${from}T12:00:00Z`);
	const toDate = new Date(`${to}T12:00:00Z`);
	return Math.floor((toDate.getTime() - fromDate.getTime()) / 86_400_000);
}

function heatmapWeekdayLabels(isPersian: boolean) {
	if (isPersian) {
		return ["ش", "", "د", "", "چ", "", "ج"];
	}

	return ["", "Mon", "", "Wed", "", "Fri", ""];
}

function weekdayIndexForLocale(value: string, locale: string) {
	const [year, month, day] = value.split("-").map(Number);
	const weekday = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
	const startDay = locale.toLowerCase().startsWith("fa") ? 6 : 0;
	return (weekday - startDay + 7) % 7;
}

function heatmapLevelClassName(level: number) {
	switch (level) {
		case 4:
			return "border-primary bg-primary text-primary-foreground";
		case 3:
			return "border-primary/80 bg-primary/70 text-primary-foreground";
		case 2:
			return "border-primary/55 bg-primary/35 text-foreground";
		case 1:
			return "border-primary/35 bg-primary/15 text-foreground";
		default:
			return "border-dashed bg-muted/20 text-muted-foreground";
	}
}

type HeatmapScore = ActivityHeatmapDayResponseDto["score"] | undefined;

function heatmapScoreClassName(score: HeatmapScore) {
	if (score == null || isDisabledHeatmapScore(score)) {
		return "border-dashed border-muted-foreground/25 bg-muted/35 text-muted-foreground opacity-60";
	}
	if (score >= 85) {
		return "border-primary bg-primary text-primary-foreground";
	}
	if (score >= 70) {
		return "border-primary/80 bg-primary/70 text-primary-foreground";
	}
	if (score >= 50) {
		return "border-primary/55 bg-primary/35 text-foreground";
	}
	return "border-primary/35 bg-primary/15 text-foreground";
}

function isDisabledHeatmapScore(score: HeatmapScore) {
	return score === undefined || (score !== null && score <= 0);
}

function heatmapDayStatus(day: ActivityHeatmapDayResponseDto) {
	if (day.score === undefined || isDisabledHeatmapScore(day.score)) {
		return "بدون امتیاز";
	}
	if (day.score === null) {
		return "در انتظار نهایی شدن";
	}

	const score = `${toPersianDigits(day.score)} امتیاز`;
	if (day.scoreMode === "GOAL_ADHERENCE") {
		return `${score}، پایبندی به هدف`;
	}
	if (day.scoreMode === "CONSISTENCY") {
		return `${score}، تداوم ثبت غذا`;
	}
	return score;
}

function formatPercentHelper(value: number | null | undefined) {
	if (value === null || value === undefined) return "بدون هدف فعال";
	return `${toPersianDigits(Math.round(value))}٪ هدف`;
}

function formatNumber(value: number | null | undefined) {
	if (value === null || value === undefined) return "—";
	return toPersianDigits(Math.round(value));
}

function formatWeight(value: number | null | undefined) {
	if (value === null || value === undefined) return "—";
	return `${toPersianDigits(value.toFixed(1))} kg`;
}

function formatSignedWeight(value: number | null | undefined) {
	if (value === null || value === undefined) return "—";
	const prefix = value > 0 ? "+" : "";
	return `${prefix}${toPersianDigits(value.toFixed(1))} kg`;
}

function trendLabel(value: string | null | undefined) {
	switch (value) {
		case "DOWN":
			return "روند کاهشی";
		case "UP":
			return "روند افزایشی";
		case "FLAT":
			return "تقریبا ثابت";
		default:
			return "داده ناکافی";
	}
}

function trendIcon(value: string | null | undefined) {
	const className = "size-4 text-primary";
	if (value === "UP") {
		return <TrendingUpIcon className={className} aria-hidden="true" />;
	}
	return <TrendingDownIcon className={className} aria-hidden="true" />;
}

function formatShortDate(value: string) {
	return new Intl.DateTimeFormat("fa-IR", {
		month: "short",
		day: "numeric",
	}).format(new Date(`${value}T12:00:00Z`));
}

function formatLongDate(value: string) {
	return new Intl.DateTimeFormat("fa-IR", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
	}).format(new Date(`${value}T12:00:00Z`));
}

function formatMonthLabel(value: string, locale: string) {
	return new Intl.DateTimeFormat(locale || "fa-IR", {
		month: "short",
	}).format(new Date(`${value}T12:00:00Z`));
}

function shiftDayDate(value: string, days: number) {
	const [year, month, day] = value.split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, day + days, 12))
		.toISOString()
		.slice(0, 10);
}

function WeeklyNutrientChartCard({
	points,
	from,
	to,
}: {
	points: NutritionProgressPoint[];
	from: string;
	to: string;
}) {
	const chartPoints: NutritionRangeAreaChartPoint[] = points.map((point) => ({
		date: point.date,
		label: formatNutritionRangeChartDate(point.date),
		calories: point.totals.calories,
		protein: point.totals.protein,
		carbs: point.totals.carbs,
		fat: point.totals.fat,
	}));

	return (
		<Card className="rounded-2xl border bg-card/80 shadow-sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base font-semibold">
					<BarChart3Icon
						className="size-4 text-primary"
						aria-hidden="true"
					/>
					نمودار مواد مغذی
				</CardTitle>
				<CardDescription className="leading-6">
					کالری، پروتئین، کربوهیدرات و چربی از{" "}
					{formatNutritionRangeChartDate(from)} تا{" "}
					{formatNutritionRangeChartDate(to)}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<NutritionRangeAreaChart points={chartPoints} />
			</CardContent>
		</Card>
	);
}
