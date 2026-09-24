import assert from "node:assert/strict";
import test from "node:test";

import { goalSaveRequiresPremiumAccess } from "../lib/goals/goal-access";

test("a long-term target date on a flat goal does not require premium access", () => {
  assert.equal(
    goalSaveRequiresPremiumAccess({
      advancedSchedule: null,
      targetDate: "2027-01-01",
    }),
    false,
  );
});

test("a serialized flat base schedule does not require premium access", () => {
  assert.equal(
    goalSaveRequiresPremiumAccess({
      advancedSchedule: {
        type: "FLAT",
        weeklyCalorieBudget: null,
        weekdayTargets: {},
        dateOverrides: {},
        macroAdjustmentMode: "FIXED_GRAMS",
        dietMode: null,
      },
      targetDate: null,
    }),
    false,
  );
});

test("an advanced schedule still requires premium access", () => {
  assert.equal(
    goalSaveRequiresPremiumAccess({
      advancedSchedule: {
        type: "WEEKDAY_WEEKEND",
      },
      targetDate: null,
    }),
    true,
  );
});
