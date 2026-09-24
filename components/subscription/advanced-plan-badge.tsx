import { CrownIcon, LockIcon } from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

type AdvancedPlanBadgeProps = {
	label?: string;
	icon?: "crown" | "lock";
	compact?: boolean;
	className?: string;
};

export function AdvancedPlanBadge({
	label = "پیشرفته",
	icon = "crown",
	compact = false,
	className,
}: AdvancedPlanBadgeProps) {
	const Icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }> =
		icon === "lock" ? LockIcon : CrownIcon;

	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center justify-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 font-black leading-none text-amber-700 shadow-sm dark:text-amber-400",
				compact
					? "px-2 py-1 text-[0.66rem]"
					: "px-2.5 py-1 text-[0.9rem]",
				className,
			)}
		>
			<Icon className="size-3" aria-hidden />
			<span className="whitespace-nowrap">{label}</span>
		</span>
	);
}
