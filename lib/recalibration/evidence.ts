export type RecalibrationConfidence = "LOW" | "MEDIUM" | "HIGH";

export type RecalibrationEvidence = {
  averageLoggedCalories: number | null;
  observedKgPerWeek: number | null;
  estimatedTdee: number | null;
  intendedDailyEnergyDelta: number | null;
  weighInDays: number | null;
  weightSpanDays: number | null;
  loggedDays: number | null;
  windowDays: number | null;
  confidence: RecalibrationConfidence | null;
};

export type RecalibrationDisclosure =
  | {
      kind: "floor";
      computedTarget: number;
      cappedTarget: number | null;
      appliedTarget: number;
      floor: number;
    }
  | {
      kind: "clamp";
      computedTarget: number;
      appliedTarget: number;
    }
  | null;

const confidences = new Set<RecalibrationConfidence>([
  "LOW",
  "MEDIUM",
  "HIGH",
]);

export function parseRecalibrationEvidence(
  basis: Record<string, unknown>,
): RecalibrationEvidence {
  return {
    averageLoggedCalories: finiteNumber(basis.averageLoggedCalories),
    observedKgPerWeek: finiteNumber(basis.observedKgPerWeek),
    estimatedTdee: finiteNumber(basis.estimatedTdee),
    intendedDailyEnergyDelta: finiteNumber(
      basis.intendedDailyEnergyDelta,
    ),
    weighInDays: finiteNumber(basis.weighInDays),
    weightSpanDays: finiteNumber(basis.weightSpanDays),
    loggedDays: finiteNumber(basis.loggedDays),
    windowDays: finiteNumber(basis.windowDays),
    confidence:
      typeof basis.confidence === "string" &&
      confidences.has(basis.confidence as RecalibrationConfidence)
        ? (basis.confidence as RecalibrationConfidence)
        : null,
  };
}

export function parseRecalibrationDisclosure(
  basis: Record<string, unknown>,
  previousCalories: number,
  suggestedCalories: number,
): RecalibrationDisclosure {
  const rawAdjustment = finiteNumber(basis.rawAdjustment);
  const clampedAdjustment = finiteNumber(basis.clampedAdjustment);
  const floor = finiteNumber(basis.flooredTo);

  if (floor !== null && rawAdjustment !== null) {
    return {
      kind: "floor",
      computedTarget: previousCalories + rawAdjustment,
      cappedTarget:
        clampedAdjustment === null
          ? null
          : previousCalories + clampedAdjustment,
      appliedTarget: suggestedCalories,
      floor,
    };
  }

  if (
    rawAdjustment !== null &&
    clampedAdjustment !== null &&
    Math.abs(rawAdjustment - clampedAdjustment) > 0.005
  ) {
    return {
      kind: "clamp",
      computedTarget: previousCalories + rawAdjustment,
      appliedTarget: suggestedCalories,
    };
  }

  return null;
}

export function finiteNumber(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}
