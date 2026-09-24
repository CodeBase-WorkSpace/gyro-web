"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Holds the nutrition rings and starts their fill animation once they are
 * actually on screen.
 *
 * The animation used to be an unconditional CSS rule, which starts the instant
 * the element is first painted — mid-stream, before hydration and font loading
 * have settled. All 950ms elapsed while the dashboard was still assembling, so
 * every device, desktop included, only ever saw the finished ring.
 *
 * This is deliberately thinner than the `useState` it replaced: the SVG and its
 * circles stay server rendered and are passed through as children, so a reveal
 * toggles one attribute on this wrapper instead of re-rendering every ring.
 *
 * Without JavaScript the stage stays idle and the rings render empty, which is
 * exactly what the pre-animation markup did.
 */
export function NutritionRingStage({
	className,
	ariaLabel,
	children,
}: {
	className?: string;
	ariaLabel: string;
	children: ReactNode;
}) {
	const stageRef = useRef<HTMLDivElement>(null);
	const [entered, setEntered] = useState(false);

	useEffect(() => {
		const stage = stageRef.current;
		if (!stage) return;

		if (typeof IntersectionObserver === "undefined") {
			setEntered(true);
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				setEntered(true);
				observer.disconnect();
			},
			{ threshold: 0.25 },
		);

		observer.observe(stage);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={stageRef}
			className={className}
			aria-label={ariaLabel}
			data-rings-idle={entered ? undefined : ""}
			data-rings-entered={entered ? "" : undefined}
		>
			{children}
		</div>
	);
}
