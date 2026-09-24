import {AuthResponse, MeResponse, VerificationStartResponse} from "./types";
import {ApiClientError, apiDelete, apiFetch, apiGet, apiPost, apiPut} from "../api";
import {normalizeContactIdentifier, normalizeEmail, normalizeIranianPhone} from "./contact";
import {debugError, debugLog} from "../debug/logger";
import type {ProfileFormValues} from "../profile/validation";

type LoginInput = {
    identifier: string;
    password: string;
}

type ContactInput = {
    email?: string;
    phoneNumber?: string;
}

type RegisterInput = {
    email?: string;
    phoneNumber?: string;
    idempotencyKey?: string;
}

export class AuthApiError extends ApiClientError {}

export async function loginWithPassword(input: LoginInput): Promise<AuthResponse> {
    return authFlow("login", () =>
        postAuth<AuthResponse>("/auth/login/password", {
            identifier: normalizeContactIdentifier(input.identifier) ?? input.identifier.trim(),
            password: input.password
        })
    );
}

export async function register(input: RegisterInput): Promise<VerificationStartResponse> {
    return postAuth<VerificationStartResponse>(
        "/auth/register",
        {
            email: input.email ? normalizeEmail(input.email) : undefined,
            phoneNumber: input.phoneNumber ? normalizePhoneOrRaw(input.phoneNumber) : undefined
        },
        input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : undefined
    );
}

export async function verifyRegistration(input: ContactInput & { code: string }): Promise<AuthResponse> {
    return postAuth<AuthResponse>("/auth/register/verify", {
        email: input.email ? normalizeEmail(input.email) : undefined,
        phoneNumber: input.phoneNumber ? normalizePhoneOrRaw(input.phoneNumber) : undefined,
        code: input.code
    });
}

export async function resendRegistrationVerification(identifier: string): Promise<VerificationStartResponse> {
  return postAuth<VerificationStartResponse>("/auth/register/resend", {
    identifier: normalizeContactIdentifier(identifier) ?? identifier.trim()
  });
}

export async function startLoginOtp(identifier: string): Promise<VerificationStartResponse> {
    return postAuth<VerificationStartResponse>("/auth/login/otp/start", {
        identifier: normalizeContactIdentifier(identifier) ?? identifier.trim()
    });
}

export async function confirmLoginOtp(input: { identifier: string; code: string }): Promise<AuthResponse> {
    return postAuth<AuthResponse>("/auth/login/otp/confirm", {
        ...input,
        identifier: normalizeContactIdentifier(input.identifier) ?? input.identifier.trim()
    });
}

export async function refreshSession(refreshToken: string): Promise<AuthResponse> {
    return authFlow("refresh", () => postAuth<AuthResponse>("/auth/refresh", { refreshToken }));
}

export async function logout(refreshToken: string): Promise<void> {
    await authFlow("logout", () => postAuth<void>("/auth/logout", { refreshToken }));
}

export async function getMe(accessToken: string): Promise<MeResponse> {
    return authFlow("users-me-validation", () => getAuth<MeResponse>("/users/me", accessToken));
}

export async function markOnboardingWelcomeSeen(accessToken: string): Promise<void> {
    await authFlow("onboarding-welcome-seen", () =>
        withAuthError(() =>
            apiPost<void>("/users/me/onboarding/welcome-seen", undefined, { accessToken })
        )
    );
}

export async function acknowledgeCalculatorRerunPrompt(accessToken: string): Promise<void> {
    await authFlow("calculator-rerun-prompt-acknowledge", () =>
        withAuthError(() =>
            apiPost<void>(
                "/users/me/coach/calculator-rerun-prompt/acknowledge",
                undefined,
                { accessToken },
            )
        )
    );
}

export async function updateMeProfile(accessToken: string, input: ProfileFormValues): Promise<MeResponse> {
    return authFlow("profile-update", () =>
        withAuthError(() =>
            apiFetch<MeResponse>("/users/me/profile", {
                accessToken,
                body: {
                    displayName: input.displayName || null,
                    timezone: input.timezone,
                    locale: input.locale,
                },
                method: "PATCH",
            })
        )
    );
}

export async function startPasswordReset(identifier: string): Promise<VerificationStartResponse> {
    return postAuth<VerificationStartResponse>("/auth/password-reset/start", {
        identifier: normalizeContactIdentifier(identifier) ?? identifier.trim()
    });
}

export async function confirmPasswordReset(input: {
    identifier: string;
    code: string;
    newPassword: string;
}): Promise<void> {
    await postAuth<void>("/auth/password-reset/confirm", {
        ...input,
        identifier: normalizeContactIdentifier(input.identifier) ?? input.identifier.trim()
    });
}

export async function startSecurityStepUp(accessToken: string): Promise<VerificationStartResponse> {
    return authFlow("security-step-up-start", () =>
        withAuthError(() =>
            apiPost<VerificationStartResponse>("/users/me/security/step-up/start", undefined, { accessToken })
        )
    );
}

export async function confirmSecurityStepUp(accessToken: string, code: string): Promise<void> {
    await authFlow("security-step-up-confirm", () =>
        withAuthError(() => apiPost<void>("/users/me/security/step-up/confirm", { code }, { accessToken }))
    );
}

export async function setPassword(accessToken: string, newPassword: string): Promise<void> {
    await authFlow("password-set", () =>
        withAuthError(() => apiPost<void>("/users/me/password", { newPassword }, { accessToken }))
    );
}

export async function changePassword(
    accessToken: string,
    input: { currentPassword?: string; newPassword: string }
): Promise<void> {
    await authFlow("password-change", () =>
        withAuthError(() =>
            apiPut<void>(
                "/users/me/password",
                { currentPassword: input.currentPassword || undefined, newPassword: input.newPassword },
                { accessToken }
            )
        )
    );
}

export async function removePassword(accessToken: string): Promise<void> {
    await authFlow("password-remove", () =>
        withAuthError(() => apiDelete<void>("/users/me/password", { accessToken }))
    );
}

async function postAuth<T>(
    path: string,
    body: unknown,
    headers?: Record<string, string>
): Promise<T> {
    return withAuthError(() => apiPost<T>(path, body, { headers }));
}

async function getAuth<T>(path: string, accessToken: string): Promise<T> {
    return withAuthError(() => apiGet<T>(path, accessToken));
}

async function withAuthError<T>(request: () => Promise<T>): Promise<T> {
    try {
        return await request();
    } catch (error) {
        if (error instanceof ApiClientError) {
            throw new AuthApiError(
              error.message || "ارتباط با سرویس حساب کاربری برقرار نشد. لطفا دوباره تلاش کنید.",
                error.status,
                error.code,
                error.fieldErrors,
                error.requestId
            );
        }

        throw error;
    }
}

async function authFlow<T>(flow: string, request: () => Promise<T>): Promise<T> {
    debugLog("auth", `${flow}:start`);

    try {
        const result = await request();
        debugLog("auth", `${flow}:success`);
        return result;
    } catch (error) {
        debugError("auth", `${flow}:failed`, error, authErrorMetadata(error));
        throw error;
    }
}

function authErrorMetadata(error: unknown) {
    if (error instanceof ApiClientError) {
        return {
            status: error.status,
            backendErrorCode: error.code,
            backendRequestId: error.requestId,
        };
    }

    return undefined;
}

function normalizePhoneOrRaw(phoneNumber: string) {
    return normalizeIranianPhone(phoneNumber) ?? phoneNumber.trim();
}
