import {
	ArrowUpDownIcon,
	CalendarDaysIcon,
	LineChartIcon,
	ScaleIcon,
	TrendingDownIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { InteractiveLineChart } from "@/components/dashboard/interactive-line-chart";
import { AppTopBar } from "@/components/design-system/app-top-bar";
import { WeightExplorerControls } from "@/components/progress/weight-explorer-controls";
import {
	ExplorerComparisonRow,
	ExplorerRangeNavigation,
	ExplorerSummaryTile,
} from "@/components/progress/explorer-ui";
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
import {
	getWeightProgress,
	getWeightProgressBatch,
	type WeightBatchProgressResultEnvelope,
	type WeightProgressResponseDto,
} from "@/lib/api/progress";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-api";
import { getSession } from "@/lib/auth/session";
import { getCurrentEntitlement } from "@/lib/api/entitlement";
import { demoSubscriptionState } from "@/lib/subscription/entitlements";
import { resolveDiaryDate } from "@/lib/diary/dashboard-loader";
import { shiftDiaryDate } from "@/lib/diary/date";
import { formatPersianNumber, toPersianDigits } from "@/lib/format";
import {
	buildWeightChartPoints,
	buildWeightChartXFractions,
	buildWeightTrendValues,
	comparisonRangesForWeightExplorer,
	measuredWeightPoints,
	resolveWeightExplorerState,
	weightComparisonCopy,
	weightExplorerHref,
	weightTrendDescription,
} from "@/lib/progress/weight-explorer";
import {
	daysBetweenInclusive,
	formatExplorerDateRangeLabel,
	formatExplorerShortDate,
} from "@/lib/progress/explorer-format";

export const metadata: Metadata = {
	title: "Gyro | تحلیل وزن",
	description: "کاوش هفتگی و فازی وزن، اندازه‌گیری‌ها و تغییرات در Gyro",
};

type WeightExplorerPageProps = {
	searchParams: Promise<{
		period?: string;
		date?: string;
		from?: string;
		to?: string;
	}>;
};

export default async function WeightExplorerPage({
	searchParams,
}: WeightExplorerPageProps) {
	const session = await getSession();

	if (!session.isAuthenticated) {
		redirect("/auth/login?next=%2Fprogress%2Fweight&expired=1");
	}

	const params = await searchParams;
	const selectedDate = resolveDiaryDate(params.date, session.user.timezone);
	const today = resolveDiaryDate(undefined, session.user.timezone);
	const subscription = await loadCurrentEntitlement();
	const premiumEnabled = subscription.premiumGatingDisabled === true || subscription.tier === "ADVANCED";
	const normalizedParams = premiumEnabled ? params : { period: "WEEK", date: params.date };
	const state = resolveWeightExplorerState(
		normalizedParams,
		selectedDate,
		session.user.locale,
	);
	const comparisonRanges = comparisonRangesForWeightExplorer(state);
	const progress = await authenticatedServerRequest(
		(accessToken) => getWeightProgress(state.activeRequest, accessToken),
		{ nextPath: "/progress/weight", retryPolicy: "idempotent" },
	);
	const comparison = premiumEnabled ? await authenticatedServerRequest(
		(accessToken) => getWeightProgressBatch({ ranges: comparisonRanges }, accessToken),
		{ nextPath: "/progress/weight", retryPolicy: "idempotent" },
	) : null;
	const previousComparison = comparison?.results.find(
		(result) => result.requestId === "previous",
	);
	const measurements = premiumEnabled ? measuredWeightPoints(progress) : [];
	const chartPoints = buildWeightChartPoints(progress);
	const trendValues = buildWeightTrendValues(progress, chartPoints);
	const chartXFractions =
		buildWeightChartXFractions(progress, chartPoints) ?? undefined;
	const comparisonCopy = weightComparisonCopy(state);
	const rangeDescription = `${formatExplorerShortDate(progress.from)} تا ${formatExplorerShortDate(progress.to)}`;

	return (
		<div className="mx-auto flex w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10">
			<main
				id="main-content"
				className="flex min-w-0 flex-1 flex-col gap-6"
				aria-label="تحلیل وزن"
			>
					<AppTopBar
						title="تحلیل وزن"
						description={`${periodLabel(progress.period)} | ${rangeDescription}`}
						backLink={{
							href: "/progress",
							label: "بازگشت به پیشرفت",
						}}
						showDateControl={false}
						showMobileDateAction={false}
					/>

					<WeightExplorerControls state={state} today={today} premiumEnabled={premiumEnabled} />

					<RangeNavigation state={state} />

					<section className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
						<ExplorerSummaryTile
							icon={ScaleIcon}
							label="وزن شروع"
							value={formatWeight(progress.summary.startWeightKg)}
							helper="اولین اندازه‌گیری بازه"
						/>
						<ExplorerSummaryTile
							icon={ScaleIcon}
							label="وزن پایان"
							value={formatWeight(progress.summary.endWeightKg)}
							helper="آخرین اندازه‌گیری بازه"
						/>
						<ExplorerSummaryTile
							icon={ArrowUpDownIcon}
							label="تغییر"
							value={formatSignedWeight(
								progress.summary.absoluteChangeKg,
							)}
							helper={trendDirectionLabel(
								progress.summary.trendDirection,
							)}
						/>
						<ExplorerSummaryTile
							icon={CalendarDaysIcon}
							label="اندازه‌گیری"
							value={toPersianDigits(
								progress.summary.measurementCount,
							)}
							helper={`${toPersianDigits(progress.summary.missingDayCount)} روز بدون ثبت`}
						/>
					</section>

					<Card className="rounded-2xl border bg-card/80 shadow-sm">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base font-semibold">
								<LineChartIcon data-icon="inline-start" />
								نمودار وزن
							</CardTitle>
							<CardDescription>
								{weightTrendDescription(progress)}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{chartPoints.length ? (
								<InteractiveLineChart
									// The measured series must stay at index 0: pointer
									// snapping, the crosshair, keyboard focus and the
									// target line all read pointsBySeries[0], and none
									// of them should follow a derived line.
									series={[
										{
											label: "وزن",
											values: chartPoints.map(
												(point) => point.weightKg,
											),
											strokeClass: "stroke-primary",
											dotClass: "bg-primary",
											unit: "kg",
										},
										...(trendValues
											? [
													{
														label: "روند",
														values: trendValues,
														strokeClass:
															"stroke-muted-foreground/60",
														dotClass:
															"bg-muted-foreground/60",
														unit: "kg",
														dashed: true,
														showDots: false,
													},
												]
											: []),
									]}
									labels={chartPoints.map(
										(point) => point.label,
									)}
									xFractions={chartXFractions}
									height={240}
									ariaLabel="نمودار روند وزن بازه انتخاب‌شده"
								/>
							) : (
								<Empty className="rounded-2xl border-dashed">
									<EmptyHeader>
										<EmptyTitle>
											برای این بازه وزنی ثبت نشده است
										</EmptyTitle>
										<EmptyDescription>
											با ثبت وزن، نمودار فقط
											اندازه‌گیری‌های واقعی را نمایش
											می‌دهد.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							)}
						</CardContent>
					</Card>

					{premiumEnabled ? <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
						<ComparisonCard
							progress={progress}
							previous={previousComparison}
							copy={comparisonCopy}
						/>
						<MeasurementsCard
							progress={progress}
							measurements={measurements}
						/>
					</section> : <LockedProgressSection message="مقایسه و جزئیات اندازه‌گیری‌ها در پلن پیشرفته فعال است." />}
			</main>
		</div>
	);
}

function LockedProgressSection({message}: {message: string}) {
	return <section className="rounded-2xl border border-dashed bg-muted/20 p-5 text-center text-sm leading-7 text-muted-foreground" aria-label="قابلیت پیشرفته قفل است">{message}</section>;
}

async function loadCurrentEntitlement() {
	try {
		return await authenticatedServerRequest((accessToken) => getCurrentEntitlement(accessToken), {nextPath: "/progress/weight", retryPolicy: "idempotent"});
	} catch {
		return demoSubscriptionState("FREE");
	}
}

function RangeNavigation({
	state,
}: {
	state: ReturnType<typeof resolveWeightExplorerState>;
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

function ComparisonCard({
	progress,
	previous,
	copy,
}: {
	progress: WeightProgressResponseDto;
	previous?: WeightBatchProgressResultEnvelope;
	copy: ReturnType<typeof weightComparisonCopy>;
}) {
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
					value={formatSignedWeight(
						progress.summary.absoluteChangeKg,
					)}
				/>
				<ExplorerComparisonRow
					label={`قبلی: ${formatExplorerDateRangeLabel(copy.previousRangeLabel)}`}
					value={formatSignedWeight(
						previous?.summary.absoluteChangeKg ?? null,
					)}
				/>
				<ExplorerComparisonRow
					label="تفاوت تغییر وزن"
					value={formatSignedWeight(
						weightChangeDelta(progress, previous),
					)}
				/>
				<ExplorerComparisonRow
					label="ثبت‌های بازه قبل"
					value={
						previous
							? toPersianDigits(previous.summary.measurementCount)
							: "—"
					}
				/>
			</CardContent>
		</Card>
	);
}

function MeasurementsCard({
	progress,
	measurements,
}: {
	progress: WeightProgressResponseDto;
	measurements: ReturnType<typeof measuredWeightPoints>;
}) {
	return (
		<Card className="rounded-2xl border bg-card/80 shadow-sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base font-semibold">
					<TrendingDownIcon data-icon="inline-start" />
					اندازه‌گیری‌های بازه
				</CardTitle>
				<CardDescription>
					روزهای بدون ثبت به نمودار اضافه نمی‌شوند؛ فقط
					اندازه‌گیری‌های واقعی نمایش داده می‌شود.
				</CardDescription>
				<CardAction>
					<span className="rounded-full border bg-background/50 px-3 py-1 text-xs font-bold">
						{toPersianDigits(progress.summary.measurementCount)} ثبت
					</span>
				</CardAction>
			</CardHeader>
			<CardContent>
				{measurements.length ? (
					<div className="grid gap-2">
						{measurements.map((point) => (
							<div
								key={point.date}
								className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border bg-background/45 px-3 py-3"
							>
								<div className="min-w-0">
									<strong className="block text-sm">
										{formatExplorerShortDate(point.date)}
									</strong>
									<p className="mt-1 text-xs text-muted-foreground">
										ثبت وزن
									</p>
								</div>
								<strong className="text-lg font-black tabular-nums">
									{formatWeight(point.weightKg)} kg
								</strong>
							</div>
						))}
					</div>
				) : (
					<Empty className="rounded-2xl border-dashed">
						<EmptyHeader>
							<EmptyTitle>
								اندازه‌گیری‌ای در این بازه نیست
							</EmptyTitle>
							<EmptyDescription>
								برای دیدن روند، یک وزن برای یکی از روزهای این
								بازه ثبت کنید.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</CardContent>
		</Card>
	);
}

function rangeShiftHref(
	state: ReturnType<typeof resolveWeightExplorerState>,
	direction: "previous" | "next",
) {
	const multiplier = direction === "previous" ? -1 : 1;

	if (state.period === "WEEK") {
		return weightExplorerHref({
			...state,
			date: shiftDiaryDate(state.date, multiplier * 7),
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

	return weightExplorerHref({
		...state,
		date: from,
		from,
		to,
	});
}

function weightChangeDelta(
	progress: WeightProgressResponseDto,
	previous?: WeightBatchProgressResultEnvelope,
) {
	const currentChange = progress.summary.absoluteChangeKg;
	const previousChange = previous?.summary.absoluteChangeKg;
	if (
		currentChange === null ||
		previousChange === null ||
		previousChange === undefined
	) {
		return null;
	}
	return currentChange - previousChange;
}

function periodLabel(period: string) {
	return period === "PHASE" ? "فاز" : "هفتگی";
}

function trendDirectionLabel(value: string) {
	switch (value) {
		case "DOWN":
			return "روند کاهشی";
		case "UP":
			return "روند افزایشی";
		case "FLAT":
			return "بدون تغییر";
		default:
			return "داده کافی نیست";
	}
}

function formatWeight(value: number | null | undefined) {
	if (value === null || value === undefined) return "—";
	return formatPersianNumber(value, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 1,
	});
}

function formatSignedWeight(value: number | null | undefined) {
	if (value === null || value === undefined) return "—";
	const sign = value > 0 ? "+" : "";
	return `${toPersianDigits(sign)}${formatWeight(value)} kg`;
}
