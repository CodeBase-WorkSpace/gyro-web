import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  label?: string;
  sublabel: string;
  className?: string;
};

export function BrandMark({ label = "جیرو", sublabel, className }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3 text-foreground", className)} aria-label={`${label} ${sublabel}`}>
      <span
        data-slot="brand-glyph"
        className="grid size-[42px] place-items-center"
      >
        <Image
          src="/brand/gyro-symbol-48.png"
          alt=""
          width={42}
          height={42}
          className="size-full object-contain"
        />
      </span>
      <span data-slot="brand-copy" className="grid leading-tight">
        <strong>{label}</strong>
        <small className="text-xs text-muted-foreground">{sublabel}</small>
      </span>
    </div>
  );
}
