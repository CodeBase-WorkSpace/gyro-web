"use client";

import { useRouter } from "next/navigation";
import {useTransition} from "react";

import {DropdownDatePicker} from "@/components/progress/dropdown-date-picker";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ExplorerPeriod = string;

export type ExplorerPeriodOption<TPeriod extends ExplorerPeriod> = {
	value: TPeriod;
	label: string;
};

export function ExplorerControls<TPeriod extends ExplorerPeriod>({
	period,
	from,
	to,
	today,
	periodLabels,
	ariaLabel,
	description,
	onPeriodHref,
	onRangeHref,
	premiumEnabled = true,
}: {
	period: TPeriod;
	from: string;
	to: string;
	today: string;
	periodLabels: Array<ExplorerPeriodOption<TPeriod>>;
	ariaLabel: string;
	description: string;
	onPeriodHref: (period: TPeriod) => string;
	onRangeHref: (range: { from: string; to: string }) => string;
	premiumEnabled?: boolean;
}) {
	const router = useRouter();
	const [, startTransition] = useTransition();

	function navigate(href: string) {
		startTransition(() => router.push(href));
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-3 rounded-2xl border bg-card/70 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm font-black">نمای تحلیل</p>
					<p className="mt-1 text-xs leading-6 text-muted-foreground">
						{description}
					</p>
				</div>
				<ToggleGroup
					dir="ltr"
					value={[period]}
					aria-label={ariaLabel}
					variant="outline"
					size="lg"
					spacing={0}
					className="w-full sm:w-fit"
					onValueChange={(value) => {
						const nextPeriod = value[0] as TPeriod | undefined;
						if (!nextPeriod || nextPeriod === period) return;
						navigate(onPeriodHref(nextPeriod));
					}}
				>
					{periodLabels.map((item) => (
						<ToggleGroupItem
							key={item.value}
							value={item.value}
							className="flex-1 sm:flex-none inline-20"
							aria-label={`نمای ${item.label}`}
							disabled={!premiumEnabled && item.value !== "WEEK"}
							title={!premiumEnabled && item.value !== "WEEK" ? "این بازه برای پلن رایگان قفل است." : undefined}
						>
							{item.label}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</div>

			{period === "PHASE" ? (
				<div className="grid gap-3 rounded-2xl border bg-card/70 p-3 shadow-sm sm:grid-cols-2">
					<PhaseDateField
						label="شروع فاز"
						value={from}
						today={today}
						ariaLabel="انتخاب شروع فاز"
						onChange={(nextFrom) =>
							navigate(
								onRangeHref({
									from: nextFrom,
									to: nextFrom.localeCompare(to) > 0 ? nextFrom : to,
								}),
							)
						}
					/>
					<PhaseDateField
						label="پایان فاز"
						value={to}
						today={today}
						ariaLabel="انتخاب پایان فاز"
						onChange={(nextTo) =>
							navigate(
								onRangeHref({
									from: from.localeCompare(nextTo) > 0 ? nextTo : from,
									to: nextTo,
								}),
							)
						}
					/>
				</div>
			) : null}
		</div>
	);
}

function PhaseDateField({
	label,
	value,
	today,
	ariaLabel,
	onChange,
}: {
	label: string;
	value: string;
	today: string;
	ariaLabel: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="grid gap-2">
			<span className="text-xs font-bold text-muted-foreground">
				{label}
			</span>
      <DropdownDatePicker
        value={value}
        today={today}
        ariaLabel={ariaLabel}
        onChange={onChange}
      />
		</div>
	);
}
