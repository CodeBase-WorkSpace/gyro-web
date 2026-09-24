import assert from "node:assert/strict";
import test from "node:test";

import { AuthenticationRequiredError, executeAuthenticatedRequest } from "../lib/auth/authenticated-api-core";

test("authenticated request refreshes when the access token is missing", async () => {
	const result = await executeAuthenticatedRequest(
		async (token) => token,
		{ getAccessToken: async () => undefined, refreshAccessToken: async () => "fresh", isUnauthorizedError: () => false },
		{ retryPolicy: "idempotent" },
	);
	assert.equal(result, "fresh");
});

test("authenticated request retries one unauthorized idempotent request after refresh", async () => {
	let attempts = 0;
	const result = await executeAuthenticatedRequest(
		async (token) => {
			attempts += 1;
			if (token === "expired") throw { status: 401 };
			return "saved";
		},
		{ getAccessToken: async () => "expired", refreshAccessToken: async () => "fresh", isUnauthorizedError: (error) => (error as { status?: number }).status === 401 },
		{ retryPolicy: "idempotent" },
	);
	assert.equal(result, "saved");
	assert.equal(attempts, 2);
});

test("authenticated request does not replay a non-idempotent request after unauthorized", async () => {
	let attempts = 0;
	const unauthorized = { status: 401 };
	await assert.rejects(
		executeAuthenticatedRequest(
			async () => { attempts += 1; throw unauthorized; },
			{ getAccessToken: async () => "access", refreshAccessToken: async () => "fresh", isUnauthorizedError: (error) => (error as { status?: number }).status === 401 },
			{ retryPolicy: "never" },
		),
		(error: unknown) => error === unauthorized,
	);
	assert.equal(attempts, 1);
});

test("authenticated request propagates non-authentication failures without refresh", async () => {
	const failure = new Error("backend unavailable");
	let refreshes = 0;
	await assert.rejects(
		executeAuthenticatedRequest(
			async () => { throw failure; },
			{ getAccessToken: async () => "access", refreshAccessToken: async () => { refreshes += 1; return "fresh"; }, isUnauthorizedError: () => false },
			{ retryPolicy: "idempotent" },
		),
		(error: unknown) => error === failure,
	);
	assert.equal(refreshes, 0);
});

test("authenticated request signals login when an initial refresh fails", async () => {
	await assert.rejects(
		executeAuthenticatedRequest(
			async () => "unreachable",
			{ getAccessToken: async () => undefined, refreshAccessToken: async () => undefined, isUnauthorizedError: () => false },
			{ retryPolicy: "idempotent" },
		),
		AuthenticationRequiredError,
	);
});
