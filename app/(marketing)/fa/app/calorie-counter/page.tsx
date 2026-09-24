import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftIcon,
  BarChart3Icon,
  CheckCircleIcon,
  LockKeyholeIcon,
  SearchIcon,
  TargetIcon,
  TrendingUpIcon,
  UtensilsIcon,
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
const canonicalPath = "/fa/app/calorie-counter";

export const metadata: Metadata = createPersianPageMetadata({
  path: canonicalPath,
  title: "کالری شمار فارسی | ثبت غذا و محاسبه کالری آنلاین با جیرو",
  description:
    "با جیرو غذا را فارسی ثبت کنید، کالری و ماکروها را ببینید و هدف روزانه‌تان را دنبال کنید. کالری شمار فارسی، کالری شمار آنلاین و ثبت کالری غذا در یک ابزار ساده.",
  ogTitle: "کالری شمار فارسی | جیرو",
  ogDescription:
    "ثبت غذا و محاسبه کالری آنلاین با جیرو؛ کالری شمار فارسی برای پیگیری تغذیه روزانه.",
  imageAlt: "کالری شمار فارسی جیرو",
});

const steps = [
  {
    icon: SearchIcon,
    title: "غذا را جست‌وجو کنید",
    description: "نام غذا را به فارسی تایپ کنید و از فهرست نتایج انتخاب کنید.",
  },
  {
    icon: UtensilsIcon,
    title: "مقدار را مشخص کنید",
    description: "اندازه وعده یا وزن غذا را انتخاب کنید تا محاسبه دقیق انجام شود.",
  },
  {
    icon: BarChart3Icon,
    title: "کالری و ماکروها را ببینید",
    description: "کالری کل، پروتئین، کربوهیدرات و چربی غذا را همان‌جا مشاهده کنید.",
  },
  {
    icon: TargetIcon,
    title: "هدف روزانه را دنبال کنید",
    description: "پیشرفت امروز را نسبت به هدف کالری و ماکروهایتان ببینید.",
  },
];

const features = [
  {
    icon: SearchIcon,
    title: "جست‌وجوی غذا",
    description: "غذاها را به فارسی جست‌وجو کنید و بدون دردسر ثبت کنید.",
  },
  {
    icon: TargetIcon,
    title: "هدف کالری",
    description: "هدف کالری روزانه خود را تعیین کنید و پیشرفتتان را ببینید.",
  },
  {
    icon: BarChart3Icon,
    title: "نمای ماکروها",
    description: "پروتئین، کربوهیدرات و چربی را کنار هم ببینید تا تغذیه‌تان متعادل باشد.",
  },
  {
    icon: TrendingUpIcon,
    title: "پیگیری پیشرفت",
    description: "روزها و هفته‌های گذشته را مرور کنید و روند تغییرات را ببینید.",
  },
];

const faqs = [
  {
    question: "چطور شروع کنم؟",
    answer:
      "کافی است حساب رایگان بسازید، غذای امروز را ثبت کنید و اولین قدم را بردارید. نیازی به تنظیمات پیچیده نیست.",
  },
  {
    question: "آیا غذاهای ایرانی را پوشش می‌دهد؟",
    answer:
      "بله. جیرو فارسی‌اول ساخته شده و مسیر محصول روی ثبت غذا و وعده‌ها برای کاربران فارسی‌زبان تمرکز دارد.",
  },
  {
    question: "آیا نیاز به خرید اشتراک دارم؟",
    answer:
      "خیر. برای شروع می‌توانید حساب رایگان بسازید و ثبت غذا را آغاز کنید. امکانات پیشرفته می‌توانند در پلن‌های پولی ارائه شوند.",
  },
  {
    question: "اگر غذای خانگی بخورم چطور ثبت کنم؟",
    answer:
      "غذاهای خانگی را می‌توانید با جست‌وجوی نام آن‌ها ثبت کنید. اگر غذایی در فهرست نبود، امکان ثبت دستی با اطلاعات تغذیه‌ای وجود دارد.",
  },
  {
    question: "آیا می‌توانم هدف کالری تعیین کنم؟",
    answer:
      "بله. هدف کالری روزانه خود را تنظیم کنید تا هر بار که غذا ثبت می‌کنید، پیشرفتتان نسبت به آن هدف نمایش داده شود.",
  },
];

const jsonLd = jsonLdGraph([
  softwareApplicationJsonLd({
    name: "جیرو",
    path: canonicalPath,
    operatingSystem: "Web, iOS, Android",
    description:
      "جیرو یک کالری شمار فارسی و دفتر تغذیه است که ثبت غذا، محاسبه کالری و پیگیری تغذیه روزانه را ساده می‌کند.",
  }),
  breadcrumbJsonLd([
    {name: "جیرو", path: "/"},
    {name: "محصول", path: "/app"},
    {name: "کالری شمار", path: canonicalPath},
  ]),
  faqPageJsonLd(faqs),
]);

export default function CalorieCounterPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
      <section className="relative isolate border-b border-border/70">
        <CalorieCounterPagePattern />
        <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
          <PageNav />
          <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:gap-14 lg:py-16">
            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-right">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-black text-primary">
                <UtensilsIcon className="size-4" aria-hidden="true" />
                ثبت غذا و کالری
              </p>
              <h1 className="mt-6 text-balance font-heading text-[clamp(2.5rem,10vw,5.25rem)] font-black leading-[1.16] tracking-normal lg:leading-[1.1]">
                کالری شمار فارسی
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-base font-semibold leading-8 text-muted-foreground sm:text-lg sm:leading-9 lg:mx-0">
                غذای امروز را فارسی ثبت کنید، کالری و ماکروها را همان‌جا
                ببینید و بدون درگیر شدن با ابزارهای پیچیده، بفهمید چقدر به هدف
                روزانه نزدیک شده‌اید.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  href={signupHref}
                  className={cn(buttonVariants({size: "xl"}), "h-12 rounded-full px-6")}
                >
                  ثبت اولین غذای امروز
                  <ArrowLeftIcon data-icon="inline-end" />
                </Link>
                <Link
                  href="/fa/tools/calorie-calculator"
                  className={cn(
                    buttonVariants({variant: "outline", size: "xl"}),
                    "h-12 rounded-full px-6",
                  )}
                >
                  ماشین حساب کالری
                </Link>
              </div>
              <div className="mt-5">
                <SeoPageMeta
                  updatedAt="۱۴ تیر ۱۴۰۵"
                  disclaimer="این صفحه راهنمای محصول است و توصیه پزشکی یا رژیم درمانی ارائه نمی‌دهد."
                />
              </div>
            </div>

            <CalorieCounterProductScene />
          </div>
        </div>
      </section>

      <section className="border-b border-border/70 bg-card/20 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <SectionIntro
            eyebrow="چطور کار می‌کند"
            title="ثبت غذا در چهار مرحله ساده انجام می‌شود."
            description="از جست‌وجوی غذا تا پیگیری هدف روزانه، همه چیز در یک مسیر ساده طراحی شده تا ثبت کردن عادت شود."
          />
          <ol className="grid gap-3">
            {steps.map((step, index) => (
              <StepCard key={step.title} index={index + 1} {...step} />
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <SectionIntro
            eyebrow="امکانات"
            title="ابزاری که برای پیگیری تغذیه روزانه نیاز دارید."
            description="جیرو روی سادگی و کاربردی بودن تمرکز دارد: از جست‌وجوی غذا تا دیدن روند پیشرفت."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-card/20 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <SectionIntro
            eyebrow="پرسش‌های رایج"
            title="قبل از شروع، تکلیف چند سؤال را روشن کنیم."
            description="اگر سؤالی دارید که اینجا نیست، با ما در تماس باشید تا راهنماییتان کنیم."
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

      <section className="py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <SectionIntro
            eyebrow="لینک‌های مرتبط"
            title="ابزارها و صفحات مفید"
            description="ابزارهای بیشتری برای کمک به پیگیری تغذیه و سلامتی شما."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/fa/app/calorie-counter-iphone"
              className="rounded-3xl border border-border/80 bg-card/55 p-5 shadow-[inset_0_1px_0_color-mix(in_oklch,var(--foreground)_5%,transparent)] transition-colors hover:border-primary/40"
            >
              <h2 className="text-lg font-black">کالری شمار آیفون</h2>
              <p className="mt-3 leading-8 text-muted-foreground">
                کالری شمار فارسی برای کاربران آیفون، از طریق وب اپ.
              </p>
            </Link>
            <Link
              href="/fa/tools/calorie-calculator"
              className="rounded-3xl border border-border/80 bg-card/55 p-5 shadow-[inset_0_1px_0_color-mix(in_oklch,var(--foreground)_5%,transparent)] transition-colors hover:border-primary/40"
            >
              <h2 className="text-lg font-black">ماشین حساب کالری</h2>
              <p className="mt-3 leading-8 text-muted-foreground">
                کالری مورد نیاز روزانه خود را با ماشین حساب جیرو محاسبه کنید.
              </p>
            </Link>
            <Link
              href="/fa/foods"
              className="rounded-3xl border border-border/80 bg-card/55 p-5 shadow-[inset_0_1px_0_color-mix(in_oklch,var(--foreground)_5%,transparent)] transition-colors hover:border-primary/40"
            >
              <h2 className="text-lg font-black">پایگاه داده غذاها</h2>
              <p className="mt-3 leading-8 text-muted-foreground">
                اطلاعات تغذیه‌ای غذاهای ایرانی و بین‌المللی.
              </p>
            </Link>
            <Link
              href="/fa/app/persian-calorie-counter"
              className="rounded-3xl border border-border/80 bg-card/55 p-5 shadow-[inset_0_1px_0_color-mix(in_oklch,var(--foreground)_5%,transparent)] transition-colors hover:border-primary/40"
            >
              <h2 className="text-lg font-black">کالری شمار فارسی</h2>
              <p className="mt-3 leading-8 text-muted-foreground">
                کالری شمار فارسی جیرو با تمرکز بر غذاهای ایرانی.
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border/70 bg-card/20 py-14">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-5 px-4 text-center sm:px-6 lg:px-8">
          <h2 className="max-w-2xl text-balance font-heading text-3xl font-black leading-tight sm:text-4xl">
            امروز اولین غذا را ثبت کنید.
          </h2>
          <p className="max-w-2xl leading-8 text-muted-foreground">
            لازم نیست همه چیز را از روز اول کامل کنید. با یک وعده شروع کنید،
            عددها را ببینید و کم‌کم عادت ثبت روزانه را بسازید.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={signupHref}
              className={cn(buttonVariants({size: "xl"}), "h-12 rounded-full px-6")}
            >
              ثبت اولین غذا
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
      <nav className="flex items-center gap-2" aria-label="ناوبری صفحه کالری شمار">
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

function CalorieCounterPagePattern() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-[-18%] top-[-28%] h-[64rem] opacity-80 blur-3xl">
        <span className="absolute right-[10%] top-[18%] h-80 w-[38rem] rotate-[-12deg] rounded-full bg-primary/20" />
        <span className="absolute left-[6%] top-[25%] h-72 w-[34rem] rotate-[18deg] rounded-full bg-[var(--nutrient-protein)]/15" />
        <span className="absolute left-[28%] top-[4%] h-64 w-[28rem] rounded-full bg-[var(--nutrient-carbs)]/10" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--background)_14%,transparent),var(--background)_88%)]" />
      <div className="absolute inset-x-0 top-0 h-full opacity-[0.06] [background-image:linear-gradient(to_left,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] [background-size:56px_56px]" />
    </div>
  );
}

function CalorieCounterProductScene() {
  return (
    <div className="relative mx-auto w-full max-w-[34rem]" aria-label="نمای کالری شمار فارسی جیرو">
      <div className="absolute -left-6 top-14 z-20 hidden rounded-3xl border border-border/80 bg-card/85 p-4 shadow-2xl backdrop-blur lg:block">
        <div className="flex items-center gap-2 text-sm font-black">
          <CheckCircleIcon className="size-4 text-primary" aria-hidden="true" />
          ثبت غذای امروز
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Image src="/brand/gyro-symbol-48.png" alt="" width={42} height={42} className="size-10" />
          <span className="grid">
            <b>جیرو</b>
            <small className="font-bold text-muted-foreground">کالری شمار فارسی</small>
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
                <small className="text-[0.7rem] font-bold text-muted-foreground">امروز</small>
              </span>
            </div>
            <span className="grid size-10 place-items-center rounded-2xl border border-border bg-muted/45 text-primary">
              <UtensilsIcon className="size-5" aria-hidden="true" />
            </span>
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
  icon: typeof SearchIcon;
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

function StepCard({icon: Icon, index, title, description}: {
  icon: typeof SearchIcon;
  index: number;
  title: string;
  description: string;
}) {
  return (
    <li className="grid gap-4 rounded-3xl border border-border/80 bg-card/55 p-5 sm:grid-cols-[auto_1fr]">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-sm font-black text-primary">
          {index}
        </span>
        <span className="grid size-11 place-items-center rounded-2xl border border-border bg-background/65 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <div>
        <h2 className="text-lg font-black">{title}</h2>
        <p className="mt-2 leading-8 text-muted-foreground">{description}</p>
      </div>
    </li>
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
