"use client";

import {DownloadIcon, LoaderCircleIcon} from "lucide-react";

import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import {useServiceWorkerUpdate} from "./service-worker-registration";

export function PwaUpdateButton({
  surface,
  compact = false,
}: {
  surface: "desktop" | "mobile";
  compact?: boolean;
}) {
  const {applyUpdate, isUpdateAvailable, isUpdating} = useServiceWorkerUpdate();

  if (!isUpdateAvailable) return null;

  const label = isUpdating ? "در حال به‌روزرسانی" : "به‌روزرسانی آماده است";
  const Icon = isUpdating ? LoaderCircleIcon : DownloadIcon;

  return (
    <Button
      type="button"
      variant={surface === "desktop" ? "outline" : "default"}
      className={cn(
        "font-bold",
        surface === "desktop"
          ? compact
            ? "size-11 rounded-xl"
            : "h-11 w-full justify-start gap-3 rounded-xl"
          : "fixed bottom-24 left-6 z-40 h-12 rounded-full px-4 text-sm shadow-[0_16px_34px_color-mix(in_oklch,var(--primary)_24%,transparent)] transition-transform hover:-translate-y-0.5 motion-reduce:transition-none lg:hidden",
      )}
      aria-label={label}
      disabled={isUpdating}
      onClick={applyUpdate}
      title={surface === "desktop" ? label : undefined}
    >
      <Icon className={cn(isUpdating && "animate-spin motion-reduce:animate-none")} aria-hidden="true" />
      <span className={cn(compact && "sr-only")}>{label}</span>
    </Button>
  );
}
