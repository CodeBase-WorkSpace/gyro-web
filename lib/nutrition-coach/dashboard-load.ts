import type { NutritionCoachState } from "@/lib/api/nutrition-coach";

export type NutritionCoachLoadResult =
  | { kind: "success"; state: NutritionCoachState | null }
  | { kind: "failure" };

export function resolveNutritionCoachDashboardLoad(
  result: NutritionCoachLoadResult | null,
) {
  if (!result) {
    return { nutritionCoach: null, shouldLoadLegacyRecalibration: false };
  }
  if (result.kind === "failure") {
    return { nutritionCoach: null, shouldLoadLegacyRecalibration: true };
  }
  return {
    nutritionCoach: result.state,
    shouldLoadLegacyRecalibration: false,
  };
}
