import type { LucideIcon } from "lucide-react";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ExplorerRangeNavigation({
	previousHref,
	nextHref,
	label,
}: {
	previousHref: string;
	nextHref: string;
	label: string;
}) {
	return (
		<div className="grid gap-3 rounded-2xl border bg-card/70 p-3 shadow-sm sm:grid-cols-[auto_1fr_auto] sm:items-center">
			<Link
				href={nextHref}
				className={buttonVariants({
					variant: "outline",
					size: "lg",
					className: "w-full sm:w-auto",
				})}
			>
				<ArrowRightIcon data-icon="inline-start" />
				بازه بعد
			</Link>
			<div className="text-center">
				<p className="text-xs font-bold text-muted-foreground">
					بازه فعال
				</p>
				<p className="mt-1 font-black">{label}</p>
			</div>
			<Link
				href={previousHref}
				className={buttonVariants({
					variant: "outline",
					size: "lg",
					className: "w-full sm:w-auto",
				})}
			>
				بازه قبل
				<ArrowLeftIcon data-icon="inline-end" />
			</Link>
		</div>
	);
}

export function ExplorerSummaryTile({
	icon: Icon,
	label,
	value,
	helper,
}: {
	icon: LucideIcon;
	label: string;
	value: string;
	helper: string;
}) {
	return (
		<Card
			size="sm"
			className="rounded-xl border bg-card/80 shadow-sm sm:rounded-2xl"
		>
			<CardHeader className="gap-1">
				<CardTitle className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:text-sm">
					<Icon data-icon="inline-start" />
					{label}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<strong className="block text-xl font-black tabular-nums tracking-normal sm:text-2xl">
					{value}
				</strong>
				<p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
					{helper}
				</p>
			</CardContent>
		</Card>
	);
}

export function ExplorerComparisonRow({
	label,
	value,
}: {
	label: string;
	value: string;
}) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-2xl border bg-background/45 px-3 py-2">
			<span className="text-sm font-bold text-muted-foreground">
				{label}
			</span>
			<strong className="text-sm font-black tabular-nums">{value}</strong>
		</div>
	);
}
