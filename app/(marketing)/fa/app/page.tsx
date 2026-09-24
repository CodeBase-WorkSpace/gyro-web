import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftIcon,
  BarChart3Icon,
  LockKeyholeIcon,
  ScaleIcon,
  SearchIcon,
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
const canonicalPath = "/fa/app";

export const metadata: Metadata = createPersianPageMetadata({
  path: canonicalPath,
  title: "جیرو | دفتر تغذیه فارسی — ثبت غذا، کالری و ماکروها",
  description:
    "جیرو دفتر تغذیه فارسی است؛ غذا را به فارسی ثبت کنید، کالری و ماکروها را ببینید و پیشرفت روزانه‌تان را بدون پیچیدگی دنبال کنید.",
  ogTitle: "جیرو | دفتر تغذیه فارسی",
  ogDescription:
    "دفتر تغذیه فارسی برای ثبت غذا، کالری و ماکروها در وب اپ ساده و رایگان.",
  imageAlt: "دفتر تغذیه فارسی جیرو",
});

const features = [
  {
    icon: SearchIcon,
    title: "ثبت غذا",
    description: "غذا را به فارسی جست‌وجو و ثبت کنید، بدون نیاز به ترجمه یا حدس زدن نام‌های انگلیسی.",
  },
  {
    icon: BarChart3Icon,
    title: "محاسبه کالری",
    description: "کالری هر وعده و مجموع روزانه را کنار هدف روزانه ببینید تا بدانید چقدر به هدف نزدیک شده‌اید.",
  },
  {
    icon: ScaleIcon,
    title: "ماکروها",
    description: "پروتئین، کربوهیدرات و چربی را جداگانه پیگیری کنید تا تغذیه‌تان متعادل بماند.",
  },
  {
    icon: TrendingUpIcon,
    title: "پیشرفت",
    description: "وزن و روند پیشرفت روزانه و هفتگی‌تان را در یک نگاه ببینید.",
  },
  {
    icon: UtensilsIcon,
    title: "غذاهای ایرانی",
    description: "جیرو برای کاربر فارسی‌زبان ساخته شده و مسیر محصول روی غذا و عادت‌های روزانه شما تمرکز دارد.",
  },
  {
    icon: LockKeyholeIcon,
    title: "حریم خصوصی",
    description: "ثبت غذا و وزن یک کار شخصی است. داده‌های شما فقط برای مدیریت حساب‌تان نگه داشته می‌شود.",
  },
];

const productPages = [
  {
    title: "کالری شمار",
    description: "کالری و ماکروهای هر وعده را سریع ثبت و پیگیری کنید.",
    href: "/fa/app/calorie-counter",
  },
  {
    title: "کالری شمار فارسی",
    description: "مسیر ثبت غذا به فارسی، برای کاربری که با زبان فارسی راحت‌تر است.",
    href: "/fa/app/persian-calorie-counter",
  },
  {
    title: "دفتر تغذیه",
    description: "هر وعده را با جزئیات ثبت کنید و در پایان روز ببینید چه خورده‌اید.",
    href: "/fa/app/food-diary",
  },
  {
    title: "ماکرو شمار",
    description: "پروتئین، کربوهیدرات و چربی را جداگانه دنبال کنید.",
    href: "/fa/app/macro-tracker",
  },
  {
    title: "کالری شمار آیفون",
    description: "جیرو را روی آیفون از طریق وب اپ نصب کنید و مثل یک ابزار روزانه از آن استفاده کنید.",
    href: "/fa/app/calorie-counter-iphone",
  },
];

const faqs = [
  {
    question: "جیرو چیست؟",
    answer:
      "جیرو یک دفتر تغذیه فارسی است که به شما کمک می‌کند غذا، کالری و ماکروها را به فارسی ثبت کنید و پیشرفت روزانه‌تان را پیگیری کنید.",
  },
  {
    question: "آیا جیرو رایگان است؟",
    answer:
      "برای شروع می‌توانید حساب رایگان بسازید و ثبت غذا را آغاز کنید. امکانات پیشرفته می‌توانند در پلن‌های پولی ارائه شوند.",
  },
  {
    question: "آیا غذاهای ایرانی در جیرو پشتیبانی می‌شوند؟",
    answer:
      "بله. جیرو فارسی‌اول ساخته شده و مسیر محصول آن روی ثبت غذا و عادت‌های روزانه کاربران فارسی‌زبان تمرکز دارد.",
  },
  {
    question: "جیرو اپلیکیشن است یا وب‌سایت؟",
    answer:
      "جیرو در حال حاضر یک وب اپ/PWA است. یعنی از طریق مرورگر روی هر دستگاهی قابل استفاده است و می‌توانید آن را به صفحه اصلی موبایل اضافه کنید.",
  },
  {
    question: "حریم خصوصی من چطور تضمین می‌شود؟",
    answer:
      "ثبت غذا و وزن یک کار شخصی است. جیرو این داده‌ها را فقط برای مدیریت حساب خودتان نگه می‌دارد و آن‌ها را در اختیار دیگران قرار نمی‌دهد.",
  },
];

const jsonLd = jsonLdGraph([
  softwareApplicationJsonLd({
    name: "جیرو",
    path: canonicalPath,
    operatingSystem: "Web, iOS, Android",
    description:
      "جیرو یک دفتر تغذیه فارسی است که ثبت غذا، کالری و ماکروها را برای کاربران فارسی‌زبان ساده می‌کند.",
  }),
  breadcrumbJsonLd([
    {name: "جیرو", path: "/"},
    {name: "محصول جیرو", path: canonicalPath},
  ]),
  faqPageJsonLd(faqs),
]);

export default function AppHubPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />

      {/* Hero */}
      <section className="relative isolate border-b border-border/70">
        <HeroPattern />
        <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
          <PageNav />
          <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:gap-14 lg:py-16">
            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-right">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-black text-primary">
                محصول جیرو
              </p>
              <h1 className="mt-6 text-balance font-heading text-[clamp(2.5rem,10vw,5.25rem)] font-black leading-[1.16] tracking-normal lg:leading-[1.1]">
                دفتر تغذیه فارسی برای ثبت غذا، کالری و ماکروها
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-base font-semibold leading-8 text-muted-foreground sm:text-lg sm:leading-9 lg:mx-0">
                جیرو دفتر تغذیه فارسی است که ثبت غذا، کالری و ماکروها را برای
                کاربر فارسی‌زبان ساده می‌کند. غذا را به فارسی ثبت کنید، عددها را
                ببینید و بدون درگیر شدن با اپ‌های شلوغ، تغذیه روزانه‌تان را
                پیگیری کنید.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  href={signupHref}
                  className={cn(buttonVariants({size: "xl"}), "h-12 rounded-full px-6")}
                >
                  ثبت نام رایگان
                  <ArrowLeftIcon data-icon="inline-end" />
                </Link>
                <Link
                  href="#features"
                  className={cn(
                    buttonVariants({variant: "outline", size: "xl"}),
                    "h-12 rounded-full px-6",
                  )}
                >
                  دیدن امکانات
                </Link>
              </div>
              <div className="mt-5">
                <SeoPageMeta
                  updatedAt="۱۴ تیر ۱۴۰۵"
                  disclaimer="این صفحه راهنمای محصول است و توصیه پزشکی یا رژیم درمانی ارائه نمی‌دهد."
                />
              </div>
            </div>

            <HeroProductScene />
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="scroll-mt-24 border-b border-border/70 bg-card/20 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <SectionIntro
            eyebrow="امکانات جیرو"
            title="هر آنچه برای پیگیری تغذیه روزانه نیاز دارید."
            description="جیرو روی مسیر روزانه ثبت غذا تمرکز دارد: پیدا کردن غذا، انتخاب مقدار، دیدن هدف و ادامه دادن."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Product pages */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <SectionIntro
            eyebrow="صفحات محصول"
            title="هر ویژگی جیرو را جداگانه ببینید."
            description="جیرو چند صفحه محصول دارد که هر کدام بخشی از امکانات را معرفی می‌کنند."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {productPages.map((page) => (
              <ProductPageCard key={page.href} {...page} />
            ))}
          </div>
        </div>
      </section>

      {/* PWA section */}
      <section className="border-y border-border/70 bg-card/20 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <SectionIntro
              eyebrow="وب اپ / PWA"
              title="جیرو روی هر دستگاهی کار می‌کند."
              description="لازم نیست منتظر نسخه اپلیکیشن بمانید. جیرو یک وب اپ است که از مرورگر روی موبایل، تبلت و کامپیوتر باز می‌شود."
            />
          </div>
          <div className="grid gap-3 lg:col-span-7 sm:grid-cols-3">
            {[
              {title: "بدون نصب", description: "فقط کافی است آدرس سایت را در مرورگر باز کنید."},
              {title: "روی هر دستگاه", description: "موبایل، تبلت، کامپیوتر — هر جایی که مرورگر دارید."},
              {title: "اضافه به صفحه اصلی", description: "در iOS و Android می‌توانید آن را مثل اپ به صفحه اصلی اضافه کنید."},
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-3xl border border-border/80 bg-card/55 p-5"
              >
                <h2 className="text-lg font-black">{item.title}</h2>
                <p className="mt-3 leading-8 text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <SectionIntro
            eyebrow="پرسش‌های رایج"
            title="قبل از شروع، تکلیف چند سؤال را روشن کنیم."
            description="جیرو قرار نیست با وعده‌های بزرگ شما را قانع کند. بهتر است دقیق بدانید چه چیزی هست، چه چیزی نیست."
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
      <section className="border-t border-border/70 bg-card/20 py-14">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-5 px-4 text-center sm:px-6 lg:px-8">
          <h2 className="max-w-2xl text-balance font-heading text-3xl font-black leading-tight sm:text-4xl">
            همین الان شروع کنید
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
              ثبت نام رایگان
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

/* ---------- Helper components ---------- */

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
      <nav className="flex items-center gap-2" aria-label="ناوبری صفحه محصول جیرو">
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

function HeroPattern() {
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

function HeroProductScene() {
  return (
    <div className="relative mx-auto w-full max-w-[34rem]" aria-label="نمای دفتر تغذیه فارسی جیرو">
      <div className="relative mx-auto w-full max-w-[22rem] rounded-[2.75rem] border border-border/90 bg-background p-3 shadow-[0_38px_120px_color-mix(in_oklch,var(--background)_76%,black)]">
        <div className="rounded-[2.25rem] border border-border/80 bg-card/95 p-4">
          <div className="mx-auto mb-5 h-1.5 w-20 rounded-full bg-muted" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/brand/gyro-symbol-48.png" alt="" width={36} height={36} className="size-9" />
              <span className="grid leading-tight">
                <strong className="text-sm font-black">جیرو</strong>
                <small className="text-[0.7rem] font-bold text-muted-foreground">دفتر تغذیه فارسی</small>
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

function ProductPageCard({title, description, href}: {title: string; description: string; href: string}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-border/80 bg-card/55 p-5 shadow-[inset_0_1px_0_color-mix(in_oklch,var(--foreground)_5%,transparent)] transition-colors hover:border-primary/30 hover:bg-card/70"
    >
      <h2 className="text-lg font-black">{title}</h2>
      <p className="mt-3 leading-8 text-muted-foreground">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">
        مشاهده
        <ArrowLeftIcon className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
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
