"use client";

import {
	ChevronDownIcon,
	CookingPotIcon,
	PlusIcon,
	ScaleIcon,
} from "lucide-react";
import type {ComponentProps} from "react";
import {useState} from "react";
import dynamic from "next/dynamic";

import {Button} from "@/components/ui/button";
import {ButtonGroup, ButtonGroupSeparator,} from "@/components/ui/button-group";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {cn} from "@/lib/utils";

import type {
	QuickAddSheetRequest,
	QuickAddSurface,
	QuickDashboardAction,
} from "./quick-add-sheet";

// The sheet carries the food search, wizard, and forms; load it only after the
// first trigger click so it stays out of the routes' initial bundles.
const QuickAddSheet = dynamic(
	() => import("./quick-add-sheet").then((module) => module.QuickAddSheet),
	{ssr: false},
);

type QuickAddTrigger =
	| "default"
	| "food"
	| "food-card"
	| "custom-food"
	| "custom-meal";
type QuickAddButtonProps = ComponentProps<typeof Button>;

export function QuickAddClient({
	surface = "desktop",
	trigger = "default",
	date,
	canWriteDiary = true,
	triggerClassName,
	triggerLabelClassName,
	triggerSize,
	triggerVariant,
	foodTriggerPresentation = "compact",
	coachTarget,
}: {
	surface?: QuickAddSurface;
	trigger?: QuickAddTrigger;
	date: string;
	canWriteDiary?: boolean;
	triggerClassName?: string;
	triggerLabelClassName?: string;
	triggerSize?: QuickAddButtonProps["size"];
	triggerVariant?: QuickAddButtonProps["variant"];
	foodTriggerPresentation?: "compact" | "full";
	coachTarget?: string;
}) {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [request, setRequest] = useState<QuickAddSheetRequest | null>(null);

	function openAction(action: QuickDashboardAction) {
		setMobileMenuOpen(false);
		setRequest((current) => ({
			action,
			nonce: (current?.nonce ?? 0) + 1,
		}));
	}

	return (
		<>
			{trigger === "food" ? (
				<Button
					type="button"
					size={foodTriggerPresentation === "full" ? "xl" : "lg"}
					className={cn(
						foodTriggerPresentation === "full"
							? "min-w-36 rounded-full px-3 text-sm sm:min-w-44 sm:px-5"
							: "h-10 min-w-36 rounded-full px-3 text-sm max-sm:size-10 max-sm:min-w-0 max-sm:px-2 sm:h-11 sm:min-w-44 sm:px-5",
					)}
					aria-label="افزودن غذا"
					disabled={!canWriteDiary}
					title={!canWriteDiary ? "این تاریخ فقط برای مشاهده است." : undefined}
					onClick={() => openAction("food")}
				>
					<PlusIcon data-icon="inline-start" aria-hidden="true" />
					<span
						className={
							foodTriggerPresentation === "compact"
								? "max-sm:sr-only"
								: undefined
						}
					>
						افزودن غذا
					</span>
				</Button>
			) : trigger === "food-card" ? (
				<Button
					type="button"
					variant={triggerVariant ?? "outline"}
					size={triggerSize ?? "sm"}
					className={triggerClassName}
					aria-label="افزودن سریع غذا"
					disabled={!canWriteDiary}
					title={!canWriteDiary ? "این تاریخ فقط برای مشاهده است." : undefined}
					onClick={() => openAction("food")}
				>
					<PlusIcon data-icon="inline-start"/>
					<span className={triggerLabelClassName}>
						افزودن سریع غذا
					</span>
				</Button>
			) : trigger === "custom-meal" ? (
				<Button
					type="button"
					size="lg"
					className="h-10 rounded-full px-3 text-sm max-sm:size-10 max-sm:px-2 sm:h-11 sm:px-5"
					aria-label="ساخت وعده سفارشی"
					onClick={() => openAction("custom-meal")}
				>
					<PlusIcon data-icon="inline-start" />
					<span className="max-sm:sr-only">ساخت وعده سفارشی</span>
				</Button>
			) : trigger === "custom-food" ? (
				<Button
					type="button"
					size="lg"
					className="h-10 rounded-full px-3 text-sm max-sm:size-10 max-sm:px-2 sm:h-11 sm:px-5"
					aria-label="ساخت غذای سفارشی"
					onClick={() => openAction("custom-food")}
				>
					<PlusIcon data-icon="inline-start"/>
					<span className="max-sm:sr-only">ساخت غذای سفارشی</span>
				</Button>
			) : surface === "mobile" ? (
				<MobileQuickAddTrigger
					isOpen={mobileMenuOpen}
					onToggle={() => setMobileMenuOpen((current) => !current)}
					onOpen={openAction}
					canWriteDiary={canWriteDiary}
					coachTarget={coachTarget}
				/>
			) : (
				<QuickAddDesktopTrigger
					onOpen={openAction}
					canWriteDiary={canWriteDiary}
					coachTarget={coachTarget}
				/>
			)}

			{request ? (
				<QuickAddSheet
					surface={surface}
					date={date}
					canWriteDiary={canWriteDiary}
					request={request}
				/>
			) : null}
		</>
	);
}

function MobileQuickAddTrigger({
	isOpen,
	onToggle,
	onOpen,
	canWriteDiary,
	coachTarget,
}: {
	isOpen: boolean;
	onToggle: () => void;
	onOpen: (action: QuickDashboardAction) => void;
	canWriteDiary: boolean;
	coachTarget?: string;
}) {
	const actions: Array<{
		label: string;
		action: QuickDashboardAction;
		icon: typeof PlusIcon;
	}> = [
		{label: "افزودن غذا", action: "food", icon: PlusIcon},
		{label: "ثبت وزن", action: "weight", icon: ScaleIcon},
		{label: "غذای سفارشی", action: "custom-food", icon: PlusIcon},
		{label: "وعده سفارشی", action: "custom-meal", icon: CookingPotIcon},
	];

	return (
		<div className="pointer-events-none fixed bottom-24 z-40 flex flex-col gap-2 ps-6 sm:right-4 lg:hidden">
			<div
				id="mobile-quick-add-actions"
				className={cn(
					"flex flex-col items-start gap-2 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
					isOpen
						? "pointer-events-auto translate-y-0 opacity-100"
						: "pointer-events-none translate-y-2 opacity-0",
				)}
				aria-hidden={!isOpen}
			>
				{actions.map((action, index) => {
					const Icon = action.icon;
					return (
						<Button
							key={action.action}
							type="button"
							variant="secondary"
							className="h-11 rounded-full border border-primary/70 bg-card px-2 text-sm font-bold shadow-lg transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out hover:border-primary focus-visible:border-primary motion-reduce:transition-none"
							style={{
								transitionDelay: isOpen
									? `${index * 40}ms`
									: "0ms",
							}}
							tabIndex={isOpen ? 0 : -1}
							disabled={action.action === "food" && !canWriteDiary}
							title={action.action === "food" && !canWriteDiary ? "این تاریخ فقط برای مشاهده است." : undefined}
							onClick={() => onOpen(action.action)}
						>
							<Icon data-icon="inline-start" />
							{action.label}
						</Button>
					);
				})}
			</div>
			<Button
				data-coach-target={coachTarget}
				type="button"
				size="icon-xl"
				className="pointer-events-auto size-14 rounded-full shadow-[0_16px_34px_color-mix(in_oklch,var(--primary)_24%,transparent)] transition-[transform,box-shadow] duration-200 ease-out motion-reduce:transition-none"
				aria-label={
					isOpen ? "بستن گزینه‌های افزودن" : "نمایش گزینه‌های افزودن"
				}
				aria-expanded={isOpen}
				aria-controls="mobile-quick-add-actions"
				onClick={onToggle}
			>
				<PlusIcon
					className={cn(
						"transition-transform duration-200 ease-out motion-reduce:transition-none",
						isOpen && "rotate-45",
					)}
				/>
			</Button>
		</div>
	);
}

function QuickAddDesktopTrigger({
	onOpen,
	canWriteDiary,
	coachTarget,
}: {
	onOpen: (action: QuickDashboardAction) => void;
	canWriteDiary: boolean;
	coachTarget?: string;
}) {
	return (
		<ButtonGroup
			aria-label="افزودن سریع"
			data-coach-target={coachTarget}
			dir="ltr"
		>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							type="button"
							size="icon-xl"
							aria-label="انتخاب نوع افزودن"
						/>
					}
				>
					<ChevronDownIcon />
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="start"
					sideOffset={8}
					className="w-48"
					dir="rtl"
				>
					<DropdownMenuGroup>
						<DropdownMenuItem onClick={() => onOpen("custom-food")}>
							<PlusIcon data-icon="inline-start" />
							افزودن غذای سفارشی
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => onOpen("custom-meal")}>
							<CookingPotIcon data-icon="inline-start" />
							افزودن وعده سفارشی
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => onOpen("weight")}>
							<ScaleIcon data-icon="inline-start"/>
							ثبت وزن
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<ButtonGroupSeparator />
			<Button
				type="button"
				size="xl"
				className="min-w-40"
				onClick={() => onOpen("food")}
				disabled={!canWriteDiary}
				title={!canWriteDiary ? "این تاریخ فقط برای مشاهده است." : undefined}
			>
				<PlusIcon data-icon="inline-start" />
				افزودن غذا
			</Button>
		</ButtonGroup>
	);
}
