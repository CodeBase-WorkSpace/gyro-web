"use client";

import type {ReactNode} from "react";
import {useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";

import {trackViewportChanges} from "@/lib/dom/viewport-tracking";

const mobileTooltipQuery = "(hover: none), (pointer: coarse)";

// One client component for the whole heatmap: cells stay server-rendered and a
// delegated click handler drives a single tap tooltip on coarse pointers.
export function ActivityHeatmapGrid({
                                      ariaLabel,
                                      className,
                                      children,
                                    }: {
  ariaLabel: string;
  className?: string;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isMobileInput, setIsMobileInput] = useState(false);
  const [activeCell, setActiveCell] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(mobileTooltipQuery);
    const updateInputMode = () => {
      setIsMobileInput(mediaQuery.matches);
      if (!mediaQuery.matches) setActiveCell(null);
    };

    updateInputMode();
    mediaQuery.addEventListener("change", updateInputMode);

    return () => mediaQuery.removeEventListener("change", updateInputMode);
  }, []);

  useEffect(() => {
    if (!activeCell) {
      setTooltipPosition(null);
      return;
    }

    // Mirrors the state so an unchanged frame can bail before calling setState.
    let lastPosition: {left: number; top: number} | null = null;

    const updateTooltipPosition = () => {
      const rect = activeCell.getBoundingClientRect();
      const next = {left: rect.left + rect.width / 2, top: rect.top - 8};
      if (lastPosition?.left === next.left && lastPosition.top === next.top) return;
      lastPosition = next;
      setTooltipPosition(next);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!activeCell.contains(event.target as Node)) {
        setActiveCell(null);
      }
    };

    updateTooltipPosition();
    document.addEventListener("pointerdown", handlePointerDown);
    const stopTracking = trackViewportChanges(updateTooltipPosition);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      stopTracking();
    };
  }, [activeCell]);

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!isMobileInput) return;

    const cell = (event.target as HTMLElement).closest?.(
      "[data-heatmap-tooltip]",
    ) as HTMLElement | null;
    if (!cell || !rootRef.current?.contains(cell)) return;

    setActiveCell((current) => (current === cell ? null : cell));
  }

  const tooltip = activeCell?.dataset.heatmapTooltip;

  return (
    <div
      ref={rootRef}
      role="list"
      aria-label={ariaLabel}
      className={className}
      onClick={handleClick}
    >
      {children}
      {isMobileInput && tooltip && tooltipPosition
        ? createPortal(
          <span
            role="tooltip"
            className="fixed z-50 w-max max-w-52 -translate-x-1/2 -translate-y-full rounded-lg bg-popover px-3 py-2 text-xs font-bold leading-5 text-popover-foreground shadow-md ring-1 ring-foreground/10"
            style={{
              left: tooltipPosition.left,
              top: tooltipPosition.top,
            }}
          >
            {tooltip}
          </span>,
          document.body,
        )
        : null}
    </div>
  );
}
