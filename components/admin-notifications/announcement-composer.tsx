"use client";

import {useState, useTransition} from "react";
import {BellRingIcon, CableIcon, SearchIcon, SendIcon} from "lucide-react";

import {ensureAdminTelegramWebhookAction, sendAdminAnnouncementAction} from "@/app/_actions/admin-notifications";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Field, FieldGroup, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {Spinner} from "@/components/ui/spinner";
import type {AdminAnnouncementResult, AdminNotificationPage, AdminNotificationRuntime} from "@/lib/api/admin-notifications";
import type {AdminUserSummaryDto, AdminUsersPageDto} from "@/lib/api/admin-users";

type Audience = "ALL" | "USER";
type Props = {
  history: AdminNotificationPage;
  runtime: AdminNotificationRuntime;
  telegramVisible: boolean;
};

export function AnnouncementComposer({history, runtime: initialRuntime, telegramVisible}: Props) {
  const [announcementId, setAnnouncementId] = useState(() => crypto.randomUUID());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("ALL");
  const [selectedUser, setSelectedUser] = useState<AdminUserSummaryDto>();
  const [telegramChannel, setTelegramChannel] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<AdminAnnouncementResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [runtime, setRuntime] = useState(initialRuntime);

  const telegramAvailable = telegramVisible && runtime.telegramEnabled;
  const valid = title.trim().length > 0
    && title.trim().length <= 80
    && body.trim().length > 0
    && body.trim().length <= 500
    && (audience === "ALL" || Boolean(selectedUser));

  function changeAudience(next: Audience) {
    setAudience(next);
    setConfirming(false);
    if (next === "USER") setTelegramChannel(false);
  }

  function submit() {
    startTransition(async () => {
      const response = await sendAdminAnnouncementAction({
        announcementId,
        title,
        body,
        targets: {webPush: true, telegramChannel: audience === "ALL" && telegramAvailable && telegramChannel},
        recipientUserId: audience === "USER" ? selectedUser?.id : null,
      });
      setConfirming(false);
      if (!response.ok) {
        setMessage(response.message);
        return;
      }
      setResult(response.result);
      setMessage(null);
      setTitle("");
      setBody("");
      setAnnouncementId(crypto.randomUUID());
    });
  }

  const audienceLabel = audience === "ALL"
    ? "همه کاربران دارای اعلان مرورگر فعال"
    : selectedUser
      ? selectedUser.displayName || selectedUser.email || selectedUser.phoneNumber || selectedUser.id
      : "کاربر انتخاب‌شده";

  return <div className="flex flex-col gap-6">
    <NotificationRuntimeCard runtime={runtime} telegramVisible={telegramVisible} busy={pending} onRuntimeChange={setRuntime} startTransition={startTransition}/>
    <Card className="rounded-3xl border bg-card shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <BellRingIcon className="size-6 text-primary"/>
          <div>
            <CardTitle className="text-lg font-semibold">نوشتن و ارسال اعلان</CardTitle>
            <CardDescription className="leading-7">یک پیام دلخواه را برای همه کاربران دارای Push فعال یا فقط یک کاربر بفرست. ساعات آرام و انتخاب دریافت اعلان هر کاربر رعایت می‌شود.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {message ? <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive">{message}</p> : null}
        {result ? <p className="rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm leading-6 text-primary" role="status">
          {result.recipientsTargeted === 0
            ? "برای این مقصد اشتراک Push فعالی پیدا نشد؛ اعلانی ساخته نشد."
            : `${result.intentsCreated} اعلان تازه برای ${result.recipientsTargeted} کاربر در صف قرار گرفت`}
          {result.intentsExisting > 0 ? `؛ ${result.intentsExisting} مورد از قبل در صف بود` : ""}
          {result.telegramQueued ? "؛ پیام کانال تلگرام هم در صف قرار گرفت" : ""}
          {result.telegramAlreadyQueued ? "؛ پیام کانال تلگرام از قبل در صف بود" : ""}
          {result.failures > 0 ? `؛ ${result.failures} خطا` : ""}.
        </p> : null}

        <FieldGroup>
          <Field>
            <span className="text-sm font-medium">گیرندگان</span>
            <div className="grid gap-2 sm:grid-cols-2">
              <AudienceOption checked={audience === "ALL"} label="همه کاربران" description="فقط کسانی که Push فعال دارند" onSelect={() => changeAudience("ALL")}/>
              <AudienceOption checked={audience === "USER"} label="یک کاربر" description="جست‌وجو و انتخاب حساب مشخص" onSelect={() => changeAudience("USER")}/>
            </div>
          </Field>

          {audience === "USER" ? <UserPicker selected={selectedUser} onSelect={setSelectedUser} disabled={pending}/> : null}

          <Field>
            <FieldLabel htmlFor="announcement-title">عنوان اعلان</FieldLabel>
            <Input id="announcement-title" value={title} maxLength={80} onChange={event => setTitle(event.target.value)} disabled={pending} placeholder="مثلاً گزارش هفتگی آماده است"/>
            <span className="text-xs text-muted-foreground">حداکثر ۸۰ نویسه</span>
          </Field>
          <Field>
            <FieldLabel htmlFor="announcement-body">متن اعلان</FieldLabel>
            <textarea id="announcement-body" value={body} maxLength={500} rows={4} onChange={event => setBody(event.target.value)} disabled={pending} placeholder="پیام کوتاه و روشن بنویس؛ کاربر باید بداند چه کاری می‌تواند انجام دهد." className="w-full rounded-2xl border bg-background px-3 py-2 text-sm leading-7 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"/>
            <span className="text-xs text-muted-foreground">حداکثر ۵۰۰ نویسه</span>
          </Field>

          {audience === "ALL" && telegramAvailable ? <Field>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 text-sm">
              <input type="checkbox" checked={telegramChannel} onChange={event => setTelegramChannel(event.target.checked)} disabled={pending} className="mt-1 size-4 accent-primary"/>
              <span><strong className="block font-medium">هم‌زمان در کانال تلگرام جیرو</strong><span className="mt-1 block leading-6 text-muted-foreground">این گزینه فقط برای اعلان همگانی است.</span></span>
            </label>
          </Field> : null}
        </FieldGroup>

        {confirming ? <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-medium leading-7">این پیام برای «{audienceLabel}» ارسال می‌شود{telegramChannel ? " و در کانال تلگرام هم منتشر می‌شود" : ""}. ادامه می‌دهی؟</p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="h-11 rounded-full" onClick={submit} disabled={pending}>{pending ? <Spinner/> : <SendIcon data-icon="inline-start"/>}{pending ? "در حال ثبت" : "ارسال اعلان"}</Button>
            <Button size="lg" variant="outline" className="h-11 rounded-full" onClick={() => setConfirming(false)} disabled={pending}>بازگشت و ویرایش</Button>
          </div>
        </div> : <Button size="lg" className="h-11 rounded-full" onClick={() => {setMessage(null); setResult(null); setConfirming(true);}} disabled={!valid || pending}><SendIcon data-icon="inline-start"/>بازبینی پیام</Button>}
      </CardContent>
    </Card>

    <Card className="rounded-3xl border bg-muted/30 shadow-sm">
      <CardHeader><CardTitle className="text-base">اعلان‌های اخیر</CardTitle><CardDescription>هر کاربر هدف یک intent جداگانه دارد تا وضعیت ارسال قابل پیگیری بماند.</CardDescription></CardHeader>
      <CardContent>{history.items.length === 0 ? <p className="text-sm leading-7 text-muted-foreground">هنوز اعلانی ارسال نشده است.</p> : <ul className="flex flex-col gap-2">{history.items.map(item => <li key={item.intentId} className="flex flex-wrap items-center gap-3 rounded-2xl border bg-background p-3 text-sm"><span className="font-medium" dir="ltr">{new Date(item.createdAt).toLocaleString("fa-IR")}</span><span className="rounded-full border px-2 py-0.5 text-xs">{item.status}</span>{item.reason ? <span className="text-xs text-muted-foreground">{item.reason}</span> : null}<span className="text-xs text-muted-foreground" dir="ltr">{item.deliveries.map(delivery => `${delivery.channel}: ${delivery.status}`).join(" · ")}</span></li>)}</ul>}</CardContent>
    </Card>
  </div>;
}

function AudienceOption({checked, label, description, onSelect}: {checked: boolean; label: string; description: string; onSelect: () => void}) {
  return <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 ${checked ? "border-primary bg-primary/5" : "bg-background"}`}><input type="radio" name="announcement-audience" checked={checked} onChange={onSelect} className="mt-1 size-4 accent-primary"/><span><strong className="block text-sm font-medium">{label}</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span></span></label>;
}

function UserPicker({selected, onSelect, disabled}: {selected?: AdminUserSummaryDto; onSelect: (user: AdminUserSummaryDto) => void; disabled: boolean}) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUserSummaryDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string>();

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setMessage(undefined);
    try {
      const response = await fetch(`/api/admin/users/search?query=${encodeURIComponent(query.trim())}`);
      if (!response.ok) throw new Error();
      const page = await response.json() as AdminUsersPageDto;
      setUsers(page.items.slice(0, 5));
      if (page.items.length === 0) setMessage("کاربری با این مشخصات پیدا نشد.");
    } catch {
      setMessage("جست‌وجوی کاربر انجام نشد. دوباره تلاش کن.");
    } finally {
      setSearching(false);
    }
  }

  return <Field><FieldLabel htmlFor="announcement-user-search">کاربر مقصد</FieldLabel><div className="flex flex-col gap-2 sm:flex-row"><Input id="announcement-user-search" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => {if (event.key === "Enter") void search();}} placeholder="ایمیل، شماره، نام یا شناسه کاربر" disabled={disabled || searching}/><Button type="button" variant="outline" onClick={() => void search()} disabled={disabled || searching || !query.trim()}>{searching ? <Spinner/> : <SearchIcon data-icon="inline-start"/>}جست‌وجو</Button></div>{users.length > 0 ? <div className="mt-2 grid gap-2">{users.map(user => <button type="button" key={user.id} onClick={() => onSelect(user)} className={`rounded-2xl border p-3 text-start text-sm ${selected?.id === user.id ? "border-primary bg-primary/5" : "bg-background"}`}><span className="font-medium">{user.displayName || user.email || user.phoneNumber || "کاربر بدون نام"}</span><span className="mt-1 block text-xs text-muted-foreground" dir="ltr">{user.email || user.phoneNumber || user.id}</span></button>)}</div> : null}{message ? <span className="mt-2 text-sm text-muted-foreground" role="status">{message}</span> : null}</Field>;
}

function NotificationRuntimeCard({runtime, telegramVisible, busy, onRuntimeChange, startTransition}: {runtime: AdminNotificationRuntime; telegramVisible: boolean; busy: boolean; onRuntimeChange: (runtime: AdminNotificationRuntime) => void; startTransition: (callback: () => Promise<void>) => void}) {
  const [message, setMessage] = useState<string>();
  const showTelegram = telegramVisible && runtime.telegramEnabled;
  function ensureWebhook() {
    startTransition(async () => {
      setMessage(undefined);
      const response = await ensureAdminTelegramWebhookAction();
      if (!response.ok) return setMessage(response.message);
      onRuntimeChange({...runtime, telegramWebhook: response.result});
      setMessage(response.result.matchesExpectedUrl ? "Webhook تلگرام ثبت و تأیید شد." : "وضعیت webhook هنوز با تنظیمات سرور هماهنگ نیست.");
    });
  }
  const proxy = runtime.proxy.type === "NONE" ? "بدون پروکسی" : `${runtime.proxy.type} — ${runtime.proxy.host}:${runtime.proxy.port}${runtime.proxy.authenticated ? " (با احراز هویت)" : ""}`;
  return <Card className="rounded-3xl border bg-card shadow-sm"><CardHeader><div className="flex items-center gap-3"><CableIcon className="size-6 text-primary"/><div><CardTitle className="text-lg font-semibold">وضعیت ارسال اعلان</CardTitle><CardDescription className="leading-7">قبل از ارسال، فعال‌بودن Push و مسیرهای اختیاری را بررسی کن.</CardDescription></div></div></CardHeader><CardContent className="space-y-4 text-sm"><dl className={`grid gap-3 ${showTelegram ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}><div className="rounded-2xl border p-3"><dt className="text-muted-foreground">Web Push</dt><dd className="mt-1 font-medium">{runtime.webPushEnabled ? "فعال" : "غیرفعال"}</dd></div><div className="rounded-2xl border p-3"><dt className="text-muted-foreground">مسیر خروجی</dt><dd className="mt-1 font-medium" dir="ltr">{proxy}</dd></div>{showTelegram ? <div className="rounded-2xl border p-3"><dt className="text-muted-foreground">Webhook تلگرام</dt><dd className="mt-1 font-medium">{runtime.telegramWebhook.matchesExpectedUrl ? "متصل" : "نیازمند بررسی"}</dd></div> : null}</dl>{showTelegram && runtime.telegramWebhook.lastErrorMessage ? <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive">آخرین خطای Telegram: {runtime.telegramWebhook.lastErrorMessage}</p> : null}{showTelegram && runtime.telegramWebhook.enabled && !runtime.telegramWebhook.matchesExpectedUrl ? <Button type="button" variant="outline" onClick={ensureWebhook} disabled={busy}><CableIcon data-icon="inline-start"/>ثبت یا اصلاح webhook</Button> : null}{message ? <p role="status" className="text-muted-foreground">{message}</p> : null}</CardContent></Card>;
}
