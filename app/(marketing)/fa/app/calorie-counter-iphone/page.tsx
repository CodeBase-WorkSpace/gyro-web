import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AppleIcon,
  ArrowLeftIcon,
  BarChart3Icon,
  CheckIcon,
  HomeIcon,
  LockKeyholeIcon,
  PlusIcon,
  SearchIcon,
  ShareIcon,
  SmartphoneIcon,
  SparklesIcon,
  UtensilsIcon,
} from "lucide-react";

import {SeoPageMeta} from "@/components/seo/seo-page-meta";
import {buttonVariants} from "@/components/ui/button";
import {MarketingInstallLink} from "@/components/public/marketing-install-link";
import {breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, softwareApplicationJsonLd,} from "@/lib/seo/json-ld";
import {appBaseUrl, createPersianPageMetadata,} from "@/lib/seo/metadata";
import {cn} from "@/lib/utils";

const signupHref = `${appBaseUrl}/auth/signup`;
const canonicalPath = "/fa/app/calorie-counter-iphone";

export const metadata: Metadata = createPersianPageMetadata({
  path: canonicalPath,
  title: "کالری شمار آیفون | ثبت غذا و محاسبه کالری با جیرو",
  description:
    "با جیرو روی آیفون غذا را فارسی ثبت کنید، کالری و ماکروها را ببینید و هدف روزانه‌تان را بدون پیچیدگی دنبال کنید.",
  ogTitle: "کالری شمار آیفون | جیرو",
  ogDescription:
    "کالری شمار فارسی برای آیفون؛ ثبت غذا، هدف روزانه و ماکروها در یک وب اپ ساده.",
  imageAlt: "کالری شمار آیفون جیرو",
});

const features = [
  {
    icon: SearchIcon,
    title: "غذا را با زبان خودتان پیدا کنید",
    description: "به جای حدس زدن بین نام‌های انگلیسی، مسیر ثبت غذا برای کاربر فارسی‌زبان طراحی شده است.",
  },
  {
    icon: UtensilsIcon,
    title: "هر وعده سر جای خودش",
    description: "صبحانه، ناهار، شام و میان‌وعده‌ها را جدا ثبت کنید تا آخر روز بدانید چه خورده‌اید.",
  },
  {
    icon: BarChart3Icon,
    title: "عددها قابل فهم می‌شوند",
    description: "کالری، پروتئین، کربوهیدرات و چربی را کنار هدف روزانه ببینید، نه در چند صفحه پراکنده.",
  },
  {
    icon: LockKeyholeIcon,
    title: "بدون نمایش عمومی زندگی غذایی شما",
    description: "ثبت غذا و وزن یک کار شخصی است. جیرو این داده‌ها را برای مدیریت حساب خودتان نگه می‌دارد.",
  },
];

const installSteps = [
  {
    icon: SmartphoneIcon,
    title: "جیرو را در Safari باز کنید",
    description: "وارد gyrohealth.ir شوید، حساب رایگان بسازید و اولین غذای امروز را ثبت کنید.",
  },
  {
    icon: ShareIcon,
    title: "دکمه Share را بزنید",
    description: "از نوار پایین Safari، منوی اشتراک‌گذاری آیفون را باز کنید.",
  },
  {
    icon: HomeIcon,
    title: "Add to Home Screen",
    description: "آیکن جیرو روی صفحه اصلی می‌آید تا ثبت غذا با یک لمس شروع شود.",
  },
];

const faqs = [
  {
    question: "آیا جیرو اپ آیفون دارد؟",
    answer:
      "در حال حاضر جیرو روی آیفون به عنوان وب اپ فارسی قابل استفاده است. تا وقتی نسخه App Store منتشر نشده، آن را اپ native معرفی نمی‌کنیم.",
  },
  {
    question: "آیا می‌توانم غذاهای ایرانی را ثبت کنم؟",
    answer:
      "بله. جیرو فارسی‌اول ساخته شده و مسیر محصول آن روی ثبت غذا، وعده‌ها، هدف کالری و پیگیری تغذیه برای کاربران فارسی‌زبان تمرکز دارد.",
  },
  {
    question: "برای شروع باید اشتراک بخرم؟",
    answer:
      "خیر. برای شروع می‌توانید حساب رایگان بسازید و ثبت غذا را آغاز کنید. امکانات پیشرفته می‌توانند در پلن‌های پولی ارائه شوند.",
  },
];

const jsonLd = jsonLdGraph([
  softwareApplicationJsonLd({
    name: "جیرو",
    path: canonicalPath,
    operatingSystem: "iOS, Web",
    description:
      "جیرو یک کالری شمار و دفتر تغذیه فارسی است که روی آیفون از طریق وب اپ قابل استفاده است.",
  }),
  breadcrumbJsonLd([
    {name: "جیرو", path: "/"},
    {name: "کالری شمار آیفون", path: canonicalPath},
  ]),
  faqPageJsonLd(faqs),
]);

export default function IPhoneCalorieCounterPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
      <section className="relative isolate border-b border-border/70">
        <IPhonePagePattern />
        <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
          <PageNav />
          <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:gap-14 lg:py-16">
            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-right">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-black text-primary">
                <AppleIcon className="size-4" aria-hidden="true" />
                برای کاربر آیفون که فارسی غذا ثبت می‌کند
              </p>
              <h1 className="mt-6 text-balance font-heading text-[clamp(2.5rem,10vw,5.25rem)] font-black leading-[1.16] tracking-normal lg:leading-[1.1]">
                کالری شمار آیفون
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-base font-semibold leading-8 text-muted-foreground sm:text-lg sm:leading-9 lg:mx-0">
                غذای امروز را روی آیفون ثبت کنید، کالری و ماکروها را همان‌جا
                ببینید و بدون درگیر شدن با اپ‌های شلوغ، بفهمید چقدر به هدف
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
                  href="#install"
                  className={cn(
                    buttonVariants({variant: "outline", size: "xl"}),
                    "h-12 rounded-full px-6",
                  )}
                >
                  دیدن روش نصب
                </Link>
              </div>
              <p className="mt-5 max-w-xl text-sm font-bold leading-7 text-muted-foreground lg:mx-0">
                شفاف و بدون ادعای اضافه: جیرو فعلا وب اپ/PWA است، نه نسخه
                App Store. روی آیفون بازش می‌کنید و مثل یک ابزار روزانه از آن
                استفاده می‌کنید.
              </p>
              <div className="mt-5">
                <SeoPageMeta
                  updatedAt="۱۴ تیر ۱۴۰۵"
                  disclaimer="این صفحه راهنمای محصول است و توصیه پزشکی یا رژیم درمانی ارائه نمی‌کند."
                />
              </div>
            </div>

            <IPhoneProductScene />
          </div>
        </div>
      </section>

      <section className="border-b border-border/70 bg-card/20 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <SectionIntro
            eyebrow="چرا جیرو"
            title="چون کالری شماری وقتی ادامه پیدا می‌کند که ثبت کردنش سخت نباشد."
            description="اگر هر وعده ثبت کردن شبیه فرم پر کردن باشد، بعد از چند روز رها می‌شود. جیرو روی مسیر روزانه تمرکز می‌کند: پیدا کردن غذا، انتخاب مقدار، دیدن هدف و ادامه دادن."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section id="install" className="scroll-mt-24 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <SectionIntro
              eyebrow="نصب روی آیفون"
              title="جیرو را کنار بقیه اپ‌های روزانه‌تان بگذارید."
              description="لازم نیست برای شروع منتظر نسخه App Store بمانید. وب اپ جیرو از صفحه اصلی آیفون باز می‌شود و برای ثبت غذا همیشه در دسترس است."
            />
          </div>
          <ol className="grid gap-3 lg:col-span-7">
            {installSteps.map((step, index) => (
              <InstallStep key={step.title} index={index + 1} {...step} />
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-border/70 bg-card/20 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <SectionIntro
            eyebrow="مقایسه ساده"
            title="یک کالری شمار فارسی باید با غذا و عادت روزانه شما کنار بیاید."
            description="اگر برای هر وعده مجبور شوید اسم غذا را ترجمه کنید یا بین چند مسیر گیج شوید، ابزار به جای کمک، اصطکاک می‌سازد."
          />
          <div className="overflow-hidden rounded-3xl border border-border/80 bg-background/60">
            <ComparisonRow label="زبان و جهت" generic="اغلب انگلیسی یا نیمه‌فارسی"
                           gyro="فارسی، راست‌به‌چپ و قابل خواندن روی موبایل"/>
            <ComparisonRow label="ثبت روزانه" generic="چند مرحله برای یک وعده ساده"
                           gyro="ثبت غذا با تمرکز روی وعده امروز"/>
            <ComparisonRow label="غذاهای ایرانی" generic="جست‌وجوی سخت یا ورود دستی مکرر"
                           gyro="مسیر محصول برای غذای فارسی‌زبان طراحی شده"/>
            <ComparisonRow label="شروع استفاده" generic="منتظر نصب یا تنظیمات طولانی"
                           gyro="باز کردن وب اپ، ساخت حساب و شروع ثبت"/>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <SectionIntro
            eyebrow="پرسش‌های رایج"
            title="قبل از شروع، تکلیف چند سؤال را روشن کنیم."
            description="جیرو قرار نیست با وعده‌های بزرگ شما را قانع کند. بهتر است دقیق بدانید چه چیزی هست، چه چیزی نیست و چطور روی آیفون استفاده می‌شود."
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

      <section className="border-y border-border/70 bg-card/20 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <SectionIntro
            eyebrow="صفحات مرتبط"
            title="درباره جیرو بیشتر بدانید."
            description="امکانات مختلف جیرو را در صفحات جداگانه ببینید."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/fa/app" className="group rounded-3xl border border-border/80 bg-card/55 p-5 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <h3 className="text-lg font-black group-hover:text-primary">همه امکانات جیرو</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">محصول جیرو و امکانات آن را ببینید.</p>
            </Link>
            <Link href="/fa/app/calorie-counter" className="group rounded-3xl border border-border/80 bg-card/55 p-5 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <h3 className="text-lg font-black group-hover:text-primary">کالری شمار فارسی</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">ثبت غذا و محاسبه کالری با زبان فارسی.</p>
            </Link>
            <Link href="/fa/app/persian-calorie-counter" className="group rounded-3xl border border-border/80 bg-card/55 p-5 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <h3 className="text-lg font-black group-hover:text-primary">کالری شمار فارسی</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">نسخه ویژه کالری شمار برای غذاهای ایرانی.</p>
            </Link>
            <Link href="/fa/app/food-diary" className="group rounded-3xl border border-border/80 bg-card/55 p-5 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <h3 className="text-lg font-black group-hover:text-primary">دفتر تغذیه</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">ثبت روزانه غذا و پیگیری عادت غذایی.</p>
            </Link>
            <Link href="/fa/app/macro-tracker" className="group rounded-3xl border border-border/80 bg-card/55 p-5 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <h3 className="text-lg font-black group-hover:text-primary">ماکرو شمار</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">پیگیری پروتئین، کربوهیدرات و چربی.</p>
            </Link>
            <Link href="/fa/tools/calorie-calculator" className="group rounded-3xl border border-border/80 bg-card/55 p-5 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <h3 className="text-lg font-black group-hover:text-primary">ماشین حساب کالری</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">پیش از ثبت غذا، یک هدف تقریبی روزانه بسازید.</p>
            </Link>
            <Link href="/fa/foods" className="group rounded-3xl border border-border/80 bg-card/55 p-5 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <h3 className="text-lg font-black group-hover:text-primary">جدول کالری غذاهای ایرانی</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">کالری، ماکروها و اندازه سهم غذاهای آشنا را ببینید.</p>
            </Link>
            <Link href="/fa/guides/calorie-deficit" className="group rounded-3xl border border-border/80 bg-card/55 p-5 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <h3 className="text-lg font-black group-hover:text-primary">راهنمای کسری کالری</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">کسری کالری را با چارچوبی محتاطانه و قابل بازبینی بشناسید.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border/70 bg-card/20 py-14">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-5 px-4 text-center sm:px-6 lg:px-8">
          <h2 className="max-w-2xl text-balance font-heading text-3xl font-black leading-tight sm:text-4xl">
            امروز فقط یک کار انجام دهید: اولین غذا را ثبت کنید.
          </h2>
          <p className="max-w-2xl leading-8 text-muted-foreground">
            لازم نیست همه چیز را از روز اول کامل کنید. با یک وعده شروع کنید،
            عددها را ببینید و کم‌کم عادت ثبت روزانه را بسازید.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
            <Link href="/fa/app" className="transition-colors hover:text-primary">محصول جیرو</Link>
            <span aria-hidden="true">·</span>
            <Link href="/fa/app/calorie-counter" className="transition-colors hover:text-primary">کالری شمار فارسی</Link>
          </div>
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
      <nav className="flex items-center gap-2" aria-label="ناوبری صفحه کالری شمار آیفون">
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

function IPhonePagePattern() {
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

function IPhoneProductScene() {
  return (
    <div className="relative mx-auto w-full max-w-[34rem]" aria-label="نمای کالری شمار آیفون جیرو">
      <div className="absolute -left-6 top-14 z-20 hidden rounded-3xl border border-border/80 bg-card/85 p-4 shadow-2xl backdrop-blur lg:block">
        <div className="flex items-center gap-2 text-sm font-black">
          <SparklesIcon className="size-4 text-primary" aria-hidden="true" />
          نصب شده روی آیفون
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Image src="/brand/gyro-symbol-48.png" alt="" width={42} height={42} className="size-10" />
          <span className="grid">
            <b>جیرو</b>
            <small className="font-bold text-muted-foreground">Add to Home Screen</small>
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
                <small className="text-[0.7rem] font-bold text-muted-foreground">امروز روی آیفون</small>
              </span>
            </div>
            <span className="grid size-10 place-items-center rounded-2xl border border-border bg-muted/45 text-primary">
              <PlusIcon className="size-5" aria-hidden="true" />
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

function InstallStep({icon: Icon, index, title, description}: {
  icon: typeof SmartphoneIcon;
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

function ComparisonRow({label, generic, gyro}: {label: string; generic: string; gyro: string}) {
  return (
    <div className="grid gap-0 border-b border-border/70 last:border-b-0 sm:grid-cols-[0.62fr_1fr_1fr]">
      <div className="bg-card/45 px-4 py-4 text-sm font-black text-muted-foreground">{label}</div>
      <div className="border-t border-border/70 px-4 py-4 leading-8 text-muted-foreground sm:border-r sm:border-t-0">
        {generic}
      </div>
      <div className="flex items-start gap-2 border-t border-border/70 px-4 py-4 font-bold leading-8 sm:border-r sm:border-t-0">
        <CheckIcon className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
        {gyro}
      </div>
    </div>
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
