"use client";

import {ArrowRightIcon} from "lucide-react";
import type {ReactNode} from "react";

import {Button} from "@/components/ui/button";

export function WizardFooter({
                               summary,
                               canGoBack,
                               isLastStep,
                               disabled,
                               onBack,
                               onContinue,
                               continueLabel = "ادامه",
                               submitButton,
                             }: {
  summary?: ReactNode;
  canGoBack: boolean;
  isLastStep: boolean;
  disabled?: boolean;
  onBack: () => void;
  /** Lets a non-form wizard validate and advance without submitting a parent form. */
  onContinue?: () => void;
  continueLabel?: string;
  /** Rendered instead of the continue button on the last step (usually a submit button). */
  submitButton: ReactNode;
}) {
  return (
    <div
      className="sticky bottom-0 z-20 -mx-1 border-t border-border/70 bg-background/95 px-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm"
      dir="rtl"
    >
      {summary ? <div className="mb-3">{summary}</div> : null}
      <div className="flex items-center justify-between gap-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-11 rounded-full"
        disabled={!canGoBack || disabled}
        onClick={onBack}
      >
        <ArrowRightIcon data-icon="inline-start"/>
        بازگشت
      </Button>
      {isLastStep ? (
        submitButton
      ) : (
        <Button
          type={onContinue ? "button" : "submit"}
          size="lg"
          className="h-11 rounded-full"
          disabled={disabled}
          onClick={onContinue}
        >
          {continueLabel}
        </Button>
      )}
      </div>
    </div>
  );
}
