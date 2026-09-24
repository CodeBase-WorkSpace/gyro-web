"use client";

import Link from "next/link";
import {useActionState} from "react";

import {
  cancelSubscriptionAction,
  restoreSubscriptionAction,
  type SubscriptionActionState,
} from "@/app/_actions/subscription";
import {Button} from "@/components/ui/button";
import type {CurrentSubscription} from "@/lib/api/subscription";
import {
  billingAccessKind,
  type BillingAccessKind,
} from "@/lib/subscription/billing-presentation";
import {formatBillingHistoryDate} from "@/lib/subscription/billing-history";
import type {SubscriptionState} from "@/lib/subscription/entitlements";

const initial: SubscriptionActionState = {status: "idle"};

export function SubscriptionStatusCard({
  subscription,
  entitlement,
}: {
  subscription: CurrentSubscription | null;
  entitlement: SubscriptionState;
}) {
  const [cancelState, cancel] = useActionState(cancelSubscriptionAction, initial);
  const [restoreState, restore] = useActionState(restoreSubscriptionAction, initial);
  const state = subscription ?? {
    status: "NONE",
    cancelAtPeriodEnd: false,
    nextAction: "RENEW",
  } as CurrentSubscription;
  const accessKind = billingAccessKind(entitlement, subscription);
  const presentation = accessPresentation(accessKind, entitlement, state);

  return (
    <section className="rounded-3xl border bg-card/90 p-5 shadow-sm">
      <p className="text-xs font-black text-primary">وضعیت دسترسی</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-black">{presentation.title}</h2>
        <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
          {presentation.badge}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium leading-7 text-muted-foreground">
        {presentation.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {accessKind === "TRIAL" ? (
          <Link href="#plans"><Button>انتخاب مدت اشتراک</Button></Link>
        ) : state.cancelAtPeriodEnd ? (
          <form action={restore}><Button type="submit">ادامه اشتراک</Button></form>
        ) : state.status === "ACTIVE" ? (
          <>
            <Link href="#plans"><Button>تمدید اشتراک</Button></Link>
            <form action={cancel}>
              <Button type="submit" variant="ghost">لغو در پایان دوره</Button>
            </form>
          </>
        ) : (
          <Link href="#plans"><Button>مشاهده طرح‌ها</Button></Link>
        )}
      </div>
      {cancelState.error || restoreState.error ? (
        <p className="mt-2 text-xs text-destructive">
          {cancelState.error ?? restoreState.error}
        </p>
      ) : null}
    </section>
  );
}

function accessPresentation(
  accessKind: BillingAccessKind,
  entitlement: SubscriptionState,
  lifecycle: CurrentSubscription,
) {
  const periodEnd = lifecycle.periodEnd ?? entitlement.currentPeriodEnd;
  const formattedPeriodEnd = periodEnd
    ? formatBillingHistoryDate(periodEnd)
    : null;

  if (accessKind === "TRIAL") {
    const trialEnd = entitlement.trial?.expiresAt
      ? formatBillingHistoryDate(entitlement.trial.expiresAt)
      : formattedPeriodEnd;
    return {
      title: "دوره آزمایشی پیشرفته",
      badge: "رایگان",
      description: `همه امکانات پیشرفته${trialEnd ? ` تا ${trialEnd}` : " در این دوره"} فعال است. با خرید اشتراک، مدت انتخابی بعد از دوره آزمایشی به دسترسی‌ات اضافه می‌شود.`,
    };
  }

  if (accessKind === "PAID") {
    if (lifecycle.status === "GRACE_PERIOD") {
      const graceEnd = lifecycle.gracePeriodEnd
        ? formatBillingHistoryDate(lifecycle.gracePeriodEnd)
        : "پایان مهلت";
      return {
        title: "اشتراک پیشرفته",
        badge: "مهلت تمدید",
        description: `مهلت تمدید تا ${graceEnd} ادامه دارد. برای حفظ دسترسی، یک دوره اشتراک انتخاب کن.`,
      };
    }
    if (lifecycle.cancelAtPeriodEnd) {
      return {
        title: "اشتراک پیشرفته",
        badge: "لغو در پایان دوره",
        description: `دسترسی‌ات تا ${formattedPeriodEnd ?? "پایان دوره"} فعال می‌ماند. می‌تونی ادامه اشتراک را دوباره فعال کنی.`,
      };
    }
    return {
      title: "اشتراک پیشرفته",
      badge: "خریداری‌شده",
      description: `اشتراک خریداری‌شده‌ات${formattedPeriodEnd ? ` تا ${formattedPeriodEnd}` : ""} فعال است. هر دوره جدید به زمان باقی‌مانده اضافه می‌شود.`,
    };
  }

  if (lifecycle.status === "EXPIRED") {
    return {
      title: "طرح رایگان",
      badge: "اشتراک پایان‌یافته",
      description: "اشتراک قبلی پایان یافته و امکانات پایه همچنان فعال است. برای بازگشت به امکانات پیشرفته، یک دوره انتخاب کن.",
    };
  }

  return {
    title: "طرح رایگان",
    badge: "فعال",
    description: "امکانات پایه برای ثبت غذا، هدف و پیگیری روزانه فعال است. هر زمان بخواهی می‌تونی طرح پیشرفته را انتخاب کنی.",
  };
}
