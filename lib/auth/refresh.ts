import { refreshSession } from "./api";
import { clearAuthCookies, getRefreshToken, setAuthCookies } from "./cookies";
import { refreshAuthCookiesCore, type RefreshAuthCoreResult } from "./refresh-core";

export async function refreshAuthCookies(): Promise<RefreshAuthCoreResult> {
  return refreshAuthCookiesCore({
    getRefreshToken,
    refreshSession,
    setAuthCookies,
    clearAuthCookies,
  });
}
