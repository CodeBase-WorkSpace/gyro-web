import assert from "node:assert/strict";
import test from "node:test";

import {profileSchema} from "../lib/profile/validation";

test("profileSchema accepts backend profile edit fields", () => {
  const parsed = profileSchema.safeParse({
    displayName: "Gyro User",
    timezone: "Asia/Tehran",
    locale: "fa-IR",
  });

  assert.equal(parsed.success, true);
});

test("profileSchema rejects missing timezone and locale", () => {
  const parsed = profileSchema.safeParse({
    displayName: "Gyro User",
    timezone: "",
    locale: "",
  });

  assert.equal(parsed.success, false);
});

test("profileSchema rejects unsupported preference values", () => {
  const parsed = profileSchema.safeParse({
    displayName: "Gyro User",
    timezone: "Mars/Olympus",
    locale: "zz-ZZ",
  });

  assert.equal(parsed.success, false);
});
