import assert from "node:assert/strict";
import test from "node:test";

import {
  createDialogQueueState,
  dialogQueueReducer,
  selectNextDialogId,
  type DialogQueueEntry,
} from "../lib/dialog-queue";

test("dialog queue selects prompts by priority before registration order", () => {
  const entries: DialogQueueEntry[] = [
    { id: "pwa-install", priority: 40, order: 1 },
    { id: "dashboard-notification-permission", priority: 30, order: 2 },
    { id: "dashboard-goal-wizard", priority: 10, order: 3 },
  ];

  assert.equal(
    selectNextDialogId(entries, new Set()),
    "dashboard-goal-wizard",
  );
});

test("a visible dialog is never replaced by a newly registered higher-priority dialog", () => {
  let state = createDialogQueueState();
  state = dialogQueueReducer(state, {
    type: "register",
    id: "dashboard-notification-permission",
    priority: 30,
  });
  state = dialogQueueReducer(state, { type: "activate-next" });
  assert.equal(state.activeId, "dashboard-notification-permission");

  state = dialogQueueReducer(state, {
    type: "register",
    id: "dashboard-goal-wizard",
    priority: 10,
  });
  state = dialogQueueReducer(state, { type: "activate-next" });

  assert.equal(state.activeId, "dashboard-notification-permission");
});

test("the next prompt waits for stable navigation after the current prompt closes", () => {
  let state = createDialogQueueState();
  state = dialogQueueReducer(state, {
    type: "register",
    id: "dashboard-notification-permission",
    priority: 30,
  });
  state = dialogQueueReducer(state, {
    type: "register",
    id: "dashboard-goal-wizard",
    priority: 10,
  });
  state = dialogQueueReducer(state, { type: "activate-next" });
  assert.equal(state.activeId, "dashboard-goal-wizard");

  state = dialogQueueReducer(state, {
    type: "complete",
    id: "dashboard-goal-wizard",
  });
  assert.equal(state.activeId, undefined);
  assert.equal(state.waitingForNavigation, true);

  state = dialogQueueReducer(state, { type: "activate-next" });
  assert.equal(state.activeId, undefined);

  state = dialogQueueReducer(state, { type: "navigation-stable" });
  state = dialogQueueReducer(state, { type: "activate-next" });
  assert.equal(state.activeId, "dashboard-notification-permission");
});

test("completed prompt ids stay suppressed after unregister and re-register", () => {
  let state = createDialogQueueState();
  state = dialogQueueReducer(state, {
    type: "register",
    id: "dashboard-notification-permission",
    priority: 30,
  });
  state = dialogQueueReducer(state, { type: "activate-next" });
  state = dialogQueueReducer(state, {
    type: "complete",
    id: "dashboard-notification-permission",
  });
  state = dialogQueueReducer(state, {
    type: "unregister",
    id: "dashboard-notification-permission",
  });
  state = dialogQueueReducer(state, {
    type: "register",
    id: "dashboard-notification-permission",
    priority: 30,
  });
  state = dialogQueueReducer(state, { type: "navigation-stable" });
  state = dialogQueueReducer(state, { type: "activate-next" });

  assert.equal(state.activeId, undefined);
  assert(state.completed.has("dashboard-notification-permission"));
});
