import Link from "next/link";
import type {ReactNode} from "react";
import {ArrowLeftIcon} from "lucide-react";

import {SeoPageMeta} from "@/components/seo/seo-page-meta";
import {buttonVariants} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import {PublicPageShell} from "./public-page-shell";

export function ToolPage({eyebrow, title, description, calculator, children}: {eyebrow: string; title: string; description: string; calculator: ReactNode; children: ReactNode}) {
  return <PublicPageShell eyebrow={eyebrow} title={title} description={description}>
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(360px,1.15fr)] lg:items-start">
      <article className="space-y-8 leading-8 text-muted-foreground">
        {children}
        <SeoPageMeta updatedAt="۲۱ تیر ۱۴۰۵" disclaimer="این ابزار برای آموزش و برنامه‌ریزی عمومی است؛ تشخیص، درمان یا جایگزین نظر پزشک و متخصص تغذیه نیست." />
        <Link href="/auth/signup" className={cn(buttonVariants({size: "xl"}), "h-12 rounded-full px-6")}>
          نتیجه را در دفتر جیرو ادامه بده <ArrowLeftIcon data-icon="inline-end" />
        </Link>
      </article>
      <div className="lg:sticky lg:top-6">{calculator}</div>
    </div>
  </PublicPageShell>;
}

export function ToolSection({title, children}: {title: string; children: ReactNode}) {
  return <section><h2 className="text-2xl font-black text-foreground">{title}</h2><div className="mt-3 space-y-3">{children}</div></section>;
}
