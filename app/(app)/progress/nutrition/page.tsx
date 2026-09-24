import {
	BarChart3Icon,
	CalendarDaysIcon,
	CheckCircle2Icon,
	GaugeIcon,
	TargetIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppTopBar } from "@/components/design-system/app-top-bar";
import { NutritionRangeAreaChart } from "@/components/foods/nutrition-range-area-chart-lazy";
import { NutritionExplorerControls } from "@/components/progress/nutrition-explorer-controls";
import {
	ExplorerComparisonRow,
	ExplorerRangeNavigation,
	ExplorerSummaryTile,
} from "@/components/progress/explorer-ui";
import {
	Card,
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	getNutritionProgress,
	getNutritionProgressBatch,
	type NutritionBatchProgressResultEnvelope,
	type NutritionProgressResponseDto,
	type ProgressNutritionTotals,
} from "@/lib/api/progress";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-api";
import { getSession } from "@/lib/auth/session";
import { getCurrentEntitlement } from "@/lib/api/entitlement";
import { demoSubscriptionState } from "@/lib/subscription/entitlements";
import { resolveDiaryDate } from "@/lib/diary/dashboard-loader";
import { shiftDiaryDate } from "@/lib/diary/date";
import { formatPersianNumber, toPersianDigits } from "@/lib/format";
import {
	buildNutritionChartPoints,
	comparisonRangesForNutritionExplorer,
	micronutrientRows,
	monthRange,
	nutritionComparisonCopy,
	nutritionCoverageState,
	nutritionExplorerHref,
	nutritionGoalAdherenceRows,
	previousMonth,
	resolveNutritionExplorerState,
} from "@/lib/progress/nutrition-explorer";
import {
	daysBetweenInclusive,
	formatExplorerDateRangeLabel,
	formatExplorerShortDate,
} from "@/lib/progress/explorer-format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Gyro | تحلیل تغذیه",
	description: "کاوش هفتگی، ماهانه و فازی تغذیه، اهداف و ریزمغذی‌ها در Gyro",
};

type NutritionExplorerPageProps = {
	searchParams: Promise<{
		period?: string;
		date?: string;
		month?: string;
		from?: string;
		to?: string;
	}>;
};

const macroMetrics = [
	{
		key: "calories",
		label: "کالری",
		unit: "کالری",
		accentClassName: "bg-primary",
	},
	{
		key: "protein",
		label: "پروتئین",
		unit: "گرم",
		accentClassName: "bg-nutrient-protein",
	},
	{
		key: "carbs",
		label: "کربوهیدرات",
		unit: "گرم",
		accentClassName: "bg-nutrient-carbs",
	},
	{
		key: "fat",
		label: "چربی",
		unit: "گرم",
		accentClassName: "bg-nutrient-fat",
	},
] satisfies Array<{
	key: keyof Pick<
		ProgressNutritionTotals,
		"calories" | "protein" | "carbs" | "fat"
	>;
	label: string;
	unit: string;
	accentClassName: string;
}>;

export default async function NutritionExplorerPage({
	searchParams,
}: NutritionExplorerPageProps) {
	const session = await getSession();

	if (!session.isAuthenticated) {
		redirect("/auth/login?next=%2Fprogress%2Fnutrition&expired=1");
	}

	const params = await searchParams;
	const selectedDate = resolveDiaryDate(params.date, session.user.timezone);
	const today = resolveDiaryDate(undefined, session.user.timezone);
	const subscription = await loadCurrentEntitlement();
	const premiumEnabled = subscription.premiumGatingDisabled === true || subscription.tier === "ADVANCED";
	const normalizedParams = premiumEnabled ? params : { period: "WEEK", date: params.date };
	const state = resolveNutritionExplorerState(
		normalizedParams,
		selectedDate,
		session.user.locale,
	);
	const comparisonRanges = comparisonRangesForNutritionExplorer(state);
	const progress = await authenticatedServerRequest(
		(accessToken) => getNutritionProgress(state.activeRequest, accessToken),
		{ nextPath: "/progress/nutrition", retryPolicy: "idempotent" },
	);
	const comparison = premiumEnabled ? await authenticatedServerRequest(
		(accessToken) => getNutritionProgressBatch({ ranges: comparisonRanges }, accessToken),
		{ nextPath: "/progress/nutrition", retryPolicy: "idempotent" },
	) : null;
	const previousComparison = comparison?.results.find(
		(result) => result.requestId === "previous",
	);
	const coverage = nutritionCoverageState(progress);
	const chartPoints = buildNutritionChartPoints(progress);
	const adherenceRows = premiumEnabled ? nutritionGoalAdherenceRows(progress.points) : [];
	const comparisonCopy = premiumEnabled ? nutritionComparisonCopy(state) : null;
	const rangeDescription = `${formatExplorerShortDate(progress.from)} تا ${formatExplorerShortDate(progress.to)}`;

	return (
		<div className="mx-auto flex w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10">
			<main
				id="main-content"
				className="flex min-w-0 flex-1 flex-col gap-6"
				aria-label="کاوش تغذیه"
			>
					<AppTopBar
						title="تحلیل تغذیه"
						description={`${periodLabel(progress.period)} | ${rangeDescription}`}
						backLink={{
							href: "/progress",
							label: "بازگشت به پیشرفت",
						}}
						showDateControl={false}
						showMobileDateAction={false}
					/>

					<NutritionExplorerControls state={state} today={today} premiumEnabled={premiumEnabled} />

					<RangeNavigation state={state} />

					<section className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-2 xl:grid-cols-4">
						<ExplorerSummaryTile
							icon={CalendarDaysIcon}
							label="ثبت غذا"
							value={toPersianDigits(coverage.loggedDayCount)}
							helper={`${toPersianDigits(coverage.loggedDayCount)} از ${toPersianDigits(coverage.totalDayCount)} روز`}
						/>
						<ExplorerSummaryTile
							icon={GaugeIcon}
							label="میانگین کالری"
							value={formatMetric(
								progress.summary.averagePerLoggedDay?.calories,
								"کالری",
							)}
							helper="در روزهای ثبت‌شده"
						/>
						<ExplorerSummaryTile
							icon={TargetIcon}
							label="هدف غذایی"
							value={coverage.hasGoal ? "فعال" : "تنظیم نشده"}
							helper={
								coverage.hasGoal
									? "برای همین بازه"
									: "بدون فاصله از هدف"
							}
						/>
						<ExplorerSummaryTile
							icon={CheckCircle2Icon}
							label="وضعیت بازه"
							value={coverageLabel(coverage)}
							helper={coverageSummary(coverage)}
						/>
					</section>

					<section className="grid gap-4">
						<Card className="rounded-2xl border bg-card/80 shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base font-semibold">
									<BarChart3Icon data-icon="inline-start" />
									روند تغذیه
								</CardTitle>
								<CardDescription>
									مسیر کالری و ماکروها را در طول بازه ببینید.
								</CardDescription>
							</CardHeader>
							<CardContent>
								{coverage.hasLoggedDays ? (
									<NutritionRangeAreaChart
										points={chartPoints}
									/>
								) : (
									<Empty className="rounded-2xl border-dashed">
										<EmptyHeader>
											<EmptyTitle>
												داده تغذیه برای این بازه وجود
												ندارد
											</EmptyTitle>
											<EmptyDescription>
												روزهای بدون ثبت به عنوان صفر
												مصرف‌شده نمایش داده نمی‌شوند.
											</EmptyDescription>
										</EmptyHeader>
									</Empty>
								)}
							</CardContent>
						</Card>
					</section>

					{premiumEnabled ? <>
					<ComparisonCard
						progress={progress}
						previous={previousComparison}
						copy={comparisonCopy!}
					/>

					<Card className="rounded-2xl border bg-card/80 shadow-sm">
						<CardHeader>
							<CardTitle className="text-base font-semibold">
								کالری و ماکروها
							</CardTitle>
							<CardDescription>
								ببینید کل بازه چه مقدار مصرف داشته و روزهای
								ثبت‌شده چه تصویری می‌دهند.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
							{macroMetrics.map((metric) => (
								<NutritionMetricBlock
									key={metric.key}
									label={metric.label}
									unit={metric.unit}
									total={progress.summary.totals[metric.key]}
									averagePerDay={
										progress.summary.averagePerDay[
											metric.key
										]
									}
									averagePerLoggedDay={
										progress.summary.averagePerLoggedDay?.[
											metric.key
										] ?? null
									}
									accentClassName={metric.accentClassName}
								/>
							))}
						</CardContent>
					</Card>

					<section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)]">
					<GoalAdherenceCard rows={adherenceRows} />
						<MicronutrientTable progress={progress} />
					</section>
					</> : <LockedProgressSection message="مقایسه، جزئیات ماکرو، پایبندی به هدف و ریزمغذی‌ها در پلن پیشرفته فعال است." />}
			</main>
		</div>
	);
}

function LockedProgressSection({message}: {message: string}) {
	return <section className="rounded-2xl border border-dashed bg-muted/20 p-5 text-center text-sm leading-7 text-muted-foreground" aria-label="قابلیت پیشرفته قفل است">{message}</section>;
}

async function loadCurrentEntitlement() {
	try {
		return await authenticatedServerRequest((accessToken) => getCurrentEntitlement(accessToken), {nextPath: "/progress/nutrition", retryPolicy: "idempotent"});
	} catch {
		return demoSubscriptionState("FREE");
	}
}

function RangeNavigation({
	state,
}: {
	state: ReturnType<typeof resolveNutritionExplorerState>;
}) {
	const previousHref = rangeShiftHref(state, "previous");
	const nextHref = rangeShiftHref(state, "next");

	return (
		<ExplorerRangeNavigation
			previousHref={previousHref}
			nextHref={nextHref}
			label={`${formatExplorerShortDate(state.labelFrom)} تا ${formatExplorerShortDate(state.labelTo)}`}
		/>
	);
}

function NutritionMetricBlock({
	label,
	unit,
	total,
	averagePerDay,
	averagePerLoggedDay,
	accentClassName,
}: {
	label: string;
	unit: string;
	total: number;
	averagePerDay: number;
	averagePerLoggedDay: number | null;
	accentClassName: string;
}) {
	return (
		<div className="grid gap-3 rounded-2xl border bg-background/45 p-3">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-sm font-black">{label}</p>
					<p className="mt-1 text-xs text-muted-foreground">
						مجموع: {formatMetric(total, unit)}
					</p>
				</div>
				<span
					className={cn("mt-1 size-2 rounded-full", accentClassName)}
					aria-hidden="true"
				/>
			</div>
			<div className="grid gap-2 text-xs leading-6 text-muted-foreground">
				<span>میانگین روزانه: {formatMetric(averagePerDay, unit)}</span>
				<span>
					میانگین روزهای ثبت‌شده:{" "}
					{formatMetric(averagePerLoggedDay, unit)}
				</span>
			</div>
		</div>
	);
}

function ComparisonCard({
	progress,
	previous,
	copy,
}: {
	progress: NutritionProgressResponseDto;
	previous?: NutritionBatchProgressResultEnvelope;
	copy: ReturnType<typeof nutritionComparisonCopy>;
}) {
	const currentCalories = progress.summary.totals.calories;
	const previousCalories = previous?.summary.totals.calories ?? null;
	const calorieDelta =
		previousCalories === null ? null : currentCalories - previousCalories;

	return (
		<Card className="rounded-2xl border bg-card/80 shadow-sm">
			<CardHeader>
				<CardTitle className="text-base font-semibold">
					{copy.title}
				</CardTitle>
				<CardDescription>{copy.explanation}</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-3">
				<ExplorerComparisonRow
					label={`فعلی: ${formatExplorerDateRangeLabel(copy.currentRangeLabel)}`}
					value={formatMetric(currentCalories, "کالری")}
				/>
				<ExplorerComparisonRow
					label={`قبلی: ${formatExplorerDateRangeLabel(copy.previousRangeLabel)}`}
					value={formatMetric(previousCalories, "کالری")}
				/>
				<ExplorerComparisonRow
					label="تفاوت کالری"
					value={formatSignedMetric(calorieDelta, "کالری")}
				/>
				<ExplorerComparisonRow
					label="روزهای ثبت‌شده در بازه قبل"
					value={
						previous
							? toPersianDigits(previous.summary.loggedDayCount)
							: "—"
					}
				/>
			</CardContent>
		</Card>
	);
}

function GoalAdherenceCard({
	rows,
}: {
	rows: ReturnType<typeof nutritionGoalAdherenceRows>;
}) {
	return (
		<Card className="rounded-2xl border bg-card/80 shadow-sm">
			<CardHeader>
				<CardTitle className="text-base font-semibold">
					فاصله تا هدف
				</CardTitle>
				<CardDescription>
					میانگین اختلاف روزهایی که هدف غذایی برایشان فعال بوده است.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{rows.length ? (
					<div className="grid gap-2">
						{rows.map((row) => (
							<ExplorerComparisonRow
								key={row.key}
								label={row.label}
								value={formatSignedMetric(
									row.averageDelta,
									row.unit,
								)}
							/>
						))}
					</div>
				) : (
					<Empty className="rounded-2xl border-dashed">
						<EmptyHeader>
							<EmptyTitle>
								هنوز هدفی برای این بازه فعال نیست
							</EmptyTitle>
							<EmptyDescription>
								وقتی هدف تغذیه تنظیم شود، فاصله کالری و ماکروها
								همین‌جا دیده می‌شود.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</CardContent>
		</Card>
	);
}

function MicronutrientTable({
	progress,
}: {
	progress: NutritionProgressResponseDto;
}) {
	const rows = micronutrientRows(progress);

	return (
		<Card className="rounded-2xl border bg-card/80 shadow-sm">
			<CardHeader>
				<CardTitle className="text-base font-semibold">
					ریزمغذی‌ها
				</CardTitle>
				<CardDescription>
					فیبر، قند و سدیم را کنار کالری و ماکروها دنبال کنید.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="text-right">ماده</TableHead>
							<TableHead className="text-right">مجموع</TableHead>
							<TableHead className="text-right">
								میانگین روزانه
							</TableHead>
							<TableHead className="text-right">
								میانگین ثبت‌شده
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => (
							<TableRow key={row.key}>
								<TableCell className="font-bold">
									{row.label}
								</TableCell>
								<TableCell>
									{formatMetric(row.total, row.unit)}
								</TableCell>
								<TableCell>
									{formatMetric(row.averagePerDay, row.unit)}
								</TableCell>
								<TableCell>
									{formatMetric(
										row.averagePerLoggedDay,
										row.unit,
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

function rangeShiftHref(
	state: ReturnType<typeof resolveNutritionExplorerState>,
	direction: "previous" | "next",
) {
	const multiplier = direction === "previous" ? -1 : 1;

	if (state.period === "WEEK") {
		return nutritionExplorerHref({
			...state,
			date: shiftDiaryDate(state.date, multiplier * 7),
		});
	}

	if (state.period === "MONTH") {
		const month =
			direction === "previous"
				? previousMonth(state.month)
				: nextMonth(state.month);
		const range = monthRange(month);
		return nutritionExplorerHref({
			...state,
			date: range.from,
			month,
		});
	}

	const dayCount = daysBetweenInclusive(state.from, state.to);
	const from =
		direction === "previous"
			? shiftDiaryDate(state.from, -dayCount)
			: shiftDiaryDate(state.from, dayCount);
	const to =
		direction === "previous"
			? shiftDiaryDate(state.to, -dayCount)
			: shiftDiaryDate(state.to, dayCount);

	return nutritionExplorerHref({
		...state,
		date: from,
		from,
		to,
	});
}

function nextMonth(month: string) {
	const [year, monthNumber] = month.split("-").map(Number);
	return new Date(Date.UTC(year, monthNumber, 1, 12))
		.toISOString()
		.slice(0, 7);
}

function periodLabel(period: string) {
	switch (period) {
		case "MONTH":
			return "ماهانه";
		case "PHASE":
			return "فاز";
		default:
			return "هفتگی";
	}
}

function coverageLabel(coverage: ReturnType<typeof nutritionCoverageState>) {
	if (!coverage.hasLoggedDays) return "بدون ثبت";
	if (coverage.hasPartialLogging) return "ثبت ناقص";
	return "کامل";
}

function coverageSummary(coverage: ReturnType<typeof nutritionCoverageState>) {
	if (!coverage.hasLoggedDays) return "هنوز غذایی ثبت نشده";
	if (coverage.hasLoggedZeroDay) return "یک روز ثبت صفر دارد";
	if (coverage.hasMissingDays) {
		return `${toPersianDigits(coverage.missingDayCount)} روز خالی مانده`;
	}
	return "همه روزها داده دارند";
}

function formatMetric(value: number | null | undefined, unit: string) {
	if (value === null || value === undefined) return "—";
	return `${formatPersianNumber(value, { maximumFractionDigits: value >= 100 ? 0 : 1 })} ${unit}`;
}

function formatSignedMetric(value: number | null | undefined, unit: string) {
	if (value === null || value === undefined) return "—";
	const sign = value > 0 ? "+" : "";
	return `${toPersianDigits(sign)}${formatMetric(value, unit)}`;
}
