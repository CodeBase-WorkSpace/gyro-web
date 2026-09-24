"use client";

import { useEffect, useId, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";

import {
	type ChartConfig,
	ChartContainer,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import {
	formatNutritionRangeChartDate,
	NUTRITION_CALORIE_VISUAL_DIVISOR,
} from "@/lib/progress/nutrition-chart";

export type NutritionRangeAreaChartPoint = {
	date: string;
	label: string;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
};

const persianNumberFormatter = new Intl.NumberFormat("fa-IR", {
	maximumFractionDigits: 1,
});

const chartConfig = {
	caloriesVisual: {
		label: "کالری",
		color: "var(--nutrient-calories)",
	},
	calories: {
		label: "کالری",
		color: "var(--nutrient-calories)",
	},
	protein: {
		label: "پروتئین",
		color: "var(--nutrient-protein)",
	},
	carbs: {
		label: "کربوهیدرات",
		color: "var(--nutrient-carbs)",
	},
	fat: {
		label: "چربی",
		color: "var(--nutrient-fat)",
	},
} satisfies ChartConfig;

export function NutritionRangeAreaChart({
	points,
}: {
	points: NutritionRangeAreaChartPoint[];
}) {
	const gradientId = useId().replace(/:/g, "");
	const tooltipTrigger = useCoarsePointer() ? "click" : "hover";
	const chartPoints = points.map((point) => ({
		...point,
		caloriesVisual: point.calories / NUTRITION_CALORIE_VISUAL_DIVISOR,
	}));

	return (
		<ChartContainer
			config={chartConfig}
			className="h-60 w-full aspect-auto"
			dir="ltr"
		>
			<AreaChart
				accessibilityLayer
				data={chartPoints}
				margin={{
					left: 8,
					right: 8,
					top: 12,
				}}
			>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey="date"
					tickLine={false}
					axisLine={false}
					tickMargin={10}
					minTickGap={30}
					interval="preserveStartEnd"
					tickFormatter={(value) =>
						formatNutritionRangeChartDate(String(value))
					}
				/>
				<YAxis
					hide
					domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.12)]}
				/>
				<ChartTooltip
					trigger={tooltipTrigger}
					cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
					content={
						<ChartTooltipContent
							indicator="dot"
							labelFormatter={(_, payload) => {
								const date = payload[0]?.payload?.date;
								return date
									? formatNutritionRangeChartDate(
											String(date),
										)
									: "";
							}}
							formatter={(value, name, item) => {
								const valueKey =
									name as keyof typeof chartConfig;
								const displayValue =
									valueKey === "calories" ||
									valueKey === "caloriesVisual"
										? item.payload.calories
										: value;

								return (
									<div
										className="flex w-full items-center justify-between gap-3 font-sans"
										dir="rtl"
									>
										<span className="text-muted-foreground">
											{chartConfig[valueKey]?.label ??
												name}
										</span>
										<span className="font-semibold tabular-nums text-foreground">
											{persianNumberFormatter.format(
												Number(displayValue),
											)}
										</span>
									</div>
								);
							}}
						/>
					}
				/>
				<Legend content={<ChartLegendContent />} />
				<defs>
					<linearGradient
						id={`${gradientId}-calories`}
						x1="0"
						y1="0"
						x2="0"
						y2="1"
					>
						<stop
							offset="5%"
							stopColor="var(--color-calories)"
							stopOpacity={0.34}
						/>
						<stop
							offset="95%"
							stopColor="var(--color-calories)"
							stopOpacity={0.04}
						/>
					</linearGradient>
					<linearGradient
						id={`${gradientId}-protein`}
						x1="0"
						y1="0"
						x2="0"
						y2="1"
					>
						<stop
							offset="5%"
							stopColor="var(--color-protein)"
							stopOpacity={0.3}
						/>
						<stop
							offset="95%"
							stopColor="var(--color-protein)"
							stopOpacity={0.03}
						/>
					</linearGradient>
					<linearGradient
						id={`${gradientId}-carbs`}
						x1="0"
						y1="0"
						x2="0"
						y2="1"
					>
						<stop
							offset="5%"
							stopColor="var(--color-carbs)"
							stopOpacity={0.28}
						/>
						<stop
							offset="95%"
							stopColor="var(--color-carbs)"
							stopOpacity={0.03}
						/>
					</linearGradient>
					<linearGradient
						id={`${gradientId}-fat`}
						x1="0"
						y1="0"
						x2="0"
						y2="1"
					>
						<stop
							offset="5%"
							stopColor="var(--color-fat)"
							stopOpacity={0.28}
						/>
						<stop
							offset="95%"
							stopColor="var(--color-fat)"
							stopOpacity={0.03}
						/>
					</linearGradient>
				</defs>
				<Area
					dataKey="caloriesVisual"
					name="calories"
					type="natural"
					fill={`url(#${gradientId}-calories)`}
					fillOpacity={1}
					stroke="var(--color-calories)"
					strokeWidth={2}
				/>
				<Area
					dataKey="protein"
					type="natural"
					fill={`url(#${gradientId}-protein)`}
					fillOpacity={1}
					stroke="var(--color-protein)"
					strokeWidth={2}
				/>
				<Area
					dataKey="carbs"
					type="natural"
					fill={`url(#${gradientId}-carbs)`}
					fillOpacity={1}
					stroke="var(--color-carbs)"
					strokeWidth={2}
				/>
				<Area
					dataKey="fat"
					type="natural"
					fill={`url(#${gradientId}-fat)`}
					fillOpacity={1}
					stroke="var(--color-fat)"
					strokeWidth={2}
				/>
			</AreaChart>
		</ChartContainer>
	);
}

function useCoarsePointer() {
	const [coarsePointer, setCoarsePointer] = useState(false);

	useEffect(() => {
		const query = window.matchMedia("(pointer: coarse)");

		function update() {
			setCoarsePointer(query.matches);
		}

		update();
		query.addEventListener("change", update);
		return () => query.removeEventListener("change", update);
	}, []);

	return coarsePointer;
}

export {
	NutritionRangeAreaChart as WeeklyNutrientAreaChart,
	type NutritionRangeAreaChartPoint as WeeklyNutrientAreaChartPoint,
	formatNutritionRangeChartDate,
};
