import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({ eyebrow, title, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-4", className)}>
      <div>
        {eyebrow ? <p className="panel-label">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
