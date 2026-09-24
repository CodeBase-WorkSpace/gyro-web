import assert from "node:assert/strict";
import test from "node:test";

import {
	deleteGoal,
	getGoals,
	previewGoal,
	saveGoal,
	type GoalPreviewRequestDto,
	type SaveGoalRequestDto,
} from "../lib/api/goals";

process.env.API_BASE_URL ??= "http://localhost:8080/api/v1";

test("getGoals requests the authenticated current-goal endpoint", async () => {
	const originalFetch = global.fetch;
	let requestedUrl = "";
	let authorizationHeader = "";

	global.fetch = async (input, init) => {
		requestedUrl = String(input);
		authorizationHeader =
			new Headers(init?.headers).get("Authorization") ?? "";

		return new Response(JSON.stringify({ status: "UNCONFIGURED" }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		}) as Response;
	};

	try {
		const goal = await getGoals("access-token");

		assert.equal(requestedUrl, "http://localhost:8080/api/v1/goals");
		assert.equal(authorizationHeader, "Bearer access-token");
		assert.equal(goal.status, "UNCONFIGURED");
	} finally {
		global.fetch = originalFetch;
	}
});

test("saveGoal sends the canonical goal save body with PUT", async () => {
	const originalFetch = global.fetch;
	let requestedUrl = "";
	let method = "";
	let requestBody: SaveGoalRequestDto | undefined;

	global.fetch = async (input, init) => {
		requestedUrl = String(input);
		method = init?.method ?? "";
		requestBody = JSON.parse(String(init?.body));

		return new Response(
			JSON.stringify({
				status: "CONFIGURED",
				activePlan: {
					id: "plan-1",
					goalType: "MAINTAIN_WEIGHT",
					startDate: "2026-06-30",
					baseTargets: {
						calories: 2200,
						protein: 140,
						carbs: 220,
						fat: 70,
						fiber: 28,
					},
					calculator: null,
					schedule: {
						type: "FLAT",
						activeFrom: "2026-06-30",
						activeTo: null,
					},
				},
			}),
			{ status: 200, headers: { "Content-Type": "application/json" } },
		) as Response;
	};

	try {
		const request: SaveGoalRequestDto = {
			goal: {
				type: "MAINTAIN_WEIGHT",
				targetWeight: null,
				targetDate: null,
			},
			activePlan: {
				startDate: "2026-06-30",
				baseTargets: {
					calories: 2200,
					protein: 140,
					carbs: 220,
					fat: 70,
					fiber: 28,
				},
				schedule: {
					type: "FLAT",
					activeTo: null,
				},
				calculatorUpdateMode: "CLEAR",
			},
			acceptedWarningCodes: [],
			blockingWarningCodes: [],
		};
		const goal = await saveGoal(request, "access-token");

		assert.equal(requestedUrl, "http://localhost:8080/api/v1/goals");
		assert.equal(method, "PUT");
		assert.deepEqual(requestBody, request);
		assert.equal(goal.activePlan?.schedule?.type, "FLAT");
	} finally {
		global.fetch = originalFetch;
	}
});

test("deleteGoal clears the authenticated goal with DELETE", async () => {
	const originalFetch = global.fetch;
	let requestedUrl = "";
	let method = "";
	let authorizationHeader = "";

	global.fetch = async (input, init) => {
		requestedUrl = String(input);
		method = init?.method ?? "";
		authorizationHeader =
			new Headers(init?.headers).get("Authorization") ?? "";

		return new Response(JSON.stringify({ status: "UNCONFIGURED" }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		}) as Response;
	};

	try {
		const goal = await deleteGoal("access-token");

		assert.equal(requestedUrl, "http://localhost:8080/api/v1/goals");
		assert.equal(method, "DELETE");
		assert.equal(authorizationHeader, "Bearer access-token");
		assert.equal(goal.status, "UNCONFIGURED");
	} finally {
		global.fetch = originalFetch;
	}
});

test("previewGoal posts calculator inputs to goals preview", async () => {
	const originalFetch = global.fetch;
	let requestedUrl = "";
	let method = "";

	global.fetch = async (input, init) => {
		requestedUrl = String(input);
		method = init?.method ?? "";

		return new Response(
			JSON.stringify({
				formula: { name: "MIFFLIN_ST_JEOR", version: "1" },
				calculationDate: "2026-06-30",
				maintenanceCalories: 2500,
				targetCalories: 2100,
				activityFactor: 1.45,
				dailyEnergyDelta: -400,
				weeklyWeightChangeKg: -0.36,
				timeline: {
					estimatedWeeksMin: 10,
					estimatedWeeksMax: 12,
					estimatedMonths: 2.5,
					estimatedTargetDate: "2026-09-15",
				},
				macros: {
					proteinGrams: 140,
					proteinCalories: 560,
					carbsGrams: 220,
					carbsCalories: 880,
					fatGrams: 73.3,
					fatCalories: 660,
				},
				warnings: [],
			}),
			{ status: 200, headers: { "Content-Type": "application/json" } },
		) as Response;
	};

	try {
		const request: GoalPreviewRequestDto = {
			sex: "MALE",
			birthDate: "1990-01-01",
			heightCm: 178,
			currentWeightKg: 84,
			targetWeightKg: 78,
			dailyMovementLevel: "MODERATE",
			workoutFrequency: "THREE_TO_FOUR_DAYS",
			goalType: "LOSE_WEIGHT",
			speed: "BALANCED",
		};
		const preview = await previewGoal(request, "access-token");

		assert.equal(
			requestedUrl,
			"http://localhost:8080/api/v1/goals/preview",
		);
		assert.equal(method, "POST");
		assert.equal(preview.formula.name, "MIFFLIN_ST_JEOR");
	} finally {
		global.fetch = originalFetch;
	}
});
