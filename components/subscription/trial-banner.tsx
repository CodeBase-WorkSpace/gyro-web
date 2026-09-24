"use client";

import { useState, useTransition } from "react";
import { ClockIcon, GiftIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { claimTrialAction } from "@/app/_actions/trial";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toPersianDigits } from "@/lib/format";
import type { SubscriptionState } from "@/lib/subscription/entitlements";
import {
  TRIAL_LAPSE_FEATURES,
  trialBannerState,
} from "@/lib/subscription/trial";

export function TrialBanner({ subscription }: { subscription: SubscriptionState }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(false);

  const state = trialBannerState(subscription);
  if (!state || dismissed) return null;

  function claim() {
    startTransition(async () => {
      const result = await claimTrialAction();
      if (result.ok) {
        toast.success(result.message ?? "دوره آزمایشی فعال شد.");
        router.refresh();
      } else {
        toast.error(result.message ?? "فعال‌سازی انجام نشد.");
        setDismissed(true);
      }
    });
  }

  if (state.kind === "claim") {
    return (
      <section
        className="flex flex-col gap-3 rounded-2xl border bg-card/90 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        aria-label="دوره آزمایشی پیشرفته"
      >
        <div className="flex min-w-0 items-start gap-2">
          <GiftIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm leading-7">
            <strong>۱۴ روز پلن پیشرفته، رایگان.</strong>{" "}
            <span className="text-muted-foreground">
              برنامه‌ریزی هفتگی، تحلیل‌های پیشرفته و امکانات نامحدود را امتحان کن؛ بدون نیاز به پرداخت.
            </span>
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          className="h-10 shrink-0 rounded-full"
          disabled={pending}
          onClick={claim}
        >
          {pending ? <Spinner /> : <GiftIcon data-icon="inline-start" />}
          فعال‌سازی دوره آزمایشی
        </Button>
      </section>
    );
  }

  if (state.kind === "ending") {
    return (
      <section
        className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 shadow-sm"
        aria-label="پایان دوره آزمایشی"
      >
        <div className="flex items-start gap-2">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          <div className="min-w-0 text-sm leading-7">
            <strong>
              {toPersianDigits(state.daysLeft)} روز تا پایان دوره آزمایشی پیشرفته.
            </strong>{" "}
            <span className="text-muted-foreground">
              با پایان دوره، این امکانات غیرفعال می‌شوند:{" "}
              {TRIAL_LAPSE_FEATURES.join("، ")}.
            </span>{" "}
            <Link
              href="/profile/billing"
              className="font-bold text-primary underline-offset-4 hover:underline"
            >
              مشاهده پلن‌ها
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="flex items-center gap-2 rounded-2xl border bg-card/90 px-4 py-2.5 shadow-sm"
      aria-label="دوره آزمایشی فعال"
    >
      <ClockIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <p className="min-w-0 text-sm leading-6">
        <strong>{toPersianDigits(state.daysLeft)} روز</strong>{" "}
        <span className="text-muted-foreground">
          از دوره آزمایشی پلن پیشرفته باقی مانده است.
        </span>
      </p>
      <Link
        href="/profile/billing"
        className="ms-auto shrink-0 text-sm font-bold text-primary underline-offset-4 hover:underline"
      >
        مشاهده پلن‌ها
      </Link>
    </section>
  );
}
