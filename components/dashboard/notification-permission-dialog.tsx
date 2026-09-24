"use client";

import { BellRingIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useQueuedDialog } from "@/components/dialog-queue/dialog-queue-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { enableWebPushForCurrentBrowser } from "@/lib/push-browser";
import { cn } from "@/lib/utils";

export function NotificationPermissionDialog({
  enabled,
  onShown,
  onDismiss,
  onComplete,
}: {
  enabled: boolean;
  onShown: () => void;
  onDismiss: () => void;
  onComplete: () => void;
}) {
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);
  const { open, complete } = useQueuedDialog(
    "dashboard-notification-permission",
    30,
    enabled,
  );

  useEffect(() => {
    if (open) onShown();
  }, [onShown, open]);

  function dismiss() {
    onDismiss();
    complete();
  }

  async function enable() {
    setPending(true);
    setMessage(undefined);
    try {
      // Browser permission is requested only from this explicit button action.
      await enableWebPushForCurrentBrowser();
      onComplete();
      complete();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "فعال‌سازی اعلان انجام نشد. از تنظیمات اعلان‌ها دوباره تلاش کن.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && dismiss()}>
      <DialogContent dir="rtl" className="max-w-md rounded-[2rem] p-6 sm:p-7">
        <DialogHeader className="items-center text-center">
          <span className="grid size-16 place-items-center rounded-3xl bg-primary/10 text-primary">
            <BellRingIcon className="size-8" aria-hidden="true" />
          </span>
          <DialogTitle className="mt-4 text-2xl font-black">
            یادآوری‌ها را در همین دستگاه دریافت کن
          </DialogTitle>
          <DialogDescription className="mt-2 max-w-sm text-center text-base leading-8">
            با اجازه اعلان مرورگر، یادآوری ثبت غذا و پیام‌های مهم جیرو را
            می‌بینی؛ زمان و نوع یادآوری همیشه از تنظیمات قابل تغییر است.
          </DialogDescription>
        </DialogHeader>
        <p className="rounded-3xl border bg-card/45 p-4 text-center text-sm leading-7 text-muted-foreground">
          اجازه فقط برای این مرورگر است. جیرو بدون انتخاب تو اعلان تبلیغاتی
          نمی‌فرستد.
        </p>
        {message ? (
          <p
            className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive"
            role="status"
          >
            {message}
          </p>
        ) : null}
        <DialogFooter className="mt-2 flex-col sm:flex-col sm:items-stretch">
          <Button
            type="button"
            size="xl"
            className="w-full rounded-full"
            onClick={() => void enable()}
            disabled={pending}
          >
            <BellRingIcon data-icon="inline-start" />
            {pending ? "در حال فعال‌سازی…" : "فعال‌کردن اعلان‌ها"}
          </Button>
          <Link
            href="/profile/notifications"
            onClick={dismiss}
            className={cn(
              buttonVariants({ variant: "outline", size: "xl" }),
              "w-full rounded-full",
            )}
          >
            <SettingsIcon data-icon="inline-start" />
            مشاهده تنظیمات اعلان
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="xl"
            className="w-full rounded-full"
            onClick={dismiss}
            disabled={pending}
          >
            بعداً یادآوری کن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
