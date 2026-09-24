import {cn} from "@/lib/utils";

export type NutritionRing = {
	label: string;
	progress: number;
	targetRangeStart: number;
	radius: number;
	stroke: string;
};

/**
 * Server component. The ring motion used to need `useState` plus a
 * `requestAnimationFrame` to flip stroke-dasharray after mount, which made this
 * a client component and started repaint-heavy SVG work while hydration was
 * saturating the main thread. CSS now owns the reveal and transitions every
 * subsequent progress change without adding client-side animation state.
 */
export function NutritionRingChart({ rings }: { rings: NutritionRing[] }) {
	return (
		<svg
			viewBox="0 0 240 240"
			className="size-full -rotate-90"
			role="img"
			aria-hidden="true"
		>
			{rings.map((ring, index) => {
				const targetZoneLength = Math.max(100 - ring.targetRangeStart, 0);

				return (
				<g key={ring.label}>
					<circle
						cx="120"
						cy="120"
						r={ring.radius}
						className="fill-none stroke-muted"
						strokeWidth="10"
					/>
					{targetZoneLength > 0 ? (
						<circle
							cx="120"
							cy="120"
							r={ring.radius}
							className={cn("fill-none opacity-25", ring.stroke)}
							strokeWidth="16"
							strokeLinecap="round"
							pathLength="100"
							strokeDasharray={`${targetZoneLength} ${100 - targetZoneLength}`}
							strokeDashoffset={targetZoneLength}
						/>
					) : null}
					<circle
						cx="120"
						cy="120"
						r={ring.radius}
						className={cn("nutrition-ring__value fill-none", ring.stroke)}
						strokeWidth="10"
						strokeLinecap="round"
						pathLength="100"
						strokeDasharray={`${ring.progress} 100`}
						style={{transitionDelay: `${index * 85}ms`}}
					/>
					<circle
						cx={120 + ring.radius}
						cy="120"
						r="3"
						className={cn("fill-background", ring.stroke)}
						strokeWidth="2"
					/>
				</g>
				);
			})}
		</svg>
	);
}
