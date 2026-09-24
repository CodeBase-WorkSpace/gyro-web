"use client";

import {enablePushAction, webPushPublicKeyAction, webPushStatusAction} from "@/app/(app)/profile/notifications/actions";
import {WEB_PUSH_ACTION_TIMEOUT_MS, withTimeout} from "@/lib/pwa/promise-timeout";
import {applicationServerKeysMatch, registerPushSubscriptionWithRecovery} from "@/lib/push-subscription";
import {resolveBrowserNotificationPermission} from "@/lib/notifications/browser-permission";

export {WEB_PUSH_ACTION_TIMEOUT_MS, withTimeout} from "@/lib/pwa/promise-timeout";

export function browserCanRequestWebPush() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function browserNotificationPermission() {
  return resolveBrowserNotificationPermission(
    browserCanRequestWebPush(),
    "Notification" in window ? Notification.permission : undefined,
  );
}

export async function enableWebPushForCurrentBrowser() {
  if (!browserCanRequestWebPush()) throw new Error("این مرورگر از اعلان Push پشتیبانی نمی‌کند.");
  const key = await withTimeout(webPushPublicKeyAction(), WEB_PUSH_ACTION_TIMEOUT_MS);
  if (!key.publicKey) throw new Error(key.error ?? "Push در این محیط فعال نشده است.");
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(permission === "denied"
      ? "اجازه اعلان رد شد. برای فعال‌کردن دوباره، تنظیمات این سایت را در مرورگر باز کن."
      : "اجازه اعلان داده نشد. هر وقت خواستی از تنظیمات اعلان‌ها دوباره امتحان کن.");
  }

  await withTimeout(
    navigator.serviceWorker.register("/sw.js", {updateViaCache: "none"}),
    WEB_PUSH_ACTION_TIMEOUT_MS,
  );
  const registration = await withTimeout(navigator.serviceWorker.ready, WEB_PUSH_ACTION_TIMEOUT_MS);
  const applicationServerKey = base64Url(key.publicKey);
  let subscription = await withTimeout(
    registration.pushManager.getSubscription(),
    WEB_PUSH_ACTION_TIMEOUT_MS,
  );
  if (subscription) {
    const status = await withTimeout(webPushStatusAction(subscription.endpoint), WEB_PUSH_ACTION_TIMEOUT_MS);
    const usesCurrentKey = applicationServerKeysMatch(subscription.options.applicationServerKey, applicationServerKey);
    if ((status.status && !status.status.hasActiveSubscription) || !usesCurrentKey) {
      await withTimeout(subscription.unsubscribe(), WEB_PUSH_ACTION_TIMEOUT_MS);
      subscription = await withTimeout(
        registration.pushManager.getSubscription(),
        WEB_PUSH_ACTION_TIMEOUT_MS,
      );
      if (subscription) throw new Error("اشتراک قدیمی مرورگر حذف نشد. اعلان‌های سایت را در تنظیمات مرورگر پاک کن و دوباره تلاش کن.");
    }
  }
  if (!subscription) {
    subscription = await withTimeout(
      registration.pushManager.subscribe({userVisibleOnly: true, applicationServerKey}),
      WEB_PUSH_ACTION_TIMEOUT_MS,
    );
  }
  const json = subscription.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!endpoint || !p256dh || !auth) throw new Error("اطلاعات اشتراک مرورگر کامل نیست.");
  await registerPushSubscriptionWithRecovery(
    () => withTimeout(enablePushAction({endpoint, p256dh, auth}), WEB_PUSH_ACTION_TIMEOUT_MS),
    async () => {
      const status = await withTimeout(webPushStatusAction(endpoint), WEB_PUSH_ACTION_TIMEOUT_MS);
      return status.status?.hasActiveSubscription === true;
    },
    "فعال‌سازی اعلان مرورگر انجام نشد.",
  );
}

export function base64Url(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, character => character.charCodeAt(0));
}
