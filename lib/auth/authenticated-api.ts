import "server-only";

import { redirect } from "next/navigation";

import { ApiClientError } from "@/lib/api/errors";
import {
	AuthenticationRequiredError,
	executeAuthenticatedRequest,
	type AuthenticatedRequestRetryPolicy,
} from "@/lib/auth/authenticated-api-core";
import { getAccessToken } from "@/lib/auth/cookies";
import { refreshAuthCookies } from "@/lib/auth/refresh";
import { isGatewayFailure } from "@/lib/auth/refresh-core";

export async function authenticatedServerRequest<T>(
	request: (accessToken: string) => Promise<T>,
	options: {
		nextPath: string;
		retryPolicy: AuthenticatedRequestRetryPolicy;
	},
): Promise<T> {
	try {
		return await executeAuthenticatedRequest(request, {
			getAccessToken,
			refreshAccessToken,
			isUnauthorizedError: (error) => error instanceof ApiClientError && error.status === 401,
		}, options);
	} catch (error) {
		if (error instanceof AuthenticationRequiredError) {
			redirect(`/auth/login?next=${encodeURIComponent(options.nextPath)}&expired=1`);
		}
		throw error;
	}
}

export async function authenticatedRouteRequest<T>(
	request: (accessToken: string) => Promise<T>,
	options: { retryPolicy: AuthenticatedRequestRetryPolicy },
): Promise<T> {
	return executeAuthenticatedRequest(request, {
		getAccessToken,
		refreshAccessToken,
		isUnauthorizedError: (error) => error instanceof ApiClientError && error.status === 401,
	}, options);
}

async function refreshAccessToken() {
	const refreshed = await refreshAuthCookies();
	if (refreshed.ok) return refreshed.accessToken;

	// Returning undefined here means "this session is over", and the caller
	// redirects to the login page. A gateway error is not that — the API never
	// answered, so the session is probably fine. Surface it as a backend failure
	// instead, which the route error boundary renders with a retry.
	if (isGatewayFailure(refreshed)) {
		throw new ApiClientError(
			"ارتباط با سرور برقرار نشد. لطفا دوباره تلاش کنید.",
			refreshed.status,
			"SESSION_REFRESH_UNAVAILABLE",
		);
	}

	return undefined;
}
