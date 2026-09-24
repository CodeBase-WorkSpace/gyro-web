import { cn } from "@/lib/utils";

type MetricTileProps = {
  label: string;
  value: string;
  helper?: string;
  tone?: "good" | "warn" | "quiet";
  className?: string;
};

export function MetricTile({ label, value, helper, tone = "quiet", className }: MetricTileProps) {
  return (
    <article className={cn("grid gap-1 rounded-3xl border border-border bg-card/90 p-4", className)}>
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
      <strong
        className={cn(
          "text-[1.75rem] leading-tight font-black tabular-nums text-foreground",
          tone === "good" && "text-primary",
          tone === "warn" && "text-chart-2"
        )}
      >
        {value}
      </strong>
      {helper ? <small className="text-xs font-bold text-muted-foreground">{helper}</small> : null}
    </article>
  );
}
