import { NextResponse, type NextRequest } from "next/server";

import { ApiClientError } from "@/lib/api/errors";
import { recordNutritionCoachImpression } from "@/lib/api/nutrition-coach";
import { authenticatedRouteRequest } from "@/lib/auth/authenticated-api";
import { AuthenticationRequiredError } from "@/lib/auth/authenticated-api-core";

export async function POST(request: NextRequest) {
  const impressionId = await impressionIdFrom(request);
  if (!impressionId) {
    return NextResponse.json(
      {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "A Coach impression ID is required.",
      },
      { status: 400 },
    );
  }

  try {
    await authenticatedRouteRequest(
      (accessToken) =>
        recordNutritionCoachImpression(accessToken, impressionId),
      { retryPolicy: "idempotent" },
    );
    return new Response(null, { status: 204 });
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
        code: "COACH_IMPRESSION_FAILED",
        message: "Coach impression recording failed.",
      },
      { status: 500 },
    );
  }
}

async function impressionIdFrom(request: NextRequest): Promise<string | null> {
  try {
    const payload: unknown = await request.json();
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("impressionId" in payload) ||
      typeof payload.impressionId !== "string"
    ) {
      return null;
    }
    return payload.impressionId;
  } catch {
    return null;
  }
}
