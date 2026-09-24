"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { toast } from "sonner";

import { markWelcomeSeenAction } from "@/app/(app)/dashboard/actions";
import { useQueuedDialog } from "@/components/dialog-queue/dialog-queue-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GOAL_ONBOARDING_PATH, GOAL_WIZARD_PATH } from "@/lib/onboarding";

export function OnboardingWelcomeDialog({
  enabled,
  recentSignup = false,
  onShown,
  onDismiss,
}: {
  enabled: boolean;
  recentSignup?: boolean;
  onShown: () => void;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { open, complete } = useQueuedDialog(
    "dashboard-goal-wizard",
    10,
    enabled,
  );

  useEffect(() => {
    if (open) onShown();
  }, [onShown, open]);

  function dismiss() {
    onDismiss();
    complete();
  }

  function startGoalSetup() {
    startTransition(async () => {
      const result = await markWelcomeSeenAction();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      onDismiss();
      complete();
      router.replace(recentSignup ? GOAL_ONBOARDING_PATH : GOAL_WIZARD_PATH);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && dismiss()}>
      <DialogContent
        dir="rtl"
        className="max-w-md rounded-[2rem] border-border/80 bg-background p-6 sm:p-7"
        showCloseButton
      >
        <DialogHeader className="items-center text-center">
          <span className="grid size-16 place-items-center rounded-3xl bg-primary/10 shadow-[0_16px_36px_color-mix(in_oklch,var(--primary)_18%,transparent)]">
            <Image
              src="/brand/gyro-symbol-96.png"
              width={48}
              height={48}
              alt="نشان جیرو"
              className="size-12"
            />
          </span>
          <DialogTitle className="mt-4 text-2xl font-black">
            خوش اومدی؛ برنامه‌ات را با هم می‌سازیم
          </DialogTitle>
          <DialogDescription className="mt-2 max-w-sm text-center text-base leading-8">
            در ۵ مرحله کوتاه، با توجه به قد، وزن، سن، فعالیت و هدفت، کالری و
            ماکروهای روزانه‌ات را تخمین می‌زنیم.
          </DialogDescription>
        </DialogHeader>

        <p className="rounded-3xl border border-border/80 bg-card/45 p-4 text-center text-sm leading-7 text-muted-foreground">
          این پیشنهاد یک نقطه شروع قابل‌ویرایش است و هر زمان بخواهی می‌تونی
          اطلاعات یا هدفت را تغییر بدهی.
        </p>

        <DialogFooter className="mt-2 flex-col sm:flex-col sm:items-stretch">
          <Button
            type="button"
            size="xl"
            className="w-full rounded-full"
            disabled={pending}
            onClick={startGoalSetup}
          >
            {pending ? "یک لحظه…" : "برنامه‌ام را بساز"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xl"
            className="w-full rounded-full"
            disabled={pending}
            onClick={dismiss}
          >
            بعداً انجام می‌دم
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
