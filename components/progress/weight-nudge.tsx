"use client";

import type { ComponentProps } from "react";
import { useState } from "react";
import { ScaleIcon } from "lucide-react";

import { WeightEntrySheet } from "@/components/progress/weight-entry-sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WeightNudge({
  date,
  hasConfiguredGoal,
  actionSize = "sm",
  actionClassName,
  presentation = "nudge",
}: {
  date: string;
  hasConfiguredGoal: boolean;
  actionSize?: ComponentProps<typeof Button>["size"];
  actionClassName?: string;
  presentation?: "nudge" | "action";
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const action = (
    <Button
      type="button"
      variant="outline"
      size={actionSize}
      className={cn("shrink-0 rounded-full", actionClassName)}
      onClick={() => setSheetOpen(true)}
    >
      <ScaleIcon data-icon="inline-start" aria-hidden="true" />
      ثبت وزن
    </Button>
  );

  const sheet = (
    <WeightEntrySheet
      defaultDate={date}
      open={sheetOpen}
      onOpenChange={setSheetOpen}
    />
  );

  if (presentation === "action") {
    return (
      <>
        {action}
        {sheet}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed bg-muted/30 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="min-w-0 leading-7 text-muted-foreground">
        <ScaleIcon
          className="me-1.5 inline size-4 align-text-bottom text-primary"
          aria-hidden="true"
        />
        {hasConfiguredGoal
          ? "مدتی است وزنت را ثبت نکرده‌ای؛ ثبت منظم وزن، برنامه‌ات را دقیق نگه می‌دارد."
          : "مدتی است وزنت را ثبت نکرده‌ای؛ با ثبت وزن، روند تغییرات را دنبال کن."}
      </p>
      {action}
      {sheet}
    </div>
  );
}
