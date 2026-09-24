import assert from "node:assert/strict";
import test from "node:test";

import {
  daysSinceLastWeightEntry,
  isWeightStale,
  shouldShowWeightNudge,
  WEIGHT_STALENESS_DAYS,
} from "../lib/progress/weight-staleness";

const TODAY = "2026-07-17";

test("staleness uses the owner-scoped latest measurement date", () => {
  assert.equal(daysSinceLastWeightEntry("2026-07-10", TODAY), 7);
  assert.equal(isWeightStale("2026-07-10", TODAY), true);
});

test("a previous-month entry keeps the nudge hidden at a month boundary", () => {
  assert.equal(daysSinceLastWeightEntry("2026-07-31", "2026-08-02"), 2);
  assert.equal(shouldShowWeightNudge("2026-07-31", "2026-08-02", "2026-08-02"), false);
});

test("historical dashboard dates never show the current weight nudge", () => {
  assert.equal(shouldShowWeightNudge(null, TODAY, "2026-06-10"), false);
  assert.equal(shouldShowWeightNudge("2026-06-01", TODAY, "2026-06-10"), false);
});

test("no measurement and future-dated measurements read as stale", () => {
  assert.equal(daysSinceLastWeightEntry(null, TODAY), null);
  assert.equal(daysSinceLastWeightEntry("2026-07-20", TODAY), null);
  assert.equal(isWeightStale(null, TODAY), true);
  assert.equal(isWeightStale("2026-07-20", TODAY), true);
});

test("threshold boundary is exactly WEIGHT_STALENESS_DAYS", () => {
  assert.equal(daysSinceLastWeightEntry("2026-07-11", TODAY), 6);
  assert.equal(isWeightStale("2026-07-11", TODAY), false);
  assert.equal(WEIGHT_STALENESS_DAYS, 7);
  assert.equal(isWeightStale("2026-07-10", TODAY), true);
});

test("impossible ISO calendar dates are rejected", () => {
  assert.equal(daysSinceLastWeightEntry("2026-02-31", TODAY), null);
  assert.equal(daysSinceLastWeightEntry("2026-13-01", TODAY), null);
});
