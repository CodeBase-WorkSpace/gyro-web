import assert from "node:assert/strict";
import test from "node:test";

import {
  getWeightEntries,
  saveWeightEntriesBatch,
  saveWeightEntry,
  type SaveWeightEntryRequestDto,
} from "../lib/api/weight";

process.env.API_BASE_URL ??= "http://localhost:8080/api/v1";

test("getWeightEntries requests owner-scoped entries with date range pagination", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let authorizationHeader = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    authorizationHeader =
      new Headers(init?.headers).get("Authorization") ?? "";

    return new Response(
      JSON.stringify({
        items: [
          {
            id: "entry-1",
            recordedDate: "2026-06-30",
            recordedAt: "2026-06-30T05:00:00Z",
            weightKg: 78.4,
            displayWeight: 78.4,
            displayUnit: "KG",
            source: "MANUAL",
            notes: "Morning",
            createdAt: "2026-06-30T05:00:00Z",
            updatedAt: "2026-06-30T05:00:00Z",
          },
        ],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
      }),
      {status: 200, headers: {"Content-Type": "application/json"}},
    ) as Response;
  };

  try {
    const entries = await getWeightEntries(
      {
        from: "2026-06-01",
        to: "2026-06-30",
        page: 0,
        size: 20,
      },
      "access-token",
    );

    assert.equal(
      requestedUrl,
      "http://localhost:8080/api/v1/weight-entries?from=2026-06-01&to=2026-06-30&page=0&size=20",
    );
    assert.equal(authorizationHeader, "Bearer access-token");
    assert.equal(entries.items[0]?.displayUnit, "KG");
  } finally {
    global.fetch = originalFetch;
  }
});

test("saveWeightEntry posts a manual weight with idempotency", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let method = "";
  let idempotencyKey = "";
  let requestBody: SaveWeightEntryRequestDto | undefined;

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    method = init?.method ?? "";
    idempotencyKey =
      new Headers(init?.headers).get("Idempotency-Key") ?? "";
    requestBody = JSON.parse(String(init?.body));

    return new Response(
      JSON.stringify({
        id: "entry-1",
        recordedDate: "2026-06-30",
        recordedAt: "2026-06-30T05:00:00Z",
        weightKg: 81.647,
        displayWeight: 180,
        displayUnit: "LB",
        source: "MANUAL",
        notes: null,
        createdAt: "2026-06-30T05:00:00Z",
        updatedAt: "2026-06-30T05:00:00Z",
      }),
      {status: 200, headers: {"Content-Type": "application/json"}},
    ) as Response;
  };

  try {
    const request: SaveWeightEntryRequestDto = {
      recordedDate: "2026-06-30",
      weight: 180,
      unit: "LB",
      source: "MANUAL",
    };
    const entry = await saveWeightEntry(
      request,
      "access-token",
      "weight-intent-1",
    );

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/weight-entries");
    assert.equal(method, "POST");
    assert.equal(idempotencyKey, "weight-intent-1");
    assert.deepEqual(requestBody, request);
    assert.equal(entry.displayUnit, "LB");
  } finally {
    global.fetch = originalFetch;
  }
});

test("saveWeightEntriesBatch posts batch imports with idempotency", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let method = "";
  let idempotencyKey = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    method = init?.method ?? "";
    idempotencyKey =
      new Headers(init?.headers).get("Idempotency-Key") ?? "";

    return new Response(
      JSON.stringify({
        accepted: [],
        diagnostics: [],
      }),
      {status: 200, headers: {"Content-Type": "application/json"}},
    ) as Response;
  };

  try {
    const response = await saveWeightEntriesBatch(
      {
        entries: [
          {
            clientEntryId: "row-1",
            recordedDate: "2026-06-30",
            weight: 78.4,
            unit: "KG",
            source: "IMPORT",
          },
        ],
      },
      "access-token",
      "weight-batch-1",
    );

    assert.equal(
      requestedUrl,
      "http://localhost:8080/api/v1/weight-entries/batch",
    );
    assert.equal(method, "POST");
    assert.equal(idempotencyKey, "weight-batch-1");
    assert.equal(response.diagnostics.length, 0);
  } finally {
    global.fetch = originalFetch;
  }
});
