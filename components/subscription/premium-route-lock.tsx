import {
  AlertTriangleIcon,
} from "lucide-react";
import Link from "next/link";

import {AdvancedPlanBadge} from "@/components/subscription/advanced-plan-badge";
import {Button} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {LockedFeatureState} from "@/lib/subscription/locked-feature-state";

export function PremiumRouteLock({state}: { state: LockedFeatureState }) {
  return (
    <Card className="rounded-3xl border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <AdvancedPlanBadge icon="lock" label={state.requiredTierLabel} compact />
          {state.title}
        </CardTitle>
        <CardDescription className="leading-7">
          {state.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm leading-7 text-muted-foreground">
        <div className="rounded-2xl border bg-muted/30 p-3">
          <p className="font-bold text-foreground">قابلیت</p>
          <p>{state.featureName}</p>
        </div>
        <div className="rounded-2xl border bg-muted/30 p-3">
          <p className="font-bold text-foreground">پلن لازم</p>
          <AdvancedPlanBadge icon="lock" label={state.requiredTierLabel} compact />
        </div>
        {state.supportRequestId ? (
          <div className="flex items-start gap-2 rounded-2xl border bg-muted/30 p-3">
            <AlertTriangleIcon data-icon="inline-start"/>
            <span>
              شناسه پیگیری: <bdi>{state.supportRequestId}</bdi>
            </span>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="justify-end">
        {state.recoveryAction.href && !state.recoveryAction.disabled ? (
          <Button render={<Link href={state.recoveryAction.href}/>}>
            {state.recoveryAction.label}
          </Button>
        ) : (
          <Button type="button" disabled>
            {state.recoveryAction.label}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
