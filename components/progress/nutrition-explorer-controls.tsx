"use client";

import { ExplorerControls } from "@/components/progress/explorer-controls";
import type { NutritionProgressPeriod } from "@/lib/api/progress";
import {
	nutritionExplorerHref,
	nutritionExplorerModeHref,
	type NutritionExplorerState,
} from "@/lib/progress/nutrition-explorer";

const periodLabels: Array<{ value: NutritionProgressPeriod; label: string }> = [
	{ value: "PHASE", label: "فاز" },
	{ value: "MONTH", label: "ماه" },
	{ value: "WEEK", label: "هفته" },
];

export function NutritionExplorerControls({
	state,
	today,
	premiumEnabled = true,
}: {
	state: NutritionExplorerState;
	today: string;
	premiumEnabled?: boolean;
}) {
	return (
		<ExplorerControls
			period={state.period}
			from={state.from}
			to={state.to}
			today={today}
			premiumEnabled={premiumEnabled}
			periodLabels={periodLabels}
			ariaLabel="انتخاب بازه تحلیل تغذیه"
			description="بین هفته، ماه و فاز جابه‌جا شوید؛ تاریخ مرجع حفظ می‌شود."
			onPeriodHref={(period) => nutritionExplorerModeHref(state, period)}
			onRangeHref={(range) =>
				nutritionExplorerHref({
					...state,
					from: range.from,
					to: range.to,
				})
			}
		/>
	);
}
