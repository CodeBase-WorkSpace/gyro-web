import Link from "next/link";
import {
	ArrowDownIcon,
	ArrowRightIcon,
	ArrowUpIcon,
	LightbulbIcon,
	MinusIcon,
	SparklesIcon,
} from "lucide-react";

import { QuickAddClient } from "@/components/dashboard/quick-add-client";
import { CoachObservation } from "@/components/dashboard/coach-observation";
import { CalculatorRerunCta } from "@/components/dashboard/calculator-rerun-cta";
import { RecalibrationCard } from "@/components/dashboard/recalibration-card";
import { WeightNudge } from "@/components/progress/weight-nudge";
import { buttonVariants } from "@/components/ui/button";
import type {
	NutritionCoachInsight,
	NutritionCoachInsightTrend,
	NutritionCoachState,
} from "@/lib/api/nutrition-coach";
import { formatPersianNumber } from "@/lib/format";
import {
	calorieTargetComparisonCopy,
	goalForecastCopy,
	measuredTdeeCopy,
	trendExplanationCopy,
	weekendGapCopy,
} from "@/lib/nutrition-coach/evidence-copy";
import {
	coachTipForDay,
	coachTips,
	formatCoachDateTime,
	getNutritionCoachPresentation,
} from "@/lib/nutrition-coach/presentation";
import { cn } from "@/lib/utils";

export function NutritionCoachCard({
	coach,
	date,
	timeZone,
	hasConfiguredGoal,
	canWriteDiary,
	showCalculatorRerunPrompt,
}: {
	coach: NutritionCoachState;
	date: string;
	timeZone: string;
	hasConfiguredGoal: boolean;
	canWriteDiary: boolean;
	showCalculatorRerunPrompt: boolean;
}) {
	const presentation = getNutritionCoachPresentation(coach);
	if (!presentation) return null;

	// A pending suggestion is a state of this card, not a second card beside it. The
	// embedded form still owns the only accept/dismiss controls; the shell, insights
	// and tip stay, so accepting a suggestion no longer swaps the whole surface out.
	const recommendation =
		presentation.actions.includes("recalibration") &&
		coach.recommendation?.status === "PENDING"
			? coach.recommendation
			: null;

	const headingId = "nutrition-coach-heading";
	return (
		<section
			aria-labelledby={headingId}
			className={cn(
				"min-h-128 rounded-2xl border px-4 py-4 shadow-sm sm:px-5",
				presentation.tone === "primary"
					? "border-primary/25 bg-primary/5"
					: "border-border bg-muted/35",
			)}
		>
			<div className="flex min-w-0 items-start gap-3">
				<span
					className={cn(
						"mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
						presentation.tone === "primary"
							? "bg-primary/12 text-primary"
							: "bg-muted text-muted-foreground",
					)}
				>
					<SparklesIcon className="size-4" aria-hidden="true" />
				</span>
				<div className="min-w-0 flex-1">
					<h2
						id={headingId}
						className="font-heading text-base font-bold leading-6"
					>
						{presentation.title}
					</h2>
					{/* The embedded suggestion opens with the same claim in concrete numbers,
              so the generic summary line would only repeat it. */}
					{recommendation ? null : (
						<p className="mt-1 text-sm leading-7 text-muted-foreground">
							{presentation.description}
						</p>
					)}
				</div>
			</div>

			{recommendation ? (
				<RecalibrationCard suggestion={recommendation} embedded />
			) : null}

			{showCalculatorRerunPrompt ? <CalculatorRerunCta /> : null}

			{presentation.showCollectingProgress && coach.collecting ? (
				<dl className="mt-4 grid gap-2 text-sm grid-cols-3">
					<ProgressDatum
						label="روزهای وزن‌کشی"
						value={
							coach.collecting.weighInDays ??
							coach.collecting.weighIns
						}
						required={
							coach.collecting.weighInDaysRequired ??
							coach.collecting.weighInsRequired
						}
					/>
					<ProgressDatum
						label="بازه ثبت وزن"
						value={
							coach.collecting.weightSpanDays ??
							coach.collecting.spanDays
						}
						required={
							coach.collecting.weightSpanDaysRequired ??
							coach.collecting.spanDaysRequired
						}
					/>
					<ProgressDatum
						label={
							coach.collecting.foodEvidenceDays === undefined
								? "پوشش ثبت غذا"
								: "روزهای ثبت غذا"
						}
						value={
							coach.collecting.foodEvidenceDays ??
							coach.collecting.coveragePercent
						}
						required={
							coach.collecting.foodEvidenceDaysRequired ??
							coach.collecting.coverageRequired
						}
						suffix={
							coach.collecting.foodEvidenceDays === undefined
								? "٪"
								: ""
						}
					/>
				</dl>
			) : null}

			{presentation.showWaitingTime && coach.waiting ? (
				<dl className="mt-4 grid gap-2 rounded-xl border border-border/70 bg-background/65 px-3 py-2 text-sm leading-6 sm:grid-cols-2">
					<div>
						<dt className="text-xs text-muted-foreground">
							زمان اعمال
						</dt>
						<dd className="font-medium text-foreground">
							<time dateTime={coach.waiting.appliedAt}>
								{formatCoachDateTime(
									coach.waiting.appliedAt,
									timeZone,
								)}
							</time>
						</dd>
					</div>
					<div>
						<dt className="text-xs text-muted-foreground">
							بررسی بعدی
						</dt>
						<dd className="font-medium text-foreground">
							<time dateTime={coach.waiting.nextEvaluationAt}>
								{formatCoachDateTime(
									coach.waiting.nextEvaluationAt,
									timeZone,
								)}
							</time>
						</dd>
					</div>
				</dl>
			) : null}

			{coach.observedProgress ? (
				<dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
					{coach.observedProgress.averageIntakeCalories ==
					null ? null : (
						<div className="rounded-xl border border-border/70 bg-background/55 px-3 py-2">
							<dt className="text-xs text-muted-foreground">
								میانگین کالری ثبت‌شده
							</dt>
							<dd className="mt-1 font-bold tabular-nums">
								{formatPersianNumber(
									Math.round(
										coach.observedProgress
											.averageIntakeCalories,
									),
								)}
								<span className="mr-1 text-xs font-normal text-muted-foreground">
									کالری
								</span>
							</dd>
						</div>
					)}
					{coach.observedProgress.observedKgPerWeek == null ? null : (
						<div className="rounded-xl border border-border/70 bg-background/55 px-3 py-2">
							<dt className="text-xs text-muted-foreground">
								روند وزن ثبت‌شده
							</dt>
							<dd
								className="mt-1 font-bold tabular-nums"
								dir="ltr"
							>
								{formatPersianNumber(
									coach.observedProgress.observedKgPerWeek,
									{ maximumFractionDigits: 2 },
								)}
								<span className="ml-1 text-xs font-normal text-muted-foreground">
									kg/week
								</span>
							</dd>
						</div>
					)}
				</dl>
			) : null}

			{presentation.actions.includes("billing") ? (
				<Link
					href="/profile/billing"
					className={cn(
						buttonVariants({ size: "xl" }),
						"mt-4 w-full sm:w-auto",
					)}
				>
					مشاهده طرح‌ها
					<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
				</Link>
			) : null}
			{coach.advancedScheduleAccess?.degraded &&
			coach.advancedScheduleAccess.preserved ? (
				<aside className="mt-4 rounded-2xl border border-primary/25 bg-primary/8 p-3">
					<p className="text-sm font-bold">
						برنامه پیشرفته‌ات ذخیره مانده است
					</p>
					<p className="mt-1 text-sm leading-7 text-muted-foreground">
						با تمدید اشتراک، همان الگوی روزانه دوباره فعال می‌شود.
					</p>
					<Link
						href="/profile/billing"
						className={cn(
							buttonVariants({ variant: "outline", size: "sm" }),
							"mt-3",
						)}
					>
						بررسی تمدید اشتراک
						<ArrowRightIcon
							data-icon="inline-end"
							aria-hidden="true"
						/>
					</Link>
				</aside>
			) : null}
			{presentation.actions.includes("food") ||
			presentation.actions.includes("weight") ? (
				<div className="mt-4 flex flex-wrap items-center gap-2">
					{presentation.actions.includes("food") ? (
						<QuickAddClient
							surface="responsive"
							trigger="food"
							date={date}
							canWriteDiary={canWriteDiary}
							foodTriggerPresentation="full"
						/>
					) : null}
					{presentation.actions.includes("weight") ? (
						<WeightNudge
							date={date}
							hasConfiguredGoal={hasConfiguredGoal}
							actionSize="xl"
							actionClassName="text-sm"
							presentation="action"
						/>
					) : null}
				</div>
			) : null}

			<div className="mt-4 border-t border-border/70 pt-4">
				<p className="text-xs font-medium text-muted-foreground">
					مشاهده امروز
				</p>
				{presentation.insights.length ? (
					/* Product invariant: mobile and desktop render the same ranked
             observations. Responsive hiding requires explicit product approval. */
					<ul
						className="mt-2 grid gap-2"
						aria-label="مشاهده‌های مربی"
					>
						{presentation.insights.map((insight) => (
							<Insight
								key={insight.impressionId}
								insight={insight}
							/>
						))}
					</ul>
				) : (
					<p className="mt-2 flex gap-2 rounded-xl bg-background/50 px-3 py-2 text-sm leading-6 text-muted-foreground">
						<LightbulbIcon
							className="mt-1 size-4 shrink-0 text-primary"
							aria-hidden="true"
						/>
						<span>{coachTipForDay(coach.asOf, timeZone)}</span>
					</p>
				)}
			</div>
		</section>
	);
}

function ProgressDatum({
	label,
	value,
	required,
	suffix = "",
}: {
	label: string;
	value: number;
	required: number;
	suffix?: string;
}) {
	return (
		<div className="rounded-xl border border-border/70 bg-background/55 px-3 py-2">
			<dt className="text-xs text-muted-foreground">{label}</dt>
			<dd className="mt-1 font-bold tabular-nums">
				{formatPersianNumber(value)}
				{suffix}{" "}
				<span className="font-normal text-muted-foreground">
					از {formatPersianNumber(required)}
					{suffix}
				</span>
			</dd>
		</div>
	);
}

function Insight({ insight }: { insight: NutritionCoachInsight }) {
	const insightTrend =
		insight.kind === "SCORE_TREND" || insight.kind === "PROTEIN_CONSISTENCY"
			? insight.trend
			: undefined;
	const trend = trendCopy(insightTrend);
	const TrendIcon =
		insightTrend === "UP"
			? ArrowUpIcon
			: insightTrend === "DOWN"
				? ArrowDownIcon
				: MinusIcon;

	return (
		<CoachObservation
			impressionId={insight.impressionId}
			className="rounded-xl border border-border/70 bg-background/55 px-3 py-2.5"
		>
			<InsightContent insight={insight} />
			{trend ? (
				<p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
					<TrendIcon className="size-3.5" aria-hidden="true" />
					{trend}
				</p>
			) : null}
		</CoachObservation>
	);
}

function InsightContent({ insight }: { insight: NutritionCoachInsight }) {
	if (insight.kind === "COACH_TIP") {
		const tip = coachTips[Math.floor(insight.value)] ?? coachTips[0];
		return (
			<p className="flex gap-2 text-sm leading-6 text-muted-foreground">
				<LightbulbIcon
					className="mt-1 size-4 shrink-0 text-primary"
					aria-hidden="true"
				/>
				<span>{tip}</span>
			</p>
		);
	}
	if (insight.kind === "CALORIE_ADHERENCE") {
		const comparison = calorieTargetComparisonCopy(insight);
		if (!comparison) return null;
		return (
			<p className="text-sm leading-6 text-muted-foreground">
				{comparison}
			</p>
		);
	}
	if (insight.kind === "WEEKEND_GAP") {
		const copy = weekendGapCopy(insight);
		if (!copy) return null;
		return (
			<>
				<p className="text-xs text-muted-foreground">{copy.label}</p>
				<p className="mt-1 text-sm leading-6">{copy.statement}</p>
				<p className="mt-1 text-xs leading-6 text-muted-foreground">
					{copy.evidence}
				</p>
			</>
		);
	}
	if (insight.kind === "TREND_EXPLANATION") {
		const copy = trendExplanationCopy(insight);
		if (!copy) return null;
		return (
			<>
				<p className="text-xs text-muted-foreground">{copy.label}</p>
				<p className="mt-1 text-sm leading-6">{copy.statement}</p>
				<details
					className="group mt-2 rounded-lg border border-border/60 bg-background/45"
					dir="rtl"
				>
					<summary className="cursor-pointer list-none px-2.5 py-2 text-xs font-bold marker:content-none">
						<span className="flex items-center justify-between gap-2">
							{copy.disclosureAction}
							<span
								className="text-muted-foreground transition-transform group-open:rotate-180"
								aria-hidden="true"
							>
								⌄
							</span>
						</span>
					</summary>
					<p className="border-t border-border/60 px-2.5 py-2 text-xs leading-6 text-muted-foreground">
						{copy.explainer}
					</p>
				</details>
			</>
		);
	}
	if (insight.kind === "GOAL_FORECAST") {
		const copy = goalForecastCopy(insight);
		if (!copy) return null;
		return (
			<>
				<p className="text-xs text-muted-foreground">{copy.label}</p>
				<p className="mt-1 text-sm leading-6">{copy.statement}</p>
				<p className="mt-1 text-xs leading-6 text-muted-foreground">
					{copy.originalPlanLabel}
				</p>
				{copy.note ? (
					<p className="mt-1 text-xs leading-6 text-muted-foreground">
						{copy.note}
					</p>
				) : null}
				{/* One semantic ordered list of the same four blocks on every viewport. The
            grid changes the layout at wider widths, never the content or block count. */}
				<ol
					className="mt-2 grid grid-cols-2 gap-2s"
					aria-label="مراحل مسیر هدف"
				>
					{copy.milestones.map((milestone) => (
						<li
							key={milestone.progressLabel}
							className={cn(
								"rounded-lg border px-2.5 py-2",
								milestone.state === "NEXT"
									? "border-primary/30 bg-primary/5"
									: "border-border/60 bg-background/45",
							)}
						>
							<p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
								<span>{milestone.progressLabel}</span>
								{/* The state must never be carried by the border colour alone. */}
								<span
									className={cn(
										"rounded px-1.5 py-0.5 text-[0.6875rem] leading-4",
										milestone.state === "NEXT"
											? "bg-primary/12 font-bold text-primary"
											: "bg-muted text-muted-foreground",
									)}
								>
									{milestone.stateLabel}
								</span>
							</p>
							<p className="mt-0.5 text-sm font-bold tabular-nums">
								{milestone.weight}
							</p>
							<p className="mt-1 text-xs leading-6 text-muted-foreground">
								{milestone.plannedLabel}
							</p>
							{milestone.forecastLabel ? (
								<p className="text-xs leading-6 text-muted-foreground">
									{milestone.forecastLabel}
								</p>
							) : null}
						</li>
					))}
				</ol>
			</>
		);
	}
	if (insight.kind === "MEASURED_TDEE") {
		const copy = measuredTdeeCopy(insight);
		if (!copy) return null;
		return (
			<>
				<p className="text-xs text-muted-foreground">{copy.label}</p>
				<p className="mt-1 font-bold tabular-nums">{copy.value}</p>
				<p className="mt-1 text-xs leading-6 text-muted-foreground">
					{copy.evidence}
				</p>
				<details
					className="group mt-2 rounded-lg border border-border/60 bg-background/45"
					dir="rtl"
				>
					<summary className="cursor-pointer list-none px-2.5 py-2 text-xs font-bold marker:content-none">
						<span className="flex items-center justify-between gap-2">
							{copy.disclosureAction}
							<span
								className="text-muted-foreground transition-transform group-open:rotate-180"
								aria-hidden="true"
							>
								⌄
							</span>
						</span>
					</summary>
					<p className="border-t border-border/60 px-2.5 py-2 text-xs leading-6 text-muted-foreground">
						{copy.explainer}
					</p>
				</details>
			</>
		);
	}
	if (insight.kind === "SCORE_TREND") {
		const currentDays =
			insight.loggedDayCount === undefined
				? null
				: formatPersianNumber(insight.loggedDayCount, {
						maximumFractionDigits: 0,
					});
		const previousDays =
			insight.previousLoggedDayCount === undefined
				? null
				: formatPersianNumber(insight.previousLoggedDayCount, {
						maximumFractionDigits: 0,
					});
		return (
			<>
				<p className="text-xs text-muted-foreground">
					{currentDays && previousDays
						? `تغییر امتیاز ${currentDays} روز ثبت‌شده نسبت به ${previousDays} روز پیشین`
						: "تغییر امتیاز در بازه اخیر"}
				</p>
				<p className="mt-1 font-bold tabular-nums">
					{insight.value > 0 ? "+" : ""}
					{formatPersianNumber(insight.value, {
						maximumFractionDigits: 0,
					})}{" "}
					امتیاز
				</p>
			</>
		);
	}
	if (insight.kind === "BEST_DAY") {
		const days =
			insight.loggedDayCount === undefined
				? null
				: formatPersianNumber(insight.loggedDayCount, {
						maximumFractionDigits: 0,
					});
		return (
			<>
				<p className="text-xs text-muted-foreground">
					{days
						? `بهترین روز در ${days} روز ثبت‌شده از ۷ روز گذشته`
						: "بهترین روز در بازه اخیر"}
				</p>
				<p className="mt-1 font-bold">
					{insight.date ? `${persianWeekday(insight.date)}؛ ` : ""}
					<span className="tabular-nums">
						امتیاز{" "}
						{formatPersianNumber(insight.value, {
							maximumFractionDigits: 0,
						})}
					</span>
				</p>
			</>
		);
	}

	if (insight.kind === "PROTEIN_CONSISTENCY") {
		const loggedDays = formatPersianNumber(insight.loggedDayCount, {
			maximumFractionDigits: 0,
		});
		return (
			<>
				<p className="text-xs text-muted-foreground">
					{`پروتئین کافی در ${loggedDays} روز ثبت‌شده از ۷ روز گذشته`}
				</p>
				<p className="mt-1 font-bold tabular-nums">
					{formatPersianNumber(insight.value, {
						maximumFractionDigits: 0,
					})}
					٪
				</p>
			</>
		);
	}
	return (
		<>
			<p className="text-xs text-muted-foreground">تداوم ثبت غذا</p>
			<p className="mt-1 font-bold tabular-nums">
				{formatPersianNumber(insight.value, {
					maximumFractionDigits: 0,
				})}
				{insight.capped ? "+ روز" : " روز"}
			</p>
		</>
	);
}

function persianWeekday(date: string) {
	const weekdays = [
		"یکشنبه",
		"دوشنبه",
		"سه‌شنبه",
		"چهارشنبه",
		"پنجشنبه",
		"جمعه",
		"شنبه",
	];
	const day = new Date(`${date}T00:00:00Z`).getUTCDay();
	return weekdays[day] ?? date;
}

function trendCopy(trend: NutritionCoachInsightTrend | undefined) {
	if (trend === "UP") return "رو به بهبود";
	if (trend === "DOWN") return "کمتر از قبل";
	if (trend === "STABLE") return "بدون تغییر";
	return null;
}
