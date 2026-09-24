import type { NutritionCoachMode } from "@/lib/api/nutrition-coach";

export function shouldShowCalculatorRerunPrompt(
  mode: NutritionCoachMode | null,
  acknowledgedAt?: string | null,
  calculatorProvenanceComplete = mode === "FULL",
) {
  return mode !== null && !calculatorProvenanceComplete && !acknowledgedAt;
}

export function calculatorRerunPromptOutcome(
  intent: "START_WIZARD" | "DISMISS",
  acknowledgementSucceeded: boolean,
) {
  return {
    hidePrompt: acknowledgementSucceeded,
    navigateToWizard: intent === "START_WIZARD",
  };
}
