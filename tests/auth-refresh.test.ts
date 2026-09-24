import assert from "node:assert/strict";
import test from "node:test";

import { isGatewayFailure, refreshAuthCookiesCore } from "../lib/auth/refresh-core";
import type { AuthResponse } from "../lib/auth/types";

const refreshedAuth: AuthResponse = {
  accessToken: "new-access-token",
  refreshToken: "new-refresh-token",
  tokenType: "Bearer",
  accessExpiresInSeconds: 900,
};

test("refreshAuthCookiesCore rotates cookies and returns fresh access token", async () => {
  const calls: string[] = [];
  const result = await refreshAuthCookiesCore({
    getRefreshToken: async () => {
      calls.push("getRefreshToken");
      return "valid-refresh-token";
    },
    refreshSession: async (refreshToken) => {
      calls.push(`refreshSession:${refreshToken}`);
      return refreshedAuth;
    },
    setAuthCookies: async (auth) => {
      calls.push(`setAuthCookies:${auth.accessToken}:${auth.refreshToken}`);
    },
    clearAuthCookies: async () => {
      calls.push("clearAuthCookies");
    },
  });

  assert.deepEqual(result, {
    ok: true,
    accessToken: "new-access-token",
  });
  assert.deepEqual(calls, [
    "getRefreshToken",
    "refreshSession:valid-refresh-token",
    "setAuthCookies:new-access-token:new-refresh-token",
  ]);
});

test("refreshAuthCookiesCore clears cookies on invalid refresh token", async () => {
  const calls: string[] = [];
  const result = await refreshAuthCookiesCore({
    getRefreshToken: async () => {
      calls.push("getRefreshToken");
      return "invalid-refresh-token";
    },
    refreshSession: async () => {
      calls.push("refreshSession:invalid-refresh-token");
      throw Object.assign(new Error("Invalid refresh token"), {
        status: 401,
        code: "INVALID_REFRESH_TOKEN",
      });
    },
    setAuthCookies: async () => {
      calls.push("setAuthCookies");
    },
    clearAuthCookies: async () => {
      calls.push("clearAuthCookies");
    },
  });

  assert.deepEqual(result, {
    ok: false,
    status: 401,
    code: "INVALID_REFRESH_TOKEN",
  });
  assert.deepEqual(calls, [
    "getRefreshToken",
    "refreshSession:invalid-refresh-token",
    "clearAuthCookies",
  ]);
});

test("refreshAuthCookiesCore does not call backend when refresh token is missing", async () => {
  const calls: string[] = [];
  const result = await refreshAuthCookiesCore({
    getRefreshToken: async () => {
      calls.push("getRefreshToken");
      return undefined;
    },
    refreshSession: async () => {
      calls.push("refreshSession");
      return refreshedAuth;
    },
    setAuthCookies: async () => {
      calls.push("setAuthCookies");
    },
    clearAuthCookies: async () => {
      calls.push("clearAuthCookies");
    },
  });

  assert.deepEqual(result, {
    ok: false,
    status: 401,
    code: "MISSING_REFRESH_TOKEN",
  });
  assert.deepEqual(calls, ["getRefreshToken"]);
});

test("refreshAuthCookiesCore retries once on a gateway error and keeps cookies", async () => {
  const calls: string[] = [];
  let attempts = 0;
  const result = await refreshAuthCookiesCore({
    getRefreshToken: async () => "valid-refresh-token",
    refreshSession: async () => {
      attempts += 1;
      calls.push(`refreshSession:${attempts}`);
      if (attempts === 1) {
        throw Object.assign(new Error("Bad gateway"), { status: 502 });
      }
      return refreshedAuth;
    },
    setAuthCookies: async (auth) => {
      calls.push(`setAuthCookies:${auth.accessToken}`);
    },
    clearAuthCookies: async () => {
      calls.push("clearAuthCookies");
    },
  });

  assert.deepEqual(result, { ok: true, accessToken: "new-access-token" });
  assert.equal(attempts, 2);
  assert.ok(!calls.includes("clearAuthCookies"));
});

test("refreshAuthCookiesCore gives up after a second gateway error without clearing cookies", async () => {
  const calls: string[] = [];
  const result = await refreshAuthCookiesCore({
    getRefreshToken: async () => "valid-refresh-token",
    refreshSession: async () => {
      calls.push("refreshSession");
      throw Object.assign(new Error("Service unavailable"), { status: 503 });
    },
    setAuthCookies: async () => {
      calls.push("setAuthCookies");
    },
    clearAuthCookies: async () => {
      calls.push("clearAuthCookies");
    },
  });

  assert.deepEqual(result, { ok: false, status: 503, code: undefined });
  assert.deepEqual(calls, ["refreshSession", "refreshSession"]);
});

test("refreshAuthCookiesCore does not retry an explicit rejection", async () => {
  let attempts = 0;
  const result = await refreshAuthCookiesCore({
    getRefreshToken: async () => "invalid-refresh-token",
    refreshSession: async () => {
      attempts += 1;
      throw Object.assign(new Error("Invalid refresh token"), {
        status: 401,
        code: "INVALID_REFRESH_TOKEN",
      });
    },
    setAuthCookies: async () => {},
    clearAuthCookies: async () => {},
  });

  assert.equal(attempts, 1);
  assert.equal(result.ok, false);
});

test("isGatewayFailure separates transport faults from auth rejections", () => {
  assert.equal(isGatewayFailure({ ok: false, status: 502 }), true);
  assert.equal(isGatewayFailure({ ok: false, status: 503 }), true);
  assert.equal(isGatewayFailure({ ok: false, status: 504 }), true);
  assert.equal(isGatewayFailure({ ok: false, status: 401 }), false);
  assert.equal(isGatewayFailure({ ok: false, status: 500 }), false);
  assert.equal(
    isGatewayFailure({ ok: true, accessToken: "new-access-token" }),
    false,
  );
});
