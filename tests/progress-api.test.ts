import assert from "node:assert/strict";
import test from "node:test";

import {
  getNutritionProgress,
  getNutritionProgressBatch,
  getWeeklyNutritionProgress,
  getWeeklyProgress,
  getWeightProgress,
  getWeightProgressBatch,
} from "../lib/api/progress";

process.env.API_BASE_URL ??= "http://localhost:8080/api/v1";

test("getWeeklyProgress sends authenticated anchor query to weekly progress endpoint", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let authorizationHeader = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    authorizationHeader = new Headers(init?.headers).get("Authorization") ?? "";

    return new Response(
      JSON.stringify({
        timezone: "Asia/Tehran",
        from: "2026-06-27",
        to: "2026-07-03",
        nutrition: {
          loggedDayCount: 2,
          missingDayCount: 5,
          calories: {total: 3600, average: 1800, goalAveragePercent: 82},
          macros: {
            protein: {total: 160, average: 80, goalAveragePercent: 57},
            carbs: {total: 420, average: 210, goalAveragePercent: 95},
            fat: {total: 110, average: 55, goalAveragePercent: 79},
          },
          micronutrients: {
            fiber: {total: 35, average: 17.5, goalAveragePercent: 63},
            sugar: {total: 40, average: 20, goalAveragePercent: null},
            sodium: {total: 1800, average: 900, goalAveragePercent: null},
          },
        },
        weight: null,
        warnings: [],
      }),
      {status: 200, headers: {"Content-Type": "application/json"}},
    ) as Response;
  };

  try {
    const progress = await getWeeklyProgress("2026-06-30", "access-token");

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/progress/weekly?anchor=2026-06-30");
    assert.equal(authorizationHeader, "Bearer access-token");
    assert.equal(progress.nutrition.loggedDayCount, 2);
  } finally {
    global.fetch = originalFetch;
  }
});

test("getWeeklyProgress sends documented from and to range to weekly progress endpoint", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";

  global.fetch = async (input) => {
    requestedUrl = String(input);

    return new Response(
      JSON.stringify({
        timezone: "Asia/Tehran",
        from: "2026-06-20",
        to: "2026-06-26",
        nutrition: {
          loggedDayCount: 0,
          missingDayCount: 7,
          calories: {total: 0, average: null, goalAveragePercent: null},
          macros: {
            protein: {total: 0, average: null, goalAveragePercent: null},
            carbs: {total: 0, average: null, goalAveragePercent: null},
            fat: {total: 0, average: null, goalAveragePercent: null},
          },
          micronutrients: {
            fiber: {total: 0, average: null, goalAveragePercent: null},
            sugar: {total: 0, average: null, goalAveragePercent: null},
            sodium: {total: 0, average: null, goalAveragePercent: null},
          },
        },
        weight: null,
        warnings: ["NO_DIARY_DATA"],
      }),
      {status: 200, headers: {"Content-Type": "application/json"}},
    ) as Response;
  };

  try {
    const progress = await getWeeklyProgress(
      {from: "2026-06-20", to: "2026-06-26"},
      "access-token",
    );

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/progress/weekly?from=2026-06-20&to=2026-06-26");
    assert.equal(progress.warnings[0], "NO_DIARY_DATA");
  } finally {
    global.fetch = originalFetch;
  }
});

test("getWeeklyNutritionProgress requests WEEK nutrition points for dashboard activity", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";

  global.fetch = async (input) => {
    requestedUrl = String(input);

    return new Response(
      JSON.stringify({
        period: "WEEK",
        timezone: "Asia/Tehran",
        from: "2026-06-27",
        to: "2026-07-03",
        points: [],
        summary: {
          totals: {calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0},
          averagePerDay: {calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0},
          averagePerLoggedDay: null,
          minDailyTotals: null,
          maxDailyTotals: null,
          loggedDayCount: 0,
          missingDayCount: 7,
        },
      }),
      {status: 200, headers: {"Content-Type": "application/json"}},
    ) as Response;
  };

  try {
    const progress = await getWeeklyNutritionProgress("2026-06-30", "access-token");

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/progress/nutrition?period=WEEK&anchor=2026-06-30");
    assert.equal(progress.period, "WEEK");
  } finally {
    global.fetch = originalFetch;
  }
});

test("getNutritionProgress requests MONTH nutrition points by month", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";

  global.fetch = async (input) => {
    requestedUrl = String(input);

    return new Response(
      JSON.stringify(nutritionProgressResponse({period: "MONTH", from: "2026-06-01", to: "2026-06-30"})),
      {status: 200, headers: {"Content-Type": "application/json"}},
    ) as Response;
  };

  try {
    const progress = await getNutritionProgress(
      {period: "MONTH", month: "2026-06"},
      "access-token",
    );

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/progress/nutrition?period=MONTH&month=2026-06");
    assert.equal(progress.period, "MONTH");
  } finally {
    global.fetch = originalFetch;
  }
});

test("getNutritionProgress requests PHASE nutrition points by explicit range", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";

  global.fetch = async (input) => {
    requestedUrl = String(input);

    return new Response(
      JSON.stringify(nutritionProgressResponse({period: "PHASE", from: "2026-06-01", to: "2026-06-07"})),
      {status: 200, headers: {"Content-Type": "application/json"}},
    ) as Response;
  };

  try {
    const progress = await getNutritionProgress(
      {period: "PHASE", from: "2026-06-01", to: "2026-06-07"},
      "access-token",
    );

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/progress/nutrition?period=PHASE&from=2026-06-01&to=2026-06-07");
    assert.equal(progress.period, "PHASE");
  } finally {
    global.fetch = originalFetch;
  }
});

test("getNutritionProgressBatch posts raw nutrition progress ranges", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let authorizationHeader = "";
  let requestBody = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    authorizationHeader = new Headers(init?.headers).get("Authorization") ?? "";
    requestBody = String(init?.body);

    return new Response(
      JSON.stringify({
        results: [
          {
            requestId: "current-week",
            ...nutritionProgressResponse({period: "WEEK", from: "2026-06-27", to: "2026-07-03"}),
          },
        ],
      }),
      {status: 200, headers: {"Content-Type": "application/json"}},
    ) as Response;
  };

  try {
    const response = await getNutritionProgressBatch(
      {
        ranges: [
          {requestId: "current-week", period: "WEEK", anchor: "2026-06-30"},
          {requestId: "current-month", period: "MONTH", month: "2026-06"},
          {requestId: "cut-phase", period: "PHASE", from: "2026-06-01", to: "2026-06-07"},
        ],
      },
      "access-token",
    );

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/progress/nutrition/batch");
    assert.equal(authorizationHeader, "Bearer access-token");
    assert.deepEqual(JSON.parse(requestBody), {
      ranges: [
        {requestId: "current-week", period: "WEEK", anchor: "2026-06-30"},
        {requestId: "current-month", period: "MONTH", month: "2026-06"},
        {requestId: "cut-phase", period: "PHASE", from: "2026-06-01", to: "2026-06-07"},
      ],
    });
    assert.equal(response.results[0].requestId, "current-week");
    assert.equal(response.results[0].period, "WEEK");
    assert.equal("nutrition" in response.results[0], false);
  } finally {
    global.fetch = originalFetch;
  }
});

test("getWeightProgress requests a bounded PHASE range for monthly dashboard weight stats", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let authorizationHeader = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    authorizationHeader = new Headers(init?.headers).get("Authorization") ?? "";

    return new Response(
      JSON.stringify({
        period: "PHASE",
        timezone: "Asia/Tehran",
        from: "2026-06-01",
        to: "2026-06-30",
        latestMeasurementDate: "2026-06-20",
        points: [
          {date: "2026-06-01", weightKg: 80.1, hasMeasurement: true},
          {date: "2026-06-02", weightKg: null, hasMeasurement: false},
        ],
        summary: {
          startWeightKg: 80.1,
          endWeightKg: 79.4,
          absoluteChangeKg: -0.7,
          percentChange: -0.874,
          trendDirection: "DOWN",
          measurementCount: 2,
          missingDayCount: 28,
        },
      }),
      {status: 200, headers: {"Content-Type": "application/json"}},
    ) as Response;
  };

  try {
    const progress = await getWeightProgress(
      {period: "PHASE", from: "2026-06-01", to: "2026-06-30"},
      "access-token",
    );

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/progress/weight?period=PHASE&from=2026-06-01&to=2026-06-30");
    assert.equal(authorizationHeader, "Bearer access-token");
    assert.equal(progress.summary.measurementCount, 2);
    assert.equal(progress.latestMeasurementDate, "2026-06-20");
  } finally {
    global.fetch = originalFetch;
  }
});

test("getWeightProgress requests a WEEK anchor range", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";

  global.fetch = async (input) => {
    requestedUrl = String(input);

    return new Response(
      JSON.stringify(weightProgressResponse({period: "WEEK", from: "2026-06-27", to: "2026-07-03"})),
      {status: 200, headers: {"Content-Type": "application/json"}},
    ) as Response;
  };

  try {
    const progress = await getWeightProgress(
      {period: "WEEK", anchor: "2026-06-30"},
      "access-token",
    );

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/progress/weight?period=WEEK&anchor=2026-06-30");
    assert.equal(progress.period, "WEEK");
  } finally {
    global.fetch = originalFetch;
  }
});

test("getWeightProgressBatch posts raw weight progress ranges", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let authorizationHeader = "";
  let requestBody = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    authorizationHeader = new Headers(init?.headers).get("Authorization") ?? "";
    requestBody = String(init?.body ?? "");

    return new Response(
      JSON.stringify({
        results: [
          {
            requestId: "current-week",
            ...weightProgressResponse({period: "WEEK", from: "2026-06-27", to: "2026-07-03"}),
          },
        ],
      }),
      {status: 200, headers: {"Content-Type": "application/json"}},
    ) as Response;
  };

  try {
    const response = await getWeightProgressBatch(
      {
        ranges: [
          {requestId: "current-week", period: "WEEK", anchor: "2026-06-30"},
          {requestId: "cut-phase", period: "PHASE", from: "2026-06-01", to: "2026-06-07"},
        ],
      },
      "access-token",
    );

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/progress/weight/batch");
    assert.equal(authorizationHeader, "Bearer access-token");
    assert.deepEqual(JSON.parse(requestBody), {
      ranges: [
        {requestId: "current-week", period: "WEEK", anchor: "2026-06-30"},
        {requestId: "cut-phase", period: "PHASE", from: "2026-06-01", to: "2026-06-07"},
      ],
    });
    assert.equal(response.results[0].requestId, "current-week");
    assert.equal("weight" in response.results[0], false);
  } finally {
    global.fetch = originalFetch;
  }
});

function nutritionProgressResponse({
  period,
  from,
  to,
}: {
  period: "WEEK" | "MONTH" | "PHASE";
  from: string;
  to: string;
}) {
  return {
    period,
    timezone: "Asia/Tehran",
    from,
    to,
    points: [],
    summary: {
      totals: {calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0},
      averagePerDay: {calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0},
      averagePerLoggedDay: null,
      minDailyTotals: null,
      maxDailyTotals: null,
      loggedDayCount: 0,
      missingDayCount: 7,
    },
  };
}

function weightProgressResponse({
  period,
  from,
  to,
}: {
  period: "WEEK" | "PHASE";
  from: string;
  to: string;
}) {
  return {
    period,
    timezone: "Asia/Tehran",
    from,
    to,
    latestMeasurementDate: null,
    points: [],
    summary: {
      startWeightKg: null,
      endWeightKg: null,
      absoluteChangeKg: null,
      percentChange: null,
      trendDirection: "INSUFFICIENT_DATA",
      measurementCount: 0,
      missingDayCount: 7,
    },
  };
}
