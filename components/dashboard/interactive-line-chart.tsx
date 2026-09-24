"use client";

import { useMemo, useState, type PointerEvent } from "react";

import { selectVisibleLabelIndices } from "@/lib/charts/label-thinning";
import { cn } from "@/lib/utils";

const CHART_WIDTH = 640;
const PLOT_LEFT = 24;
const PLOT_RIGHT = 616;
const PLOT_TOP = 24;
const PLOT_BOTTOM = 32;
const PLOT_SPAN = PLOT_RIGHT - PLOT_LEFT;
const SNAP_THRESHOLD_PX = 12;
/**
 * Minimum horizontal room between two visible axis labels, in viewBox units. The chart
 * scales as a whole from a fixed viewBox, so this holds at every rendered size without
 * measuring text.
 */
const MIN_LABEL_GAP_UNITS = 56;

export type ChartSeries = {
	label: string;
	values: number[];
	strokeClass: string;
	dotClass: string;
	color?: string;
	unit?: string;
	/** Renders the path dashed. Used to mark a derived series apart from measurements. */
	dashed?: boolean;
	/** Defaults to true. False draws the path alone, with no per-point markers. */
	showDots?: boolean;
};

export function InteractiveLineChart({
	series,
	labels,
	height,
	ariaLabel,
	target,
	scaleMode = "shared-range",
	xAxisDirection = "asc",
	xFractions,
}: {
	series: ChartSeries[];
	labels: string[];
	height: number;
	ariaLabel: string;
	target?: number;
	scaleMode?: "shared-range" | "stacked-normalized";
	xAxisDirection?: "asc" | "desc";
	/**
	 * Horizontal position of each label as a 0..1 fraction of the plot width, for data
	 * that is not evenly spaced in whatever the axis measures. Omit for even spacing.
	 *
	 * Must be the same length as `labels`, finite, within 0..1, and non-decreasing.
	 * Invalid input throws outside production and falls back to even spacing inside it,
	 * rather than being zipped against mismatched data.
	 */
	xFractions?: number[];
}) {
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	// Geometry is memoized so pointer-move snaps (setActiveIndex) don't
	// recompute point positions on every event.
	const { chartLabels, chartXFractions, visibleSeries, pointsBySeries } = useMemo(() => {
		const chartLabels =
			xAxisDirection === "desc" ? [...labels].reverse() : labels;
		// Reversing the axis mirrors positions as well as order, so relative spacing
		// survives: [0, 0.3, 1] becomes [0, 0.7, 1].
		const orientedFractions =
			xAxisDirection === "desc" && xFractions
				? [...xFractions].reverse().map((fraction) => 1 - fraction)
				: xFractions;
		const chartXFractions = resolveXFractions(orientedFractions, labels.length);
		const xPositions = chartXFractions
			? chartXFractions.map((fraction) => PLOT_LEFT + fraction * PLOT_SPAN)
			: undefined;
		const visibleSeries = series
			.filter((item) => item.values.length === labels.length)
			.map((item) => ({
				...item,
				values:
					xAxisDirection === "desc"
						? [...item.values].reverse()
						: item.values,
			}));
		const visibleValues = visibleSeries.flatMap((item) => item.values);
		const sharedRange = chartRange(visibleValues, target);
		const pointsBySeries = visibleSeries.map((item, index) => {
			if (scaleMode === "stacked-normalized") {
				const range = chartRange(item.values);
				return chartPointsInBand(
					item.values,
					range.min,
					range.max,
					height,
					index,
					visibleSeries.length,
					xPositions,
				);
			}

			return chartPoints(
				item.values,
				sharedRange.min,
				sharedRange.max,
				height,
				xPositions,
			);
		});

		return { chartLabels, chartXFractions, visibleSeries, pointsBySeries };
	}, [series, labels, height, target, scaleMode, xAxisDirection, xFractions]);
	const activeX =
		activeIndex === null ? null : pointsBySeries[0]?.[activeIndex]?.x;

	function updateSnap(event: PointerEvent<SVGSVGElement>) {
		const bounds = event.currentTarget.getBoundingClientRect();
		const pointerX = event.clientX - bounds.left;
		const nearest = pointsBySeries[0]?.reduce<
			{ index: number; distance: number } | undefined
		>((closest, point, index) => {
			const distance = Math.abs(
				(point.x / CHART_WIDTH) * bounds.width - pointerX,
			);
			return !closest || distance < closest.distance
				? { index, distance }
				: closest;
		}, undefined);

		setActiveIndex(
			nearest && nearest.distance <= SNAP_THRESHOLD_PX
				? nearest.index
				: null,
		);
	}

	return (
		<div className="flex flex-col gap-3" dir="ltr">
			<div className="relative">
				<svg
					className="w-full touch-pan-y outline-none"
					height={height}
					viewBox={`0 0 ${CHART_WIDTH} ${height}`}
					role="img"
					aria-label={ariaLabel}
					tabIndex={0}
					onPointerMove={updateSnap}
					onPointerLeave={() => setActiveIndex(null)}
					onFocus={() =>
						setActiveIndex(
							visibleSeries[0]?.values.length ? 0 : null,
						)
					}
					onBlur={() => setActiveIndex(null)}
					onKeyDown={(event) => {
						if (!visibleSeries[0]?.values.length) return;
						if (
							event.key === "ArrowLeft" ||
							event.key === "ArrowRight"
						) {
							event.preventDefault();
							setActiveIndex((current) => {
								const index = current ?? 0;
								return Math.min(
									Math.max(
										index +
											(event.key === "ArrowLeft"
												? -1
												: 1),
										0,
									),
									chartLabels.length - 1,
								);
							});
						}
					}}
				>
					<ChartGrid height={height} />
					{target === undefined ? null : (
						<TargetLine
							target={target}
							points={pointsBySeries[0] ?? []}
							height={height}
						/>
					)}
					{visibleSeries.map((item, index) => (
						<ChartPath
							key={item.label}
							points={pointsBySeries[index]}
							className={item.strokeClass}
							color={item.color}
							activeIndex={activeIndex}
							dashed={item.dashed}
							showDots={item.showDots}
						/>
					))}
					{activeX === null ? null : (
						<line
							x1={activeX}
							x2={activeX}
							y1={PLOT_TOP}
							y2={height - PLOT_BOTTOM}
							className="stroke-foreground/60 motion-safe:transition-[x1,x2] motion-safe:duration-100 motion-safe:ease-out"
							strokeDasharray="5 6"
						/>
					)}
				</svg>
				{activeIndex === null || activeX === null ? null : (
					<div
						className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-lg border bg-popover/95 px-2 py-1.5 text-xs shadow-sm backdrop-blur motion-safe:transition-[left,transform] motion-safe:duration-100 motion-safe:ease-out"
						style={{ left: `${(activeX / CHART_WIDTH) * 100}%` }}
					>
						<strong className="block whitespace-nowrap text-center" dir="auto">
							{chartLabels[activeIndex]}
						</strong>
						<div className="mt-1 grid gap-0.5 text-muted-foreground">
							{visibleSeries.map((item) => (
								<span
									key={item.label}
									className="whitespace-nowrap"
									dir="auto"
								>
									{item.label}:{" "}
									{item.values[activeIndex].toLocaleString(
										"fa-IR",
									)}{" "}
									{item.unit ?? ""}
								</span>
							))}
						</div>
					</div>
				)}
			</div>
			<ChartLabels labels={chartLabels} xFractions={chartXFractions} />
			{visibleSeries.length > 1 ? (
				<ChartLegend series={visibleSeries} />
			) : null}
		</div>
	);
}

function TargetLine({
	target,
	points,
	height,
}: {
	target: number;
	points: Point[];
	height: number;
}) {
	if (!points.length) return null;
	const values = points.map((point) => point.value);
	const { min, max } = chartRange(values, target);
	const targetY = chartY(target, min, max, height);

	return (
		<line
			x1={PLOT_LEFT}
			x2={PLOT_RIGHT}
			y1={targetY}
			y2={targetY}
			className="stroke-primary/50"
			strokeDasharray="6 6"
		/>
	);
}

function ChartGrid({ height }: { height: number }) {
	return (
		<g className="stroke-border">
			{[0, 1, 2, 3].map((item) => (
				<line
					key={item}
					x1={PLOT_LEFT}
					x2={PLOT_RIGHT}
					y1={PLOT_TOP + item * ((height - 56) / 3)}
					y2={PLOT_TOP + item * ((height - 56) / 3)}
					strokeWidth="1"
					opacity="0.7"
				/>
			))}
		</g>
	);
}

function ChartPath({
	points,
	className,
	color,
	activeIndex,
	dashed = false,
	showDots = true,
}: {
	points: Point[];
	className: string;
	color?: string;
	activeIndex: number | null;
	dashed?: boolean;
	showDots?: boolean;
}) {
	const d = points
		.map(
			(point, index) =>
				`${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
		)
		.join(" ");
	return (
		<g>
			<path
				d={d}
				className={cn("fill-none", className)}
				strokeWidth={dashed ? "2" : "3"}
				strokeDasharray={dashed ? "6 6" : undefined}
				strokeLinecap="round"
				strokeLinejoin="round"
				style={color ? { stroke: color } : undefined}
			/>
			{showDots
				? points.map((point, index) => (
						<circle
							key={`${point.x}-${point.y}`}
							cx={point.x}
							cy={point.y}
							r={activeIndex === index ? "6" : "4"}
							className={cn(
								"fill-card motion-safe:transition-[r] motion-safe:duration-100 motion-safe:ease-out",
								className,
							)}
							strokeWidth="3"
							style={color ? { stroke: color } : undefined}
						/>
					))
				: null}
		</g>
	);
}

function ChartLabels({
	labels,
	xFractions,
}: {
	labels: string[];
	xFractions: number[] | null;
}) {
	if (!xFractions) {
		return (
			<div
				className="grid gap-2 text-xs font-bold text-muted-foreground"
				dir="ltr"
				style={{
					gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))`,
				}}
			>
				{labels.map((label) => (
					<span key={label} className="truncate text-center" dir="auto">
						{label}
					</span>
				))}
			</div>
		);
	}

	// Positioned rather than gridded, so a label sits under its own point. Crowded
	// labels are hidden visually but kept in the DOM, so no date is lost to a screen
	// reader just because two weigh-ins fell close together.
	const visible = new Set(
		selectVisibleLabelIndices(xFractions, MIN_LABEL_GAP_UNITS / PLOT_SPAN),
	);
	return (
		<div
			className="relative h-4 text-xs font-bold text-muted-foreground"
			dir="ltr"
		>
			{labels.map((label, index) => {
				const shown = visible.has(index);
				const fraction = xFractions[index] ?? 0;
				return (
					<span
						key={`${index}-${label}`}
						className={cn(
							"absolute top-0 -translate-x-1/2 whitespace-nowrap",
							!shown && "sr-only",
						)}
						style={
							shown
								? {
										left: `${((PLOT_LEFT + fraction * PLOT_SPAN) / CHART_WIDTH) * 100}%`,
									}
								: undefined
						}
						dir="auto"
					>
						{label}
					</span>
				);
			})}
		</div>
	);
}

function ChartLegend({ series }: { series: ChartSeries[] }) {
	return (
		<div className="flex flex-wrap justify-center gap-4 text-xs font-bold text-muted-foreground" dir="rtl">
			{series.map((item) => (
				<span
					key={item.label}
					className="inline-flex items-center gap-2"
				>
					<span
						className={cn("size-2 rounded-full", item.dotClass)}
						style={
							item.color
								? { backgroundColor: item.color }
								: undefined
						}
						aria-hidden="true"
					/>
					{item.label}
				</span>
			))}
		</div>
	);
}

type Point = { x: number; y: number; value: number };

/**
 * Validates caller-supplied fractions, returning null when even spacing should be used.
 *
 * Outside production an invalid array throws rather than silently degrading: a mismatch
 * means the caller's x data and label data have diverged, which is worth surfacing
 * loudly in development and worth absorbing quietly in front of a user.
 */
function resolveXFractions(
	xFractions: number[] | undefined,
	count: number,
): number[] | null {
	if (xFractions === undefined) return null;

	let invalid: string | null = null;
	if (xFractions.length !== count) {
		invalid = `expected ${count} values, received ${xFractions.length}`;
	} else {
		let previous = Number.NEGATIVE_INFINITY;
		for (const fraction of xFractions) {
			if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1) {
				invalid = `values must be finite and within 0..1, received ${fraction}`;
				break;
			}
			if (fraction < previous) {
				invalid = "values must be non-decreasing";
				break;
			}
			previous = fraction;
		}
	}

	if (invalid === null) return xFractions;
	if (process.env.NODE_ENV !== "production") {
		throw new Error(`InteractiveLineChart received invalid xFractions: ${invalid}`);
	}
	return null;
}

function xPositionsFor(count: number, xPositions?: number[]): number[] {
	if (xPositions) return xPositions;
	const xStep = PLOT_SPAN / Math.max(count - 1, 1);
	return Array.from({ length: count }, (_, index) => PLOT_LEFT + index * xStep);
}

function chartPoints(
	values: number[],
	min: number,
	max: number,
	height: number,
	xPositions?: number[],
): Point[] {
	const xs = xPositionsFor(values.length, xPositions);
	return values.map((value, index) => ({
		x: xs[index] ?? PLOT_LEFT,
		y: chartY(value, min, max, height),
		value,
	}));
}

function chartPointsInBand(
	values: number[],
	min: number,
	max: number,
	height: number,
	seriesIndex: number,
	seriesCount: number,
	xPositions?: number[],
): Point[] {
	const xs = xPositionsFor(values.length, xPositions);
	const plotHeight = height - PLOT_TOP - PLOT_BOTTOM;
	const bandHeight = plotHeight / Math.max(seriesCount, 1);
	const bandTop = PLOT_TOP + seriesIndex * bandHeight + 6;
	const bandBottom = PLOT_TOP + (seriesIndex + 1) * bandHeight - 6;

	return values.map((value, index) => ({
		x: xs[index] ?? PLOT_LEFT,
		y: chartYWithin(value, min, max, bandTop, bandBottom),
		value,
	}));
}

function chartRange(values: number[], target?: number) {
	if (values.length === 0 && target === undefined) {
		return { min: -1, max: 1 };
	}

	const rangeValues = target === undefined ? values : [...values, target];
	const rawMin = Math.min(...rangeValues);
	const rawMax = Math.max(...rangeValues);

	if (rawMin === rawMax) {
		const padding = rawMax === 0 ? 1 : Math.abs(rawMax) * 0.1;
		return { min: rawMin - padding, max: rawMax + padding };
	}

	const padding = (rawMax - rawMin) * 0.08;
	return { min: rawMin - padding, max: rawMax + padding };
}

function chartY(value: number, min: number, max: number, height: number) {
	return chartYWithin(value, min, max, PLOT_TOP, height - PLOT_BOTTOM);
}

function chartYWithin(
	value: number,
	min: number,
	max: number,
	top: number,
	bottom: number,
) {
	return top + (1 - (value - min) / (max - min)) * (bottom - top);
}
