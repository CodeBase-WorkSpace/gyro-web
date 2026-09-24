import assert from "node:assert/strict";
import test from "node:test";

import {
  acceptRecalibration,
  dismissRecalibration,
  getPendingRecalibration,
} from "../lib/api/recalibration";

process.env.API_BASE_URL ??= "http://localhost:8080/api/v1";

const suggestion = {
  id: "s-1",
  status: "PENDING",
  suggested: { calories: 1600, protein: 124.444, carbs: 177.778, fat: 53.333 },
  previous: { calories: 1800, protein: 140, carbs: 200, fat: 60 },
  basis: { observedKgPerWeek: "0.000" },
  createdAt: "2026-07-18T05:30:00Z",
  expiresAt: "2026-08-01T05:30:00Z",
};

test("pending recalibration reads the authenticated endpoint", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let authorization = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    authorization = new Headers(init?.headers).get("Authorization") ?? "";
    return new Response(JSON.stringify({ suggestion }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }) as Response;
  };

  try {
    const pending = await getPendingRecalibration("access-token");
    assert.equal(requestedUrl, "http://localhost:8080/api/v1/goals/recalibration/pending");
    assert.equal(authorization, "Bearer access-token");
    assert.equal(pending?.suggested.calories, 1600);
  } finally {
    global.fetch = originalFetch;
  }
});

test("accept and dismiss post to the suggestion-scoped endpoints", async () => {
  const originalFetch = global.fetch;
  const calls: Array<{ url: string; method: string; body?: string }> = [];

  global.fetch = async (input, init) => {
    calls.push({
      url: String(input),
      method: init?.method ?? "",
      ...(typeof init?.body === "string" ? { body: init.body } : {}),
    });
    return new Response(JSON.stringify({ suggestion, applied: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }) as Response;
  };

  try {
    const decision = await acceptRecalibration("access-token", "s-1");
    await dismissRecalibration("access-token", "s-1");
    await dismissRecalibration("access-token", "s-1", "DATA_IS_WRONG");

    assert.equal(decision.applied, true);
    assert.deepEqual(calls, [
      { url: "http://localhost:8080/api/v1/goals/recalibration/s-1/accept", method: "POST" },
      { url: "http://localhost:8080/api/v1/goals/recalibration/s-1/dismiss", method: "POST" },
      {
        url: "http://localhost:8080/api/v1/goals/recalibration/s-1/dismiss",
        method: "POST",
        body: JSON.stringify({ reason: "DATA_IS_WRONG" }),
      },
    ]);
  } finally {
    global.fetch = originalFetch;
  }
});
