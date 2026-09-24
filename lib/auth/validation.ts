import { z } from "zod/v4";

import { contactMessages, normalizeContactIdentifier } from "./contact";
import { toPersianDigits } from "../format";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{9,}$/;

export const authFieldMessages = {
  identifierRequired: contactMessages.identifierRequired,
  identifierInvalid: contactMessages.identifierInvalid,
  passwordRequired: "رمز عبور را وارد کنید.",
  passwordInvalid: `رمز عبور باید حداقل ${toPersianDigits(9)} نویسه و شامل حرف بزرگ، حرف کوچک و عدد باشد.`,
  confirmPasswordRequired: "تکرار رمز عبور را وارد کنید.",
  confirmPasswordMismatch: "تکرار رمز عبور با رمز عبور یکی نیست.",
  currentPasswordRequired: "رمز عبور فعلی را وارد کنید.",
  otpRequired: "کد یک‌بارمصرف را وارد کنید.",
  otpInvalid: `کد باید دقیقا ${toPersianDigits(6)} رقم باشد.`
};

export function isEmailOrPhone(value: string) {
  return normalizeContactIdentifier(value) !== null;
}

export const identifierSchema = z
  .string()
  .trim()
  .min(1, authFieldMessages.identifierRequired)
  .transform((value, context) => {
    const normalized = normalizeContactIdentifier(value);
    if (normalized) return normalized;

    context.addIssue({
      code: "custom",
      message: authFieldMessages.identifierInvalid
    });
    return z.NEVER;
  });

export const passwordSchema = z
  .string()
  .min(1, authFieldMessages.passwordRequired)
  .regex(passwordPattern, authFieldMessages.passwordInvalid);

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, authFieldMessages.passwordRequired)
});

export const otpStartSchema = z.object({
  identifier: identifierSchema
});

export const otpConfirmSchema = z.object({
  identifier: identifierSchema,
  code: z
    .string()
    .trim()
    .min(1, authFieldMessages.otpRequired)
    .regex(/^\d{6}$/, authFieldMessages.otpInvalid)
});

// Sign-up is OTP-only: a single identifier (email or phone) with no password.
export const registerSchema = z.object({
  identifier: identifierSchema
});

export const signupVerifySchema = otpConfirmSchema;

export const passwordResetStartSchema = z.object({
  identifier: identifierSchema
});

export const passwordResetConfirmSchema = z.object({
  identifier: identifierSchema,
  code: z
    .string()
    .trim()
    .min(1, authFieldMessages.otpRequired)
    .regex(/^\d{6}$/, authFieldMessages.otpInvalid),
  newPassword: passwordSchema
});

export const otpSchema = z.object({
  identifier: identifierSchema,
  otpCode: z
    .string()
    .trim()
    .min(1, authFieldMessages.otpRequired)
    .regex(/^\d{6}$/, authFieldMessages.otpInvalid)
});

const otpCodeSchema = z
  .string()
  .trim()
  .min(1, authFieldMessages.otpRequired)
  .regex(/^\d{6}$/, authFieldMessages.otpInvalid);

// Account Settings → امنیت حساب
export const setPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, authFieldMessages.confirmPasswordRequired)
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: authFieldMessages.confirmPasswordMismatch
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, authFieldMessages.currentPasswordRequired),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, authFieldMessages.confirmPasswordRequired)
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: authFieldMessages.confirmPasswordMismatch
  });

export const stepUpConfirmSchema = z.object({
  code: otpCodeSchema
});

export type SetPasswordValues = z.infer<typeof setPasswordSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type StepUpConfirmValues = z.infer<typeof stepUpConfirmSchema>;

export type LoginFormValues = z.infer<typeof loginSchema>;
export type OtpStartValues = z.infer<typeof otpStartSchema>;
export type OtpConfirmValues = z.infer<typeof otpConfirmSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type SignupVerifyValues = z.infer<typeof signupVerifySchema>;
export type PasswordResetStartValues = z.infer<typeof passwordResetStartSchema>;
export type PasswordResetConfirmValues = z.infer<typeof passwordResetConfirmSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}
