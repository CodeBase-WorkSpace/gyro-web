"use client";

import Link from "next/link";

import {AdvancedPlanBadge} from "@/components/subscription/advanced-plan-badge";
import {buttonVariants} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {PlanLimitNotice} from "@/lib/subscription/plan-limits";
import {cn} from "@/lib/utils";

export function PlanLimitDialog({
  notice,
  open,
  onOpenChange,
}: {
  notice?: PlanLimitNotice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!notice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader className="gap-3">
          <AdvancedPlanBadge icon="lock" label="قفل پیشرفته" className="w-fit" />
          <DialogTitle className="leading-7">{notice.title}</DialogTitle>
          <DialogDescription>{notice.description}</DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm leading-7 text-amber-800 dark:text-amber-300">
          اطلاعات فعلی شما حفظ می‌شود؛ فقط ساخت مورد جدید بعد از سقف رایگان به طرح پیشرفته نیاز دارد.
        </div>
        <DialogFooter>
          <Link
            href={notice.actionHref}
            className={cn(buttonVariants({size: "lg"}), "rounded-full")}
          >
            مشاهده طرح پیشرفته
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
