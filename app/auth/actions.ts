"use server";

import {ActionState} from "@/lib/auth/types";
import {
  AuthApiError,
  confirmLoginOtp,
  confirmPasswordReset,
  loginWithPassword,
  register,
  resendRegistrationVerification,
  startLoginOtp,
  startPasswordReset,
  verifyRegistration
} from "@/lib/auth/api";
import {setAuthCookies} from "@/lib/auth/cookies";
import {redirect} from "next/navigation";
import {authCodeMessage, mapApiFieldErrors} from "@/lib/auth/errors";
import {completeRegistrationVerification} from "@/lib/auth/registration";
import {safeRedirectPath} from "@/lib/auth/redirects";
import {
  loginSchema,
  otpConfirmSchema,
  otpStartSchema,
  passwordResetConfirmSchema,
  passwordResetStartSchema,
  registerSchema,
  signupVerifySchema,
  zodFieldErrors
} from "@/lib/auth/validation";

export async function loginAction(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const formValues = formValuesFrom(formData, ["identifier", "password", "next"]);
    const nextPath = safeRedirectPath(formData.get("next"));
    const parsed = loginSchema.safeParse({
        identifier: formData.get("identifier"),
        password: formData.get("password")
    });

    if (!parsed.success) {
        return {
            message: "اطلاعات ورود را بررسی کنید.",
            fieldErrors: zodFieldErrors(parsed.error),
            formValues
        };
    }

    let authenticated = false;

    try {
        const auth = await loginWithPassword(parsed.data);
        await setAuthCookies(auth);
        authenticated = true;
    } catch (error) {
        return toActionError(error, formValues);
    }

    if (authenticated) {
        redirect(nextPath);
    }

    return {};
}

export async function startLoginOtpAction(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const formValues = formValuesFrom(formData, ["identifier"]);
    const parsed = otpStartSchema.safeParse({
        identifier: formData.get("identifier")
    });

    if (!parsed.success) {
        return {
            message: "اطلاعات ورود با کد را بررسی کنید.",
            fieldErrors: zodFieldErrors(parsed.error),
            formValues
        };
    }

    try {
        await startLoginOtp(parsed.data.identifier);
    } catch (error) {
        return toActionError(error, formValues);
    }

    redirect(`/auth/login/otp/verify?identifier=${encodeURIComponent(parsed.data.identifier)}`);
}

export async function confirmLoginOtpAction(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const formValues = formValuesFrom(formData, ["identifier", "code"]);
    const parsed = otpConfirmSchema.safeParse({
        identifier: formData.get("identifier"),
        code: formData.get("code")
    });

    if (!parsed.success) {
        return {
            message: "کد ورود را بررسی کنید.",
            fieldErrors: zodFieldErrors(parsed.error),
            formValues
        };
    }

    let authenticated = false;

    try {
        const auth = await confirmLoginOtp(parsed.data);
        await setAuthCookies(auth);
        authenticated = true;
    } catch (error) {
        return toActionError(error, formValues);
    }

    if (authenticated) {
        redirect("/dashboard");
    }

    return {};
}

export async function resendLoginOtpAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const formValues = formValuesFrom(formData, ["identifier", "code"]);
  const parsed = otpStartSchema.safeParse({
    identifier: formData.get("identifier")
  });

  if (!parsed.success) {
    return {
      message: "برای ارسال دوباره، ایمیل یا شماره موبایل را بررسی کنید.",
      fieldErrors: zodFieldErrors(parsed.error),
      formValues
    };
  }

  try {
    const result = await startLoginOtp(parsed.data.identifier);

    return {
      successMessage: "کد ورود دوباره ارسال شد.",
      otpExpireInSeconds: result.otpExpireInSeconds,
      formValues: {
        ...formValues,
        identifier: parsed.data.identifier,
        code: ""
      }
    };
  } catch (error) {
    return toActionError(error, formValues);
  }
}

export async function registerAction(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const formValues = formValuesFrom(formData, ["identifier"]);
    const parsed = registerSchema.safeParse({
        identifier: formData.get("identifier")
    });

    if (!parsed.success) {
        return {
            message: "اطلاعات ثبت‌نام را بررسی کنید.",
            fieldErrors: zodFieldErrors(parsed.error),
            formValues
        };
    }

    const {identifier} = parsed.data;
    const isEmail = identifier.includes("@");
    const idempotencyKey = crypto.randomUUID();

    try {
        // OTP-only sign-up: no password is collected. The account is created only after the
        // verification code is confirmed in the next step.
        await register({
            email: isEmail ? identifier : undefined,
            phoneNumber: isEmail ? undefined : identifier,
            idempotencyKey
        });
    } catch (error) {
        return toActionError(error, formValues);
    }

    redirect(`/auth/signup/verify?identifier=${encodeURIComponent(identifier)}`);
}

export async function verifyRegistrationAction(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const formValues = formValuesFrom(formData, ["identifier", "code"]);
    const parsed = signupVerifySchema.safeParse({
        identifier: formData.get("identifier"),
        code: formData.get("code")
    });

    if (!parsed.success) {
        return {
            message: "کد تایید ثبت‌نام را بررسی کنید.",
            fieldErrors: zodFieldErrors(parsed.error),
            formValues
        };
    }

    const contact = contactFromIdentifier(parsed.data.identifier);
    let onboardingPath: string;

    try {
        onboardingPath = await completeRegistrationVerification(
            {...contact, code: parsed.data.code},
            {verify: verifyRegistration, persistSession: setAuthCookies}
        );
    } catch (error) {
        return toActionError(error, formValues);
    }

    redirect(onboardingPath);
}

export async function resendRegistrationVerificationAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const formValues = formValuesFrom(formData, ["identifier", "code"]);
  const parsed = otpStartSchema.safeParse({
    identifier: formData.get("identifier")
  });

  if (!parsed.success) {
    return {
      message: "برای ارسال دوباره، ایمیل یا شماره موبایل را بررسی کنید.",
      fieldErrors: zodFieldErrors(parsed.error),
      formValues
    };
  }

  try {
    const result = await resendRegistrationVerification(parsed.data.identifier);

    return {
      successMessage: "کد تایید دوباره ارسال شد.",
      otpExpireInSeconds: result.otpExpireInSeconds,
      formValues: {
        ...formValues,
        identifier: parsed.data.identifier,
        code: ""
      }
    };
  } catch (error) {
    return toActionError(error, formValues);
  }
}

export async function startPasswordResetAction(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const formValues = formValuesFrom(formData, ["identifier"]);
    const parsed = passwordResetStartSchema.safeParse({
        identifier: formData.get("identifier")
    });

    if (!parsed.success) {
        return {
            message: "اطلاعات بازیابی رمز عبور را بررسی کنید.",
            fieldErrors: zodFieldErrors(parsed.error),
            formValues
        };
    }

    try {
        await startPasswordReset(parsed.data.identifier);

        return {
            successMessage: "اگر حسابی با این مشخصات وجود داشته باشد، راهنمای بازیابی ارسال می‌شود.",
            formValues
        };
    } catch (error) {
        return toActionError(error, formValues);
    }
}

export async function confirmPasswordResetAction(
    _prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const formValues = formValuesFrom(formData, ["identifier", "code", "newPassword"]);
    const parsed = passwordResetConfirmSchema.safeParse({
        identifier: formData.get("identifier"),
        code: formData.get("code"),
        newPassword: formData.get("newPassword")
    });

    if (!parsed.success) {
        return {
            message: "کد و رمز عبور جدید را بررسی کنید.",
            fieldErrors: zodFieldErrors(parsed.error),
            formValues
        };
    }

    try {
        await confirmPasswordReset(parsed.data);
    } catch (error) {
        return toActionError(error, formValues);
    }

    redirect("/auth/login?reset=complete");
}

export async function resendPasswordResetAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const formValues = formValuesFrom(formData, ["identifier", "code", "newPassword"]);
  const parsed = passwordResetStartSchema.safeParse({
    identifier: formData.get("identifier")
  });

  if (!parsed.success) {
    return {
      message: "برای ارسال دوباره، ایمیل یا شماره موبایل را بررسی کنید.",
      fieldErrors: zodFieldErrors(parsed.error),
      formValues
    };
  }

  try {
    const result = await startPasswordReset(parsed.data.identifier);

    return {
      successMessage: "کد بازیابی دوباره ارسال شد.",
      otpExpireInSeconds: result.otpExpireInSeconds,
      formValues: {
        ...formValues,
        identifier: parsed.data.identifier,
        code: ""
      }
    };
  } catch (error) {
    return toActionError(error, formValues);
  }
}

export async function refreshAction(): Promise<ActionState> {
    const { refreshAuthCookies } = await import("@/lib/auth/refresh");
    const result = await refreshAuthCookies();

    if (result.ok) {
        return {
            successMessage: "نشست با موفقیت تازه شد."
        };
    }

    return {
        message: "نشست شما منقضی شده است. دوباره وارد شوید."
    };
}

function toActionError(error: unknown, formValues?: ActionState["formValues"]): ActionState {
    if (error instanceof AuthApiError) {
        return {
            message: authCodeMessage(error.code, error.message),
            fieldErrors: mapApiFieldErrors(error.fieldErrors),
            requestId: error.requestId,
            formValues
        };
    }

    return {
        message: "درخواست انجام نشد. کمی بعد دوباره تلاش کنید.",
        formValues
    };
}

function formValuesFrom(formData: FormData, fields: string[]): Record<string, string> {
    return Object.fromEntries(
        fields.map((field) => [field, String(formData.get(field) ?? "")])
    );
}

function contactFromIdentifier(identifier: string) {
    return identifier.includes("@")
        ? {email: identifier, phoneNumber: undefined}
        : {email: undefined, phoneNumber: identifier};
}
