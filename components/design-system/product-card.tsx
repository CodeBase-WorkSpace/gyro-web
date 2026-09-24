import { ComponentProps } from "react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function ProductCard({ className, ...props }: ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "rounded-3xl bg-card/95 shadow-[0_18px_50px_color-mix(in_oklch,var(--background)_52%,transparent)]",
        className
      )}
      {...props}
    />
  );
}

function ProductCardHeader({ className, ...props }: ComponentProps<typeof CardHeader>) {
  return <CardHeader className={cn("gap-2.5", className)} {...props} />;
}

function ProductCardTitle(props: ComponentProps<typeof CardTitle>) {
  return <CardTitle {...props} />;
}

function ProductCardDescription(props: ComponentProps<typeof CardDescription>) {
  return <CardDescription {...props} />;
}

function ProductCardContent(props: ComponentProps<typeof CardContent>) {
  return <CardContent {...props} />;
}

function ProductCardFooter({ className, ...props }: ComponentProps<typeof CardFooter>) {
  return <CardFooter className={cn("border-border bg-sidebar/60", className)} {...props} />;
}

export {
  ProductCard,
  ProductCardContent,
  ProductCardDescription,
  ProductCardFooter,
  ProductCardHeader,
  ProductCardTitle
};
