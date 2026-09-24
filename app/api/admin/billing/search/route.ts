import {type NextRequest, NextResponse} from "next/server";

import {getAdminBillingSnapshot} from "@/lib/api/admin";
import {ApiClientError} from "@/lib/api/errors";
import {authenticatedRouteRequest} from "@/lib/auth/authenticated-api";
import {AuthenticationRequiredError} from "@/lib/auth/authenticated-api-core";

export async function GET(request: NextRequest) {
  try {
    const search = {
      query: optionalString(request.nextUrl.searchParams.get("query"), 128),
      status: optionalString(request.nextUrl.searchParams.get("status"), 32),
    };
    const snapshot = await authenticatedRouteRequest(
      (accessToken) => getAdminBillingSnapshot(accessToken, search),
      {retryPolicy: "idempotent"},
    );
    return NextResponse.json(snapshot);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return NextResponse.json({code: "AUTHENTICATION_REQUIRED"}, {status: 401});
    }
    if (error instanceof ApiClientError) {
      return NextResponse.json({code: error.code, requestId: error.requestId}, {status: error.status});
    }
    return NextResponse.json({code: "ADMIN_BILLING_SEARCH_FAILED"}, {status: 500});
  }
}

function optionalString(value: string | null, maxLength: number) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}
