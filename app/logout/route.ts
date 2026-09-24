import {redirect} from "next/navigation";

import {clearAuthCookies, getRefreshToken} from "@/lib/auth/cookies";
import {logout} from "@/lib/auth/api";
import {debugError, debugLog} from "@/lib/debug/logger";
import {LOGOUT_REDIRECT_PATH} from "@/lib/auth/logout";

export async function GET() {
  debugLog("auth", "logout-route:start");
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    try {
      await logout(refreshToken);
    } catch (error) {
      debugError("auth", "logout-route:backend-failed", error);
      // Ignore backend logout failures. We still clear local cookies.
    }
  }

  await clearAuthCookies();
  debugLog("auth", "logout-route:cookies-cleared");
  redirect(LOGOUT_REDIRECT_PATH);
}
