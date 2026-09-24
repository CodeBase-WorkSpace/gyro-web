"use client";

import { ExplorerControls } from "@/components/progress/explorer-controls";
import {
	type WeightExplorerPeriod,
	type WeightExplorerState,
	weightExplorerHref,
	weightExplorerModeHref,
} from "@/lib/progress/weight-explorer";

const periodLabels: Array<{ value: WeightExplorerPeriod; label: string }> = [
	{ value: "PHASE", label: "فاز" },
	{ value: "WEEK", label: "هفته" },
];

export function WeightExplorerControls({
	state,
	today,
	premiumEnabled = true,
}: {
	state: WeightExplorerState;
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
			ariaLabel="انتخاب بازه تحلیل وزن"
			description="بین هفته و فاز جابه‌جا شوید؛ تاریخ مرجع حفظ می‌شود."
			onPeriodHref={(period) => weightExplorerModeHref(state, period)}
			onRangeHref={(range) =>
				weightExplorerHref({
					...state,
					from: range.from,
					to: range.to,
				})
			}
		/>
	);
}
