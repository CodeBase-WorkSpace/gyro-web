"use client";

import {type ComponentProps, forwardRef} from "react";

import {cn} from "@/lib/utils";

export const ScrollArea = forwardRef<
	HTMLDivElement,
	ComponentProps<"div"> & {
  orientation?: "vertical" | "horizontal" | "both";
		viewportClassName?: string;
	}
>(function ScrollArea(
  {className, orientation = "vertical", viewportClassName, ...props},
  ref,
) {
	return (
		<div
			data-slot="scroll-area"
			className={cn("relative min-h-0 overflow-hidden", className)}
		>
			<div
				ref={ref}
				data-slot="scroll-area-viewport"
				className={cn(
          "h-full min-h-0 [scrollbar-color:color-mix(in_oklch,var(--primary)_54%,transparent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:size-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/45 [&::-webkit-scrollbar-thumb]:shadow-[0_0_12px_color-mix(in_oklch,var(--primary)_28%,transparent)] [&::-webkit-scrollbar-thumb:hover]:bg-primary/70",
          orientation === "vertical" &&
          "overflow-x-hidden overflow-y-auto pr-1",
          orientation === "horizontal" &&
          "overflow-x-auto overflow-y-hidden pb-1",
          orientation === "both" &&
          "overflow-auto pb-1 pr-1",
					viewportClassName,
				)}
				{...props}
			/>
		</div>
	);
});
