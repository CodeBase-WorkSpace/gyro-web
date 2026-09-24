import type { BrowserNotificationPermission } from "@/lib/notifications/browser-permission";

export const DASHBOARD_PROMPT_IDS = [
  "goal-wizard",
  "first-meal-guidance",
  "first-log-celebration",
  "quick-add-guidance",
  "explore-progress",
  "profile-settings-guidance",
  "notification-education",
] as const;

export type DashboardPromptId = (typeof DASHBOARD_PROMPT_IDS)[number];

export type PromptLifecycle = {
  completedAt?: number;
  dismissedAt?: number;
  cooldownUntil?: number;
  lastShownAt?: number;
};

export type DashboardPromptState = Record<DashboardPromptId, PromptLifecycle>;

export type DashboardPromptSignals = {
  hasActiveGoal: boolean;
  hasLoggedFood: boolean;
  loggedDayCount: number;
  hasEnabledReminder: boolean;
  notificationEducationEnabled: boolean;
  notificationPermission: BrowserNotificationPermission;
};

export const PROMPT_COOLDOWNS_MS: Record<DashboardPromptId, number> = {
  "goal-wizard": 7 * 24 * 60 * 60 * 1_000,
  "first-meal-guidance": 7 * 24 * 60 * 60 * 1_000,
  "first-log-celebration": 0,
  "quick-add-guidance": 0,
  "explore-progress": 0,
  "profile-settings-guidance": 0,
  "notification-education": 30 * 24 * 60 * 60 * 1_000,
};

export function createDashboardPromptState(): DashboardPromptState {
  return {
    "goal-wizard": {},
    "first-meal-guidance": {},
    "first-log-celebration": {},
    "quick-add-guidance": {},
    "explore-progress": {},
    "profile-settings-guidance": {},
    "notification-education": {},
  };
}

export function selectDashboardPrompt(
  signals: DashboardPromptSignals,
  state: DashboardPromptState,
  now: number,
): DashboardPromptId | null {
  const goalPrompt = state["goal-wizard"];
  if (!signals.hasActiveGoal && isPromptEligible(goalPrompt, now)) {
    return "goal-wizard";
  }

  const goalStageResolved =
    signals.hasActiveGoal || Boolean(goalPrompt.dismissedAt || goalPrompt.completedAt);
  if (!goalStageResolved) return null;

  const firstMealPrompt = state["first-meal-guidance"];
  if (!signals.hasLoggedFood && isPromptEligible(firstMealPrompt, now)) {
    return "first-meal-guidance";
  }

  if (
    signals.hasLoggedFood &&
    firstMealPrompt.lastShownAt &&
    isPromptEligible(state["first-log-celebration"], now)
  ) {
    return "first-log-celebration";
  }

  const celebrationResolved =
    !firstMealPrompt.lastShownAt ||
    isPromptResolved(state["first-log-celebration"]);
  if (
    signals.hasLoggedFood &&
    celebrationResolved &&
    firstMealPrompt.lastShownAt &&
    isPromptEligible(state["quick-add-guidance"], now)
  ) {
    return "quick-add-guidance";
  }

  if (
    signals.hasLoggedFood &&
    celebrationResolved &&
    firstMealPrompt.lastShownAt &&
    isPromptResolved(state["quick-add-guidance"]) &&
    isPromptEligible(state["explore-progress"], now)
  ) {
    return "explore-progress";
  }

  if (
    signals.hasLoggedFood &&
    celebrationResolved &&
    firstMealPrompt.lastShownAt &&
    isPromptResolved(state["quick-add-guidance"]) &&
    isPromptResolved(state["explore-progress"]) &&
    isPromptEligible(state["profile-settings-guidance"], now)
  ) {
    return "profile-settings-guidance";
  }

  const hasReceivedValue =
    signals.loggedDayCount >= 2 || signals.hasEnabledReminder;
  if (
    hasReceivedValue &&
    signals.notificationEducationEnabled &&
    signals.notificationPermission === "default" &&
    isPromptEligible(state["notification-education"], now)
  ) {
    return "notification-education";
  }

  return null;
}

export function applyPromptShown(
  lifecycle: PromptLifecycle,
  now: number,
): PromptLifecycle {
  return { ...lifecycle, lastShownAt: now };
}

export function applyPromptDismissed(
  lifecycle: PromptLifecycle,
  now: number,
  cooldownMs: number,
): PromptLifecycle {
  return {
    ...lifecycle,
    dismissedAt: now,
    cooldownUntil: now + cooldownMs,
  };
}

export function applyPromptCompleted(
  lifecycle: PromptLifecycle,
  now: number,
): PromptLifecycle {
  return { ...lifecycle, completedAt: now, cooldownUntil: undefined };
}

export function readDashboardPromptState(
  storage: Pick<Storage, "getItem">,
  userId: string,
): DashboardPromptState {
  const state = createDashboardPromptState();

  for (const id of DASHBOARD_PROMPT_IDS) {
    const value = storage.getItem(promptStorageKey(userId, id));
    if (!value) continue;

    try {
      const parsed = JSON.parse(value) as PromptLifecycle;
      state[id] = sanitizeLifecycle(parsed);
    } catch {
      // Ignore malformed legacy/client storage and start this prompt fresh.
    }
  }

  return state;
}

export function writePromptLifecycle(
  storage: Pick<Storage, "setItem">,
  userId: string,
  id: DashboardPromptId,
  lifecycle: PromptLifecycle,
) {
  storage.setItem(promptStorageKey(userId, id), JSON.stringify(lifecycle));
}

export function promptStorageKey(userId: string, id: DashboardPromptId) {
  return `gyro.dashboard-prompts.v1.${userId}.${id}`;
}

function isPromptEligible(lifecycle: PromptLifecycle, now: number) {
  return !lifecycle.completedAt &&
    (!lifecycle.cooldownUntil || lifecycle.cooldownUntil <= now);
}

function isPromptResolved(lifecycle: PromptLifecycle) {
  return Boolean(lifecycle.completedAt || lifecycle.dismissedAt);
}

function sanitizeLifecycle(value: PromptLifecycle): PromptLifecycle {
  return {
    completedAt: validTimestamp(value.completedAt),
    dismissedAt: validTimestamp(value.dismissedAt),
    cooldownUntil: validTimestamp(value.cooldownUntil),
    lastShownAt: validTimestamp(value.lastShownAt),
  };
}

function validTimestamp(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}
