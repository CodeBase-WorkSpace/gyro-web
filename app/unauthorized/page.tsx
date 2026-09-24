import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlertIcon } from "lucide-react";

import { BrandMark } from "@/components/design-system/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Gyro | دسترسی غیرمجاز",
  description: "این حساب به بخش درخواست‌شده دسترسی ندارد."
};

export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-background px-4 text-foreground">
      <section className="flex w-full max-w-md flex-col gap-5">
        <BrandMark sublabel="دسترسی" />
        <Card className="rounded-3xl border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <ShieldAlertIcon className="size-5 text-destructive" aria-hidden="true" />
              دسترسی به این بخش مجاز نیست
            </CardTitle>
            <CardDescription className="leading-7">
              حساب فعلی مجوز لازم برای مشاهده این بخش را ندارد.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-full")}>
              بازگشت به داشبورد
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
