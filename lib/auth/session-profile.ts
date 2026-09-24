import "server-only";

import { verifyAccessToken } from "@/lib/auth/access-token";
import { getMe } from "@/lib/auth/api";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-api";
import type { AuthenticatedRequestRetryPolicy } from "@/lib/auth/authenticated-api-core";
import { getAccessToken } from "@/lib/auth/cookies";
import {
	SESSION_PROFILE_MAX_ENTRIES,
	SESSION_PROFILE_TTL_MS,
	sessionProfileCachePlan,
	TtlCache,
} from "@/lib/auth/session-profile-core";
import type { MeResponse } from "@/lib/auth/types";

const profiles = new TtlCache<MeResponse>(
	SESSION_PROFILE_TTL_MS,
	SESSION_PROFILE_MAX_ENTRIES,
);

/**
 * Reads the caller's profile, serving a short-lived cached copy where that is
 * safe.
 *
 * `/users/me` was requested on every authenticated render, and every one of
 * those reads was `no-store`. The response is also the least volatile thing
 * the app fetches: a display name, a timezone, a locale, and two onboarding
 * flags.
 *
 * The cache key comes from the access token's verified signature, never from
 * anything the caller supplied, so one user's profile cannot be served to
 * another. The token itself is not part of the key: it rotates on every
 * refresh while the user behind it does not, and keying on it would cache
 * nothing.
 *
 * This trades away per-render backend validation of account state for non-admin
 * users. See {@link SESSION_PROFILE_TTL_MS} for why that is safe here and what
 * would make it unsafe.
 */
export async function getSessionProfile(accessToken: string): Promise<MeResponse> {
	const plan = sessionProfileCachePlan(await verifyAccessToken(accessToken));
	if (!plan.cached) return getMe(accessToken);

	return profiles.load(plan.userId, () => getMe(accessToken));
}

/**
 * Runs a request that changes something `MeResponse` carries, then drops the
 * cached copy.
 *
 * **Every mutation of a profile field must go through this**, not through
 * `authenticatedServerRequest` directly. `MeResponse` covers far more than the
 * profile form — email, phone, role, status, verification states, `hasPassword`,
 * onboarding flags — and a mutation that forgets to invalidate leaves the user
 * staring at their old value for up to a minute with no error to explain it.
 * Relying on each new action to remember the call is how that gets forgotten;
 * three password actions had already missed it.
 */
export async function mutateCurrentUserProfile<T>(
	request: (accessToken: string) => Promise<T>,
	options: {
		nextPath: string;
		retryPolicy: AuthenticatedRequestRetryPolicy;
	},
): Promise<T> {
	const result = await authenticatedServerRequest(request, options);
	await invalidateCurrentSessionProfile();
	return result;
}

/**
 * Drops the cached profile for the signed-in user.
 *
 * Prefer {@link mutateCurrentUserProfile}, which cannot be forgotten. Reach for
 * this directly only when the mutation does not run through
 * `authenticatedServerRequest` — for example when a single action performs
 * several writes and should invalidate once at the end.
 */
export async function invalidateCurrentSessionProfile(): Promise<void> {
	const accessToken = await getAccessToken();
	if (!accessToken) return;

	const plan = sessionProfileCachePlan(await verifyAccessToken(accessToken));
	if (plan.cached) profiles.delete(plan.userId);
}
