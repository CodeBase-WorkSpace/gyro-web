"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";

import {confirmTelegramLink, createTelegramLink, getTelegramStatus, getWebPushPublicKey, getWebPushStatus, sendTelegramTest, sendWebPushTest, subscribeToWebPush, unlinkTelegram, unsubscribeFromWebPush, updateFoodReminderSchedule, updateNotificationPreferences} from "@/lib/api/notifications";
import {ApiClientError} from "@/lib/api/errors";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {resolveReminderTime} from "@/lib/notifications/reminder-time";

export type NotificationPreferencesActionState = {
  message?: string;
  fieldErrors?: Record<string, string>;
  savedSettings?: {
    quietHoursStart: string;
    quietHoursEnd: string;
    optionalBillingEnabled: boolean;
    optionalAnnouncementsEnabled: boolean;
    foodReminderEnabled: boolean;
    foodReminderTime: string;
    weightReminderEnabled: boolean;
    weightReminderTime: string;
  };
};

export async function saveNotificationPreferencesAction(
  previous: NotificationPreferencesActionState,
  formData: FormData,
): Promise<NotificationPreferencesActionState> {
  const quietHoursStart = String(formData.get("quietHoursStart") ?? "");
  const quietHoursEnd = String(formData.get("quietHoursEnd") ?? "");
  const optionalBillingEnabled = formData.get("optionalBilling") === "on";
  const optionalAnnouncementsEnabled = formData.get("optionalAnnouncements") === "on";
  const foodReminderEnabled = formData.get("foodReminder") === "on";
  const foodReminderTime = resolveReminderTime(String(formData.get("foodReminderTime") ?? ""), foodReminderEnabled, "20:00");
  const weightReminderEnabled = formData.get("weightReminder") === "on";
  const weightReminderTime = resolveReminderTime(String(formData.get("weightReminderTime") ?? ""), weightReminderEnabled);

  if (!isTime(quietHoursStart) || !isTime(quietHoursEnd) || quietHoursStart === quietHoursEnd) {
    return {...previous, message: "بازه ساعات آرام را بررسی کنید.", fieldErrors: {quietHoursStart: "زمان شروع و پایان باید متفاوت باشند."}};
  }
  if (foodReminderTime === null || weightReminderTime === null) {
    return {
      ...previous,
      message: "زمان یادآوری را بررسی کنید.",
      fieldErrors: {
        ...(foodReminderTime === null ? {foodReminderTime: "زمان یادآوری غذا را وارد کنید."} : {}),
        ...(weightReminderTime === null ? {weightReminderTime: "زمان یادآوری وزن را وارد کنید."} : {}),
      },
    };
  }

  try {
    await authenticatedServerRequest(
      (accessToken) => Promise.all([
        updateNotificationPreferences(accessToken, {
          quietHoursStart,
          quietHoursEnd,
          categories: [
            {category: "OPTIONAL_BILLING", enabled: optionalBillingEnabled},
            {category: "OPTIONAL_ANNOUNCEMENTS", enabled: optionalAnnouncementsEnabled},
          ],
        }),
        updateFoodReminderSchedule(accessToken, "MEAL_REMINDER", {
          mealType: "DINNER", localTime: foodReminderTime, daysOfWeek: [1, 2, 3, 4, 5, 6, 7], enabled: foodReminderEnabled,
        }),
        updateFoodReminderSchedule(accessToken, "WEIGHT_REMINDER", {
          mealType: null, localTime: weightReminderTime, daysOfWeek: [1, 2, 3, 4, 5, 6, 7], enabled: weightReminderEnabled,
        }),
      ]),
      {nextPath: "/profile/notifications", retryPolicy: "never"},
    );
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiClientError) {
      return {...previous, message: error.message || "تنظیمات اعلان ذخیره نشد.", fieldErrors: error.fieldErrors};
    }
    return {...previous, message: "تنظیمات اعلان ذخیره نشد. کمی بعد دوباره تلاش کنید."};
  }

  revalidatePath("/profile/notifications");
  revalidatePath("/profile");
  return {
    message: "تنظیمات اعلان ذخیره شد.",
    savedSettings: {
      quietHoursStart,
      quietHoursEnd,
      optionalBillingEnabled,
      optionalAnnouncementsEnabled,
      foodReminderEnabled,
      foodReminderTime,
      weightReminderEnabled,
      weightReminderTime,
    },
  };
}
export async function webPushPublicKeyAction(): Promise<{publicKey?: string; error?: string}> {
  try { return await authenticatedServerRequest(async (accessToken) => {
    const {publicKey} = await getWebPushPublicKey(accessToken); return publicKey ? {publicKey} : {error: "Push در این محیط فعال نشده است."};
  }, {nextPath: "/profile/notifications", retryPolicy: "never"}); } catch (error) { unstable_rethrow(error); return {error: "فعال‌سازی اعلان مرورگر انجام نشد."}; }
}
export async function enablePushAction(subscription: {endpoint: string; p256dh: string; auth: string}): Promise<{error?: string}> {
  try {
    await authenticatedServerRequest((accessToken) => subscribeToWebPush(accessToken, subscription), {nextPath: "/profile/notifications", retryPolicy: "never"});
    return {};
  } catch (error) {
    unstable_rethrow(error);
    return {error: error instanceof ApiClientError ? error.message : "فعال‌سازی اعلان مرورگر انجام نشد."};
  }
}

export async function webPushStatusAction(endpoint?: string): Promise<{status?: Awaited<ReturnType<typeof getWebPushStatus>>; error?: string}> {
  try {
    return {status: await authenticatedServerRequest((accessToken) => getWebPushStatus(accessToken, endpoint), {nextPath: "/profile/notifications", retryPolicy: "never"})};
  } catch (error) {
    unstable_rethrow(error);
    return {error: error instanceof ApiClientError ? error.message : "وضعیت اعلان مرورگر دریافت نشد."};
  }
}

export async function disablePushAction(endpoint: string): Promise<{error?: string}> {
  try {
    await authenticatedServerRequest((accessToken) => unsubscribeFromWebPush(accessToken, endpoint), {nextPath: "/profile/notifications", retryPolicy: "never"});
    revalidatePath("/profile/notifications");
    return {};
  } catch (error) {
    unstable_rethrow(error);
    return {error: error instanceof ApiClientError ? error.message : "غیرفعال‌سازی اعلان مرورگر انجام نشد."};
  }
}

export async function sendWebPushTestAction(): Promise<{intentId?: string; created?: boolean; error?: string}> {
  try {
    const result = await authenticatedServerRequest((accessToken) => sendWebPushTest(accessToken), {nextPath: "/profile/notifications", retryPolicy: "never"});
    return result;
  } catch (error) {
    unstable_rethrow(error);
    return {error: error instanceof ApiClientError ? error.message : "ارسال اعلان آزمایشی انجام نشد."};
  }
}

export async function telegramStatusAction(): Promise<{status?: Awaited<ReturnType<typeof getTelegramStatus>>; error?: string}> {
  try {
    const status = await authenticatedServerRequest((accessToken) => getTelegramStatus(accessToken), {nextPath: "/profile/notifications", retryPolicy: "never"});
    return {status};
  } catch (error) {
    unstable_rethrow(error);
    return {error: error instanceof ApiClientError ? error.message : "وضعیت اتصال تلگرام دریافت نشد."};
  }
}

export async function createTelegramLinkAction(): Promise<{url?: string; error?: string}> {
  try {
    const result = await authenticatedServerRequest((accessToken) => createTelegramLink(accessToken), {nextPath: "/profile/notifications", retryPolicy: "never"});
    revalidatePath("/profile/notifications");
    return result;
  } catch (error) {
    unstable_rethrow(error);
    return {error: error instanceof ApiClientError ? error.message : "ساخت پیوند تلگرام انجام نشد."};
  }
}

export async function confirmTelegramLinkAction(code: string): Promise<{state?: "LINKED"; error?: string}> {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-HJ-NP-Z2-9]{4}-?[A-HJ-NP-Z2-9]{4}$/.test(normalized)) {
    return {error: "کد اتصال باید ۸ نویسه باشد؛ مانند ABCD-EFGH."};
  }
  try {
    const result = await authenticatedServerRequest(
      (accessToken) => confirmTelegramLink(accessToken, normalized),
      {nextPath: "/profile/notifications", retryPolicy: "never"},
    );
    revalidatePath("/profile/notifications");
    return result;
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiClientError && error.status === 409) {
      return {error: "این حساب تلگرام قبلاً به حساب جیروی دیگری متصل شده است."};
    }
    if (error instanceof ApiClientError && error.status === 400) {
      return {error: "کد اشتباه است یا اعتبارش تمام شده. در تلگرام دوباره Start را بزنید."};
    }
    return {error: "تأیید کد تلگرام انجام نشد. کمی بعد دوباره تلاش کنید."};
  }
}

export async function unlinkTelegramAction(): Promise<{error?: string}> {
  try {
    await authenticatedServerRequest((accessToken) => unlinkTelegram(accessToken), {nextPath: "/profile/notifications", retryPolicy: "never"});
    revalidatePath("/profile/notifications");
    return {};
  } catch (error) {
    unstable_rethrow(error);
    return {error: error instanceof ApiClientError ? error.message : "قطع اتصال تلگرام انجام نشد."};
  }
}

export async function sendTelegramTestAction(): Promise<{intentId?: string; created?: boolean; error?: string}> {
  try {
    return await authenticatedServerRequest((accessToken) => sendTelegramTest(accessToken), {nextPath: "/profile/notifications", retryPolicy: "never"});
  } catch (error) {
    unstable_rethrow(error);
    return {error: error instanceof ApiClientError ? error.message : "ارسال پیام آزمایشی تلگرام انجام نشد."};
  }
}

function isTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
