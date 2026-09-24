import {type NextRequest, NextResponse} from "next/server";

import {getAdminUsers} from "@/lib/api/admin-users";
import {ApiClientError} from "@/lib/api/errors";
import {authenticatedRouteRequest} from "@/lib/auth/authenticated-api";
import {AuthenticationRequiredError} from "@/lib/auth/authenticated-api-core";

const roles = new Set(["USER", "ADMIN"]);
const statuses = new Set(["ACTIVE", "DISABLED", "PENDING_VERIFICATION", "DEACTIVATED", "DELETED"]);

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const search = {
      query: optionalString(params.get("query"), 320),
      role: enumValue(params.get("role"), roles),
      status: enumValue(params.get("status"), statuses),
      page: pageValue(params.get("page")),
    };
    const usersPage = await authenticatedRouteRequest(
      (accessToken) => getAdminUsers(accessToken, search),
      {retryPolicy: "idempotent"},
    );
    return NextResponse.json(usersPage);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return NextResponse.json({code: "AUTHENTICATION_REQUIRED"}, {status: 401});
    }
    if (error instanceof ApiClientError) {
      return NextResponse.json({code: error.code, requestId: error.requestId}, {status: error.status});
    }
    return NextResponse.json({code: "ADMIN_USERS_SEARCH_FAILED"}, {status: 500});
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

function pageValue(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
