import "server-only";

import { isNutritionCoachFlagEnabled } from "./nutrition-coach";

export function isFrontendTelegramEnabled() {
  return process.env.FRONTEND_TELEGRAM_ENABLED === "true";
}

export function isNotificationPermissionPromptEnabled() {
  return process.env.FRONTEND_NOTIFICATION_PERMISSION_PROMPT_ENABLED !== "false";
}

/**
 * Keep the coach rollout opt-in: an absent, misspelled, or differently cased
 * value must not change the established dashboard recalibration request.
 */
export function isNutritionCoachEnabled() {
  return isNutritionCoachFlagEnabled(process.env.FRONTEND_NUTRITION_COACH_ENABLED);
}
