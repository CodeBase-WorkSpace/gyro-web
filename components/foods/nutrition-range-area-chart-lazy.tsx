"use client";

import dynamic from "next/dynamic";

import type { NutritionRangeAreaChartPoint } from "./nutrition-range-area-chart";

// Loads recharts on demand so it stays out of the routes' initial bundles.
// The placeholder matches ChartContainer's h-60 to avoid layout shift.
const LazyNutritionRangeAreaChart = dynamic(
	() =>
		import("./nutrition-range-area-chart").then(
			(module) => module.NutritionRangeAreaChart,
		),
	{
		ssr: false,
		loading: () => (
			<div className="h-60 w-full animate-pulse rounded-xl bg-muted/40" />
		),
	},
);

export function NutritionRangeAreaChart({
	points,
}: {
	points: NutritionRangeAreaChartPoint[];
}) {
	return <LazyNutritionRangeAreaChart points={points} />;
}
