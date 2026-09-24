import {type NextRequest, NextResponse} from "next/server";

import {getAdminCatalogFoods} from "@/lib/api/admin-catalog";
import {ApiClientError} from "@/lib/api/errors";
import {authenticatedRouteRequest} from "@/lib/auth/authenticated-api";
import {AuthenticationRequiredError} from "@/lib/auth/authenticated-api-core";

const curationStatuses = new Set(["REVIEWED", "UNREVIEWED", "HIDDEN"]);
const ownershipValues = new Set(["USER", "ALL"]);

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const page = await authenticatedRouteRequest(
      (accessToken) => getAdminCatalogFoods(accessToken, {
        query: optionalString(params.get("query"), 120),
        curationStatus: enumValue(params.get("curationStatus"), curationStatuses),
        archived: booleanString(params.get("archived")),
        ownership: enumValue(params.get("ownership"), ownershipValues) as "USER" | "ALL" | undefined,
        page: pageValue(params.get("page")),
      }),
      {retryPolicy: "idempotent"},
    );
    return NextResponse.json(page);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({code: "AUTHENTICATION_REQUIRED"}, {status: 401});
    if (error instanceof ApiClientError) return NextResponse.json({
      code: error.code,
      requestId: error.requestId
    }, {status: error.status});
    return NextResponse.json({code: "ADMIN_CATALOG_SEARCH_FAILED"}, {status: 500});
  }
}

function optionalString(value: string | null, maxLength: number) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function enumValue(value: string | null, allowed: ReadonlySet<string>) {
  const normalized = value?.trim().toUpperCase();
  return normalized && allowed.has(normalized) ? normalized : undefined;
}

function booleanString(value: string | null) {
  return value === "true" || value === "false" ? value : undefined;
}

function pageValue(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
