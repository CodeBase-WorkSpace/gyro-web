"use server";
import {revalidatePath} from "next/cache";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {ensureAdminTelegramWebhook, sendAdminAnnouncement, sendAdminUserNotificationTest, type AdminAnnouncementInput, type AdminUserNotificationTestInput} from "@/lib/api/admin-notifications";
import {ApiClientError} from "@/lib/api/errors";

export async function sendAdminAnnouncementAction(input: AdminAnnouncementInput) {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || title.length > 80) return {ok: false as const, message: "عنوان اعلان باید بین ۱ و ۸۰ نویسه باشد."};
  if (!body || body.length > 500) return {ok: false as const, message: "متن اعلان باید بین ۱ و ۵۰۰ نویسه باشد."};
  if (!input.targets.webPush && !input.targets.telegramChannel) return {ok: false as const, message: "حداقل یک مقصد ارسال را انتخاب کن."};
  if (input.recipientUserId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.recipientUserId)) return {ok: false as const, message: "یک کاربر معتبر انتخاب کن."};
  if (input.recipientUserId && input.targets.telegramChannel) return {ok: false as const, message: "ارسال تلگرام کانال فقط برای اعلان همگانی در دسترس است."};
  try {
    const result = await authenticatedServerRequest(
      token => sendAdminAnnouncement(token, {announcementId: input.announcementId, title, body, targets: input.targets, recipientUserId: input.recipientUserId}),
      {nextPath: "/admin/notifications", retryPolicy: "never"},
    );
    revalidatePath("/admin/notifications");
    return {ok: true as const, result};
  } catch (error) {
    if (error instanceof ApiClientError && error.code === "ANNOUNCEMENT_CONTENT_CONFLICT") {
      return {ok: false as const, message: "این شناسه اعلان قبلاً با محتوای دیگری ارسال شده است. صفحه را تازه‌سازی کن تا شناسه جدیدی ساخته شود."};
    }
    const message = error instanceof ApiClientError && error.message ? error.message : "ارسال اعلان انجام نشد. دوباره تلاش کن.";
    return {ok: false as const, message};
  }
}

export async function sendAdminUserNotificationTestAction(input: AdminUserNotificationTestInput) {
  if (!/^[0-9a-f-]{36}$/i.test(input.userId)) return {ok: false as const, message: "یک کاربر معتبر انتخاب کنید."};
  if (!input.webPush && !input.telegram) return {ok: false as const, message: "حداقل یک مسیر را انتخاب کنید."};
  try {
    const result = await authenticatedServerRequest(
      token => sendAdminUserNotificationTest(token, input),
      {nextPath: "/admin/notifications", retryPolicy: "never"},
    );
    revalidatePath("/admin/notifications");
    return {ok: true as const, result};
  } catch (error) {
    return {ok: false as const, message: error instanceof ApiClientError && error.message ? error.message : "اعلان آزمایشی ساخته نشد."};
  }
}

export async function ensureAdminTelegramWebhookAction() {
  try {
    const result = await authenticatedServerRequest(
      token => ensureAdminTelegramWebhook(token),
      {nextPath: "/admin/notifications", retryPolicy: "never"},
    );
    revalidatePath("/admin/notifications");
    return {ok: true as const, result};
  } catch {
    return {ok: false as const, message: "ثبت webhook تلگرام انجام نشد. دسترسی پروکسی و تنظیمات سرور را بررسی کنید."};
  }
}
