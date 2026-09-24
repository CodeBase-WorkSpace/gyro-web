import type {Metadata} from "next";
import Link from "next/link";
import {CalculatorIcon, FlameIcon, GaugeIcon, ScaleIcon, WheatIcon} from "lucide-react";

import {PublicPageShell} from "@/components/public/public-page-shell";
import {buttonVariants} from "@/components/ui/button";
import {breadcrumbJsonLd, jsonLdGraph} from "@/lib/seo/json-ld";
import {createPersianPageMetadata} from "@/lib/seo/metadata";
import {cn} from "@/lib/utils";

const canonicalPath = "/fa/tools";

export const metadata: Metadata = createPersianPageMetadata({
  path: canonicalPath,
  title: "ابزارهای تغذیه و محاسبه کالری | جیرو",
  description: "ماشین حساب کالری، ماکرو، BMR و TDEE فارسی جیرو برای ساختن یک نقطه شروع روشن در برنامه‌ریزی تغذیه روزانه.",
  imageAlt: "ابزارهای تغذیه فارسی جیرو",
});

const tools = [
  {href: "/fa/tools/calorie-calculator", icon: FlameIcon, title: "ماشین حساب کالری", description: "برآورد هدف روزانه بر پایه سن، قد، وزن، فعالیت و هدف فعلی."},
  {href: "/fa/tools/macro-calculator", icon: WheatIcon, title: "ماشین حساب ماکرو", description: "یک نقطه شروع برای پروتئین، کربوهیدرات و چربی روزانه."},
  {href: "/fa/tools/bmr-calculator", icon: GaugeIcon, title: "ماشین حساب BMR", description: "برآورد انرژی موردنیاز بدن در حالت استراحت."},
  {href: "/fa/tools/tdee-calculator", icon: ScaleIcon, title: "ماشین حساب TDEE", description: "برآورد کالری نگهدارنده با در نظر گرفتن سطح فعالیت."},
];

const jsonLd = jsonLdGraph([breadcrumbJsonLd([{name: "جیرو", path: "/"}, {name: "ابزارهای تغذیه", path: canonicalPath}])]);

export default function ToolsHubPage() {
  return <PublicPageShell eyebrow="ابزارهای کاربردی جیرو" title="از یک عدد تقریبی شروع کنید؛ با ثبت روزانه آن را واقعی‌تر کنید." description="این ابزارها برای تصمیم‌های اولیه طراحی شده‌اند: خروجی را ببینید، منطق پشت آن را بخوانید و اگر خواستید ادامه مسیر را در دفتر تغذیه جیرو ثبت کنید.">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} />
    <section className="grid gap-4 sm:grid-cols-2" aria-label="ماشین حساب‌های تغذیه">
      {tools.map((tool) => <Link key={tool.href} href={tool.href} className="group rounded-3xl border border-border bg-card/55 p-6 transition-colors hover:border-primary/50 hover:bg-primary/5">
        <tool.icon className="size-6 text-primary" aria-hidden="true" />
        <h2 className="mt-5 text-xl font-black">{tool.title}</h2>
        <p className="mt-2 leading-8 text-muted-foreground">{tool.description}</p>
        <span className="mt-5 inline-flex font-black text-primary">باز کردن ابزار ←</span>
      </Link>)}
    </section>
    <section className="mt-12 rounded-3xl border border-border bg-card/30 p-6 sm:p-8">
      <CalculatorIcon className="size-6 text-primary" aria-hidden="true" />
      <h2 className="mt-4 text-2xl font-black">ابزارها چه چیزی را جایگزین نمی‌کنند؟</h2>
      <p className="mt-3 max-w-3xl leading-8 text-muted-foreground">همه خروجی‌ها تخمین‌اند و به کیفیت اطلاعات ورودی وابسته‌اند. برای بارداری، شیردهی، سن زیر ۱۸ سال، بیماری، دارو یا سابقه اختلال خوردن، برنامه‌ریزی را با پزشک یا متخصص تغذیه انجام دهید.</p>
      <Link href="/fa/app/calorie-counter" className={cn(buttonVariants({variant: "outline", size: "lg"}), "mt-6 rounded-full")}>کالری‌شمار فارسی جیرو</Link>
    </section>
  </PublicPageShell>;
}
