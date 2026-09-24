"use client";

import {CheckIcon} from "lucide-react";

import {toPersianDigits} from "@/lib/format";
import {cn} from "@/lib/utils";

export type WizardStep = {
  id: string;
  label: string;
};

export function WizardStepper({
                                steps,
                                activeIndex,
                                onStepSelect,
                              }: {
  steps: WizardStep[];
  activeIndex: number;
  onStepSelect?: (index: number) => void;
}) {
  return (
    <ol
      className="sticky top-0 z-20 -mx-1 flex items-center gap-1 border-b border-border/70 bg-background/95 px-1 pb-2 pt-1 shadow-[0_10px_24px_color-mix(in_oklch,var(--background)_88%,transparent)] backdrop-blur-sm"
      dir="rtl"
      aria-label="مراحل فرم"
    >
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;
        const clickable = Boolean(onStepSelect) && index < activeIndex;

        return (
          <li key={step.id} className="flex min-w-0 flex-1 items-center gap-1">
            <button
              type="button"
              disabled={!clickable}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-2xl px-1 py-1.5",
                clickable && "cursor-pointer",
              )}
              onClick={clickable ? () => onStepSelect?.(index) : undefined}
            >
							<span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold tabular-nums transition-colors",
                  isActive && "border-primary bg-primary text-primary-foreground",
                  isDone && "border-primary/60 bg-primary/10 text-primary",
                  !isActive && !isDone && "border-border bg-muted/40 text-muted-foreground",
                )}
              >
								{isDone ? <CheckIcon className="size-4"/> : toPersianDigits(index + 1)}
							</span>
              <span
                className={cn(
                  "w-full truncate text-center text-[11px] leading-4",
                  isActive ? "font-bold text-foreground" : "text-muted-foreground",
                )}
              >
								{step.label}
							</span>
            </button>
            {index < steps.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "h-px w-3 shrink-0 sm:w-5",
                  index < activeIndex ? "bg-primary/60" : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
