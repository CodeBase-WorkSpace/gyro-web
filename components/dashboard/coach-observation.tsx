"use client";

import { type ReactNode, useEffect, useRef } from "react";

import {
  COACH_IMPRESSION_VISIBILITY_THRESHOLD,
  visibleCoachImpressionIds,
} from "@/lib/dom/coach-impression-visibility";
import { recordVisibleCoachImpression } from "@/lib/nutrition-coach/impressions";

export function CoachObservation({
  impressionId,
  className,
  children,
}: {
  impressionId: string;
  className?: string;
  children: ReactNode;
}) {
  const observationRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const observation = observationRef.current;
    if (!observation) return;

    let recorded = false;
    let recording = false;
    let observer: IntersectionObserver | null = null;

    const recordVisible = async () => {
      if (recorded || recording) return;
      recording = true;
      const succeeded = await recordVisibleCoachImpression(impressionId)
        .catch(() => false);
      recording = false;
      if (!succeeded) return;
      recorded = true;
      observer?.disconnect();
    };

    if (typeof IntersectionObserver === "undefined") {
      if (observation.getClientRects().length > 0) void recordVisible();
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        const visible = visibleCoachImpressionIds(
          entries.map((entry) => ({
            impressionId,
            isIntersecting: entry.isIntersecting,
            intersectionRatio: entry.intersectionRatio,
          })),
        );
        if (visible.includes(impressionId)) void recordVisible();
      },
      { threshold: COACH_IMPRESSION_VISIBILITY_THRESHOLD },
    );
    observer.observe(observation);
    return () => observer?.disconnect();
  }, [impressionId]);

  return (
    <li ref={observationRef} className={className}>
      {children}
    </li>
  );
}
