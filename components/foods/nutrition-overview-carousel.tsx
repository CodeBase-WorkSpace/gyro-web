"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NutritionOverviewCarousel({
	summary,
	chart,
}: {
	summary: ReactNode;
	chart: ReactNode;
}) {
	const [activeIndex, setActiveIndex] = useState(0);
	const slides = [
		{ label: "خلاصه", content: summary },
		{ label: "نمودار", content: chart },
	];
	const activeSlide = slides[activeIndex];

	function showPrevious() {
		setActiveIndex((current) => (current === 0 ? slides.length - 1 : current - 1));
	}

	function showNext() {
		setActiveIndex((current) => (current + 1) % slides.length);
	}

	return (
		<div className="grid gap-3 lg:hidden" aria-label="نمای موبایل خلاصه و نمودار ارزش غذایی">
			<div className="min-w-0 motion-safe:transition-opacity motion-safe:duration-200" key={activeSlide.label}>
				{activeSlide.content}
			</div>
			<div className="flex items-center justify-between gap-3" dir="rtl">
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="size-10 rounded-full"
					onClick={showPrevious}
					aria-label="نمای قبلی"
				>
					<ChevronRightIcon className="size-4" aria-hidden="true" />
				</Button>
				<div className="flex items-center gap-2" aria-label={`نمای فعال: ${activeSlide.label}`}>
					{slides.map((slide, index) => (
						<button
							key={slide.label}
							type="button"
							className={cn(
								"h-2 rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none",
								index === activeIndex ? "w-6 bg-primary" : "w-2 bg-muted-foreground/35",
							)}
							onClick={() => setActiveIndex(index)}
							aria-label={`نمایش ${slide.label}`}
							aria-current={index === activeIndex ? "true" : undefined}
						/>
					))}
				</div>
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="size-10 rounded-full"
					onClick={showNext}
					aria-label="نمای بعدی"
				>
					<ChevronLeftIcon className="size-4" aria-hidden="true" />
				</Button>
			</div>
		</div>
	);
}
