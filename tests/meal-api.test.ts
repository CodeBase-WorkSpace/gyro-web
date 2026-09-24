import assert from "node:assert/strict";
import test from "node:test";

import { archiveMeal, createMeal, listMeals, updateMeal } from "../lib/api/meals";

process.env.API_BASE_URL ??= "http://localhost:8080/api/v1";

test("createMeal posts the typed template with authentication and idempotency", async () => {
	const originalFetch = global.fetch;
	let requestedUrl = "";
	let method = "";
	let body = "";
	let authorization = "";
	let idempotencyKey = "";

	global.fetch = async (input, init) => {
		requestedUrl = String(input);
		method = init?.method ?? "";
		body = String(init?.body ?? "");
		const headers = new Headers(init?.headers);
		authorization = headers.get("Authorization") ?? "";
		idempotencyKey = headers.get("Idempotency-Key") ?? "";
		return new Response(JSON.stringify({
			id: "meal-1",
			name: "وعده تمرین",
			items: [],
			calories: 0,
			protein: 0,
			carbs: 0,
			fat: 0,
			fiber: 0,
			sugar: 0,
			sodium: 0,
		}), { status: 201, headers: { "Content-Type": "application/json" } });
	};

	try {
		const meal = await createMeal({
			name: "وعده تمرین",
			items: [{ foodId: "food-rice", quantity: 270, servingUnit: "GRAM" }],
		}, "access-token", "custom-meal-intent");

		assert.equal(requestedUrl, "http://localhost:8080/api/v1/meals");
		assert.equal(method, "POST");
		assert.equal(authorization, "Bearer access-token");
		assert.equal(idempotencyKey, "custom-meal-intent");
		assert.deepEqual(JSON.parse(body), {
			name: "وعده تمرین",
			items: [{ foodId: "food-rice", quantity: 270, servingUnit: "GRAM" }],
		});
		assert.equal(meal.id, "meal-1");
	} finally {
		global.fetch = originalFetch;
	}
});

test("listMeals reads the owner meal library with pagination", async () => {
	const originalFetch = global.fetch;
	let requestedUrl = "";
	let authorization = "";

	global.fetch = async (input, init) => {
		requestedUrl = String(input);
		authorization = new Headers(init?.headers).get("Authorization") ?? "";
		return new Response(JSON.stringify({
			items: [],
			page: 0,
			size: 8,
			totalItems: 0,
			totalPages: 0,
		}), { status: 200, headers: { "Content-Type": "application/json" } });
	};

	try {
		await listMeals({ page: 0, size: 8 }, "access-token");
		assert.equal(requestedUrl, "http://localhost:8080/api/v1/meals?page=0&size=8");
		assert.equal(authorization, "Bearer access-token");
	} finally {
		global.fetch = originalFetch;
	}
});

test("updateMeal replaces the complete meal item list", async () => {
	const originalFetch = global.fetch;
	let requestedUrl = "";
	let method = "";
	let body = "";

	global.fetch = async (input, init) => {
		requestedUrl = String(input);
		method = init?.method ?? "";
		body = String(init?.body ?? "");
		return new Response(JSON.stringify({
			id: "meal-1",
			name: "نسخه ویرایش‌شده",
			items: [],
			calories: 0,
			protein: 0,
			carbs: 0,
			fat: 0,
			fiber: 0,
			sugar: 0,
			sodium: 0,
		}), { status: 200, headers: { "Content-Type": "application/json" } });
	};

	try {
		await updateMeal("meal-1", {
			name: "نسخه ویرایش‌شده",
			items: [{ foodId: "food-1", quantity: 125, servingUnit: "GRAM" }],
		}, "access-token");
		assert.equal(requestedUrl, "http://localhost:8080/api/v1/meals/meal-1");
		assert.equal(method, "PATCH");
		assert.deepEqual(JSON.parse(body), {
			name: "نسخه ویرایش‌شده",
			items: [{ foodId: "food-1", quantity: 125, servingUnit: "GRAM" }],
		});
	} finally {
		global.fetch = originalFetch;
	}
});

test("archiveMeal posts the owner meal archive command", async () => {
	const originalFetch = global.fetch;
	let requestedUrl = "";
	let method = "";

	global.fetch = async (input, init) => {
		requestedUrl = String(input);
		method = init?.method ?? "";
		return new Response(JSON.stringify({ mealId: "meal-1", archived: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	};

	try {
		const result = await archiveMeal("meal-1", "access-token");
		assert.equal(requestedUrl, "http://localhost:8080/api/v1/meals/meal-1/archive");
		assert.equal(method, "POST");
		assert.deepEqual(result, { mealId: "meal-1", archived: true });
	} finally {
		global.fetch = originalFetch;
	}
});
