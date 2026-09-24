import assert from "node:assert/strict";
import test from "node:test";

import { acknowledgeCalculatorRerunPrompt, AuthApiError, loginWithPassword, logout, register, startLoginOtp, updateMeProfile, verifyRegistration } from "../lib/auth/api";

process.env.API_BASE_URL ??= "http://localhost:8080/api/v1";

test("calculator recovery acknowledgement uses the authenticated account endpoint", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let authorization = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    authorization = new Headers(init?.headers).get("Authorization") ?? "";
    return new Response(null, { status: 204 }) as Response;
  };

  try {
    await acknowledgeCalculatorRerunPrompt("access-token");
    assert.equal(
      requestedUrl,
      "http://localhost:8080/api/v1/users/me/coach/calculator-rerun-prompt/acknowledge",
    );
    assert.equal(authorization, "Bearer access-token");
  } finally {
    global.fetch = originalFetch;
  }
});

test("loginWithPassword sends only identifier and password", async () => {
  const originalFetch = global.fetch;
  let requestBody: unknown;

  global.fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        tokenType: "Bearer",
        accessExpiresInSeconds: 900,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "X-Request-Id": "backend-request-1" },
      }
    ) as Response;
  };

  try {
    const response = await loginWithPassword({
      identifier: "user@example.com",
      password: "Password123",
    });

    assert.equal(response.accessToken, "access-token");
    assert.deepEqual(requestBody, {
      identifier: "user@example.com",
      password: "Password123",
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test("auth API normalizes email and phone contact payloads", async () => {
  const originalFetch = global.fetch;
  const requestBodies: unknown[] = [];

  global.fetch = async (_input, init) => {
    requestBodies.push(JSON.parse(String(init?.body)));
    return new Response(
      JSON.stringify({
        message: "ok",
        otpExpireInSeconds: 600,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "X-Request-Id": "backend-request-normalized" },
      }
    ) as Response;
  };

  try {
    await loginWithPassword({
      identifier: " Tester@Example.invalid ",
      password: "Password123",
    });
    await register({
      email: "USER@EXAMPLE.COM",
    });
    await register({
      phoneNumber: "09121234567",
    });
    await verifyRegistration({
      phoneNumber: "989121234567",
      code: "123456",
    });
    await startLoginOtp("+989121234567");

    assert.deepEqual(requestBodies, [
      { identifier: "tester@example.invalid", password: "Password123" },
      { email: "user@example.com" },
      { phoneNumber: "+989121234567" },
      { phoneNumber: "+989121234567", code: "123456" },
      { identifier: "+989121234567" },
    ]);
  } finally {
    global.fetch = originalFetch;
  }
});

test("loginWithPassword maps failed login diagnostics", async () => {
  const originalFetch = global.fetch;

  global.fetch = async () =>
    new Response(
      JSON.stringify({
        status: 401,
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
        requestId: "backend-request-2",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    ) as Response;

  try {
    await assert.rejects(
      () => loginWithPassword({ identifier: "user@example.com", password: "wrong" }),
      (error) => {
        assert.ok(error instanceof AuthApiError);
        assert.equal(error.status, 401);
        assert.equal(error.code, "INVALID_CREDENTIALS");
        assert.equal(error.requestId, "backend-request-2");
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("logout posts the refresh token to the logout endpoint", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let requestMethod = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    requestMethod = String(init?.method);
    return new Response(null, { status: 204, headers: { "X-Request-Id": "backend-request-3" } }) as Response;
  };

  try {
    await logout("refresh-token");

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/auth/logout");
    assert.equal(requestMethod, "POST");
  } finally {
    global.fetch = originalFetch;
  }
});

test("updateMeProfile patches backend profile fields", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let requestMethod = "";
  let requestBody: unknown;

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    requestMethod = String(init?.method);
    requestBody = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({
        id: "7c4d85fb-8f86-4b2a-bab2-03f5e364c601",
        email: "user@example.com",
        phoneNumber: null,
        displayName: "Gyro User",
        timezone: "Asia/Tehran",
        locale: "fa-IR",
        role: "USER",
        status: "ACTIVE",
        emailVerificationStatus: "VERIFIED",
        phoneVerificationStatus: "UNVERIFIED",
        createdAt: "2026-06-12T00:00:00.000Z",
        updatedAt: "2026-06-12T00:00:00.000Z",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "X-Request-Id": "backend-request-4" },
      }
    ) as Response;
  };

  try {
    await updateMeProfile("access-token", {
      displayName: "Gyro User",
      timezone: "Asia/Tehran",
      locale: "fa-IR",
    });

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/users/me/profile");
    assert.equal(requestMethod, "PATCH");
    assert.deepEqual(requestBody, {
      displayName: "Gyro User",
      timezone: "Asia/Tehran",
      locale: "fa-IR",
    });
  } finally {
    global.fetch = originalFetch;
  }
});
