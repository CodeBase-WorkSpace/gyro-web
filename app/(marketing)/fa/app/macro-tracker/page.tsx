import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftIcon,
  BarChart3Icon,
  BeefIcon,
  DropletIcon,
  WheatIcon,
  PieChartIcon,
  ScaleIcon,
  TargetIcon,
} from "lucide-react";

import {SeoPageMeta} from "@/components/seo/seo-page-meta";
import {buttonVariants} from "@/components/ui/button";
import {MarketingInstallLink} from "@/components/public/marketing-install-link";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  jsonLdGraph,
  softwareApplicationJsonLd,
} from "@/lib/seo/json-ld";
import {appBaseUrl, createPersianPageMetadata} from "@/lib/seo/metadata";
import {cn} from "@/lib/utils";

const signupHref = `${appBaseUrl}/auth/signup`;
const canonicalPath = "/fa/app/macro-tracker";

export const metadata: Metadata = createPersianPageMetadata({
  path: canonicalPath,
  title: "ماکرو شمار فارسی | پیگیری پروتئین، کربوهیدرات و چربی با جیرو",
  description:
    "با جیرو ماکروهای روزانه‌تان را فارسی ردیابی کنید: پروتئین، کربوهیدرات و چربی را کنار کالری ببینید و به تغذیه‌تان نگاه دقیق‌تری داشته باشید.",
  ogTitle: "ماکرو شمار فارسی | جیرو",
  ogDescription:
    "ماکرو شمار فارسی؛ پیگیری پروتئین، کربوهیدرات و چربی در یک وب اپ ساده.",
  imageAlt: "ماکرو شمار فارسی جیرو",
});

const macros = [
  {
    icon: BeefIcon,
    name: "پروتئین",
    description:
      "پروتئین نقش اصلی در ساخت و ترمیم بافت‌های بدن دارد. ماهیچه‌ها، پوست و حتی هورمون‌ها به پروتئین نیاز دارند. دریافت کافی پروتئین کمک می‌کند بدن بهتر بازسازی شود و احساس سیری بیشتری داشته باشید.",
  },
  {
    icon: WheatIcon,
    name: "کربوهیدرات",
    description:
      "کربوهیدرات اصلی‌ترین منبع انرژی بدن است. مغز، ماهیچه‌ها و فعالیت روزانه شما به کربوهیدرات نیاز دارند. انتخاب منابع مناسب کربوهیدرات مثل نان، برنج و میوه کمک می‌کند انرژی پایداری در طول روز داشته باشید.",
  },
  {
    icon: DropletIcon,
    name: "چربی",
    description:
      "چربی برای تولید هورمون‌ها و جذب ویتامین‌های محلول در چربی ضروری است. بدن بدون چربی کافی نمی‌تواند درست کار کند. چربی‌های سالم مثل روغن زیتون، مغزها و ماهی بخش مهمی از یک تغذیه متعادل هستند.",
  },
];

const features = [
  {
    icon: ScaleIcon,
    title: "محاسبه خودکار",
    description:
      " وقتی غذا ثبت می‌کنید، جیرو پروتئین، کربوهیدرات و چربی آن را به صورت خودکار محاسبه می‌کند. نیازی نیست خودتان عدد وارد کنید.",
  },
  {
    icon: TargetIcon,
    title: "اهداف روزانه",
    description:
      "برای هر ماکرو یک هدف روزانه تعیین کنید و در طول روز ببینید چقدر به آن نزدیک شده‌اید.",
  },
  {
    icon: BarChart3Icon,
    title: "نمودار پیشرفت",
    description:
      "نوارهای پیشرفت بصری نشان می‌دهند هر ماکرو چه درصدی از هدف روزانه‌تان را پوشش داده است.",
  },
  {
    icon: PieChartIcon,
    title: "خلاصه وعده‌ها",
    description:
      "در یک نگاه ببینید هر وعده چه سهمی از ماکروهای روزانه‌تان را تأمین کرده است.",
  },
];

const faqs = [
  {
    question: "ماکروها چیست؟",
    answer:
      "ماکروها سه دسته اصلی مواد مغذی هستند که بدن شما به آن‌ها نیاز دارد: پروتئین، کربوهیدرات و چربی. هر کدام نقش متفاوتی در سلامت و انرژی روزانه شما دارند.",
  },
  {
    question: "چرا باید ماکروها را ردیابی کنم؟",
    answer:
      "فقط دانستن کالری کلی تصویر کاملی نمی‌دهد. دو غذا ممکن است کالری یکسانی داشته باشند اما ترکیب ماکروهایشان متفاوت باشد. ردیابی ماکروها کمک می‌کند بفهمید غذایتان چه کیفیتی دارد.",
  },
  {
    question: "چطور اهداف ماکرو تعیین کنم؟",
    answer:
      "اهداف ماکرو به سن، جنسیت، وزن و سطح فعالیت شما بستگی دارد. جیرو امکان تعیین دستی اهداف را فراهم می‌کند و می‌توانید بر اساس نیاز خودتان آن‌ها را تنظیم کنید.",
  },
  {
    question: "آیا می‌توانم ماکروهای هر وعده را ببینم؟",
    answer:
      "بله. وقتی یک غذا را ثبت می‌کنید، ماکروهای آن وعده نمایش داده می‌شود و می‌توانید ببینید هر وعده چه سهمی از هدف روزانه شما را پوشش داده است.",
  },
  {
    question: "اگر فقط کالری برایم مهم است چطور؟",
    answer:
      "جیرو امکان پیگیری فقط کالری را هم دارد. ردیابی ماکروها یک امکان اضافه است که به شما دید دقیق‌تری می‌دهد، اما اجباری نیست.",
  },
];

const internalLinks = [
  {href: "/fa/tools/macro-calculator", label: "ماشین حساب ماکرو"},
  {href: "/fa/app/calorie-counter", label: "کالری شمار"},
  {href: "/fa/app/food-diary", label: "دفتر تغذیه"},
  {href: "/fa/foods", label: "پایگاه داده غذاها"},
];

const jsonLd = jsonLdGraph([
  softwareApplicationJsonLd({
    name: "جیرو",
    path: canonicalPath,
    operatingSystem: "Web, iOS, Android",
    description:
      "جیرو یک ماکرو شمار و دفتر تغذیه فارسی است که پروتئین، کربوهیدرات و چربی را در کنار کالری ردیابی می‌کند.",
  }),
  breadcrumbJsonLd([
    {name: "جیرو", path: "/"},
    {name: "محصول", path: "/fa/app"},
    {name: "ماکرو شمار", path: canonicalPath},
  ]),
  faqPageJsonLd(faqs),
]);

export default function MacroTrackerPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />

      {/* Hero */}
      <section className="relative isolate border-b border-border/70">
        <MacroTrackerPattern />
        <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
          <PageNav />
          <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:gap-14 lg:py-16">
            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-right">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-black text-primary">
                <PieChartIcon className="size-4" aria-hidden="true" />
                ماکروها
              </p>
              <h1 className="mt-6 text-balance font-heading text-[clamp(2.5rem,10vw,5.25rem)] font-black leading-[1.16] tracking-normal lg:leading-[1.1]">
                ماکرو شمار فارسی
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-base font-semibold leading-8 text-muted-foreground sm:text-lg sm:leading-9 lg:mx-0">
                کالری تنها عددی نیست که باید بدانید. پروتئین، کربوهیدرات و
                چربی سه ماکروی اصلی هستند که کیفیت تغذیه شما را مشخص
                می‌کنند. با ردیابی ماکروها در کنار کالری، دید دقیق‌تری به
                غذای روزانه‌تان پیدا کنید.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  href={signupHref}
                  className={cn(buttonVariants({size: "xl"}), "h-12 rounded-full px-6")}
                >
                  شروع ردیابی ماکروها
                  <ArrowLeftIcon data-icon="inline-end" />
                </Link>
                <Link
                  href="/fa/tools/macro-calculator"
                  className={cn(
                    buttonVariants({variant: "outline", size: "xl"}),
                    "h-12 rounded-full px-6",
                  )}
                >
                  ماشین حساب ماکرو
                </Link>
              </div>
              <div className="mt-5">
                <SeoPageMeta
                  updatedAt="۱۴ تیر ۱۴۰۵"
                  disclaimer="این صفحه راهنمای محصول است و توصیه پزشکی یا رژیم درمانی ارائه نمی‌کند."
                />
              </div>
            </div>

            <MacroTrackerScene />
          </div>
        </div>
      </section>

      {/* What are macros */}
      <section className="border-b border-border/70 bg-card/20 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <SectionIntro
            eyebrow="شناخت ماکروها"
            title="ماکروها سه ستون اصلی تغذیه شما هستند."
            description="به جای فقط شمردن کالری، دانستن اینکه غذایتان از چه ساخته شده کمک می‌کند انتخاب‌های بهتری داشته باشید."
          />
          <div className="grid gap-3 sm:grid-cols-3">
            {macros.map((macro) => (
              <MacroInfoCard key={macro.name} {...macro} />
            ))}
          </div>
        </div>
      </section>

      {/* How Gyro tracks macros */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <SectionIntro
            eyebrow="قابلیت‌ها"
            title="جیرو ماکروها را ساده و قابل فهم ردیابی می‌کند."
            description="لازم نیست خودتان حساب کنید. جیرو از روی غذاهای ثبت‌شده، ماکروها را محاسبه و نمایش می‌دهد."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Why track macros */}
      <section className="border-y border-border/70 bg-card/20 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <SectionIntro
            eyebrow="چرا ماکرو ردیابی کنیم؟"
            title="تغذیه خوب فقط در کالری خلاصه نمی‌شود."
            description="ردیابی ماکروها کمک می‌کند بفهمید غذایتان چه کیفیتی دارد و چطور می‌توانید انتخاب‌های بهتری داشته باشید."
          />
          <div className="grid gap-3">
            <article className="rounded-3xl border border-border/80 bg-card/55 p-5">
              <h2 className="text-lg font-black">تغذیه متعادل‌تر</h2>
              <p className="mt-3 leading-8 text-muted-foreground">
                وقتی بدانید هر وعده چه مقدار پروتئین، کربوهیدرات و چربی
                دارد، راحت‌تر می‌توانید تعادل را در طول روز رعایت کنید.
              </p>
            </article>
            <article className="rounded-3xl border border-border/80 bg-card/55 p-5">
              <h2 className="text-lg font-black">کیفیت غذا فراتر از کالری</h2>
              <p className="mt-3 leading-8 text-muted-foreground">
                دو غذا ممکن است کالری یکسانی داشته باشند اما یکی پروتئین
                بیشتری داشته باشد و دیگری چربی. دانستن ماکروها به شما
                تصویر واقعی‌تری می‌دهد.
              </p>
            </article>
            <article className="rounded-3xl border border-border/80 bg-card/55 p-5">
              <h2 className="text-lg font-black">انتخاب‌های آگاهانه‌تر</h2>
              <p className="mt-3 leading-8 text-muted-foreground">
                وقتی الگوی غذایی‌تان را با ماکروها ببینید، راحت‌تر می‌توانید
                تشخیص دهید کجا بهتر است تغییری ایجاد کنید و کجا همه چیز
                خوب است.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="ابزارهای مرتبط"
            title="ابزارهایی که کنار ماکرو شمار به کارتان می‌آید."
            description="جیرو ابزارهای مختلفی برای مدیت تغذیه دارد که می‌توانید همراه ماکرو شمار از آن‌ها استفاده کنید."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {internalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center justify-between gap-3 rounded-3xl border border-border/80 bg-card/55 p-5 transition-colors hover:border-primary/40 hover:bg-card/80"
              >
                <span className="text-base font-black">{link.label}</span>
                <ArrowLeftIcon
                  className="size-4 text-muted-foreground transition-colors group-hover:text-primary"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-border/70 bg-card/20 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <SectionIntro
            eyebrow="پرسش‌های رایج"
            title="قبل از شروع، تکلیف چند سؤال را روشن کنیم."
            description="اگر سؤالی درباره ماکروها یا نحوه ردیابی آن‌ها در جیرو دارید، اینجا پاسخ رایج‌ترین‌ها را ببینید."
          />
          <div className="grid gap-3">
            {faqs.map((faq) => (
              <article
                key={faq.question}
                className="rounded-3xl border border-border/80 bg-card/55 p-5"
              >
                <h2 className="text-lg font-black">{faq.question}</h2>
                <p className="mt-3 leading-8 text-muted-foreground">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-14">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-5 px-4 text-center sm:px-6 lg:px-8">
          <h2 className="max-w-2xl text-balance font-heading text-3xl font-black leading-tight sm:text-4xl">
            امروز اولین غذا را ثبت کنید و ماکروها را ببینید.
          </h2>
          <p className="max-w-2xl leading-8 text-muted-foreground">
            لازم نیست از روز اول همه چیز را کامل کنید. با یک وعده شروع
            کنید و کم‌کم ببینید ترکیب غذاهایتان چطور است.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={signupHref}
              className={cn(buttonVariants({size: "xl"}), "h-12 rounded-full px-6")}
            >
              شروع ردیابی ماکروها
              <ArrowLeftIcon data-icon="inline-end" />
            </Link>
            <Link
              href="/"
              className={cn(
                buttonVariants({variant: "outline", size: "xl"}),
                "h-12 rounded-full px-6",
              )}
            >
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function PageNav() {
  return (
    <header className="flex items-center justify-between gap-4 py-3">
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
      <nav className="flex items-center gap-2" aria-label="ناوبری صفحه ماکرو شمار">
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

function MacroTrackerPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-[-18%] top-[-28%] h-[64rem] opacity-80 blur-3xl">
        <span className="absolute right-[10%] top-[18%] h-80 w-[38rem] rotate-[-12deg] rounded-full bg-[var(--nutrient-protein)]/20" />
        <span className="absolute left-[6%] top-[25%] h-72 w-[34rem] rotate-[18deg] rounded-full bg-primary/15" />
        <span className="absolute left-[28%] top-[4%] h-64 w-[28rem] rounded-full bg-[var(--nutrient-carbs)]/10" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--background)_14%,transparent),var(--background)_88%)]" />
      <div className="absolute inset-x-0 top-0 h-full opacity-[0.06] [background-image:linear-gradient(to_left,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] [background-size:56px_56px]" />
    </div>
  );
}

function MacroTrackerScene() {
  return (
    <div className="relative mx-auto w-full max-w-[34rem]" aria-label="نمای ماکرو شمار جیرو">
      <div className="absolute -left-6 top-14 z-20 hidden rounded-3xl border border-border/80 bg-card/85 p-4 shadow-2xl backdrop-blur lg:block">
        <div className="flex items-center gap-2 text-sm font-black">
          <TargetIcon className="size-4 text-primary" aria-hidden="true" />
          هدف روزانه ماکروها
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Image src="/brand/gyro-symbol-48.png" alt="" width={42} height={42} className="size-10" />
          <span className="grid">
            <b>جیرو</b>
            <small className="font-bold text-muted-foreground">ماکرو شمار فارسی</small>
          </span>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[22rem] rounded-[2.75rem] border border-border/90 bg-background p-3 shadow-[0_38px_120px_color-mix(in_oklch,var(--background)_76%,black)]">
        <div className="rounded-[2.25rem] border border-border/80 bg-card/95 p-4">
          <div className="mx-auto mb-5 h-1.5 w-20 rounded-full bg-muted" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/brand/gyro-symbol-48.png" alt="" width={36} height={36} className="size-9" />
              <span className="grid leading-tight">
                <strong className="text-sm font-black">جیرو</strong>
                <small className="text-[0.7rem] font-bold text-muted-foreground">ماکروهای امروز</small>
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-border/80 bg-background/55 p-4">
            <p className="text-sm font-bold text-muted-foreground">هدف امروز</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <strong className="text-4xl font-black tracking-normal">۱٬۸۵۰</strong>
              <span className="pb-1 text-xs font-black text-primary">کالری</span>
            </div>
            <div className="mt-4 grid gap-2">
              <MacroLine label="پروتئین" value="۸۲٪" width="82%" className="bg-[var(--nutrient-protein)]" />
              <MacroLine label="کربوهیدرات" value="۶۸٪" width="68%" className="bg-[var(--nutrient-carbs)]" />
              <MacroLine label="چربی" value="۵۴٪" width="54%" className="bg-[var(--nutrient-fat)]" />
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            {[
              ["صبحانه", "نان سنگک، تخم‌مرغ", "۴۲۰"],
              ["ناهار", "مرغ، برنج، سالاد", "۶۸۰"],
              ["میان‌وعده", "ماست، موز", "۲۴۰"],
            ].map(([meal, items, calories]) => (
              <div
                key={meal}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/45 px-3 py-3"
              >
                <span className="min-w-0">
                  <b className="block text-sm">{meal}</b>
                  <small className="block truncate text-xs font-bold text-muted-foreground">{items}</small>
                </span>
                <b className="shrink-0 text-sm tabular-nums">{calories}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionIntro({eyebrow, title, description}: {eyebrow: string; title: string; description: string}) {
  return (
    <div>
      <p className="text-sm font-black text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-balance font-heading text-3xl font-black leading-tight sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 leading-8 text-muted-foreground">{description}</p>
    </div>
  );
}

function FeatureCard({icon: Icon, title, description}: {
  icon: typeof ScaleIcon;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-3xl border border-border/80 bg-card/55 p-5 shadow-[inset_0_1px_0_color-mix(in_oklch,var(--foreground)_5%,transparent)]">
      <div className="grid size-11 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-lg font-black">{title}</h2>
      <p className="mt-3 leading-8 text-muted-foreground">{description}</p>
    </article>
  );
}

function MacroInfoCard({name, icon: Icon, description}: {
  name: string;
  icon: typeof BeefIcon;
  description: string;
}) {
  return (
    <article className="rounded-3xl border border-border/80 bg-card/55 p-5 shadow-[inset_0_1px_0_color-mix(in_oklch,var(--foreground)_5%,transparent)]">
      <div className="grid size-11 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-lg font-black">{name}</h2>
      <p className="mt-3 leading-8 text-muted-foreground">{description}</p>
    </article>
  );
}

function MacroLine({label, value, width, className}: {
  label: string;
  value: string;
  width: string;
  className: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs font-black">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", className)} style={{width}} />
      </div>
    </div>
  );
}
