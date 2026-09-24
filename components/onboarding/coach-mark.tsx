"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  isSameRect,
  trackViewportChanges,
  type AnchorRect,
} from "@/lib/dom/viewport-tracking";
import { cn } from "@/lib/utils";

/**
 * Dependency-free anchored callout. Finds the target by `[data-coach-target]`
 * post-mount, renders a fixed card near it (above by default, below when the
 * target sits in the top half), and repositions on resize/scroll. If the
 * target is missing (layout variant without it), nothing renders.
 *
 * Repositioning goes through `trackViewportChanges` because this runs during
 * onboarding, on the dashboard, for brand-new users — the exact moment the
 * main thread is busiest. A per-event listener here re-rendered the callout on
 * every scroll frame and, being non-passive, delayed the scroll itself.
 */
export function CoachMark({
  target,
  title,
  body,
  onDismiss,
}: {
  target: string;
  title: string;
  body: string;
  onDismiss: () => void;
}) {
  const [rect, setRect] = useState<AnchorRect | null>(null);

  useEffect(() => {
    // The same target can exist in both the mobile nav and the desktop
    // sidebar; anchor to whichever is actually visible.
    let activeTarget: HTMLElement | null = null;
    const handleTargetClick = () => onDismiss();
    // Mirrors the state so an unchanged frame can bail before calling setRect.
    let lastRect: AnchorRect | null = null;

    const applyRect = (next: AnchorRect | null) => {
      if (isSameRect(lastRect, next)) return;
      lastRect = next;
      setRect(next);
    };

    const update = () => {
      const candidates = document.querySelectorAll<HTMLElement>(
        `[data-coach-target="${target}"]`,
      );
      for (const element of candidates) {
        const bounds = element.getBoundingClientRect();
        if (bounds.width > 0 || bounds.height > 0) {
          if (activeTarget !== element) {
            activeTarget?.removeEventListener("click", handleTargetClick);
            activeTarget = element;
            activeTarget.addEventListener("click", handleTargetClick);
          }
          applyRect({
            top: bounds.top,
            left: bounds.left,
            width: bounds.width,
            height: bounds.height,
          });
          return;
        }
      }
      activeTarget?.removeEventListener("click", handleTargetClick);
      activeTarget = null;
      applyRect(null);
    };

    update();
    const stopTracking = trackViewportChanges(update);
    return () => {
      activeTarget?.removeEventListener("click", handleTargetClick);
      stopTracking();
    };
  }, [onDismiss, target]);

  if (!rect) return null;

  const placeBelow = rect.top < window.innerHeight / 2;
  const anchorCenter = rect.left + rect.width / 2;
  const cardWidth = Math.min(300, window.innerWidth - 24);
  const left = Math.min(
    Math.max(12, anchorCenter - cardWidth / 2),
    window.innerWidth - cardWidth - 12,
  );
  const arrowLeft = Math.min(
    Math.max(16, anchorCenter - left - 6),
    cardWidth - 28,
  );

  return (
    <div
      role="dialog"
      aria-label={title}
      dir="rtl"
      className="fixed z-50 animate-in fade-in zoom-in-95 duration-300"
      style={{
        width: cardWidth,
        left,
        top: placeBelow ? rect.top + rect.height + 10 : undefined,
        bottom: placeBelow ? undefined : window.innerHeight - rect.top + 10,
      }}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute size-3 rotate-45 border bg-card",
          placeBelow
            ? "-top-1.5 border-b-0 border-e-0"
            : "-bottom-1.5 border-s-0 border-t-0",
        )}
        style={{ left: arrowLeft }}
      />
      <div className="rounded-2xl border bg-card px-4 py-3 shadow-lg">
        <div className="flex items-start justify-between gap-2">
          <strong className="text-sm">{title}</strong>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-me-1.5 -mt-1 size-7 shrink-0 rounded-full"
            aria-label="بستن راهنما"
            onClick={onDismiss}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
