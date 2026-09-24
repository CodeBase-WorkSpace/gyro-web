"use client";

import {useState} from "react";
import {CheckCircle2Icon, ExternalLinkIcon, KeyRoundIcon, LoaderCircleIcon, SendIcon, UnplugIcon} from "lucide-react";

import {confirmTelegramLinkAction, createTelegramLinkAction, sendTelegramTestAction, unlinkTelegramAction} from "@/app/(app)/profile/notifications/actions";
import {Button, buttonVariants} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import type {TelegramStatus} from "@/lib/api/notifications";

export function TelegramLinkCard({initialStatus}: {initialStatus: TelegramStatus}) {
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [linkUrl, setLinkUrl] = useState<string>();
  const [code, setCode] = useState("");

  async function connect() {
    setBusy(true);
    setMessage(undefined);
    const result = await createTelegramLinkAction();
    if (result.error || !result.url) {
      setMessage(result.error ?? "پیوند تلگرام ساخته نشد.");
      setBusy(false);
      return;
    }
    setLinkUrl(result.url);
    setMessage("ربات را باز کنید و Start را بزنید. ربات یک کد ۸ نویسه‌ای می‌فرستد؛ آن را همین‌جا وارد کنید.");
    setBusy(false);
  }

  async function confirm() {
    setBusy(true);
    setMessage(undefined);
    const result = await confirmTelegramLinkAction(code);
    if (result.error) setMessage(result.error);
    else {
      setStatus({...status, state: "LINKED", linkedAt: new Date().toISOString(), pendingUntil: null});
      setLinkUrl(undefined);
      setCode("");
      setMessage("حساب تلگرام با موفقیت متصل شد.");
    }
    setBusy(false);
  }

  async function unlink() {
    setBusy(true);
    setMessage(undefined);
    const result = await unlinkTelegramAction();
    if (result.error) setMessage(result.error);
    else {
      setStatus({...status, state: "RELINK_REQUIRED", linkedAt: null, pendingUntil: null});
      setMessage("اتصال تلگرام قطع شد.");
    }
    setBusy(false);
  }

  async function sendTest() {
    setBusy(true);
    setMessage(undefined);
    const result = await sendTelegramTestAction();
    setMessage(result.error ?? (result.created === false
      ? "پیام آزمایشی همین حالا در صف قرار گرفته است؛ یک دقیقه بعد دوباره تلاش کنید."
      : "پیام آزمایشی در صف ارسال تلگرام قرار گرفت."));
    setBusy(false);
  }

  const canConnect = status.enabled && ["UNLINKED", "BLOCKED", "RELINK_REQUIRED"].includes(status.state);
  return <div className="space-y-4 rounded-2xl border bg-background p-4">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-primary">{status.state === "LINKED" ? <CheckCircle2Icon className="size-5"/> : <SendIcon className="size-5"/>}</span>
      <div className="min-w-0 flex-1"><p className="font-medium">تلگرام شخصی</p><p className="text-sm leading-6 text-muted-foreground">{stateLabel(status)}</p></div>
    </div>
    <div className="flex flex-wrap gap-2">
      {canConnect && !linkUrl ? <Button type="button" variant="outline" onClick={() => void connect()} disabled={busy}>{busy ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start"/> : <ExternalLinkIcon data-icon="inline-start"/>}{status.state === "UNLINKED" ? "اتصال تلگرام" : "اتصال دوباره"}</Button> : null}
      {status.state === "LINKED" ? <><Button type="button" variant="outline" onClick={() => void sendTest()} disabled={busy}>{busy ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start"/> : <SendIcon data-icon="inline-start"/>}ارسال پیام آزمایشی</Button><Button type="button" variant="ghost" onClick={() => void unlink()} disabled={busy}><UnplugIcon data-icon="inline-start"/>قطع اتصال</Button></> : null}
    </div>
    {linkUrl && status.state !== "LINKED" ? <div className="space-y-3 rounded-2xl border bg-muted/20 p-3">
      <p className="text-sm font-medium">۱. ربات را باز کنید و Start را بزنید.</p>
      <a href={linkUrl} target="_blank" rel="noreferrer" className={buttonVariants({variant: "outline"})}><ExternalLinkIcon data-icon="inline-start"/>باز کردن ربات تلگرام</a>
      <label className="block space-y-2">
        <span className="text-sm font-medium">۲. کدی که ربات فرستاد وارد کنید.</span>
        <Input value={code} onChange={event => setCode(event.target.value.toUpperCase())} maxLength={9} autoComplete="one-time-code" dir="ltr" inputMode="text" placeholder="ABCD-EFGH" className="font-mono tracking-widest" disabled={busy}/>
      </label>
      <Button type="button" onClick={() => void confirm()} disabled={busy || !/^[A-HJ-NP-Z2-9]{4}-?[A-HJ-NP-Z2-9]{4}$/.test(code.trim())}>{busy ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start"/> : <KeyRoundIcon data-icon="inline-start"/>}تأیید و اتصال</Button>
    </div> : null}
    {message ? <p className="text-sm leading-6 text-muted-foreground" role="status">{message}</p> : null}
  </div>;
}

function stateLabel(status: TelegramStatus) {
  switch (status.state) {
    case "UNAVAILABLE": return "اتصال تلگرام در این محیط فعال نشده است.";
    case "PENDING": return "در انتظار تأیید؛ تلگرام را باز کنید و دکمه Start را بزنید.";
    case "LINKED": return "حساب تلگرام شما متصل است.";
    case "BLOCKED": return "ربات در تلگرام مسدود شده است؛ آن را آزاد و دوباره متصل کنید.";
    case "RELINK_REQUIRED": return "برای دریافت پیام، حساب تلگرام را دوباره متصل کنید.";
    default: return "برای دریافت پیام خصوصی آزمایشی، حساب تلگرام را متصل کنید.";
  }
}
