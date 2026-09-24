import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatusPillProps = {
  children: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "success" | "warning";
  className?: string;
};

export function StatusPill({ children, icon, tone = "neutral", className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-[34px] w-fit items-center gap-2 rounded-full border border-border bg-muted px-3 text-xs font-extrabold text-muted-foreground [&_svg]:text-primary",
        tone === "success" && "border-primary/60 text-primary",
        tone === "warning" && "border-chart-2/60 text-chart-2",
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
}
