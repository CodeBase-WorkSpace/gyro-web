import type React from "react";
import Link from "next/link";

import {AdvancedPlanBadge} from "@/components/subscription/advanced-plan-badge";
import {
  type LockedFeatureReasonCode,
  lockedFeatureState,
  type RecoveryAction,
} from "@/lib/subscription/locked-feature-state";
import type {SubscriptionTier} from "@/lib/subscription/entitlements";
import {cn} from "@/lib/utils";

export function LockedFeature({
                                locked,
                                label = "پیشرفته",
                                description,
                                featureName,
                                requiredTier = "ADVANCED",
                                reasonCode = "SUBSCRIPTION_MISSING",
                                recoveryAction,
                                supportRequestId,
                                actionHref = "/profile/billing",
                                actionLabel = "مشاهده پلن‌ها",
                                children,
                                className,
                              }: {
  locked: boolean;
  label?: string;
  description?: string;
  featureName?: string;
  requiredTier?: SubscriptionTier;
  reasonCode?: LockedFeatureReasonCode;
  recoveryAction?: RecoveryAction;
  supportRequestId?: string;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const lockState = locked && featureName
    ? lockedFeatureState({
      featureName,
      requiredTier,
      reasonCode,
      recoveryAction,
      supportRequestId,
    })
    : null;
  const action = lockState?.recoveryAction ?? {
    label: actionLabel,
    href: actionHref,
  };

  return (
    <div
      className={cn("relative", locked && "group/locked", className)}
      data-locked={locked || undefined}
    >
      {children}
      {locked ? (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-primary/20"
          aria-hidden="true"
        />
      ) : null}
      {locked ? (
        <span
          className="absolute left-3 top-3"
        >
          <AdvancedPlanBadge
            icon="lock"
            label={lockState?.requiredTierLabel ?? label}
            compact
          />
        </span>
      ) : null}
      {(description || lockState) && locked ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs leading-6 text-muted-foreground">
          <div className="grid gap-1">
            {lockState ? (
              <p className="font-bold text-foreground">{lockState.title}</p>
            ) : null}
            <p>{description ?? lockState?.description}</p>
            {lockState?.supportRequestId ? (
              <p>
                شناسه پیگیری: <bdi>{lockState.supportRequestId}</bdi>
              </p>
            ) : null}
          </div>
          {action.href && !action.disabled ? (
            <Link
              href={action.href}
              className="font-bold text-primary underline-offset-4 hover:underline"
            >
              {action.label}
            </Link>
          ) : (
            <span className="font-bold text-muted-foreground">
              {action.label}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
