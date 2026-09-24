"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { selectVisibleSlide } from "@/lib/dom/carousel-selection";
import { cn } from "@/lib/utils";

// A slide has to cover most of the viewport before it counts as selected. At
// rest exactly one slide qualifies; mid-drag neither does, so the dots settle
// once per slide instead of flickering across the midpoint.
const SELECTED_SLIDE_VISIBILITY = 0.6;

export function TodayNutritionCarousel({
	children,
}: {
	children: ReactNode[];
}) {
	const viewportRef = useRef<HTMLDivElement>(null);
	const [selectedIndex, setSelectedIndex] = useState(0);

	// This replaces an onScroll handler that ran querySelectorAll and read
	// offsetLeft off every slide — a forced synchronous layout plus a React
	// render on every scroll event, while the user's finger is on the carousel.
	// IntersectionObserver reads nothing and fires only when the active slide
	// actually changes, including on resize.
	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;

		const slides = Array.from(
			viewport.querySelectorAll<HTMLElement>("[data-carousel-slide]"),
		);
		if (!slides.length) return;

		const observer = new IntersectionObserver(
			(entries) => {
				// Deliberately not `entry.isIntersecting`: that stays true for a
				// slide crossing back down through the threshold, which would let
				// the slide being swiped away re-select itself.
				const target = selectVisibleSlide(
					entries,
					SELECTED_SLIDE_VISIBILITY,
				);
				if (target === null) return;

				const index = slides.indexOf(target as HTMLElement);
				if (index !== -1) setSelectedIndex(index);
			},
			{ root: viewport, threshold: SELECTED_SLIDE_VISIBILITY },
		);

		for (const slide of slides) observer.observe(slide);
		return () => observer.disconnect();
	}, [children.length]);

	function scrollToSlide(index: number) {
		const viewport = viewportRef.current;
		if (!viewport) return;
		const slides = viewport.querySelectorAll<HTMLElement>(
			"[data-carousel-slide]",
		);
		const targetIndex = Math.min(Math.max(index, 0), slides.length - 1);
		const target = slides[targetIndex];
		if (!target) return;

		// Update controls immediately; the observer then confirms it once the
		// smooth scroll settles.
		setSelectedIndex(targetIndex);
		viewport.scrollTo({
			left: target.offsetLeft,
			behavior: "smooth",
		});
	}

	return (
		<div
			className="grid gap-3 xl:hidden"
			dir="ltr"
			role="region"
			aria-roledescription="carousel"
			aria-label="کارت‌های تغذیه امروز"
		>
			<p className="sr-only">
				برای دیدن کارت‌های دیگر، این بخش را به صورت افقی بکشید.
			</p>
			<div
				className="snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
				ref={viewportRef}
			>
				<div className="flex">
					{children.map((child, index) => (
						<div
							key={index}
							id={`today-nutrition-slide-${index}`}
							data-carousel-slide
							className="min-w-0 flex-[0_0_100%] snap-start [scroll-snap-stop:always]"
							dir="rtl"
							role="group"
							aria-roledescription="slide"
							aria-label={`اسلاید ${index + 1} از ${children.length}`}
						>
							{child}
						</div>
					))}
				</div>
			</div>

			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						className="rounded-full"
						disabled={selectedIndex === 0}
						aria-label="اسلاید قبلی"
						onClick={() => scrollToSlide(selectedIndex - 1)}
					>
						<ChevronLeftIcon aria-hidden="true" />
					</Button>
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						className="rounded-full"
						disabled={selectedIndex === children.length - 1}
						aria-label="اسلاید بعدی"
						onClick={() => scrollToSlide(selectedIndex + 1)}
					>
						<ChevronRightIcon aria-hidden="true" />
					</Button>
				</div>

				<div
					className="flex items-center"
					aria-label="اسلایدهای تغذیه امروز"
				>
					{children.map((_, index) => (
						<button
							key={index}
							type="button"
							className="group grid size-6 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/45"
							aria-label={`رفتن به اسلاید ${index + 1}`}
							aria-controls={`today-nutrition-slide-${index}`}
							aria-current={
								selectedIndex === index ? "true" : undefined
							}
							onClick={() => scrollToSlide(index)}
						>
							<span
								className={cn(
									"size-2.5 rounded-full border transition-[background-color,border-color,transform]",
									selectedIndex === index
										? "scale-110 border-primary bg-primary"
										: "border-muted-foreground/35 bg-transparent group-hover:border-primary/70",
								)}
								aria-hidden="true"
							/>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
