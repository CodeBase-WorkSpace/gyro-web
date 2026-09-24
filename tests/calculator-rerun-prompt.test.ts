import assert from "node:assert/strict";
import test from "node:test";

import {
  calculatorRerunPromptOutcome,
  shouldShowCalculatorRerunPrompt,
} from "../lib/nutrition-coach/calculator-rerun";

test("calculator rerun prompt is offered only for unacknowledged insights-only plans", () => {
  assert.equal(shouldShowCalculatorRerunPrompt("INSIGHTS_ONLY", null), true);
  assert.equal(shouldShowCalculatorRerunPrompt("INSIGHTS_ONLY", undefined), true);
  assert.equal(
    shouldShowCalculatorRerunPrompt("INSIGHTS_ONLY", "2026-08-01T10:00:00Z"),
    false,
  );
  assert.equal(shouldShowCalculatorRerunPrompt("FULL", null), false);
  assert.equal(shouldShowCalculatorRerunPrompt(null, null), false);
});

test("starting the wizard navigates even when acknowledgement fails", () => {
  assert.deepEqual(calculatorRerunPromptOutcome("START_WIZARD", false), {
    hidePrompt: false,
    navigateToWizard: true,
  });
});

test("dismissal hides only after acknowledgement succeeds", () => {
  assert.deepEqual(calculatorRerunPromptOutcome("DISMISS", false), {
    hidePrompt: false,
    navigateToWizard: false,
  });
  assert.deepEqual(calculatorRerunPromptOutcome("DISMISS", true), {
    hidePrompt: true,
    navigateToWizard: false,
  });
});
