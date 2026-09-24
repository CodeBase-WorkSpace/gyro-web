import { FlameIcon, FlagIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type {
	NutritionProgressPoint,
	ProgressGoalTargets,
} from "@/lib/api/progress";
import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

type NutritionBalanceCardProps = {
	days: NutritionProgressPoint[];
	title?: string;
	description?: string;
};

const macroTargets = [
	{
		targetKey: "protein",
		label: "پروتئین",
		tone: "border-nutrient-protein/25 bg-nutrient-protein/10 text-nutrient-protein",
	},
	{
		targetKey: "carbs",
		label: "کربوهیدرات",
		tone: "border-nutrient-carbs/25 bg-nutrient-carbs/10 text-nutrient-carbs",
	},
	{
		targetKey: "fat",
		label: "چربی",
		tone: "border-nutrient-fat/25 bg-nutrient-fat/10 text-nutrient-fat",
	},
] as const;

export function NutritionBalanceCard({
	days,
	title,
	description,
}: NutritionBalanceCardProps) {
	return (
		<Card className="rounded-2xl border bg-card/80 shadow-sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base font-semibold">
					<FlagIcon className="size-4 text-primary" aria-hidden="true" />
					{title ?? "اهداف فعال"}
				</CardTitle>
				<CardDescription>
					{description ?? "هدف کالری و درشت‌مغذی‌ها برای هر روز این هفته"}
				</CardDescription>
				<CardAction>
					<Link
						href="/progress/goals"
						className={buttonVariants({ variant: "outline", size: "sm" })}
					>
						مدیریت
					</Link>
				</CardAction>
			</CardHeader>
			<CardContent>
				<div
					className="grid gap-2"
					role="list"
					aria-label="هدف روزانه کالری و درشت‌مغذی‌های هفته"
				>
					{days.map((day) => (
						<DailyTargetRow key={day.date} day={day} />
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function DailyTargetRow({ day }: { day: NutritionProgressPoint }) {
	const targets = day.goal?.targets;

	return (
		<div
			className={cn(
				"grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-xl border p-3 sm:grid-cols-[5rem_7.25rem_minmax(0,1fr)] sm:items-center",
				targets ? "bg-background/45" : "border-dashed bg-muted/20",
			)}
			role="listitem"
		>
			<div className="min-w-0">
				<strong className="block text-sm font-black">
					{formatWeekday(day.date)}
				</strong>
				<span className="mt-0.5 block text-xs text-muted-foreground">
					{formatShortDate(day.date)}
				</span>
			</div>
			{targets ? (
				<>
					<div className="flex items-center justify-end gap-2 rounded-lg border border-nutrient-calories/25 bg-nutrient-calories/10 px-2.5 py-2 text-nutrient-calories sm:justify-center">
						<FlameIcon className="size-4 shrink-0" aria-hidden="true" />
						<strong className="tabular-nums tracking-normal">
							{toPersianDigits(Math.round(targets.calories))}
						</strong>
						<span className="text-[0.65rem] font-bold">کالری</span>
					</div>
					<div className="col-span-2 grid grid-cols-3 gap-1.5 sm:col-span-1">
						{macroTargets.map((macro) => (
							<MacroTarget
								key={macro.targetKey}
								targets={targets}
								{...macro}
							/>
						))}
					</div>
				</>
			) : (
				<p className="col-span-2 text-xs leading-6 text-muted-foreground sm:col-span-2">
					برای این روز هدف تغذیه تنظیم نشده است.
				</p>
			)}
		</div>
	);
}

function MacroTarget({
	targets,
	targetKey,
	label,
	tone,
}: {
	targets: ProgressGoalTargets;
	targetKey: "protein" | "carbs" | "fat";
	label: string;
	tone: string;
}) {
	return (
		<div
			className={cn(
				"min-w-0 rounded-lg border px-1.5 py-2 text-center",
				tone,
			)}
		>
			<span className="block truncate text-[0.6rem] font-bold">{label}</span>
			<strong className="mt-0.5 block text-xs tabular-nums tracking-normal">
				{toPersianDigits(Math.round(targets[targetKey]))}
				<span className="ms-0.5 text-[0.55rem]">گرم</span>
			</strong>
		</div>
	);
}

function formatWeekday(value: string) {
	return new Intl.DateTimeFormat("fa-IR", { weekday: "long" }).format(
		new Date(`${value}T12:00:00Z`),
	);
}

function formatShortDate(value: string) {
	return new Intl.DateTimeFormat("fa-IR", {
		month: "short",
		day: "numeric",
	}).format(new Date(`${value}T12:00:00Z`));
}
