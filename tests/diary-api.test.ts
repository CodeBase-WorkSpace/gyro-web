import assert from "node:assert/strict";
import test from "node:test";

import {
  createDiaryEntry,
  createDiaryEntriesBatch,
  copyDiaryDay,
  deleteDiaryEntry,
  repeatDiaryEntry,
  diaryDayRenderKey,
  getDiaryDay,
  updateDiaryEntry,
} from "../lib/api/diary";

process.env.API_BASE_URL ??= "http://localhost:8080/api/v1";

test("getDiaryDay sends authenticated request to diary day endpoint", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let authorizationHeader = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    authorizationHeader = new Headers(init?.headers).get("Authorization") ?? "";

    return new Response(
      JSON.stringify({
        date: "2026-06-21",
        timezone: "Asia/Tehran",
        goal: { configured: true, calories: 2200, protein: 140, carbs: 220, fat: 70 },
        totals: { calories: 550, protein: 35, carbs: 40, fat: 18, fiber: 5, sugar: 4, sodium: 320 },
        remainingCalories: { configured: true, value: 1650 },
        mealGroups: [],
        warnings: [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "X-Request-Id": "backend-request-diary-day" },
      }
    ) as Response;
  };

  try {
    const day = await getDiaryDay("2026-06-21", "access-token");

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/diary/2026-06-21");
    assert.equal(authorizationHeader, "Bearer access-token");
    assert.equal(day.date, "2026-06-21");
  } finally {
    global.fetch = originalFetch;
  }
});

test("createDiaryEntriesBatch posts all foods in one authenticated idempotent request", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let requestBody = "";
  let idempotencyHeader = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    requestBody = String(init?.body ?? "");
    idempotencyHeader = new Headers(init?.headers).get("Idempotency-Key") ?? "";
    return new Response(JSON.stringify({ date: "2026-06-21", mealGroups: [], warnings: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await createDiaryEntriesBatch("2026-06-21", {
      mealType: "LUNCH",
      entries: [
        { sourceType: "FOOD", sourceId: "food-1", quantity: 150, servingUnitId: "unit-gram" },
        { sourceType: "FOOD", sourceId: "food-2", quantity: 200, servingUnitId: "unit-gram" },
      ],
    }, "access-token", "batch-intent-key");

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/diary/2026-06-21/entries/batch");
    assert.equal(idempotencyHeader, "batch-intent-key");
    assert.equal(JSON.parse(requestBody).entries.length, 2);
  } finally {
    global.fetch = originalFetch;
  }
});

test("createDiaryEntry posts authenticated quick-add payload with idempotency key", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let method = "";
  let authorizationHeader = "";
  let idempotencyHeader = "";
  let requestBody = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    method = init?.method ?? "";
    const headers = new Headers(init?.headers);
    authorizationHeader = headers.get("Authorization") ?? "";
    idempotencyHeader = headers.get("Idempotency-Key") ?? "";
    requestBody = String(init?.body ?? "");

    return new Response(
      JSON.stringify({
        date: "2026-06-21",
        timezone: "Asia/Tehran",
        goal: { configured: true, calories: 2200, protein: 140, carbs: 220, fat: 70 },
        totals: { calories: 800, protein: 55, carbs: 65, fat: 24, fiber: 9, sugar: 7, sodium: 510 },
        remainingCalories: { configured: true, value: 1400 },
        mealGroups: [],
        warnings: [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "X-Request-Id": "backend-request-diary-create" },
      }
    ) as Response;
  };

  try {
    const day = await createDiaryEntry(
      "2026-06-21",
      {
        mealType: "LUNCH",
        sourceType: "FOOD",
        sourceFoodId: "food-123",
        sourceMealId: null,
        servingQuantity: 1.5,
        servingUnit: "GRAM",
      },
      "access-token",
      "quick-add-key"
    );

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/diary/2026-06-21/entries");
    assert.equal(method, "POST");
    assert.equal(authorizationHeader, "Bearer access-token");
    assert.equal(idempotencyHeader, "quick-add-key");
    assert.deepEqual(JSON.parse(requestBody), {
      mealType: "LUNCH",
      sourceType: "FOOD",
      sourceFoodId: "food-123",
      sourceMealId: null,
      servingQuantity: 1.5,
      servingUnit: "GRAM",
    });
    assert.equal(day.remainingCalories.value, 1400);
  } finally {
    global.fetch = originalFetch;
  }
});

test("updateDiaryEntry patches an entry with its edit intent key", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let method = "";
  let idempotencyHeader = "";
  let requestBody = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    method = init?.method ?? "";
    idempotencyHeader = new Headers(init?.headers).get("Idempotency-Key") ?? "";
    requestBody = String(init?.body ?? "");
    return new Response(JSON.stringify({ date: "2026-06-21", mealGroups: [], warnings: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await updateDiaryEntry("2026-06-21", "entry-123", {
      mealType: "DINNER",
      sourceType: "FOOD",
      sourceFoodId: "food-123",
      sourceMealId: null,
      servingQuantity: 200,
      servingUnit: "GRAM",
    }, "access-token", "edit-intent-key");

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/diary/2026-06-21/entries/entry-123");
    assert.equal(method, "PATCH");
    assert.equal(idempotencyHeader, "edit-intent-key");
    assert.equal(JSON.parse(requestBody).servingQuantity, 200);
  } finally {
    global.fetch = originalFetch;
  }
});

test("deleteDiaryEntry deletes an authenticated diary entry", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let method = "";
  let authorizationHeader = "";
  let idempotencyHeader = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    method = init?.method ?? "";
    authorizationHeader = new Headers(init?.headers).get("Authorization") ?? "";
    idempotencyHeader = new Headers(init?.headers).get("Idempotency-Key") ?? "";
    return new Response(JSON.stringify({ date: "2026-06-21", mealGroups: [], warnings: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await deleteDiaryEntry("2026-06-21", "entry-123", "access-token", "delete-intent-key");
    assert.equal(requestedUrl, "http://localhost:8080/api/v1/diary/2026-06-21/entries/entry-123");
    assert.equal(method, "DELETE");
    assert.equal(authorizationHeader, "Bearer access-token");
    assert.equal(idempotencyHeader, "delete-intent-key");
  } finally {
    global.fetch = originalFetch;
  }
});

test("repeatDiaryEntry posts the selected target date with an intent key", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let method = "";
  let idempotencyHeader = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    method = init?.method ?? "";
    idempotencyHeader = new Headers(init?.headers).get("Idempotency-Key") ?? "";
    return new Response(JSON.stringify({ date: "2026-06-22", mealGroups: [], warnings: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await repeatDiaryEntry("2026-06-22", "entry-123", "access-token", "repeat-intent-key");
    assert.equal(requestedUrl, "http://localhost:8080/api/v1/diary/2026-06-22/entries/entry-123/repeat");
    assert.equal(method, "POST");
    assert.equal(idempotencyHeader, "repeat-intent-key");
  } finally {
    global.fetch = originalFetch;
  }
});

test("copyDiaryDay posts source and target dates with an intent key", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let method = "";
  let authorizationHeader = "";
  let idempotencyHeader = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    method = init?.method ?? "";
    const headers = new Headers(init?.headers);
    authorizationHeader = headers.get("Authorization") ?? "";
    idempotencyHeader = headers.get("Idempotency-Key") ?? "";
    return new Response(JSON.stringify({ date: "2026-06-23", mealGroups: [], warnings: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await copyDiaryDay("2026-06-23", "2026-06-22", "access-token", "copy-intent-key");
    assert.equal(requestedUrl, "http://localhost:8080/api/v1/diary/2026-06-23/copy-from/2026-06-22");
    assert.equal(method, "POST");
    assert.equal(authorizationHeader, "Bearer access-token");
    assert.equal(idempotencyHeader, "copy-intent-key");
  } finally {
    global.fetch = originalFetch;
  }
});

test("diaryDayRenderKey stays stable for same server read model and changes on entry updates", () => {
  const baseDay = {
    date: "2026-06-21",
    timezone: "Asia/Tehran",
    goal: { configured: true, calories: 2200, protein: 140, carbs: 220, fat: 70 },
    totals: { calories: 800, protein: 55, carbs: 65, fat: 24, fiber: 9, sugar: 7, sodium: 510 },
    remainingCalories: { configured: true, value: 1400 },
    macroProgress: {
      configured: true,
      protein: { consumed: 55, target: 140, remaining: 85, goalPercent: 39.29 },
      carbs: { consumed: 65, target: 220, remaining: 155, goalPercent: 29.55 },
      fat: { consumed: 24, target: 70, remaining: 46, goalPercent: 34.29 },
    },
    mealGroups: [
      {
        mealType: "LUNCH" as const,
        totals: { calories: 800, protein: 55, carbs: 65, fat: 24, fiber: 9, sugar: 7, sodium: 510 },
        entries: [
          {
            id: "entry-1",
            mealType: "LUNCH" as const,
            sourceType: "FOOD" as const,
            sourceFoodId: "food-123",
            sourceMealId: null,
            displayName: "سینه مرغ",
            servingQuantity: 1.5,
            servingUnitCode: "GRAM",
            servingUnitName: "گرم",
            sortOrder: 0,
            nutrition: { calories: 800, protein: 55, carbs: 65, fat: 24, fiber: 9, sugar: 7, sodium: 510 },
          },
        ],
      },
    ],
    warnings: [],
  };

  assert.equal(diaryDayRenderKey(baseDay), diaryDayRenderKey(structuredClone(baseDay)));

  const updatedDay = structuredClone(baseDay);
  updatedDay.mealGroups[0].entries[0].servingQuantity = 2;

  assert.notEqual(diaryDayRenderKey(baseDay), diaryDayRenderKey(updatedDay));

  const updatedGoalDay = structuredClone(baseDay);
  updatedGoalDay.remainingCalories.value = 1200;
  updatedGoalDay.macroProgress.protein.target = 150;

  assert.notEqual(diaryDayRenderKey(baseDay), diaryDayRenderKey(updatedGoalDay));
});
