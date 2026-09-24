"use client";

import {useEffect, useState} from "react";
import {DownloadIcon, MoreVerticalIcon, PlusIcon, ShareIcon, SmartphoneIcon} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {useQueuedDialog} from "@/components/dialog-queue/dialog-queue-provider";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{outcome: "accepted" | "dismissed"}>;
};

/**
 * Rendered by the login route only. It used to sit in the root layout behind a
 * `pathname === "/auth/login"` check, which dragged the whole Base UI dialog
 * stack into the shared baseline for every route to serve exactly one.
 */
export function PwaInstallPrompt() {
  const [eligible, setEligible] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
  }, []);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & {standalone?: boolean}).standalone === true;
    const dismissed = window.sessionStorage.getItem("gyro-pwa-install-dismissed") === "true";

    setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent));
    const explicitlyRequested = new URLSearchParams(window.location.search).get("install") === "1";
    // An explicit request comes from the permanent marketing install link. It
    // must be able to reopen the guide even if a passive login prompt was
    // previously dismissed in this browser session.
    setEligible(!isStandalone && (explicitlyRequested || (isMobile && !dismissed)));
  }, []);

  const {open, complete} = useQueuedDialog("pwa-install", 40, eligible);

  const close = () => {
    window.sessionStorage.setItem("gyro-pwa-install-dismissed", "true");
    complete();
  };

  const install = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") complete();
    setInstallPrompt(null);
  };

  return <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) close(); }}>
    <DialogContent className="max-w-md rounded-[2rem] border-border/80 bg-background p-6 sm:p-7" showCloseButton>
      <DialogHeader className="items-center text-center">
        <span className="grid size-14 place-items-center rounded-3xl bg-primary/12 text-primary shadow-[0_16px_36px_color-mix(in_oklch,var(--primary)_18%,transparent)]"><SmartphoneIcon className="size-7" aria-hidden="true" /></span>
        <DialogTitle className="mt-4 text-2xl font-black">جیرو را به صفحه اصلی اضافه کنید</DialogTitle>
        <DialogDescription className="mt-2 max-w-sm text-center text-base leading-8">اول وارد حسابتان شوید؛ سپس جیرو را مثل یک اپ در کنار برنامه‌های روزانه‌تان داشته باشید.</DialogDescription>
      </DialogHeader>
      <div className="mt-2 rounded-3xl border border-border/80 bg-card/45 p-4 text-sm font-bold leading-7 text-muted-foreground">
        {isIos ? <ol className="space-y-3"><InstallInstruction icon={ShareIcon} step="۱" text="در Safari روی دکمه Share بزنید." /><InstallInstruction icon={PlusIcon} step="۲" text="گزینه Add to Home Screen را انتخاب کنید." /><InstallInstruction icon={DownloadIcon} step="۳" text="روی Add بزنید تا آیکن جیرو اضافه شود." /></ol> : <ol className="space-y-3"><InstallInstruction icon={MoreVerticalIcon} step="۱" text="منوی مرورگر را باز کنید." /><InstallInstruction icon={PlusIcon} step="۲" text="گزینه نصب برنامه یا افزودن به صفحه اصلی را بزنید." /><InstallInstruction icon={DownloadIcon} step="۳" text="جیرو را تأیید کنید و از صفحه اصلی بازش کنید." /></ol>}
      </div>
      <DialogFooter className="mt-2 sm:flex-col sm:items-stretch">
        {installPrompt ? <Button className="h-12 rounded-full" onClick={install}>نصب وب اپ جیرو</Button> : null}
        <Button variant={installPrompt ? "ghost" : "default"} className="h-12 rounded-full" onClick={close}>متوجه شدم</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

function InstallInstruction({icon: Icon, step, text}: {icon: typeof ShareIcon; step: string; text: string}) {
  return <li className="flex items-center gap-3 text-right"><span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-4" aria-hidden="true" /></span><span><strong className="text-foreground">{step}.</strong> {text}</span></li>;
}
