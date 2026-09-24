import Link from "next/link";
import type {ReactNode} from "react";
import {ArrowLeftIcon} from "lucide-react";

import {PublicPageShell} from "@/components/public/public-page-shell";
import {SeoPageMeta} from "@/components/seo/seo-page-meta";
import {buttonVariants} from "@/components/ui/button";
import {cn} from "@/lib/utils";

export function GuidePage({eyebrow, title, description, children, relatedTools}: {eyebrow: string; title: string; description: string; children: ReactNode; relatedTools: {href: string; label: string}[]}) {
  return <PublicPageShell eyebrow={eyebrow} title={title} description={description}>
    <article className="mx-auto max-w-3xl space-y-10 text-[1.02rem] leading-9 text-muted-foreground">
      {children}
      <section className="rounded-3xl border border-primary/25 bg-primary/5 p-6">
        <p className="text-sm font-black text-primary">قدم بعدی</p>
        <h2 className="mt-2 text-2xl font-black text-foreground">این راهنما را به عمل تبدیل کنید.</h2>
        <div className="mt-5 flex flex-wrap gap-3">{relatedTools.map((tool) => <Link key={tool.href} href={tool.href} className={cn(buttonVariants({variant: "outline", size: "lg"}), "rounded-full")}>{tool.label} <ArrowLeftIcon data-icon="inline-end" /></Link>)}</div>
      </section>
      <SeoPageMeta updatedAt="۲۱ تیر ۱۴۰۵" disclaimer="این راهنما برای آگاهی عمومی است و توصیه پزشکی، تشخیص یا برنامه درمانی شخصی ارائه نمی‌کند. برای بارداری، شیردهی، بیماری، دارو یا سابقه اختلال خوردن با متخصص مشورت کنید." />
    </article>
  </PublicPageShell>;
}

export function GuideSection({title, children}: {title: string; children: ReactNode}) {
  return <section><h2 className="text-2xl font-black text-foreground">{title}</h2><div className="mt-3 space-y-3">{children}</div></section>;
}
