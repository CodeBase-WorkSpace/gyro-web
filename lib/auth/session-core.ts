import type { AnonymousSession, MeResponse, Session } from "@/lib/auth/types";

export type SessionResolverDependencies = {
  getAccessToken: () => Promise<string | undefined>;
  getRefreshToken: () => Promise<string | undefined>;
  getMe: (accessToken: string) => Promise<MeResponse>;
  onDebug?: (event: string, metadata?: Record<string, unknown>) => void;
  onError?: (context: string, error: unknown) => void;
};

export async function resolveSession(
  dependencies: SessionResolverDependencies
): Promise<Session | AnonymousSession> {
  const accessToken = await dependencies.getAccessToken();
  dependencies.onDebug?.("access-token:resolved", {
    present: Boolean(accessToken),
  });

  if (accessToken) {
    try {
      dependencies.onDebug?.("users-me-validation:start");
      const me = await dependencies.getMe(accessToken);
      dependencies.onDebug?.("users-me-validation:success");
      return toAuthenticatedSession(me);
    } catch (error) {
      dependencies.onError?.("getMe", error);
    }
  }

  const refreshToken = await dependencies.getRefreshToken();
  dependencies.onDebug?.("refresh-token:resolved", {
    present: Boolean(refreshToken),
  });
  dependencies.onDebug?.("resolve:anonymous");

  return {
    isAuthenticated: false,
    reason: accessToken || refreshToken ? "expired" : "anonymous"
  };
}

function toAuthenticatedSession(me: MeResponse): Session {
  return {
    isAuthenticated: true,
    user: {
      id: me.id,
      email: me.email,
      phoneNumber: me.phoneNumber,
      role: me.role,
      status: me.status,
      displayName: me.displayName,
      timezone: me.timezone,
      locale: me.locale,
      emailVerificationStatus: me.emailVerificationStatus,
      phoneVerificationStatus: me.phoneVerificationStatus,
      hasPassword: me.hasPassword,
      onboardingWelcomeSeenAt: me.onboardingWelcomeSeenAt,
      ...(me.calculatorRerunPromptAcknowledgedAt !== undefined
        ? {
            calculatorRerunPromptAcknowledgedAt:
              me.calculatorRerunPromptAcknowledgedAt,
          }
        : {}),
    },
  };
}
