import { redirect, unstable_rethrow } from "next/navigation";

import { TrackOnce } from "@/components/analytics/track-once";
import { GyroDashboard } from "@/components/gyro-dashboard";
import { getCurrentEntitlement } from "@/lib/api/entitlement";
import { getNutritionCoachState } from "@/lib/api/nutrition-coach";
import {
  getPendingRecalibration,
  type RecalibrationSuggestionDto,
} from "@/lib/api/recalibration";
import { getFoodReminderSchedules } from "@/lib/api/notifications";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-api";
import { getSession } from "@/lib/auth/session";
import {
  diaryDateHref,
  loadDashboardDiary,
  loadDashboardProgress,
  resolveDiaryDate,
} from "@/lib/diary/dashboard-loader";
import {
  isNutritionCoachEnabled,
  isNotificationPermissionPromptEnabled,
} from "@/lib/features/server-features";
import {
  resolveNutritionCoachDashboardLoad,
  type NutritionCoachLoadResult,
} from "@/lib/nutrition-coach/dashboard-load";
import {
  canUseEntitlement,
  demoSubscriptionState,
  type SubscriptionState,
} from "@/lib/subscription/entitlements";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; onboarding?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();

  if (!session.isAuthenticated) {
    const nextPath = params.date ? `/dashboard?date=${params.date}` : "/dashboard";
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}&expired=1`);
  }

  const today = resolveDiaryDate(undefined, session.user.timezone);
  const date = resolveDiaryDate(params.date, session.user.timezone);
  const nextPath = diaryDateHref(date, "/dashboard");
  const notificationEducationEnabled = isNotificationPermissionPromptEnabled();
  const nutritionCoachEnabled = isNutritionCoachEnabled();
  const subscriptionPromise = loadCurrentEntitlement("/dashboard");
  const recalibrationPromise = nutritionCoachEnabled
    ? Promise.resolve(null)
    : subscriptionPromise.then((subscription) =>
        loadPendingRecalibration(subscription, nextPath),
      );
  const nutritionCoachPromise: Promise<NutritionCoachLoadResult | null> = nutritionCoachEnabled
    ? loadNutritionCoachState(nextPath)
    : Promise.resolve(null);
  // Started here but deliberately not awaited. The progress cards and the
  // prompt coordinator stream in behind Suspense, which keeps four of the
  // dashboard's backend calls (three for progress, one for reminders) off the
  // critical path — the shell used to wait for the slowest of all of them.
  // The no-op catch only marks the rejection as observed so Node does not treat
  // it as unhandled in the gap before React consumes it; the promise still
  // rejects for the component awaiting it.
  const progressPromise = loadDashboardProgress(date, nextPath);
  const hasEnabledReminderPromise = loadHasEnabledReminder(
    nextPath,
    notificationEducationEnabled,
  );
  progressPromise.catch(() => {});
  hasEnabledReminderPromise.catch(() => {});

  const [subscription, data, recalibration, nutritionCoachResult] =
    await Promise.all([
      subscriptionPromise,
      loadDashboardDiary(date, nextPath),
      recalibrationPromise,
      nutritionCoachPromise,
    ]);
  const coachLoad = resolveNutritionCoachDashboardLoad(nutritionCoachResult);
  // The fallback is deliberately failure-only: a valid empty Coach state is a
  // rollout response, not a reason to revive the legacy card.
  const dashboardRecalibration = coachLoad.shouldLoadLegacyRecalibration
    ? await loadPendingRecalibration(subscription, nextPath)
    : recalibration;

  return (
    <>
      {params.onboarding === "1" ? <TrackOnce event="seo_signup_completed" /> : null}
      <GyroDashboard
        session={session}
        data={data}
        progressPromise={progressPromise}
        date={date}
        today={today}
        subscription={subscription}
        recalibration={dashboardRecalibration}
        nutritionCoach={coachLoad.nutritionCoach}
        recentSignup={params.onboarding === "1"}
        notificationEducationEnabled={notificationEducationEnabled}
        hasEnabledReminderPromise={hasEnabledReminderPromise}
      />
    </>
  );
}

async function loadNutritionCoachState(
  nextPath: string,
): Promise<NutritionCoachLoadResult> {
  try {
    const state = await authenticatedServerRequest(
      (accessToken) => getNutritionCoachState(accessToken),
      { nextPath, retryPolicy: "idempotent" },
    );
    return { kind: "success", state };
  } catch (error) {
    unstable_rethrow(error);
    console.warn(
      "event=nutrition_coach_fetch outcome=failure surface=dashboard",
      error,
    );
    return { kind: "failure" };
  }
}

async function loadPendingRecalibration(
  subscription: SubscriptionState,
  nextPath: string,
): Promise<RecalibrationSuggestionDto | null> {
  if (!canUseEntitlement(subscription, "goal_recalibration")) return null;

  try {
    return await authenticatedServerRequest(
      (accessToken) => getPendingRecalibration(accessToken),
      { nextPath, retryPolicy: "idempotent" },
    );
  } catch (error) {
    console.warn(
      "event=recalibration_fetch outcome=failure surface=dashboard",
      error,
    );
    return null;
  }
}

async function loadCurrentEntitlement(nextPath: string) {
  try {
    return await authenticatedServerRequest(
      (accessToken) => getCurrentEntitlement(accessToken),
      { nextPath, retryPolicy: "idempotent" },
    );
  } catch (error) {
    console.warn(
      "event=entitlement_fetch outcome=failure surface=dashboard",
      error,
    );
    return demoSubscriptionState("FREE");
  }
}

async function loadHasEnabledReminder(nextPath: string, enabled: boolean) {
  if (!enabled) return false;

  try {
    const schedules = await authenticatedServerRequest(
      (accessToken) => getFoodReminderSchedules(accessToken),
      { nextPath, retryPolicy: "idempotent" },
    );
    return schedules.some((schedule) => schedule.enabled);
  } catch (error) {
    console.warn(
      "event=notification_reminder_fetch outcome=failure surface=dashboard",
      error,
    );
    return false;
  }
}
