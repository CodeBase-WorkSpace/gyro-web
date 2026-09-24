import assert from "node:assert/strict";
import test from "node:test";

import { resolveSession, type SessionResolverDependencies } from "../lib/auth/session-core";
import type { MeResponse } from "../lib/auth/types";

const meResponse: MeResponse = {
  id: "7c4d85fb-8f86-4b2a-bab2-03f5e364c601",
  email: "user@example.com",
  phoneNumber: null,
  role: "USER",
  status: "ACTIVE",
  emailVerificationStatus: "VERIFIED",
  phoneVerificationStatus: "UNVERIFIED",
  hasPassword: true,
  onboardingWelcomeSeenAt: "2026-06-12T00:05:00.000Z",
  createdAt: "2026-06-12T00:00:00.000Z",
  updatedAt: "2026-06-12T00:00:00.000Z",
  displayName: "Gyro User",
  timezone: "Asia/Tehran",
  locale: "fa-IR",
};

test("resolveSession returns expired when only refresh token exists", async () => {
  const calls: string[] = [];
  const dependencies = createDependencies({
    accessToken: undefined,
    refreshToken: "valid-refresh-token",
    calls,
  });

  const session = await resolveSession(dependencies);

  assert.equal(session.isAuthenticated, false);
  assert.equal(session.reason, "expired");
  assert.deepEqual(calls, [
    "getAccessToken",
    "getRefreshToken",
  ]);
});

test("resolveSession does not refresh or clear cookies when refresh token exists", async () => {
  const calls: string[] = [];
  const dependencies = createDependencies({
    accessToken: undefined,
    refreshToken: "invalid-refresh-token",
    calls,
  });

  const session = await resolveSession(dependencies);

  assert.equal(session.isAuthenticated, false);
  assert.equal(session.reason, "expired");
  assert.deepEqual(calls, [
    "getAccessToken",
    "getRefreshToken",
  ]);
});

test("resolveSession returns anonymous when no session cookies exist", async () => {
  const calls: string[] = [];
  const dependencies = createDependencies({
    accessToken: undefined,
    refreshToken: undefined,
    calls,
  });

  const session = await resolveSession(dependencies);

  assert.equal(session.isAuthenticated, false);
  assert.equal(session.reason, "anonymous");
  assert.deepEqual(calls, [
    "getAccessToken",
    "getRefreshToken",
  ]);
});

test("resolveSession returns expired when access token validation fails", async () => {
  const calls: string[] = [];
  const dependencies = createDependencies({
    accessToken: "stale-access-token",
    refreshToken: "valid-refresh-token",
    calls,
    getMeErrorForAccessToken: "stale-access-token",
  });

  const session = await resolveSession(dependencies);

  assert.equal(session.isAuthenticated, false);
  assert.equal(session.reason, "expired");
  assert.deepEqual(calls, [
    "getAccessToken",
    "getMe:stale-access-token",
    "getRefreshToken",
  ]);
});

test("resolveSession returns authenticated session when access token is valid", async () => {
  const calls: string[] = [];
  const dependencies = createDependencies({
    accessToken: "valid-access-token",
    refreshToken: "valid-refresh-token",
    calls,
  });

  const session = await resolveSession(dependencies);

  assert.equal(session.isAuthenticated, true);
  assert.deepEqual(session.user, {
    id: meResponse.id,
    email: meResponse.email,
    phoneNumber: meResponse.phoneNumber,
    role: "USER",
    status: "ACTIVE",
    displayName: "Gyro User",
    timezone: "Asia/Tehran",
    locale: "fa-IR",
    emailVerificationStatus: "VERIFIED",
    phoneVerificationStatus: "UNVERIFIED",
    hasPassword: true,
    onboardingWelcomeSeenAt: meResponse.onboardingWelcomeSeenAt,
  });
  assert.deepEqual(calls, [
    "getAccessToken",
    "getMe:valid-access-token",
  ]);
});

function createDependencies(options: {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  calls: string[];
  getMeErrorForAccessToken?: string;
}): SessionResolverDependencies {
  return {
    getAccessToken: async () => {
      options.calls.push("getAccessToken");
      return options.accessToken;
    },
    getRefreshToken: async () => {
      options.calls.push("getRefreshToken");
      return options.refreshToken;
    },
    getMe: async (accessToken) => {
      options.calls.push(`getMe:${accessToken}`);
      if (options.getMeErrorForAccessToken === accessToken) {
        throw new Error("access token rejected");
      }
      return meResponse;
    },
  };
}
