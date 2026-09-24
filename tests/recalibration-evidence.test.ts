import assert from "node:assert/strict";
import test from "node:test";

import {
  parseRecalibrationDisclosure,
  parseRecalibrationEvidence,
} from "../lib/recalibration/evidence";

test("evidence parses Phase 1 basis defensively without exposing diagnostics", () => {
  const evidence = parseRecalibrationEvidence({
    averageLoggedCalories: "2100.25",
    observedKgPerWeek: "-0.2",
    estimatedTdee: "2320",
    intendedDailyEnergyDelta: "-500",
    weighIns: 9,
    weighInDays: 6,
    weightSpanDays: 12,
    loggedDays: 11,
    windowDays: 14,
    confidence: "MEDIUM",
    trendRSquared: "0.98",
    trendStdErrorKgPerDay: null,
  });

  assert.deepEqual(evidence, {
    averageLoggedCalories: 2100.25,
    observedKgPerWeek: -0.2,
    estimatedTdee: 2320,
    intendedDailyEnergyDelta: -500,
    weighInDays: 6,
    weightSpanDays: 12,
    loggedDays: 11,
    windowDays: 14,
    confidence: "MEDIUM",
  });
  assert.equal("trendRSquared" in evidence, false);
});

test("old rows degrade to the fields they actually contain", () => {
  const evidence = parseRecalibrationEvidence({
    observedKgPerWeek: "-0.3",
    estimatedTdee: null,
    confidence: "UNKNOWN",
  });

  assert.equal(evidence.observedKgPerWeek, -0.3);
  assert.equal(evidence.estimatedTdee, null);
  assert.equal(evidence.confidence, null);
  assert.equal(evidence.weighInDays, null);
});

test("clamp and floor disclosures use the computed and applied targets", () => {
  assert.deepEqual(
    parseRecalibrationDisclosure(
      { rawAdjustment: "-350", clampedAdjustment: "-150" },
      2000,
      1850,
    ),
    { kind: "clamp", computedTarget: 1650, appliedTarget: 1850 },
  );

  assert.deepEqual(
    parseRecalibrationDisclosure(
      {
        rawAdjustment: "-500",
        clampedAdjustment: "-200",
        flooredTo: "1200",
      },
      1300,
      1200,
    ),
    {
      kind: "floor",
      computedTarget: 800,
      cappedTarget: 1100,
      appliedTarget: 1200,
      floor: 1200,
    },
  );

  assert.equal(
    parseRecalibrationDisclosure(
      { rawAdjustment: "80", clampedAdjustment: "80" },
      1800,
      1880,
    ),
    null,
  );
});
