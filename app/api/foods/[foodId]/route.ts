import { NextResponse } from "next/server";

import { ApiClientError } from "@/lib/api/errors";
import { getFoodDetail } from "@/lib/api/foods";
import { authenticatedRouteRequest } from "@/lib/auth/authenticated-api";
import { AuthenticationRequiredError } from "@/lib/auth/authenticated-api-core";

export async function GET(_request: Request, { params }: { params: Promise<{ foodId: string }> }) {
	const { foodId } = await params;
	try {
		return NextResponse.json(await authenticatedRouteRequest(
			(accessToken) => getFoodDetail(foodId, accessToken, "fa"),
			{ retryPolicy: "idempotent" },
		));
	} catch (error) {
		if (error instanceof AuthenticationRequiredError) {
			return NextResponse.json({ message: "Authentication is required." }, { status: 401 });
		}
		return apiErrorResponse(error, "Food source could not be loaded.");
	}
}

function apiErrorResponse(error: unknown, fallback: string) {
	if (error instanceof ApiClientError) {
		return NextResponse.json({ message: error.message, code: error.code, requestId: error.requestId }, { status: error.status });
	}
	return NextResponse.json({ message: fallback }, { status: 500 });
}
