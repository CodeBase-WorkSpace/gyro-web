import type { ReactNode } from "react";
import Link from "next/link";
import {
	ArrowRightIcon,
	BellIcon,
	CalendarDaysIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { MobileDatePickerTrigger } from "@/components/design-system/mobile-date-picker-trigger";
import { formatPersianDayLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

type TopBarLink = {
	href: string;
	label: string;
};

type DateNavigation = {
	previousHref: string;
	nextHref: string;
	nextDisabled?: boolean;
	todayHref: string;
	isToday: boolean;
};

type MobileDatePicker = {
	value: string;
	today: string;
	path: string;
};

type AppTopBarProps = {
	title: string;
	description: string;
	dateLabel?: string;
	dateNavigation?: DateNavigation;
	showDateControl?: boolean;
	showMobileDateAction?: boolean;
	mobileDatePicker?: MobileDatePicker;
	backLink?: TopBarLink;
	quickAddControl?: ReactNode;
	planBadge?: ReactNode;
	leadingAvatar?: ReactNode;
	className?: string;
};

export function AppTopBar({
	title,
	description,
	dateLabel = formatPersianDayLabel(new Date()),
	dateNavigation,
	showDateControl = true,
	showMobileDateAction = true,
	mobileDatePicker,
	backLink,
	quickAddControl,
	planBadge,
	leadingAvatar,
	className,
}: AppTopBarProps) {
	return (
		<header
			className={cn("border-b bg-background/80 backdrop-blur", className)}
		>
			<div
				className="flex h-16 items-center justify-between gap-3 px-4 lg:hidden"
				dir="rtl"
			>
				<div className="flex shrink-0 items-center gap-2">
					{backLink ? (
						<Link
							href={backLink.href}
							className={buttonVariants({
								variant: "outline",
								size: "icon-lg",
							})}
							aria-label={backLink.label}
							title={backLink.label}
						>
							<ArrowRightIcon />
						</Link>
					) : (
						leadingAvatar
					)}
				</div>
				<div className="flex min-w-0 flex-1 items-center justify-center">
					<div className="min-w-0 text-center">
						<h1 className="min-w-0 truncate text-base font-black tracking-normal">
							{title}
						</h1>
					</div>
				</div>
				<div
					className="flex min-w-0 items-center justify-end gap-2"
					dir="ltr"
				>
					{planBadge}
					{mobileDatePicker ? (
						<MobileDatePickerTrigger
							dateLabel={dateLabel}
							value={mobileDatePicker.value}
							today={mobileDatePicker.today}
							path={mobileDatePicker.path}
							variant="icon"
						/>
					) : showMobileDateAction && dateNavigation ? (
						<Link
							href={dateNavigation.todayHref}
							className={buttonVariants({
								variant: "outline",
								size: "icon-lg",
							})}
							aria-label="بازگشت به امروز"
							title="بازگشت به امروز"
						>
							<CalendarDaysIcon />
						</Link>
					) : showMobileDateAction ? (
						<Button
							type="button"
							variant="outline"
							size="icon-lg"
							aria-label="انتخاب روز"
						>
							<CalendarDaysIcon />
						</Button>
					) : null}
				</div>
			</div>
			{showDateControl && dateLabel && dateNavigation ? (
				<div className="border-t px-4 py-2 lg:hidden">
					<DateNavigationControls
						dateLabel={dateLabel}
						navigation={dateNavigation}
							mobileDatePicker={mobileDatePicker}
					/>
				</div>
			) : null}

			<div className="hidden gap-4 py-6 lg:grid lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.8fr)] lg:items-center lg:[direction:rtl]">
				<div className="flex min-w-0 items-center gap-3 lg:[direction:rtl]">
					{leadingAvatar}
					<div className="min-w-0">
						<div className="flex min-w-0 items-center justify-start gap-3 lg:justify-end">
							<h1 className="truncate text-3xl font-black tracking-normal lg:text-right">
								{title}
							</h1>
							{planBadge}
						</div>
						<p className="mt-2 truncate text-sm font-semibold text-muted-foreground lg:text-right">
							{description}
						</p>
					</div>
				</div>

				<div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-start lg:[direction:ltr]">
					<div className="flex items-center gap-3 lg:[direction:ltr]">
						<Button
							type="button"
							variant="outline"
							size="icon-xl"
							aria-label="اعلان‌ها"
							className="relative"
						>
							<span
								className="absolute inset-e-2 top-2 size-2 rounded-full bg-primary"
								aria-hidden="true"
							/>
							<BellIcon />
						</Button>
						{quickAddControl}

						{backLink ? (
							<Link
								href={backLink.href}
								className={buttonVariants({
									variant: "outline",
									size: "icon-xl",
								})}
								aria-label={backLink.label}
								title={backLink.label}
							>
								<ArrowRightIcon />
							</Link>
						) : null}
					</div>

					{showDateControl && dateLabel ? (
						dateNavigation ? (
							<DateNavigationControls
								dateLabel={dateLabel}
								navigation={dateNavigation}
								mobileDatePicker={mobileDatePicker}
							/>
						) : (
							<StaticDateLabel dateLabel={dateLabel} />
						)
					) : null}
				</div>
			</div>
		</header>
	);
}

function StaticDateLabel({ dateLabel }: { dateLabel: string }) {
	return (
		<ButtonGroup
			aria-label="روز جاری"
			className="w-full lg:w-auto"
			dir="ltr"
		>
			<Button
				type="button"
				variant="outline"
				size="icon-xl"
				aria-label="روز قبل"
				disabled
			>
				<ChevronLeftIcon />
			</Button>
			<ButtonGroupText className="min-w-0 flex-1 justify-center bg-card/80 px-5 text-base font-bold lg:min-w-72 lg:flex-none">
				<span className="truncate" dir="rtl">
					{dateLabel}
				</span>
			</ButtonGroupText>
			<Button
				type="button"
				variant="outline"
				size="icon-xl"
				aria-label="روز بعد"
				disabled
			>
				<ChevronRightIcon />
			</Button>
		</ButtonGroup>
	);
}

function DateNavigationControls({
	dateLabel,
	navigation,
	mobileDatePicker,
}: {
	dateLabel: string;
	navigation: DateNavigation;
	mobileDatePicker?: MobileDatePicker;
}) {
	return (
		<ButtonGroup
			aria-label="انتخاب روز"
			className="grid w-full min-w-0 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] lg:w-full lg:max-w-136 lg:grid-cols-[3rem_minmax(0,1fr)_3rem] xl:w-auto xl:max-w-none xl:grid-cols-[3.5rem_minmax(24rem,auto)_3.5rem]"
			dir="ltr"
		>
			<Link
				href={navigation.previousHref}
				data-slot="button"
				className={buttonVariants({
					variant: "outline",
					size: "icon-xl",
					className: "size-11 lg:size-12 xl:size-14",
				})}
				aria-label="روز قبل"
				title="روز قبل"
			>
				<ChevronLeftIcon />
			</Link>
			<ButtonGroupText className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(4.25rem,2.75rem)] items-center gap-1 bg-card/80 px-1.5 font-bold lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-2 lg:px-2 xl:grid-cols-[minmax(14rem,1fr)_auto] xl:gap-3 xl:px-3">
				{mobileDatePicker ? (
					<MobileDatePickerTrigger
						dateLabel={dateLabel}
						value={mobileDatePicker.value}
										today={mobileDatePicker.today}
						path={mobileDatePicker.path}
						variant="label"
						className="h-8 w-full min-w-0 justify-center px-1.5 text-[0.8rem] lg:h-9 lg:px-2 lg:text-sm xl:min-w-56 xl:text-base"
					/>
				) : (
					<span
						className="min-w-0 truncate text-center text-sm lg:text-sm xl:text-base"
						dir="rtl"
					>
						{dateLabel}
					</span>
				)}
				<Link
					href={navigation.todayHref}
					className={buttonVariants({
						variant: navigation.isToday ? "secondary" : "outline",
						size: "xs",
						className:
							"h-8 w-full min-w-0 justify-center px-1 text-[0.7rem] lg:h-9 lg:w-auto lg:min-w-16 lg:px-2 xl:min-w-24",
					})}
					aria-current={navigation.isToday ? "date" : undefined}
					aria-label="بازگشت به امروز"
				>
					<span className="truncate">
						{navigation.isToday ? "امروز" : "بازگشت به امروز"}
					</span>
				</Link>
			</ButtonGroupText>
			<Link
				href={navigation.nextHref}
				data-slot="button"
				aria-label="روز بعد"
				title="روز بعد"
				aria-disabled={navigation.nextDisabled || undefined}
				data-disabled={navigation.nextDisabled || undefined}
				className={cn(
					buttonVariants({
						variant: "outline",
						size: "icon-xl",
						className: "size-11 lg:size-12 xl:size-14",
					}),
					navigation.nextDisabled && "pointer-events-none opacity-50",
				)}
			>
				<ChevronRightIcon />
			</Link>
		</ButtonGroup>
	);
}
