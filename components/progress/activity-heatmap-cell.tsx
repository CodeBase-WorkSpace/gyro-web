import {cn} from "@/lib/utils";

// Server-rendered cell: interactivity (tap tooltip on coarse pointers) is
// handled by the single ActivityHeatmapGrid client wrapper via delegation.
export function ActivityHeatmapCell({
                                      ariaLabel,
                                      className,
                                      disabled,
                                      tooltip,
                                    }: {
  ariaLabel: string;
  className: string;
  disabled?: boolean;
  tooltip: string;
}) {
  return (
    <span
      role="listitem"
      aria-label={ariaLabel}
      data-disabled={disabled || undefined}
      title={tooltip}
      data-heatmap-tooltip={tooltip}
      className={cn(className, "cursor-default pointer-coarse:cursor-pointer")}
    />
  );
}
