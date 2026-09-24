import {
	BeefIcon,
	Droplets,
	GrapeIcon,
	type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type MacroNutrientKind = "protein" | "carbs" | "fat";

const macroNutrients: Record<
	MacroNutrientKind,
	{ label: string; icon: LucideIcon; tone: string }
> = {
	protein: {
		label: "پروتئین",
		icon: BeefIcon,
		tone: "text-nutrient-protein",
	},
	carbs: {
		label: "کربوهیدرات",
		icon: GrapeIcon,
		tone: "text-nutrient-carbs",
	},
	fat: {
		label: "چربی",
		icon: Droplets,
		tone: "text-nutrient-fat",
	},
};

export function MacroNutrientIcon({
	kind,
	className,
}: {
	kind: MacroNutrientKind;
	className?: string;
}) {
	const { icon: Icon, tone } = macroNutrients[kind];
	return <Icon className={cn(tone, className)} aria-hidden="true" />;
}

export function MacroNutrient({
	kind,
	value,
	unit = "گرم",
	className,
	iconClassName,
	valueClassName,
}: {
	kind: MacroNutrientKind;
	value: string;
	unit?: string;
	className?: string;
	iconClassName?: string;
	valueClassName?: string;
}) {
	const { label } = macroNutrients[kind];
	return (
		<span className={cn("flex items-center gap-1", className)}>
			<MacroNutrientIcon
				kind={kind}
				className={cn("size-3.5", iconClassName)}
			/>
			<span className={valueClassName}>
				{label} {value} {unit}
			</span>
		</span>
	);
}
