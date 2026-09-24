import type { GoalResponseDto } from "@/lib/api/goals";

export const SIGNUP_ONBOARDING_PATH = "/dashboard?onboarding=1";
export const GOAL_ONBOARDING_PATH = "/progress/goals?onboarding=1";
export const GOAL_WIZARD_PATH = "/progress/goals?wizard=1";
export const ONBOARDING_COMPLETE_PATH = "/dashboard";
export const GOAL_CREATED_PATH = "/dashboard?goalCreated=1";

export function isOnboardingMode(
  onboardingParam: string | undefined,
  goalStatus: GoalResponseDto["status"] | undefined,
) {
  return onboardingParam === "1" && goalStatus === "UNCONFIGURED";
}

export function onboardingDestinationAfterGoalSave(onboarding: boolean) {
  return onboarding ? GOAL_CREATED_PATH : null;
}
