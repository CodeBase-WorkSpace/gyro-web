import { cache } from "react";

import { AnonymousSession, Session } from "@/lib/auth/types";
import { getAccessToken, getRefreshToken } from "@/lib/auth/cookies";
import { getSessionProfile } from "@/lib/auth/session-profile";
import { resolveSession } from "@/lib/auth/session-core";
import { debugError, debugLog } from "../debug/logger";

export const getSession = cache(async function getSession(): Promise<Session | AnonymousSession> {
  debugLog("session", "resolve:start");

  return resolveSession({
    getAccessToken,
    getRefreshToken,
    getMe: getSessionProfile,
    onDebug: (event, metadata) => {
      debugLog("session", event, metadata);
    },
    onError: (context, error) => {
      debugError("session", `${context}:failed`, error);
    },
  });
});
