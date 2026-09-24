"use client";

import { ArrowUpIcon, CheckIcon } from "lucide-react";
import { type ComponentProps, useEffect, useState } from "react";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {toPersianDigits} from "@/lib/format";
import {cn} from "@/lib/utils";

export type NutritionRingTooltipItem = {
	label: string;
	consumed: number;
	target: number | null;
	unit: string;
	progress: number;
	percentage: number;
	status: "below" | "within" | "above" | "unconfigured";
	distance: number;
	rangeStart: number;
	rangeEnd: number | null;
	dot: string;
};

export function NutritionRingTooltipGrid({
	items,
	hasConfiguredGoal,
}: {
	items: NutritionRingTooltipItem[];
	hasConfiguredGoal: boolean;
}) {
	const coarsePointer = useCoarsePointer();
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	return (
		<div className="grid w-full grid-cols-4 gap-2">
			{items.map((item, index) =>
				coarsePointer ? (
					<Popover
						key={item.label}
						open={openIndex === index}
						onOpenChange={(open) => setOpenIndex(open ? index : null)}
					>
						<PopoverTrigger render={<NutritionStatusButton item={item} />} />
						<PopoverContent
							dir="rtl"
							side="bottom"
							className="w-56 gap-1.5 text-right"
						>
							<NutritionStatusDetails
								item={item}
								hasConfiguredGoal={hasConfiguredGoal}
							/>
						</PopoverContent>
					</Popover>
				) : (
					<TooltipProvider key={item.label} delay={200}>
						<Tooltip>
							<TooltipTrigger render={<NutritionStatusButton item={item} />} />
							<TooltipContent dir="rtl" side="bottom" className="text-right">
								<NutritionStatusDetails
									item={item}
									hasConfiguredGoal={hasConfiguredGoal}
								/>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				),
			)}
		</div>
	);
}

function NutritionStatusButton({
	item,
	className,
	...buttonProps
}: { item: NutritionRingTooltipItem } & ComponentProps<"button">) {
	const status = nutritionStatusCopy(item);
	const isWithinRange = item.status === "within";
	const isAboveRange = item.status === "above";

	return (
		<button
			{...buttonProps}
			type="button"
			className={cn(
				"min-w-0 rounded-xl border bg-background/45 p-2 text-center transition-colors hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-popup-open:bg-accent/50",
				isWithinRange && "border-emerald-500/45 bg-emerald-500/10",
				isAboveRange && "border-amber-500/45 bg-amber-500/10",
				className,
			)}
			aria-label={`جزئیات ${item.label}: ${toPersianDigits(item.percentage)} درصد، ${status.detail}`}
		>
			<span
				className={cn("mx-auto mb-1 block size-2 rounded-full", item.dot)}
				aria-hidden="true"
			/>
			<strong className="block text-sm tabular-nums">
				{item.status === "unconfigured"
					? "—"
					: `${toPersianDigits(item.percentage)}٪`}
			</strong>
			<small className="block truncate text-xs text-muted-foreground">
				{item.label}
			</small>
			<span
				className={cn(
					"mt-1 flex min-h-4 items-center justify-center gap-0.5 text-[0.62rem] font-bold leading-4",
					isWithinRange && "text-emerald-600 dark:text-emerald-400",
					isAboveRange && "text-amber-600 dark:text-amber-400",
					item.status === "below" && "text-muted-foreground",
				)}
			>
				{isWithinRange ? <CheckIcon className="size-3" aria-hidden="true" /> : null}
				{isAboveRange ? <ArrowUpIcon className="size-3" aria-hidden="true" /> : null}
				<span className="truncate">{status.compact}</span>
			</span>
		</button>
	);
}

function NutritionStatusDetails({
	item,
	hasConfiguredGoal,
}: {
	item: NutritionRingTooltipItem;
	hasConfiguredGoal: boolean;
}) {
	const status = nutritionStatusCopy(item);
	const targetRange =
		item.rangeEnd === null
			? `از ${toPersianDigits(item.rangeStart)}٪ به بالا`
			: `${toPersianDigits(item.rangeStart)} تا ${toPersianDigits(item.rangeEnd)}٪`;

	return (
		<>
			<strong className="block text-sm">{item.label}</strong>
			<span className="block text-muted-foreground">
				{hasConfiguredGoal
					? `${toPersianDigits(item.consumed)} از ${toPersianDigits(item.target ?? 0)} ${item.unit}`
					: `${toPersianDigits(item.consumed)} ${item.unit} مصرف‌شده`}
			</span>
			<span className="block font-bold">
				{hasConfiguredGoal
					? `${toPersianDigits(item.percentage)}٪ از هدف روزانه`
					: "برای محاسبه درصد، هدف روزانه را تنظیم کنید."}
			</span>
			{hasConfiguredGoal ? (
				<>
					<span className="block font-bold">{status.detail}</span>
					<span className="block text-muted-foreground">
						محدوده مناسب: {targetRange}
					</span>
				</>
			) : null}
		</>
	);
}

function nutritionStatusCopy(item: NutritionRingTooltipItem) {
	switch (item.status) {
		case "within":
			return { compact: "مناسب", detail: "در محدوده مناسب" };
		case "above":
			return {
				compact: `${toPersianDigits(item.distance)}٪ بالاتر`,
				detail: `${toPersianDigits(item.distance)}٪ بالاتر از محدوده مناسب`,
			};
		case "below":
			return {
				compact: `${toPersianDigits(item.distance)}٪ تا بازه`,
				detail: `${toPersianDigits(item.distance)}٪ تا محدوده مناسب`,
			};
		default:
			return { compact: "بدون هدف", detail: "هدف روزانه تنظیم نشده" };
	}
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
