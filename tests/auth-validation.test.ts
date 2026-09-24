import assert from "node:assert/strict";
import test from "node:test";

import {
  changePasswordSchema,
  registerSchema,
  setPasswordSchema,
  stepUpConfirmSchema,
} from "../lib/auth/validation";

test("registerSchema accepts a lone identifier and never requires a password", () => {
  const parsed = registerSchema.safeParse({ identifier: " USER@example.com ", password: "ignored" });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.identifier, "user@example.com");
    assert.equal("password" in parsed.data, false);
  }
});

test("registerSchema rejects an invalid identifier", () => {
  const parsed = registerSchema.safeParse({ identifier: "not-a-contact" });
  assert.equal(parsed.success, false);
});

test("setPasswordSchema enforces policy and matching confirmation", () => {
  assert.equal(
    setPasswordSchema.safeParse({ newPassword: "Password123", confirmPassword: "Password123" }).success,
    true
  );
  assert.equal(
    setPasswordSchema.safeParse({ newPassword: "weak", confirmPassword: "weak" }).success,
    false
  );
  const mismatch = setPasswordSchema.safeParse({ newPassword: "Password123", confirmPassword: "Password124" });
  assert.equal(mismatch.success, false);
  if (!mismatch.success) {
    assert.equal(mismatch.error.issues[0]?.path[0], "confirmPassword");
  }
});

test("changePasswordSchema requires the current password", () => {
  assert.equal(
    changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "Password123",
      confirmPassword: "Password123",
    }).success,
    false
  );
  assert.equal(
    changePasswordSchema.safeParse({
      currentPassword: "OldPassword1",
      newPassword: "Password123",
      confirmPassword: "Password123",
    }).success,
    true
  );
});

test("stepUpConfirmSchema requires a 6-digit code", () => {
  assert.equal(stepUpConfirmSchema.safeParse({ code: "123456" }).success, true);
  assert.equal(stepUpConfirmSchema.safeParse({ code: "12345" }).success, false);
  assert.equal(stepUpConfirmSchema.safeParse({ code: "abcdef" }).success, false);
});
