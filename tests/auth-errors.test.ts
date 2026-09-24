import assert from "node:assert/strict";
import test from "node:test";

import {ApiClientError, toFieldErrorMap} from "../lib/api/errors";
import {authCodeMessage, mapApiFieldErrors} from "../lib/auth/errors";

test("authCodeMessage maps known API codes to Farsi messages", () => {
  assert.equal(authCodeMessage("INVALID_CREDENTIALS"), "ایمیل، شماره موبایل یا رمز عبور درست نیست.");
  assert.equal(authCodeMessage("INVALID_REFRESH_TOKEN"), "نشست شما منقضی شده است. دوباره وارد شوید.");
});

test("authCodeMessage returns backend fallback for unknown codes", () => {
  assert.equal(authCodeMessage("UNKNOWN_CODE", "Backend fallback"), "Backend fallback");
});

test("authCodeMessage localizes generic API fallback errors", () => {
  assert.equal(
    authCodeMessage(undefined, "An error occurred while communicating with the API."),
    "ارتباط با سرور برقرار نشد. لطفا دوباره تلاش کنید."
  );
});

test("toFieldErrorMap converts API field arrays to maps", () => {
  assert.deepEqual(
    toFieldErrorMap({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid request",
      fieldErrors: [
        { field: "email", errorMessage: "Invalid email" },
        { field: "password", errorMessage: "Weak password" }
      ]
    }),
    {
      email: "Invalid email",
      password: "Weak password"
    }
  );
});

test("mapApiFieldErrors maps backend field names to auth form fields", () => {
  assert.deepEqual(
    mapApiFieldErrors({
      email: "Invalid email",
      newPassword: "Weak password"
    }),
    {
      identifier: "ایمیل را درست وارد کنید.",
      password: "رمز عبور باید حداقل ۹ نویسه و شامل حرف بزرگ، حرف کوچک و عدد باشد."
    }
  );
});

test("ApiClientError preserves API diagnostics", () => {
  const error = new ApiClientError(
    "Failed",
    422,
    "VALIDATION_ERROR",
    {email: "Invalid"},
    "req_1",
    {recoveryPath: "/profile/billing"},
  );

  assert.equal(error.message, "Failed");
  assert.equal(error.status, 422);
  assert.equal(error.code, "VALIDATION_ERROR");
  assert.deepEqual(error.fieldErrors, { email: "Invalid" });
  assert.equal(error.requestId, "req_1");
  assert.deepEqual(error.metadata, {recoveryPath: "/profile/billing"});
});
