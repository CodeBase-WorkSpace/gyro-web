"use client";

import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { MacroNutrientIcon } from "@/components/foods/macro-nutrient";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuickAddSearchItem } from "@/lib/api/foods";
import { localizedServingUnit } from "@/lib/format";
import { cn } from "@/lib/utils";

const foodResultsScrollClass =
	"flex min-h-0 flex-col gap-2 motion-safe:transition-[max-height,height] motion-safe:duration-300 motion-safe:ease-out motion-reduce:transition-none";

export function FoodSearchResults({
	foods,
	selectedFoodIds = [],
	isSearching = false,
	isLoadingMore = false,
	searchError,
	canLoadMore = false,
	autoLoadMore = true,
	scrollable = true,
	emptyMessage = "غذایی پیدا نشد.",
	viewportClassName = "max-h-[min(42svh,26rem)]",
	onLoadMore,
	onRetry,
	onSelect,
}: {
	foods: QuickAddSearchItem[];
	selectedFoodIds?: string[];
	isSearching?: boolean;
	isLoadingMore?: boolean;
	searchError?: string | null;
	canLoadMore?: boolean;
	autoLoadMore?: boolean;
	scrollable?: boolean;
	emptyMessage?: string;
	viewportClassName?: string;
	onLoadMore?: () => void;
	onRetry?: () => void;
	onSelect?: (food: QuickAddSearchItem) => void;
}) {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const scrollContainer = scrollContainerRef.current;
		const loadMoreSentinel = loadMoreSentinelRef.current;

		if (
			!scrollContainer ||
			!loadMoreSentinel ||
			!autoLoadMore ||
			!canLoadMore ||
			isLoadingMore ||
			!onLoadMore
		) {
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					onLoadMore();
				}
			},
			{
				root: scrollContainer,
				rootMargin: "96px 0px",
				threshold: 0.1,
			},
		);

		observer.observe(loadMoreSentinel);
		return () => observer.disconnect();
	}, [autoLoadMore, canLoadMore, isLoadingMore, onLoadMore]);

	if (isSearching && foods.length === 0) {
		return (
      <div
        className={cn(
          "flex flex-col gap-2",
          !scrollable ? viewportClassName : "",
        )}
      >
				{scrollable ? (
          <ScrollArea
            viewportClassName={cn(
              foodResultsScrollClass,
              viewportClassName,
            )}
          >
						{Array.from({ length: 3 }).map((_, index) => (
							<Skeleton
								key={index}
								className="h-16 rounded-2xl"
							/>
						))}
					</ScrollArea>
				) : (
					Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl"/>
					))
				)}
			</div>
		);
	}

	const content = (
		<>
			{searchError ? (
        <div
          className="flex items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
					<span>
						{foods.length ? "نتایج قبلی نمایش داده می‌شوند. " : ""}
            {searchError}
					</span>
					{onRetry ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
            >
							تلاش دوباره
						</Button>
					) : null}
				</div>
			) : null}
			{foods.length === 0 ? (
				<Empty className="min-h-24 rounded-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:ease-out motion-reduce:animate-none">
					<EmptyHeader>
						<EmptyTitle>نتیجه‌ای پیدا نشد</EmptyTitle>
						<EmptyDescription>{emptyMessage}</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				foods.map((food, index) => (
					<FoodSearchResultItem
						key={food.id}
						food={food}
						selected={selectedFoodIds.includes(food.id)}
						animationDelayMs={Math.min(index, 8) * 35}
						onSelect={onSelect ? () => onSelect(food) : undefined}
					/>
				))
			)}
			{canLoadMore ? (
				<div
					ref={loadMoreSentinelRef}
					className="grid min-h-12 place-items-center"
				>
					{autoLoadMore ? (
						<ScrollMoreIndicator loading={isLoadingMore} />
					) : (
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="rounded-full border border-primary/20 bg-accent/35 px-3 py-1.5 text-[0.7rem] font-bold text-accent-foreground"
							disabled={isLoadingMore}
							onClick={onLoadMore}
						>
              {isLoadingMore
                ? "در حال دریافت"
                : "نمایش موارد بیشتر"}
						</Button>
					)}
				</div>
			) : null}
		</>
	);

	if (!scrollable) {
    return (
      <div className={cn("flex flex-col gap-2", viewportClassName)}>
        {content}
      </div>
    );
	}

	return (
		<ScrollArea
			ref={scrollContainerRef}
			viewportClassName={cn(foodResultsScrollClass, viewportClassName)}
			aria-live="polite"
		>
			{content}
		</ScrollArea>
	);
}

function FoodSearchResultItem({
	food,
	selected,
	animationDelayMs,
	onSelect,
}: {
	food: QuickAddSearchItem;
	selected: boolean;
	animationDelayMs: number;
	onSelect?: () => void;
}) {
	return (
		<div
			style={{ animationDelay: `${animationDelayMs}ms` }}
			className={cn(
				"group flex min-h-18 items-center justify-between gap-2 rounded-2xl border pe-1 ps-4 text-right text-xs motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:transition-[min-height,padding,background-color,border-color,box-shadow,transform] motion-safe:duration-300 motion-safe:ease-out motion-reduce:animate-none motion-reduce:transition-none active:scale-[0.99]",
				selected
					? "min-h-20 border-primary/50 bg-accent py-3 text-accent-foreground shadow-[0_14px_30px_color-mix(in_oklch,var(--primary)_12%,transparent),inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_24%,transparent)]"
					: "border-border bg-muted/40 hover:border-border/80 hover:bg-muted",
			)}
		>
			{onSelect ? (
				<button
					type="button"
					aria-pressed={selected}
					className="flex min-w-0 flex-1 items-center gap-2 text-right"
					onClick={onSelect}
				>
          {/* <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border", selected ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent")}>
						<CheckIcon className="size-4" aria-hidden="true" />
					</span> */}
          <span className="flex min-w-0 flex-1 flex-col gap-1">
						<FoodResultBody food={food}/>
					</span>
				</button>
			) : (
				<Link
					href={
						food.quickAddSourceType === "MEAL"
							? `/foods/meals/${food.id}`
							: `/foods/${food.id}`
					}
					className="flex min-w-0 flex-1 flex-col gap-1 text-right focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
				>
					<FoodResultBody food={food} />
				</Link>
			)}
			<span
				className={cn(
					"flex h-14 w-24 shrink-0 flex-col items-center justify-center border px-2 text-center leading-none motion-safe:transition-[background-color,border-color,color] motion-safe:duration-300 motion-safe:ease-out motion-reduce:transition-none",
					selected
						? "rounded-xl border-primary/40 bg-primary/15 text-primary"
						: "border-border/80 bg-card/70 text-card-foreground rounded-2xl",
				)}
			>
				<b className="whitespace-nowrap text-[0.8125rem] font-black tabular-nums">
					{food.calories.toLocaleString("fa-IR")} کالری
				</b>
				<small className="mt-1 max-w-20 truncate text-[0.65rem] font-medium text-muted-foreground">
					{formatServingInfo(food)}
				</small>
			</span>
		</div>
	);
}

function FoodResultBody({ food }: { food: QuickAddSearchItem }) {
	return (
		<>
      <strong className="truncate text-[0.8125rem]">
        {food.displayName}
      </strong>
			<MacroStrip food={food} />
		</>
	);
}

function ScrollMoreIndicator({ loading }: { loading: boolean }) {
	return (
		<div className="flex items-center gap-2 rounded-full border border-primary/20 bg-accent/35 px-3 py-1.5 text-[0.7rem] font-bold text-accent-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_10%,transparent)]">
			<span className="relative flex size-2">
				<span
					className={cn(
						"absolute inline-flex size-full rounded-full bg-primary/60",
						loading ? "motion-safe:animate-ping" : "",
					)}
				/>
				<span className="relative inline-flex size-2 rounded-full bg-primary" />
			</span>
			{loading ? "در حال دریافت" : "برای موارد بیشتر اسکرول کنید"}
		</div>
	);
}

function MacroStrip({ food }: { food: QuickAddSearchItem }) {
	const macros = [
		{
			label: "پروتئین",
			value: food.protein,
			kind: "protein",
		},
		{
			label: "کربوهیدرات",
			value: food.carbs,
			kind: "carbs",
		},
		{
			label: "چربی",
			value: food.fat,
			kind: "fat",
		},
	] as const;

	return (
		<span
			className="mt-1 flex min-w-0 flex-nowrap items-center gap-x-1.5 overflow-hidden whitespace-nowrap text-muted-foreground"
			aria-label={`درشت‌مغذی‌ها: پروتئین ${food.protein.toLocaleString("fa-IR")} گرم، کربوهیدرات ${food.carbs.toLocaleString("fa-IR")} گرم، چربی ${food.fat.toLocaleString("fa-IR")} گرم`}
		>
			{macros.map((macro, index) => {
        return (
					<span
            key={macro.label}
            className="flex shrink-0 items-center gap-1"
					>
						<span className="size-4 shrink-0" aria-hidden="true">
							<MacroNutrientIcon
                kind={macro.kind}
                className="size-full"
              />
						</span>
						<span className="flex items-baseline gap-0.5">
							<b className="text-[0.68rem] font-black tabular-nums text-foreground/90">
								{macro.value.toLocaleString("fa-IR")}
							</b>
							<small className="text-[0.64rem] font-bold text-muted-foreground">
								گرم
							</small>
						</span>
            {index < macros.length - 1 ? (
              <span
                className="ms-0.5 h-5 w-px bg-border"
                aria-hidden="true"
              />
            ) : null}
					</span>
        );
			})}
		</span>
	);
}

function formatServingInfo(food: QuickAddSearchItem) {
	const quantity = food.servingQuantity.toLocaleString("fa-IR");
	return `${quantity} ${localizedServingUnit(food.servingUnit.code, food.servingUnit.label)}`;
}
