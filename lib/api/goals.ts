import {apiDelete, apiGet, apiPost, apiPut} from "./client";

export type GoalConfigurationStatus = "CONFIGURED" | "UNCONFIGURED";
export type GoalType = "LOSE_WEIGHT" | "MAINTAIN_WEIGHT" | "GAIN_WEIGHT";
export type GoalScheduleType = "FLAT" | "WEEKDAY_WEEKEND" | "ZIGZAG" | "CUSTOM";
export type MacroTargetAdjustmentMode =
  | "FIXED_GRAMS"
  | "SCALE_WITH_CALORIES"
  | "FIXED_PROTEIN_FLEXIBLE_CARBS_FAT";
export type DailyTargetSource =
	| "BASE_PLAN"
	| "WEEKDAY_TARGET"
	| "DATE_OVERRIDE"
	| "DEGRADED_AVERAGE";
export type WeightUnit = "KG";
export type GoalCalculatorSex = "FEMALE" | "MALE";
export type DailyMovementLevel =
	| "SEDENTARY"
	| "LIGHT"
	| "MODERATE"
	| "ACTIVE"
	| "VERY_ACTIVE";
export type WorkoutFrequency =
	| "ZERO_DAYS"
	| "ONE_TO_TWO_DAYS"
	| "THREE_TO_FOUR_DAYS"
	| "FIVE_TO_SIX_DAYS"
	| "DAILY";
export type GoalChangeSpeed = "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";
export type CalculatorUpdateMode = "PRESERVE" | "REPLACE" | "CLEAR";
export type CalculatorMaintenanceSource = "FORMULA" | "OBSERVED";

export type WeightValueDto = {
	value: number;
	unit: WeightUnit;
};

export type GoalOutcomeDto = {
	targetWeight: WeightValueDto | null;
	targetDate: string | null;
};

export type NutritionTargetsDto = {
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	fiber: number | null;
};

export type PlanCalculatorDto = {
	formula: string;
	formulaVersion: string;
	maintenanceCalories: number;
	dailyEnergyDelta: number;
	expectedWeeklyWeightChangeKg: number;
	profile: PlanCalculatorProfileDto | null;
	maintenanceSource: CalculatorMaintenanceSource;
	formulaMaintenanceCalories: number;
	observationBasis: Record<string, unknown> | null;
};

export type PlanCalculatorProfileDto = {
	sex: GoalCalculatorSex;
	birthDate: string;
	heightCm: number;
	currentWeightKg: number;
	targetWeightKg: number | null;
	dailyMovementLevel: DailyMovementLevel;
	workoutFrequency: WorkoutFrequency;
	speed?: GoalChangeSpeed | null;
};

export type PlanScheduleDto = {
	type: GoalScheduleType;
	activeFrom: string;
	activeTo: string | null;
  weeklyCalorieBudget?: number | null;
  weekdayTargets?: Partial<Record<Weekday, NutritionTargetsDto>>;
  dateOverrides?: Record<string, NutritionTargetsDto>;
  macroAdjustmentMode?: MacroTargetAdjustmentMode;
  dietMode?: string | null;
};

export type NutritionPlanDto = {
	id: string;
	goalType: GoalType | null;
	startDate: string;
	baseTargets: NutritionTargetsDto;
	calculator: PlanCalculatorDto | null;
	schedule: PlanScheduleDto | null;
};

export type TodayTargetDto = {
	date: string;
	source: DailyTargetSource;
	sourceDetail: string | null;
	targets: NutritionTargetsDto;
};

export type GoalResponseDto = {
	status: GoalConfigurationStatus;
	goal?: GoalOutcomeDto | null;
	activePlan?: NutritionPlanDto | null;
	todayTarget?: TodayTargetDto | null;
};

export type SaveGoalRequestDto = {
	goal: {
		type: GoalType;
		targetWeight?: WeightValueDto | null;
		targetDate?: string | null;
	};
	activePlan: {
		startDate: string;
		baseTargets: NutritionTargetsDto;
		schedule?: {
			type: GoalScheduleType;
			activeTo?: string | null;
      weeklyCalorieBudget?: number | null;
      weekdayTargets?: Partial<Record<Weekday, NutritionTargetsDto>>;
      dateOverrides?: Record<string, NutritionTargetsDto>;
      macroAdjustmentMode?: MacroTargetAdjustmentMode;
      dietMode?: string | null;
		} | null;
    calculator?: GoalCalculatorSnapshotDto | null;
    calculatorUpdateMode?: CalculatorUpdateMode | null;
	};
	acceptedWarningCodes?: string[];
	blockingWarningCodes?: string[];
};

export type Weekday =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type GoalCalculatorSnapshotDto = {
  formula: {
    name: string;
    version: string;
  };
  maintenanceCalories: number;
  targetCalories: number;
  activityFactor: number;
  dailyEnergyDelta: number;
  weeklyWeightChangeKg: number;
  timeline: {
    estimatedWeeksMin: number;
    estimatedWeeksMax: number;
    estimatedTargetDate: string | null;
  };
  warningCodes: string[];
  maintenanceSource?: CalculatorMaintenanceSource;
  formulaMaintenanceCalories?: number;
  observationBasis?: Record<string, unknown> | null;
  profile?: {
    sex: GoalCalculatorSex;
    birthDate: string;
    heightCm: number;
    currentWeightKg: number;
    targetWeightKg: number | null;
    dailyMovementLevel: DailyMovementLevel;
    workoutFrequency: WorkoutFrequency;
    speed: GoalChangeSpeed;
  };
};

export type GoalPreviewRequestDto = {
	sex: GoalCalculatorSex;
	birthDate: string;
	heightCm: number;
	currentWeightKg: number;
	targetWeightKg?: number | null;
	dailyMovementLevel: DailyMovementLevel;
	workoutFrequency: WorkoutFrequency;
	goalType: GoalType;
	speed: GoalChangeSpeed;
};

export type GoalPreviewResponseDto = {
	formula: {
		name: string;
		version: string;
	};
	calculationDate: string;
	maintenanceCalories: number;
	targetCalories: number;
	activityFactor: number;
	dailyEnergyDelta: number;
	weeklyWeightChangeKg: number;
	timeline: {
		estimatedWeeksMin: number;
		estimatedWeeksMax: number;
		estimatedMonths: number;
		estimatedTargetDate?: string | null;
	};
	macros: {
		proteinGrams: number;
		proteinCalories: number;
		carbsGrams: number;
		carbsCalories: number;
		fatGrams: number;
		fatCalories: number;
	};
	warnings: Array<{
		code: string;
		message: string;
		blocking: boolean;
	}>;
	observedCalibration?: {
		status:
			| "AVAILABLE"
			| "LOCKED"
			| "INSUFFICIENT_EVIDENCE"
			| "NO_MEANINGFUL_DIFFERENCE"
			| "NOT_APPLICABLE";
		windowDays: number | null;
		windowStart: string | null;
		windowEnd: string | null;
		loggedDays: number;
		loggedDaysRequired: number;
		weighInDays: number;
		weightSpanDays: number;
		confidence: string | null;
		recommendation: {
			maintenanceCalories: number;
			targetCalories: number;
			dailyEnergyDelta: number;
			weeklyWeightChangeKg: number;
			timeline: GoalPreviewResponseDto["timeline"];
			macros: GoalPreviewResponseDto["macros"];
			warnings: GoalPreviewResponseDto["warnings"];
			observationBasis: Record<string, unknown>;
		} | null;
	} | null;
};

export function getGoals(accessToken: string) {
	return apiGet<GoalResponseDto>("/goals", accessToken);
}

export function saveGoal(
	request: SaveGoalRequestDto,
	accessToken: string,
) {
	return apiPut<GoalResponseDto>("/goals", request, {
		accessToken,
	});
}

export function deleteGoal(accessToken: string) {
	return apiDelete<GoalResponseDto>("/goals", {
		accessToken,
	});
}

export function previewGoal(
	request: GoalPreviewRequestDto,
	accessToken: string,
) {
	return apiPost<GoalPreviewResponseDto>("/goals/preview", request, {
		accessToken,
	});
}
