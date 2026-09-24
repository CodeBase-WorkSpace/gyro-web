import { NextResponse, type NextRequest } from "next/server";

import { searchFoods, type FoodSearchRequestDto, type FoodSearchType } from "@/lib/api/foods";
import { ApiClientError } from "@/lib/api/errors";
import { authenticatedRouteRequest } from "@/lib/auth/authenticated-api";
import { AuthenticationRequiredError } from "@/lib/auth/authenticated-api-core";

const FOOD_TYPES = new Set<FoodSearchType>(["CUSTOM", "SYSTEM"]);

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await authenticatedRouteRequest(
      (accessToken) => searchFoods(foodSearchRequestFrom(request.nextUrl.searchParams), accessToken),
      { retryPolicy: "idempotent" },
    ));
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return NextResponse.json({ status: 401, code: "AUTHENTICATION_REQUIRED", message: "Authentication is required." }, { status: 401 });
    }
    if (error instanceof ApiClientError) {
      return NextResponse.json(
        {
          status: error.status,
          code: error.code,
          message: error.message,
          requestId: error.requestId,
          fieldErrors: error.fieldErrors
            ? Object.entries(error.fieldErrors).map(([field, errorMessage]) => ({ field, errorMessage }))
            : undefined,
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        status: 500,
        code: "FOOD_SEARCH_FAILED",
        message: "Food search failed.",
      },
      { status: 500 }
    );
  }
}

function foodSearchRequestFrom(searchParams: URLSearchParams): FoodSearchRequestDto {
  const type = searchParams.get("type");

  return {
    query: optionalString(searchParams.get("query")),
    type: type && FOOD_TYPES.has(type as FoodSearchType) ? (type as FoodSearchType) : undefined,
    favorite: optionalBoolean(searchParams.get("favorite")),
    recent: optionalBoolean(searchParams.get("recent")),
    locale: optionalString(searchParams.get("locale")),
    page: optionalInteger(searchParams.get("page")),
    size: optionalInteger(searchParams.get("size")),
  };
}

function optionalString(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function optionalBoolean(value: string | null) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function optionalInteger(value: string | null) {
  if (!value) return undefined;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}
