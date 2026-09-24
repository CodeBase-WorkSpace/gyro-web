import { NextResponse } from "next/server";

import { ApiClientError } from "@/lib/api/errors";
import { getMealDetail } from "@/lib/api/meals";
import { authenticatedRouteRequest } from "@/lib/auth/authenticated-api";
import { AuthenticationRequiredError } from "@/lib/auth/authenticated-api-core";

export async function GET(_request: Request, { params }: { params: Promise<{ mealId: string }> }) {
	const { mealId } = await params;
	try {
		return NextResponse.json(await authenticatedRouteRequest(
			(accessToken) => getMealDetail(mealId, accessToken),
			{ retryPolicy: "idempotent" },
		));
	} catch (error) {
		if (error instanceof AuthenticationRequiredError) {
			return NextResponse.json({ message: "Authentication is required." }, { status: 401 });
		}
		if (error instanceof ApiClientError) {
			return NextResponse.json({ message: error.message, code: error.code, requestId: error.requestId }, { status: error.status });
		}
		return NextResponse.json({ message: "Meal source could not be loaded." }, { status: 500 });
	}
}
