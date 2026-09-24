import type {Metadata} from "next";
import Link from "next/link";
import {BookOpenIcon, FlameIcon, ScaleIcon, WheatIcon} from "lucide-react";

import {PublicPageShell} from "@/components/public/public-page-shell";
import {breadcrumbJsonLd, jsonLdGraph} from "@/lib/seo/json-ld";
import {createPersianPageMetadata} from "@/lib/seo/metadata";

const canonicalPath = "/fa/guides";
export const metadata: Metadata = createPersianPageMetadata({path: canonicalPath, title: "راهنمای تغذیه و کالری فارسی | جیرو", description: "راهنماهای ساده و کاربردی درباره کالری، ماکروها، BMR، ثبت غذا و پیگیری وعده‌های ایرانی با جیرو.", imageAlt: "راهنماهای تغذیه فارسی جیرو"});
const guides = [
  {href: "/fa/guides/calorie-deficit", icon: FlameIcon, category: "تغییر وزن", title: "کسری کالری چیست؟", description: "مفهوم کسری انرژی و یک روش محتاطانه برای استفاده از آن."},
  {href: "/fa/guides/what-is-bmr", icon: ScaleIcon, category: "کالری پایه", title: "BMR و TDEE چه فرقی دارند؟", description: "دو عددی که برای برآورد کالری روزانه به کار می‌روند."},
  {href: "/fa/guides/what-are-macros", icon: WheatIcon, category: "ماکروها", title: "ماکروها چه هستند؟", description: "نقش پروتئین، کربوهیدرات و چربی در غذای روزانه."},
  {href: "/fa/guides/how-to-count-calories", icon: BookOpenIcon, category: "ثبت غذا", title: "چطور کالری بشماریم؟", description: "یک مسیر ساده برای شروع ثبت وعده‌ها بدون وسواس."},
  {href: "/fa/guides/track-persian-foods", icon: BookOpenIcon, category: "غذاهای ایرانی", title: "ثبت غذای ایرانی", description: "روش عملی ثبت غذاهای خانگی، ترکیبی و وعده‌های بیرون."},
];
const jsonLd = jsonLdGraph([breadcrumbJsonLd([{name: "جیرو", path: "/"}, {name: "راهنماها", path: canonicalPath}])]);

export default function GuidesHubPage() { return <PublicPageShell eyebrow="راهنمای تغذیه جیرو" title="برای انتخاب‌های روزمره، توضیح روشن داشته باشید." description="راهنماهای جیرو مفاهیم پایه تغذیه را به کارهای کوچک و قابل‌انجام وصل می‌کنند: محاسبه، ثبت غذا و بررسی روند خودتان."><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} /><section className="grid gap-4 sm:grid-cols-2">{guides.map((guide) => <Link key={guide.href} href={guide.href} className="group rounded-3xl border border-border bg-card/55 p-6 transition-colors hover:border-primary/50 hover:bg-primary/5"><guide.icon className="size-6 text-primary" aria-hidden="true" /><p className="mt-5 text-sm font-black text-primary">{guide.category}</p><h2 className="mt-1 text-xl font-black">{guide.title}</h2><p className="mt-2 leading-8 text-muted-foreground">{guide.description}</p><span className="mt-5 inline-flex font-black text-primary">خواندن راهنما ←</span></Link>)}</section></PublicPageShell>; }
