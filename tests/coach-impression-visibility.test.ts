import assert from "node:assert/strict";
import test from "node:test";

import { visibleCoachImpressionIds } from "../lib/dom/coach-impression-visibility";

test("records only Coach observations that are actually visible", () => {
  assert.deepEqual(
    visibleCoachImpressionIds([
      {
        impressionId: "CALORIE_ADHERENCE",
        isIntersecting: true,
        intersectionRatio: 1,
      },
      {
        impressionId: "BEST_DAY",
        isIntersecting: false,
        intersectionRatio: 0,
      },
    ]),
    ["CALORIE_ADHERENCE"],
  );
});

test("records every visible Coach observation", () => {
  assert.deepEqual(
    visibleCoachImpressionIds([
      {
        impressionId: "CALORIE_ADHERENCE",
        isIntersecting: true,
        intersectionRatio: 1,
      },
      {
        impressionId: "BEST_DAY",
        isIntersecting: true,
        intersectionRatio: 1,
      },
    ]),
    ["CALORIE_ADHERENCE", "BEST_DAY"],
  );
});

test("partially intersecting observations are not recorded before visibility threshold", () => {
  assert.deepEqual(
    visibleCoachImpressionIds([
      {
        impressionId: "SCORE_TREND",
        isIntersecting: true,
        intersectionRatio: 0.49,
      },
    ]),
    [],
  );
});
