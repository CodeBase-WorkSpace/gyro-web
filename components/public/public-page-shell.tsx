import Image from "next/image";
import Link from "next/link";
import type {ReactNode} from "react";

import {buttonVariants} from "@/components/ui/button";
import {MarketingInstallLink} from "@/components/public/marketing-install-link";
import {appBaseUrl} from "@/lib/seo/metadata";
import {cn} from "@/lib/utils";

const signupHref = `${appBaseUrl}/auth/signup`;

const publicLinks = [
  {label: "تماس با ما", href: "/contact"},
  {label: "حریم خصوصی", href: "/privacy"},
  {label: "شرایط استفاده", href: "/terms"},
];

type PublicPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function PublicPageShell({eyebrow, title, description, children}: PublicPageShellProps) {
  return (
    <main className="min-h-dvh overflow-hidden bg-background text-foreground">
      <section className="relative isolate border-b border-border/70">
        <PublicPagePattern />
        <div className="mx-auto flex min-h-[62svh] w-full max-w-5xl flex-col px-4 pb-12 pt-4 sm:px-6 lg:px-8">
          <PublicNav />
          <div className="flex flex-1 items-center py-14 sm:py-20">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-black text-primary">
                {eyebrow}
              </p>
              <h1 className="mt-6 text-balance font-heading text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base font-semibold leading-8 text-muted-foreground sm:text-lg sm:leading-9">
                {description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {children}
      </div>

      <footer className="border-t border-border/70 bg-card/20 py-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <PublicBrandMark />
            <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-muted-foreground" aria-label="لینک‌های قانونی جیرو">
              {publicLinks.map((link) => (
                <Link key={link.href} href={link.href} className="transition-colors hover:text-primary">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="border-t border-border/70 pt-5 text-sm font-bold text-muted-foreground">
            <p>© {new Date().getFullYear()} جیرو. همه حقوق محفوظ است.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function PublicNav() {
  return (
    <header className="flex items-center justify-between gap-4 py-3">
      <PublicBrandMark />
      <nav className="flex items-center gap-2" aria-label="ناوبری عمومی جیرو">
        <MarketingInstallLink />
        <Link
          href={signupHref}
          className={cn(buttonVariants({variant: "outline", size: "lg"}), "rounded-full")}
        >
          شروع
        </Link>
      </nav>
    </header>
  );
}

function PublicBrandMark() {
  return (
    <Link href="/" className="flex items-center gap-3 text-foreground" aria-label="صفحه اصلی جیرو">
      <span className="grid size-12 place-items-center">
        <Image
          src="/brand/gyro-symbol-64.png"
          alt=""
          width={48}
          height={48}
          priority
          className="size-full object-contain drop-shadow-[0_12px_26px_color-mix(in_oklch,var(--primary)_22%,transparent)]"
        />
      </span>
      <span className="grid leading-tight">
        <strong className="text-xl font-black tracking-normal">جیرو</strong>
        <small className="text-xs font-bold text-muted-foreground">دفتر سلامتی</small>
      </span>
    </Link>
  );
}

function PublicPagePattern() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-[-18%] top-[-30%] h-[54rem] opacity-75 blur-3xl">
        <span className="absolute right-[8%] top-[18%] h-80 w-[38rem] rotate-[-12deg] rounded-full bg-primary/20" />
        <span className="absolute left-[8%] top-[25%] h-72 w-[34rem] rotate-[18deg] rounded-full bg-[var(--nutrient-protein)]/12" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--background)_14%,transparent),var(--background)_88%)]" />
      <div className="absolute inset-x-0 top-0 h-full opacity-[0.06] [background-image:linear-gradient(to_left,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] [background-size:56px_56px]" />
    </div>
  );
}
