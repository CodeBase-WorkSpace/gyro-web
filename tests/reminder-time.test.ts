import assert from "node:assert/strict";
import test from "node:test";

import {resolveReminderTime} from "../lib/notifications/reminder-time";

test("a disabled reminder accepts a cleared time", () => {
  assert.equal(resolveReminderTime("", false), "08:00");
  assert.equal(resolveReminderTime("", false, "20:00"), "20:00");
});

test("an enabled reminder still requires a valid time", () => {
  assert.equal(resolveReminderTime("", true), null);
  assert.equal(resolveReminderTime("07:30", true), "07:30");
});
