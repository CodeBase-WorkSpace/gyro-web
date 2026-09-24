import type {ActionState} from "@/lib/auth/types";

type AuthApiErrorCode =
  | "ACCOUNT_ALREADY_VERIFIED"
  | "TOO_MANY_VERIFICATION_ATTEMPTS"
  | "EXTERNAL_SERVICE_UNAVAILABLE"
  | "VERIFICATION_CODE_EXPIRED"
  | "INVALID_VERIFICATION_CODE"
  | "RATE_LIMIT_EXCEEDED"
  | "VALIDATION_ERROR"
  | "INVALID_CREDENTIALS"
  | "PASSWORD_ALREADY_SET"
  | "RECENT_VERIFICATION_REQUIRED"
  | "NO_REMAINING_LOGIN_IDENTIFIER"
  | "INVALID_REFRESH_TOKEN"
  | "ACCOUNT_DISABLED"
  | "ACCOUNT_NOT_VERIFIED"
  | "EMAIL_ALREADY_REGISTERED"
  | "PHONE_ALREADY_REGISTERED"
  | "RESOURCE_NOT_FOUND"
  | "FORBIDDEN_RESOURCE"
  | "DIARY_ENTRY_LOCKED"
  | "SUBSCRIPTION_REQUIRED"
  | "SUBSCRIPTION_EXPIRED"
  | "DUPLICATE_REQUEST"
  | "IDEMPOTENCY_KEY_CONFLICT"
  | "INVALID_IDEMPOTENCY_KEY"
  | "INTERNAL_ERROR";

const authErrorMessages: Record<AuthApiErrorCode, string> = {
  ACCOUNT_ALREADY_VERIFIED: "این حساب قبلا تایید شده است.",
  TOO_MANY_VERIFICATION_ATTEMPTS: "تعداد تلاش‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",
  EXTERNAL_SERVICE_UNAVAILABLE: "ارسال کد تایید فعلا ممکن نیست. کمی بعد دوباره تلاش کنید.",
  VERIFICATION_CODE_EXPIRED: "کد تایید منقضی شده است.",
  INVALID_VERIFICATION_CODE: "کد تایید معتبر نیست.",
  RATE_LIMIT_EXCEEDED: "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",
  VALIDATION_ERROR: "اطلاعات فرم را بررسی کنید.",
  INVALID_CREDENTIALS: "ایمیل، شماره موبایل یا رمز عبور درست نیست.",
  PASSWORD_ALREADY_SET: "برای این حساب رمز عبور تنظیم شده است. آن را تغییر دهید.",
  RECENT_VERIFICATION_REQUIRED: "ابتدا هویت خود را با کد یک‌بارمصرف تایید کنید.",
  NO_REMAINING_LOGIN_IDENTIFIER: "حذف رمز عبور ممکن نیست؛ حساب باید حداقل یک راه ورود تاییدشده داشته باشد.",
  INVALID_REFRESH_TOKEN: "نشست شما منقضی شده است. دوباره وارد شوید.",
  ACCOUNT_DISABLED: "این حساب غیرفعال شده است.",
  ACCOUNT_NOT_VERIFIED: "برای ادامه باید حساب را تایید کنید.",
  EMAIL_ALREADY_REGISTERED: "این ایمیل قبلا ثبت شده است.",
  PHONE_ALREADY_REGISTERED: "این شماره موبایل قبلا ثبت شده است.",
  RESOURCE_NOT_FOUND: "مورد درخواستی پیدا نشد.",
  FORBIDDEN_RESOURCE: "به این بخش دسترسی ندارید.",
  DIARY_ENTRY_LOCKED: "این ثبت روزانه دیگر قابل تغییر نیست.",
  SUBSCRIPTION_REQUIRED: "برای این عملیات اشتراک فعال لازم است.",
  SUBSCRIPTION_EXPIRED: "اشتراک شما منقضی شده است.",
  DUPLICATE_REQUEST: "این درخواست قبلا پردازش شده است.",
  IDEMPOTENCY_KEY_CONFLICT: "این درخواست با شناسه تکراری متفاوتی ارسال شده است.",
  INVALID_IDEMPOTENCY_KEY: "شناسه یکتای درخواست معتبر نیست.",
  INTERNAL_ERROR: "خطای داخلی رخ داد. کمی بعد دوباره تلاش کنید."
};

const fieldNameMap: Record<string, string> = {
  email: "identifier",
  phoneNumber: "identifier",
  contactProvided: "identifier",
  identifier: "identifier",
  password: "password",
  newPassword: "password",
  confirmPassword: "confirmPassword",
  code: "code"
};

const fieldErrorMessages: Record<string, string> = {
  email: "ایمیل را درست وارد کنید.",
  phoneNumber: "شماره موبایل را درست وارد کنید.",
  contactProvided: "ایمیل یا شماره موبایل را وارد کنید.",
  identifier: "ایمیل یا شماره موبایل را وارد کنید.",
  password: "رمز عبور باید حداقل ۹ نویسه و شامل حرف بزرگ، حرف کوچک و عدد باشد.",
  newPassword: "رمز عبور باید حداقل ۹ نویسه و شامل حرف بزرگ، حرف کوچک و عدد باشد.",
  confirmPassword: "تکرار رمز عبور را بررسی کنید.",
  code: "کد تایید باید دقیقا ۶ رقم باشد."
};

export function authCodeMessage(code?: string, fallback?: string) {
  if (code && code in authErrorMessages) {
    return authErrorMessages[code as AuthApiErrorCode];
  }

  return localizedFallbackMessage(fallback);
}

function localizedFallbackMessage(fallback?: string) {
  if (!fallback) return "درخواست انجام نشد. کمی بعد دوباره تلاش کنید.";

  if (fallback === "An error occurred while communicating with the API.") {
    return "ارتباط با سرور برقرار نشد. لطفا دوباره تلاش کنید.";
  }

  if (fallback === "Request timed out while communicating with the API.") {
    return "ارتباط با سرور بیش از حد طول کشید. لطفا دوباره تلاش کنید.";
  }

  if (fallback === "An error occurred while communicating with the authentication service.") {
    return "ارتباط با سرویس حساب کاربری برقرار نشد. لطفا دوباره تلاش کنید.";
  }

  return fallback;
}

export function mapApiFieldErrors(fieldErrors?: Record<string, string>): ActionState["fieldErrors"] {
  if (!fieldErrors) return undefined;

  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, message]) => {
      const mappedField = fieldNameMap[field] || field;
      return [mappedField, fieldErrorMessages[field] || message];
    })
  );
}
