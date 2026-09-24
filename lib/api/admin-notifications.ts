import {apiGet, apiPost} from "./client";

export type AdminAnnouncementTargets = {webPush: boolean; telegramChannel: boolean};
export type AdminAnnouncementInput = {announcementId: string; title: string; body: string; targets: AdminAnnouncementTargets; recipientUserId?: string | null};
export type AdminAnnouncementResult = {announcementId: string; recipientsTargeted: number; intentsCreated: number; intentsExisting: number; failures: number; telegramQueued: boolean; telegramAlreadyQueued: boolean};
export type AdminNotificationDelivery = {deliveryId: string; channel: string; status: string; reason: string | null; dueAt: string};
export type AdminNotificationSummary = {intentId: string; type: string; category: string; status: string; reason: string | null; createdAt: string; deliveries: AdminNotificationDelivery[]};
export type AdminNotificationPage = {items: AdminNotificationSummary[]; page: number; size: number; totalItems: number; totalPages: number};
export type NotificationChannelTestResult = {status: "QUEUED" | "ALREADY_QUEUED" | "CHANNEL_DISABLED" | "NO_ACTIVE_ENDPOINT"; intentId: string | null};
export type AdminUserNotificationTestInput = {userId: string; requestId: string; webPush: boolean; telegram: boolean};
export type AdminUserNotificationTestResult = {userId: string; webPush: NotificationChannelTestResult | null; telegram: NotificationChannelTestResult | null};
export type TelegramWebhookRuntime = {enabled: boolean; expectedUrl: string | null; registeredUrl: string | null; matchesExpectedUrl: boolean; pendingUpdateCount: number | null; lastErrorMessage: string | null; providerReachable: boolean};
export type AdminNotificationRuntime = {webPushEnabled: boolean; telegramEnabled: boolean; telegramLinkingEnabled: boolean; proxy: {type: "NONE" | "HTTP" | "SOCKS"; host: string | null; port: number | null; authenticated: boolean}; telegramWebhook: TelegramWebhookRuntime};

export function sendAdminAnnouncement(token: string, input: AdminAnnouncementInput) {
  return apiPost<AdminAnnouncementResult>("/admin/notifications/announcements", input, {accessToken: token});
}

export function getAdminAnnouncementHistory(token: string, page = 0) {
  return apiGet<AdminNotificationPage>(`/admin/notifications?type=ADMIN_ANNOUNCEMENT&page=${page}&size=20`, token);
}

export function getAdminNotificationRuntime(token: string) {
  return apiGet<AdminNotificationRuntime>("/admin/notifications/runtime", token);
}

export function ensureAdminTelegramWebhook(token: string) {
  return apiPost<TelegramWebhookRuntime>("/admin/notifications/telegram/webhook", {}, {accessToken: token});
}

export function sendAdminUserNotificationTest(token: string, input: AdminUserNotificationTestInput) {
  return apiPost<AdminUserNotificationTestResult>("/admin/notifications/user-tests", input, {accessToken: token});
}
