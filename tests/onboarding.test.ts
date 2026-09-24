import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { safeRedirectPath } from "../lib/auth/redirects";
import {
  GOAL_ONBOARDING_PATH,
  GOAL_CREATED_PATH,
  GOAL_WIZARD_PATH,
  isOnboardingMode,
  onboardingDestinationAfterGoalSave,
  ONBOARDING_COMPLETE_PATH,
  SIGNUP_ONBOARDING_PATH,
} from "../lib/onboarding";

const welcomeDialogSource = readFileSync(
  path.resolve(
    process.cwd(),
    "components/dashboard/onboarding-welcome-dialog.tsx",
  ),
  "utf8",
);

test("signup onboarding routes through the dashboard welcome dialog to the goal wizard", () => {
  assert.equal(safeRedirectPath(SIGNUP_ONBOARDING_PATH), SIGNUP_ONBOARDING_PATH);
  assert.equal(SIGNUP_ONBOARDING_PATH, "/dashboard?onboarding=1");
  assert.equal(GOAL_ONBOARDING_PATH, "/progress/goals?onboarding=1");
  assert.equal(
    onboardingDestinationAfterGoalSave(true),
    GOAL_CREATED_PATH,
  );
});

test("new signup onboarding still requires an unconfigured goal", () => {
  assert.equal(isOnboardingMode("1", "UNCONFIGURED"), true);
  assert.equal(isOnboardingMode("1", "CONFIGURED"), false);
  assert.equal(isOnboardingMode("1", undefined), false);
  assert.equal(isOnboardingMode(undefined, "UNCONFIGURED"), false);
  assert.equal(isOnboardingMode("true", "UNCONFIGURED"), false);
});

test("existing users can open the wizard without entering the new-signup completion flow", () => {
  assert.equal(GOAL_WIZARD_PATH, "/progress/goals?wizard=1");
  assert.equal(ONBOARDING_COMPLETE_PATH, "/dashboard");
});

test("ordinary goal saves stay on the goals page", () => {
  assert.equal(onboardingDestinationAfterGoalSave(false), null);
});

test("welcome dialog uses the Gyro logo and keeps actions stacked on every viewport", () => {
  assert.match(welcomeDialogSource, /src="\/brand\/gyro-symbol-96\.png"/);
  assert.match(welcomeDialogSource, /flex-col sm:flex-col sm:items-stretch/);
  assert.doesNotMatch(welcomeDialogSource, /SparklesIcon/);
});
