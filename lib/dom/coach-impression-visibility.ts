export type CoachImpressionIntersection = {
  impressionId: string;
  isIntersecting: boolean;
  intersectionRatio: number;
};

export const COACH_IMPRESSION_VISIBILITY_THRESHOLD = 0.5;

export function visibleCoachImpressionIds(
  entries: readonly CoachImpressionIntersection[],
): string[] {
  return entries
    .filter(
      (entry) =>
        entry.isIntersecting &&
        entry.intersectionRatio >= COACH_IMPRESSION_VISIBILITY_THRESHOLD,
    )
    .map((entry) => entry.impressionId);
}
