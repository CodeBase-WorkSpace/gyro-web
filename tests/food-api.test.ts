import assert from "node:assert/strict";
import test from "node:test";

import {
  archiveCustomFood,
  createCustomFood,
  favoriteFood,
  foodDetailPath,
  foodSearchPath,
  foodSearchProxyPath,
  getFoodDetail,
  quickAddFoodSearchRequest,
  searchFoods,
  unfavoriteFood,
  updateCustomFood,
} from "../lib/api/foods";

process.env.API_BASE_URL ??= "http://localhost:8080/api/v1";

test("foodSearchPath maps quick-add filters to backend query parameters", () => {
  const path = foodSearchPath({
    query: "مرغ",
    type: "CUSTOM",
    favorite: true,
    recent: false,
    locale: "fa-IR",
    page: 2,
    size: 10,
  });

  assert.equal(
    path,
    "/foods?query=%D9%85%D8%B1%D8%BA&type=CUSTOM&favorite=true&recent=false&locale=fa-IR&page=2&size=10"
  );
});

test("foodSearchProxyPath targets the frontend search route", () => {
  assert.equal(
    foodSearchProxyPath({ query: "مرغ", page: 0, size: 10 }),
    "/api/foods/search?query=%D9%85%D8%B1%D8%BA&page=0&size=10"
  );
});

test("quickAddFoodSearchRequest maps all filter tabs to backend search params", () => {
  assert.deepEqual(
    quickAddFoodSearchRequest({ query: " مرغ ", filter: "all", locale: "fa", page: 0, size: 10 }),
    { query: "مرغ", locale: "fa", page: 0, size: 10, recent: undefined, favorite: undefined, type: undefined }
  );

  assert.deepEqual(
    quickAddFoodSearchRequest({ query: "مرغ", filter: "recent", locale: "fa", page: 0, size: 10 }),
    { query: "مرغ", locale: "fa", page: 0, size: 10, recent: true, favorite: undefined, type: undefined }
  );

  assert.deepEqual(
    quickAddFoodSearchRequest({ query: "مرغ", filter: "favorite", locale: "fa", page: 0, size: 10 }),
    { query: "مرغ", locale: "fa", page: 0, size: 10, recent: undefined, favorite: true, type: undefined }
  );

  assert.deepEqual(
    quickAddFoodSearchRequest({ query: "مرغ", filter: "custom", locale: "fa", page: 0, size: 10 }),
    { query: "مرغ", locale: undefined, page: 0, size: 10, recent: undefined, favorite: undefined, type: "CUSTOM" }
  );

  assert.deepEqual(
    quickAddFoodSearchRequest({ query: "مرغ", filter: "system", locale: "fa", page: 0, size: 10 }),
    { query: "مرغ", locale: "fa", page: 0, size: 10, recent: undefined, favorite: undefined, type: "SYSTEM" }
  );
});

test("quickAddFoodSearchRequest preserves selected filter while query changes", () => {
  const request = quickAddFoodSearchRequest({
    query: "مرغ خام",
    filter: "favorite",
    locale: "fa",
    page: 0,
    size: 10,
  });

  assert.equal(request.query, "مرغ خام");
  assert.equal(request.favorite, true);
});

test("searchFoods sends access token on server-side backend requests", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let authorizationHeader = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    authorizationHeader = new Headers(init?.headers).get("Authorization") ?? "";

    return new Response(
      JSON.stringify({
        items: [],
        page: 0,
        size: 10,
        totalItems: 0,
        totalPages: 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "X-Request-Id": "backend-request-foods" },
      }
    ) as Response;
  };

  try {
    await searchFoods({ query: "chicken", page: 0, size: 10 }, "access-token");

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/foods?query=chicken&page=0&size=10");
    assert.equal(authorizationHeader, "Bearer access-token");
  } finally {
    global.fetch = originalFetch;
  }
});

test("foodSearchPath preserves short Farsi locale for backend food search", () => {
  const path = foodSearchPath({ query: "مرغ", locale: "fa", page: 0, size: 10 });

  assert.equal(path, "/foods?query=%D9%85%D8%B1%D8%BA&locale=fa&page=0&size=10");
});

test("foodDetailPath maps food id and locale to backend detail path", () => {
  assert.equal(foodDetailPath("food-123", "fa"), "/foods/food-123?locale=fa");
});

test("getFoodDetail sends access token on server-side backend requests", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let authorizationHeader = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    authorizationHeader = new Headers(init?.headers).get("Authorization") ?? "";

    return new Response(
      JSON.stringify({
        id: "food-detail-1",
        type: "SYSTEM",
        name: "Chicken breast",
        displayName: "سینه مرغ",
        locale: "fa",
        servingQuantity: 100,
        servingUnit: { code: "GRAM", label: "گرم" },
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
        sugar: 0,
        sodium: 74,
        portions: [],
        favorite: false,
        recent: true,
        source: "USDA_FDC",
        dataQuality: "FOUNDATION",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "X-Request-Id": "backend-request-food-detail" },
      }
    ) as Response;
  };

  try {
    const food = await getFoodDetail("food-detail-1", "access-token", "fa");

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/foods/food-detail-1?locale=fa");
    assert.equal(authorizationHeader, "Bearer access-token");
    assert.equal(food.displayName, "سینه مرغ");
  } finally {
    global.fetch = originalFetch;
  }
});

test("createCustomFood posts authenticated request with idempotency and request ids", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let method = "";
  let authorizationHeader = "";
  let idempotencyHeader = "";
  let requestIdHeader = "";
  let requestBody = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    method = init?.method ?? "";
    const headers = new Headers(init?.headers);
    authorizationHeader = headers.get("Authorization") ?? "";
    idempotencyHeader = headers.get("Idempotency-Key") ?? "";
    requestIdHeader = headers.get("X-Request-Id") ?? "";
    requestBody = String(init?.body ?? "");

    return new Response(
      JSON.stringify({
        id: "food-custom-1",
        name: "خوراک مرغ",
        type: "CUSTOM",
        servingQuantity: 100,
        servingUnit: { code: "GRAM", label: "گرم" },
        calories: 220,
        protein: 25,
        carbs: 8,
        fat: 10,
        fiber: 1,
        sugar: 2,
        sodium: 180,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json", "X-Request-Id": "backend-request-custom-food" },
      }
    ) as Response;
  };

  try {
    const createdFood = await createCustomFood(
      {
        name: "خوراک مرغ",
        servingQuantity: 100,
        servingUnit: "GRAM",
        calories: 220,
        protein: 25,
        carbs: 8,
        fat: 10,
        fiber: 1,
        sugar: 2,
        sodium: 180,
      },
      "access-token",
      "custom-food-key"
    );

    assert.equal(requestedUrl, "http://localhost:8080/api/v1/foods/custom");
    assert.equal(method, "POST");
    assert.equal(authorizationHeader, "Bearer access-token");
    assert.equal(idempotencyHeader, "custom-food-key");
    assert.match(requestIdHeader, /.+/);
    assert.equal(JSON.parse(requestBody).servingUnit, "GRAM");
    assert.equal(createdFood.id, "food-custom-1");
  } finally {
    global.fetch = originalFetch;
  }
});

test("favoriteFood and unfavoriteFood use authenticated favorite endpoints", async () => {
  const originalFetch = global.fetch;
  const requests: Array<{ url: string; method: string; authorization: string }> = [];

  global.fetch = async (input, init) => {
    requests.push({
      url: String(input),
      method: init?.method ?? "",
      authorization: new Headers(init?.headers).get("Authorization") ?? "",
    });

    return new Response(
      JSON.stringify({
        foodId: "food-1",
        favorite: init?.method === "POST",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    ) as Response;
  };

  try {
    await favoriteFood("food-1", "access-token");
    await unfavoriteFood("food-1", "access-token");

    assert.deepEqual(requests, [
      {
        url: "http://localhost:8080/api/v1/foods/food-1/favorite",
        method: "POST",
        authorization: "Bearer access-token",
      },
      {
        url: "http://localhost:8080/api/v1/foods/food-1/favorite",
        method: "DELETE",
        authorization: "Bearer access-token",
      },
    ]);
  } finally {
    global.fetch = originalFetch;
  }
});

test("updateCustomFood patches custom food and archiveCustomFood posts archive", async () => {
  const originalFetch = global.fetch;
  const requests: Array<{ url: string; method: string; body: string; authorization: string }> = [];

  global.fetch = async (input, init) => {
    requests.push({
      url: String(input),
      method: init?.method ?? "",
      body: String(init?.body ?? ""),
      authorization: new Headers(init?.headers).get("Authorization") ?? "",
    });

    return new Response(
      JSON.stringify(
        init?.method === "PATCH"
          ? {
              id: "food-custom-1",
              name: "خوراک مرغ ویرایش‌شده",
              type: "CUSTOM",
              servingQuantity: 100,
              servingUnit: { code: "GRAM", label: "گرم" },
              calories: 221,
              protein: 25,
              carbs: 8,
              fat: 10,
              fiber: 1,
              sugar: 2,
              sodium: 180,
            }
          : {
              foodId: "food-custom-1",
              archived: true,
            }
      ),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    ) as Response;
  };

  try {
    await updateCustomFood(
      "food-custom-1",
      {
        name: "خوراک مرغ ویرایش‌شده",
        servingQuantity: 100,
        servingUnit: "GRAM",
        calories: 221,
        protein: 25,
        carbs: 8,
        fat: 10,
        fiber: 1,
        sugar: 2,
        sodium: 180,
      },
      "access-token"
    );
    await archiveCustomFood("food-custom-1", "access-token");

    assert.equal(requests[0]?.url, "http://localhost:8080/api/v1/foods/custom/food-custom-1");
    assert.equal(requests[0]?.method, "PATCH");
    assert.equal(requests[0]?.authorization, "Bearer access-token");
    assert.equal(JSON.parse(requests[0]?.body ?? "{}").calories, 221);
    assert.equal(requests[1]?.url, "http://localhost:8080/api/v1/foods/custom/food-custom-1/archive");
    assert.equal(requests[1]?.method, "POST");
    assert.equal(requests[1]?.authorization, "Bearer access-token");
  } finally {
    global.fetch = originalFetch;
  }
});
