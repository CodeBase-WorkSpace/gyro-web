import {
	diaryDayRenderKey,
	type DiaryDayResponseDto,
	type DiaryEntrySummary,
	type DiaryMealType,
} from "@/lib/api/diary";
import {formatPersianDayLabel, formatPersianGregorianDate, localizedServingUnit, toPersianDigits} from "@/lib/format";

export type MacroProgress = {
	label: string;
	consumed: number;
	target: number | null;
	unit: string;
	tone: "protein" | "carbs" | "fat";
};

export type FoodEntry = {
	id: string;
	name: string;
	detail: string;
	calories: number;
	entry: DiaryEntrySummary;
};

export type MealGroup = {
	title: string;
	target: string;
	entries: FoodEntry[];
};

export type DashboardData = {
	day: {
		date: string;
		canWriteDiary: boolean;
		label: string;
		gregorian: string;
		renderKey: string;
		consumedCalories: number;
		targetCalories: number | null;
		targetIsDegradedAverage: boolean;
		remainingCalories: number | null;
		hasConfiguredGoal: boolean;
		syncState: string;
		warnings: string[];
	};
	macros: MacroProgress[];
	meals: MealGroup[];
};

const mealLabels: Record<DiaryMealType, string> = {
	BREAKFAST: "صبحانه",
	LUNCH: "ناهار",
	DINNER: "شام",
	SNACK: "میان‌وعده",
	CUSTOM: "سفارشی",
};

export function mapDiaryDayToDashboardData(day: DiaryDayResponseDto): DashboardData {
	const date = new Date(`${day.date}T12:00:00Z`);
	const hasConfiguredGoal = day.goal.configured;
	const macroProgress = day.macroProgress;

	return {
		day: {
		date: day.date,
			canWriteDiary: day.canWriteDiary ?? true,
			label: formatPersianDayLabel(date),
			gregorian: formatPersianGregorianDate(date),
			renderKey: diaryDayRenderKey(day),
			consumedCalories: day.totals.calories,
			targetCalories: hasConfiguredGoal ? day.goal.calories : null,
			targetIsDegradedAverage: day.goal.targetSource === "DEGRADED_AVERAGE",
			remainingCalories: day.remainingCalories.configured
				? day.remainingCalories.value
				: null,
			hasConfiguredGoal,
			syncState: "همگام با دفتر روزانه",
			warnings: day.warnings.map((warning) => warning.message),
		},
		macros: [
			{
				label: "پروتئین",
				consumed: macroProgress.protein.consumed,
				target: macroProgress.protein.target,
				unit: "گرم",
				tone: "protein",
			},
			{
				label: "کربوهیدرات",
				consumed: macroProgress.carbs.consumed,
				target: macroProgress.carbs.target,
				unit: "گرم",
				tone: "carbs",
			},
			{
				label: "چربی",
				consumed: macroProgress.fat.consumed,
				target: macroProgress.fat.target,
				unit: "گرم",
				tone: "fat",
			},
		],
    meals: day.mealGroups
      .filter((meal) => meal.mealType !== "CUSTOM")
      .map((meal) => ({
        title: mealLabels[meal.mealType],
        target: meal.entries.length ? `${meal.entries.length} ثبت` : "بدون ثبت",
        entries: meal.entries.map((entry) => ({
          id: entry.id,
          name: entry.displayName,
          detail: `${toPersianDigits(entry.servingQuantity)} ${localizedServingUnit(entry.servingUnitCode, entry.servingUnitName)}`,
          calories: entry.nutrition.calories,
          entry,
        })),
      })),
	};
}
