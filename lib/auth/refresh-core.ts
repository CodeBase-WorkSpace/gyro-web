import type { AuthResponse } from "./types";

export type RefreshAuthCoreDependencies = {
  getRefreshToken: () => Promise<string | undefined>;
  refreshSession: (refreshToken: string) => Promise<AuthResponse>;
  setAuthCookies: (auth: AuthResponse) => Promise<void>;
  clearAuthCookies: () => Promise<void>;
};

export type RefreshAuthCoreResult =
  | {
      ok: true;
      accessToken: string;
    }
  | {
      ok: false;
      status: number;
      code?: string;
    };

type RefreshAuthCoreFailure = Extract<RefreshAuthCoreResult, { ok: false }>;

/**
 * Statuses that mean "the request never reached the API", not "the API rejected
 * this session". nginx returns these when it cannot hand the request to the
 * upstream at all — a stale pooled connection, a restart, a brief overload.
 */
const GATEWAY_STATUSES = new Set([502, 503, 504]);

export function isGatewayFailure(
  result: RefreshAuthCoreResult
): result is RefreshAuthCoreFailure {
  return !result.ok && GATEWAY_STATUSES.has(result.status);
}

export async function refreshAuthCookiesCore(
  dependencies: RefreshAuthCoreDependencies
): Promise<RefreshAuthCoreResult> {
  const refreshToken = await dependencies.getRefreshToken();

  if (!refreshToken) {
    return {
      ok: false,
      status: 401,
      code: "MISSING_REFRESH_TOKEN",
    };
  }

  const attempt = await attemptRefresh(dependencies, refreshToken);
  if (!isGatewayFailure(attempt)) return attempt;

  // A gateway error carries no verdict about the token, so retrying is safe.
  // If the first attempt did reach the API and only the response was lost, the
  // token is now rotated-with-grace and the retry still succeeds.
  return attemptRefresh(dependencies, refreshToken);
}

async function attemptRefresh(
  dependencies: RefreshAuthCoreDependencies,
  refreshToken: string
): Promise<RefreshAuthCoreResult> {
  try {
    const auth = await dependencies.refreshSession(refreshToken);
    await dependencies.setAuthCookies(auth);

    return {
      ok: true,
      accessToken: auth.accessToken,
    };
  } catch (error) {
    const diagnostic = toRefreshFailureDiagnostic(error);

    // Only an explicit rejection may destroy the session. Clearing cookies on a
    // gateway error would turn a dropped connection into a forced logout.
    if (diagnostic.status === 401 || diagnostic.code === "INVALID_REFRESH_TOKEN") {
      await dependencies.clearAuthCookies();
    }

    return diagnostic;
  }
}

function toRefreshFailureDiagnostic(error: unknown): RefreshAuthCoreFailure {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return {
      ok: false,
      status: error.status,
      code: "code" in error && typeof error.code === "string" ? error.code : undefined,
    };
  }

  return {
    ok: false,
    status: 500,
    code: "REFRESH_FAILED",
  };
}
