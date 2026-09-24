"use client";

import {useEffect, useState} from "react";
import {BellRingIcon, CheckCircle2Icon, LoaderCircleIcon, SendIcon, XCircleIcon} from "lucide-react";

import {disablePushAction, sendWebPushTestAction, webPushPublicKeyAction, webPushStatusAction} from "@/app/(app)/profile/notifications/actions";
import {Button} from "@/components/ui/button";
import {applicationServerKeysMatch} from "@/lib/push-subscription";
import {base64Url, enableWebPushForCurrentBrowser, WEB_PUSH_ACTION_TIMEOUT_MS, withTimeout} from "@/lib/push-browser";

type State = "loading" | "unsupported" | "unavailable" | "permission" | "denied" | "enabled" | "ready" | "stale" | "error";

export function PushPermissionButton() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();

  async function refreshStatus() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported");
      return;
    }
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      const result = await withTimeout(webPushStatusAction(subscription?.endpoint), WEB_PUSH_ACTION_TIMEOUT_MS);
      if (result.error) {
        setState("unavailable");
        setMessage(result.error);
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
      } else if (Notification.permission === "granted") {
        const key = await withTimeout(webPushPublicKeyAction(), WEB_PUSH_ACTION_TIMEOUT_MS);
        const usesCurrentKey = Boolean(
          key.publicKey
          && subscription
          && applicationServerKeysMatch(subscription.options.applicationServerKey, base64Url(key.publicKey)),
        );
        if (subscription && result.status?.hasActiveSubscription === false) {
          setState("stale");
          setMessage("اشتراک این مرورگر منقضی شده است. برای ساخت اشتراک تازه، اعلان مرورگر را دوباره فعال کنید.");
        } else if (result.status?.hasActiveSubscription && usesCurrentKey) {
          setState("enabled");
        } else {
          setState("ready");
          if (subscription && !usesCurrentKey) {
            setMessage("کلید اعلان مرورگر تغییر کرده است. برای ساخت اشتراک تازه، دوباره فعال‌سازی کنید.");
          }
        }
      } else {
        setState("permission");
      }
    } catch {
      setState("unavailable");
      setMessage("وضعیت اعلان مرورگر دریافت نشد. اتصال اینترنت و ورود حساب را بررسی کنید.");
    }
  }

  useEffect(() => {
    void refreshStatus();
  }, []);

  async function enable() {
    setBusy(true);
    setMessage(undefined);
    try {
      await enableWebPushForCurrentBrowser();
      setState("enabled");
      setMessage("اعلان مرورگر فعال شد.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "فعال‌سازی اعلان مرورگر انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage(undefined);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription?.endpoint) throw new Error("اشتراک فعالی برای این مرورگر پیدا نشد.");
      const result = await withTimeout(disablePushAction(subscription.endpoint), WEB_PUSH_ACTION_TIMEOUT_MS);
      if (result.error) throw new Error(result.error);
      await subscription.unsubscribe();
      setState("permission");
      setMessage("اعلان در این مرورگر غیرفعال شد. دستگاه‌های دیگر تغییری نکردند.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "غیرفعال‌سازی اعلان مرورگر انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setMessage(undefined);
    try {
      const result = await withTimeout(sendWebPushTestAction(), WEB_PUSH_ACTION_TIMEOUT_MS);
      if (result.error) throw new Error(result.error);
      setMessage(result.created === false
        ? "اعلان آزمایشی همین حالا قبلاً در صف قرار گرفته است. یک دقیقه بعد دوباره امتحان کنید."
        : "اعلان آزمایشی در صف ارسال قرار گرفت؛ معمولاً تا چند ثانیه دیگر نمایش داده می‌شود.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ارسال اعلان آزمایشی انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  const status = stateLabel(state);
  return <div className="space-y-3 rounded-2xl border bg-background p-4">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-primary">{state === "enabled" ? <CheckCircle2Icon className="size-5"/> : state === "denied" ? <XCircleIcon className="size-5"/> : <BellRingIcon className="size-5"/>}</span>
      <div className="min-w-0 flex-1"><p className="font-medium">اعلان مرورگر</p><p className="text-sm leading-6 text-muted-foreground">{status}</p></div>
    </div>
    {state === "enabled" ? <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => void sendTest()} disabled={busy}>{busy ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start"/> : <SendIcon data-icon="inline-start"/>}ارسال اعلان آزمایشی</Button><Button type="button" variant="ghost" onClick={() => void disable()} disabled={busy}>غیرفعال‌سازی در این مرورگر</Button></div> : state !== "unsupported" && state !== "unavailable" ? <Button type="button" variant={state === "stale" ? "default" : "outline"} onClick={() => void enable()} disabled={busy}>{busy ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start"/> : <BellRingIcon data-icon="inline-start"/>}{state === "stale" ? "بازسازی اشتراک اعلان" : "فعال‌سازی اعلان مرورگر"}</Button> : null}
    {message ? <p className="text-sm leading-6 text-muted-foreground" role="status">{message}</p> : null}
  </div>;
}

function stateLabel(state: State) {
  switch (state) {
    case "loading": return "در حال بررسی وضعیت...";
    case "unsupported": return "مرورگر شما Push را پشتیبانی نمی‌کند.";
    case "unavailable": return "Push در این محیط فعال نشده است.";
    case "denied": return "اجازه اعلان در مرورگر رد شده است؛ آن را از تنظیمات سایت فعال کنید.";
    case "enabled": return "اعلان‌ها فعال هستند.";
    case "ready": return "اجازه اعلان داده شده؛ اشتراک مرورگر هنوز ثبت نشده است.";
    case "stale": return "اشتراک قبلی مرورگر منقضی شده و باید بازسازی شود.";
    case "error": return "در فعال‌سازی اعلان خطایی رخ داد.";
    default: return "برای دریافت یادآوری، اعلان مرورگر را فعال کنید.";
  }
}
