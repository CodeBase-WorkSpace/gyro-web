"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { NotificationPermissionDialog } from "@/components/dashboard/notification-permission-dialog";
import { OnboardingWelcomeDialog } from "@/components/dashboard/onboarding-welcome-dialog";
import { DashboardCoachMarks } from "@/components/onboarding/dashboard-coach-marks";
import type { BrowserNotificationPermission } from "@/lib/notifications/browser-permission";
import {
  applyPromptCompleted,
  applyPromptDismissed,
  applyPromptShown,
  PROMPT_COOLDOWNS_MS,
  readDashboardPromptState,
  selectDashboardPrompt,
  writePromptLifecycle,
  type DashboardPromptId,
  type DashboardPromptState,
  type PromptLifecycle,
} from "@/lib/onboarding/prompt-coordinator";
import { browserNotificationPermission } from "@/lib/push-browser";

const COACH_MARK_PROMPTS = new Set<DashboardPromptId>([
  "first-meal-guidance",
  "first-log-celebration",
  "quick-add-guidance",
  "explore-progress",
  "profile-settings-guidance",
]);

export function DashboardPromptCoordinator({
  userId,
  hasActiveGoal,
  entryCount,
  loggedDayCount,
  hasEnabledReminder,
  notificationEducationEnabled,
  recentSignup,
}: {
  userId: string;
  hasActiveGoal: boolean;
  entryCount: number;
  loggedDayCount: number;
  hasEnabledReminder: boolean;
  notificationEducationEnabled: boolean;
  recentSignup: boolean;
}) {
  const [promptState, setPromptState] = useState<DashboardPromptState | null>(
    null,
  );
  const [permission, setPermission] =
    useState<BrowserNotificationPermission>("unsupported");
  const [evaluationTime, setEvaluationTime] = useState(0);

  useEffect(() => {
    try {
      setPromptState(readDashboardPromptState(window.localStorage, userId));
    } catch {
      setPromptState(readDashboardPromptState(memoryStorage(), userId));
    }
    setPermission(browserNotificationPermission());
    setEvaluationTime(Date.now());
  }, [userId]);

  const updatePrompt = useCallback(
    (
      id: DashboardPromptId,
      update: (lifecycle: PromptLifecycle) => PromptLifecycle,
    ) => {
      setPromptState((current) => {
        if (!current) return current;
        const lifecycle = update(current[id]);
        try {
          writePromptLifecycle(window.localStorage, userId, id, lifecycle);
        } catch {
          // Persistence is best effort when storage is unavailable.
        }
        return { ...current, [id]: lifecycle };
      });
    },
    [userId],
  );

  const showPrompt = useCallback(
    (id: DashboardPromptId) => {
      updatePrompt(id, (lifecycle) => applyPromptShown(lifecycle, Date.now()));
    },
    [updatePrompt],
  );

  const dismissPrompt = useCallback(
    (id: DashboardPromptId) => {
      updatePrompt(id, (lifecycle) =>
        applyPromptDismissed(
          lifecycle,
          Date.now(),
          PROMPT_COOLDOWNS_MS[id],
        ),
      );
    },
    [updatePrompt],
  );

  const completePrompt = useCallback(
    (id: DashboardPromptId) => {
      updatePrompt(id, (lifecycle) =>
        applyPromptCompleted(lifecycle, Date.now()),
      );
    },
    [updatePrompt],
  );

  const hasLoggedFood = entryCount > 0 || loggedDayCount > 0;

  useEffect(() => {
    if (!promptState) return;
    if (hasActiveGoal && !promptState["goal-wizard"].completedAt) {
      completePrompt("goal-wizard");
    }
    if (
      hasLoggedFood &&
      promptState["first-meal-guidance"].lastShownAt &&
      !promptState["first-meal-guidance"].completedAt
    ) {
      completePrompt("first-meal-guidance");
    }
    if (
      permission === "granted" &&
      !promptState["notification-education"].completedAt
    ) {
      completePrompt("notification-education");
    }
  }, [
    completePrompt,
    hasActiveGoal,
    hasLoggedFood,
    permission,
    promptState,
  ]);

  const selectedPrompt = useMemo(
    () =>
      promptState
        ? selectDashboardPrompt(
            {
              hasActiveGoal,
              hasLoggedFood,
              loggedDayCount,
              hasEnabledReminder,
              notificationEducationEnabled,
              notificationPermission: permission,
            },
            promptState,
            evaluationTime,
          )
        : null,
    [
      hasActiveGoal,
      hasEnabledReminder,
      hasLoggedFood,
      loggedDayCount,
      notificationEducationEnabled,
      permission,
      promptState,
      evaluationTime,
    ],
  );

  const coachMarkStep =
    selectedPrompt && COACH_MARK_PROMPTS.has(selectedPrompt)
      ? (selectedPrompt as
          | "first-meal-guidance"
          | "first-log-celebration"
          | "quick-add-guidance"
          | "explore-progress"
          | "profile-settings-guidance")
      : null;

  const showGoalPrompt = useCallback(
    () => showPrompt("goal-wizard"),
    [showPrompt],
  );
  const dismissGoalPrompt = useCallback(
    () => dismissPrompt("goal-wizard"),
    [dismissPrompt],
  );
  const showNotificationPrompt = useCallback(
    () => showPrompt("notification-education"),
    [showPrompt],
  );
  const dismissNotificationPrompt = useCallback(
    () => dismissPrompt("notification-education"),
    [dismissPrompt],
  );
  const completeNotificationPrompt = useCallback(() => {
    completePrompt("notification-education");
    setPermission(browserNotificationPermission());
  }, [completePrompt]);
  const showCoachMark = useCallback(() => {
    if (coachMarkStep) showPrompt(coachMarkStep);
  }, [coachMarkStep, showPrompt]);
  const dismissCoachMark = useCallback(() => {
    if (!coachMarkStep) return;
    if (coachMarkStep === "first-meal-guidance") {
      dismissPrompt(coachMarkStep);
    } else {
      completePrompt(coachMarkStep);
    }
  }, [coachMarkStep, completePrompt, dismissPrompt]);

  return (
    <>
      <OnboardingWelcomeDialog
        enabled={selectedPrompt === "goal-wizard"}
        recentSignup={recentSignup}
        onShown={showGoalPrompt}
        onDismiss={dismissGoalPrompt}
      />
      <DashboardCoachMarks
        step={coachMarkStep}
        hasConfiguredGoal={hasActiveGoal}
        onShown={showCoachMark}
        onDismiss={dismissCoachMark}
      />
      <NotificationPermissionDialog
        enabled={selectedPrompt === "notification-education"}
        onShown={showNotificationPrompt}
        onDismiss={dismissNotificationPrompt}
        onComplete={completeNotificationPrompt}
      />
    </>
  );
}

function memoryStorage(): Pick<Storage, "getItem"> {
  return { getItem: () => null };
}
