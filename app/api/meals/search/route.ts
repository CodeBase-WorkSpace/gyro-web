import { NextResponse, type NextRequest } from "next/server";

import { ApiClientError } from "@/lib/api/errors";
import { listMeals } from "@/lib/api/meals";
import { authenticatedRouteRequest } from "@/lib/auth/authenticated-api";
import { AuthenticationRequiredError } from "@/lib/auth/authenticated-api-core";

export async function GET(request: NextRequest) {
	try {
		return NextResponse.json(
			await authenticatedRouteRequest(
				(accessToken) =>
					listMeals(mealSearchRequestFrom(request.nextUrl.searchParams), accessToken),
				{ retryPolicy: "idempotent" },
			),
		);
	} catch (error) {
		if (error instanceof AuthenticationRequiredError) {
			return NextResponse.json(
				{
					status: 401,
					code: "AUTHENTICATION_REQUIRED",
					message: "Authentication is required.",
				},
				{ status: 401 },
			);
		}

		if (error instanceof ApiClientError) {
			return NextResponse.json(
				{
					status: error.status,
					code: error.code,
					message: error.message,
					requestId: error.requestId,
				},
				{ status: error.status },
			);
		}

		return NextResponse.json(
			{
				status: 500,
				code: "MEAL_SEARCH_FAILED",
				message: "Meal search failed.",
			},
			{ status: 500 },
		);
	}
}

function mealSearchRequestFrom(searchParams: URLSearchParams) {
	return {
		query: optionalString(searchParams.get("query")),
		page: optionalInteger(searchParams.get("page")),
		size: optionalInteger(searchParams.get("size")),
	};
}

function optionalString(value: string | null) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

function optionalInteger(value: string | null) {
	if (!value) return undefined;

	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : undefined;
}
