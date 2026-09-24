import {apiDelete, apiGet, apiPost, apiPut} from "./client";

export type NotificationCategory = "MANDATORY_TRANSACTIONAL" | "OPTIONAL_BILLING" | "OPTIONAL_FOOD_LOGGING" | "OPTIONAL_WEIGHT_LOGGING" | "OPTIONAL_ANNOUNCEMENTS";

export type NotificationPreferences = {
  timezone: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  categories: Array<{ category: NotificationCategory; enabled: boolean; mutable: boolean }>;
  eligibility: { emailEligible: boolean; smsEligible: boolean };
};

export type UpdateNotificationPreferencesInput = {
  quietHoursStart: string;
  quietHoursEnd: string;
  categories: Array<{ category: NotificationCategory; enabled: boolean }>;
};

export type FoodReminderScheduleType = "MEAL_REMINDER" | "INCOMPLETE_DAY_REMINDER" | "WEIGHT_REMINDER";
export type FoodReminderMealType = "BREAKFAST" | "LUNCH" | "DINNER";
export type FoodReminderSchedule = {
  type: FoodReminderScheduleType;
  mealType: FoodReminderMealType | null;
  localTime: string;
  daysOfWeek: number[];
  enabled: boolean;
  state: "ACTIVE" | "PAUSED" | "CHANNEL_UNAVAILABLE" | "INVALID_TIMEZONE";
};

export function getNotificationPreferences(accessToken: string) {
  return apiGet<NotificationPreferences>("/notifications/preferences", accessToken);
}

export function updateNotificationPreferences(accessToken: string, input: UpdateNotificationPreferencesInput) {
  return apiPut<NotificationPreferences>("/notifications/preferences", input, {accessToken});
}

export function getFoodReminderSchedules(accessToken: string) {
  return apiGet<FoodReminderSchedule[]>("/notifications/schedules", accessToken);
}

export function updateFoodReminderSchedule(accessToken: string, type: FoodReminderScheduleType, input: Omit<FoodReminderSchedule, "type" | "state">) {
  return apiPut<FoodReminderSchedule>(`/notifications/schedules/${type}`, input, {accessToken});
}
export function getWebPushPublicKey(accessToken: string) { return apiGet<{publicKey: string | null}>("/notifications/push-subscriptions/public-key", accessToken); }
export function subscribeToWebPush(accessToken: string, input: {endpoint: string; p256dh: string; auth: string}) { return apiPost<void>("/notifications/push-subscriptions", input, {accessToken}); }
export type WebPushStatus = {enabled: boolean; publicKeyAvailable: boolean; hasActiveSubscription: boolean; activeSubscriptionCount: number};
export function getWebPushStatus(accessToken: string, endpoint?: string) {
  return endpoint
    ? apiPost<WebPushStatus>("/notifications/push-subscriptions/status/current", {endpoint}, {accessToken})
    : apiGet<WebPushStatus>("/notifications/push-subscriptions/status", accessToken);
}
export function unsubscribeFromWebPush(accessToken: string, endpoint: string) {
  return apiPost<void>("/notifications/push-subscriptions/revoke", {endpoint}, {accessToken});
}
export function unsubscribeAllWebPushDevices(accessToken: string) {
  return apiDelete<void>("/notifications/push-subscriptions/all", {accessToken});
}
export function sendWebPushTest(accessToken: string) { return apiPost<{intentId: string; created: boolean}>("/notifications/push-subscriptions/test", undefined, {accessToken}); }

export type TelegramLinkState = "UNAVAILABLE" | "UNLINKED" | "PENDING" | "LINKED" | "BLOCKED" | "RELINK_REQUIRED";
export type TelegramStatus = {
  enabled: boolean;
  state: TelegramLinkState;
  linkedAt: string | null;
  pendingUntil: string | null;
};
export function getTelegramStatus(accessToken: string) {
  return apiGet<TelegramStatus>("/notifications/telegram/status", accessToken);
}
export function createTelegramLink(accessToken: string) {
  return apiPost<{url: string}>("/notifications/telegram/link", undefined, {accessToken});
}
export function confirmTelegramLink(accessToken: string, code: string) {
  return apiPost<{state: "LINKED"}>("/notifications/telegram/link/confirm", {code}, {accessToken});
}
export function unlinkTelegram(accessToken: string) {
  return apiDelete<void>("/notifications/telegram/link", {accessToken});
}
export function sendTelegramTest(accessToken: string) {
  return apiPost<{intentId: string; created: boolean}>("/notifications/telegram/test", undefined, {accessToken});
}
