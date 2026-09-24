import type {ApiErrorResponse, ApiFieldError} from "@/lib/api/types";

export type AuthResponse = {
    accessToken: string;
    refreshToken: string;
    tokenType: "Bearer";
    accessExpiresInSeconds: number;
};

export type VerificationStartResponse = {
    message: string;
    otpExpireInSeconds?: number;
};

export type { ApiErrorResponse, ApiFieldError };

export type MeResponse = {
    id: string;
    email?: string | null;
    phoneNumber?: string | null;
    displayName?: string | null;
    timezone: string;
    locale: string;
    role: "USER" | "ADMIN";
    status: string;
    emailVerificationStatus: string;
    phoneVerificationStatus: string;
    hasPassword: boolean;
    onboardingWelcomeSeenAt?: string | null;
    calculatorRerunPromptAcknowledgedAt?: string | null;
    createdAt: string;
    updatedAt: string;
};

export type ActionState = {
    message?: string;
    successMessage?: string;
  otpExpireInSeconds?: number;
    requestId?: string;
    fieldErrors?: Record<string, string>;
    formValues?: Record<string, string>;
};

export type AnonymousSession = {
    isAuthenticated: false,
    reason: AuthGuardState
}

export type Session = {
    isAuthenticated: true
    user: {
        id: string
        email?: string | null
        phoneNumber?: string | null
        role: "USER" | "ADMIN"
        status: string
        displayName?: string | null
        timezone: string
        locale: string
        emailVerificationStatus: string
        phoneVerificationStatus: string
        hasPassword: boolean
        onboardingWelcomeSeenAt?: string | null
        calculatorRerunPromptAcknowledgedAt?: string | null
    }
}

export type AuthGuardState =
    | "authenticated"
    | "anonymous"
    | "expired"
    | "unauthorized";
