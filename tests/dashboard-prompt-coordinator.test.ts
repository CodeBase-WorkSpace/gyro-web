import assert from "node:assert/strict";
import test from "node:test";

import { resolveBrowserNotificationPermission } from "../lib/notifications/browser-permission";
import {
  applyPromptCompleted,
  applyPromptDismissed,
  applyPromptShown,
  createDashboardPromptState,
  PROMPT_COOLDOWNS_MS,
  promptStorageKey,
  readDashboardPromptState,
  selectDashboardPrompt,
  writePromptLifecycle,
  type DashboardPromptSignals,
} from "../lib/onboarding/prompt-coordinator";

const NOW = Date.UTC(2026, 6, 20, 12);

function signals(
  overrides: Partial<DashboardPromptSignals> = {},
): DashboardPromptSignals {
  return {
    hasActiveGoal: false,
    hasLoggedFood: false,
    loggedDayCount: 0,
    hasEnabledReminder: false,
    notificationEducationEnabled: true,
    notificationPermission: "default",
    ...overrides,
  };
}

test("goal wizard is first priority and appears only without an active goal", () => {
  const state = createDashboardPromptState();
  assert.equal(selectDashboardPrompt(signals(), state, NOW), "goal-wizard");
  assert.equal(
    selectDashboardPrompt(signals({ hasActiveGoal: true }), state, NOW),
    "first-meal-guidance",
  );
});

test("dismissing the goal wizard starts a cooldown and unlocks first-meal guidance", () => {
  const state = createDashboardPromptState();
  state["goal-wizard"] = applyPromptDismissed(
    state["goal-wizard"],
    NOW,
    PROMPT_COOLDOWNS_MS["goal-wizard"],
  );

  assert.equal(
    selectDashboardPrompt(signals(), state, NOW + 1),
    "first-meal-guidance",
  );
  assert.equal(
    selectDashboardPrompt(
      signals(),
      state,
      NOW + PROMPT_COOLDOWNS_MS["goal-wizard"] + 1,
    ),
    "goal-wizard",
  );
});

test("first-meal guidance is not eligible before goal setup or dismissal", () => {
  const state = createDashboardPromptState();
  state["goal-wizard"] = applyPromptCompleted(state["goal-wizard"], NOW);

  assert.equal(
    selectDashboardPrompt(signals({ hasActiveGoal: true }), state, NOW),
    "first-meal-guidance",
  );
  assert.notEqual(
    selectDashboardPrompt(signals(), createDashboardPromptState(), NOW),
    "first-meal-guidance",
  );
});

test("first-log celebration is a follow-up only for users who saw first-meal guidance", () => {
  const state = createDashboardPromptState();
  state["goal-wizard"] = applyPromptCompleted(state["goal-wizard"], NOW);
  state["first-meal-guidance"] = applyPromptShown(
    state["first-meal-guidance"],
    NOW,
  );
  state["first-meal-guidance"] = applyPromptCompleted(
    state["first-meal-guidance"],
    NOW + 1,
  );

  assert.equal(
    selectDashboardPrompt(
      signals({ hasActiveGoal: true, hasLoggedFood: true, loggedDayCount: 1 }),
      state,
      NOW + 2,
    ),
    "first-log-celebration",
  );
});

test("dashboard guidance proceeds from quick add to progress and settings", () => {
  const state = createDashboardPromptState();
  state["goal-wizard"] = applyPromptCompleted(state["goal-wizard"], NOW);
  state["first-meal-guidance"] = applyPromptShown(
    state["first-meal-guidance"],
    NOW,
  );
  state["first-meal-guidance"] = applyPromptCompleted(
    state["first-meal-guidance"],
    NOW + 1,
  );
  state["first-log-celebration"] = applyPromptCompleted(
    state["first-log-celebration"],
    NOW + 2,
  );

  const receivedValue = signals({
    hasActiveGoal: true,
    hasLoggedFood: true,
    loggedDayCount: 1,
  });

  assert.equal(
    selectDashboardPrompt(receivedValue, state, NOW + 3),
    "quick-add-guidance",
  );

  state["quick-add-guidance"] = applyPromptCompleted(
    state["quick-add-guidance"],
    NOW + 4,
  );
  assert.equal(
    selectDashboardPrompt(receivedValue, state, NOW + 5),
    "explore-progress",
  );

  state["explore-progress"] = applyPromptCompleted(
    state["explore-progress"],
    NOW + 6,
  );
  assert.equal(
    selectDashboardPrompt(receivedValue, state, NOW + 7),
    "profile-settings-guidance",
  );
});

test("notification education requires value and the default permission state", () => {
  const state = createDashboardPromptState();
  state["goal-wizard"] = applyPromptCompleted(state["goal-wizard"], NOW);

  assert.equal(
    selectDashboardPrompt(
      signals({ hasActiveGoal: true, hasLoggedFood: true, loggedDayCount: 1 }),
      state,
      NOW,
    ),
    null,
  );
  assert.equal(
    selectDashboardPrompt(
      signals({ hasActiveGoal: true, hasLoggedFood: true, loggedDayCount: 2 }),
      state,
      NOW,
    ),
    "notification-education",
  );
  assert.equal(
    selectDashboardPrompt(
      signals({
        hasActiveGoal: true,
        hasLoggedFood: true,
        loggedDayCount: 2,
        notificationPermission: "denied",
      }),
      state,
      NOW,
    ),
    null,
  );
  assert.equal(
    selectDashboardPrompt(
      signals({
        hasActiveGoal: true,
        hasLoggedFood: true,
        hasEnabledReminder: true,
      }),
      state,
      NOW,
    ),
    "notification-education",
  );
});

test("permission states distinguish default, granted, denied, and unsupported", () => {
  assert.equal(resolveBrowserNotificationPermission(false), "unsupported");
  assert.equal(resolveBrowserNotificationPermission(true, "default"), "default");
  assert.equal(resolveBrowserNotificationPermission(true, "granted"), "granted");
  assert.equal(resolveBrowserNotificationPermission(true, "denied"), "denied");
});

test("prompt storage persists completion, dismissal, cooldown, and last-shown state per user", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
  const lifecycle = {
    ...applyPromptShown({}, NOW),
    ...applyPromptDismissed({}, NOW + 1, 1_000),
    ...applyPromptCompleted({}, NOW + 2),
  };

  writePromptLifecycle(
    storage,
    "user-a",
    "notification-education",
    lifecycle,
  );
  const restored = readDashboardPromptState(storage, "user-a");

  assert.equal(restored["notification-education"].lastShownAt, NOW);
  assert.equal(restored["notification-education"].dismissedAt, NOW + 1);
  assert.equal(restored["notification-education"].completedAt, NOW + 2);
  assert.equal(
    values.has(promptStorageKey("user-b", "notification-education")),
    false,
  );
});
