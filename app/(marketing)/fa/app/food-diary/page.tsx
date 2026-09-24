import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  LockKeyholeIcon,
  SearchIcon,
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
const canonicalPath = "/fa/app/food-diary";

export const metadata: Metadata = createPersianPageMetadata({
  path: canonicalPath,
  title: "دفتر تغذیه فارسی | ثبت و پیگیری غذای روزانه با جیرو",
  description:
    "دفتر تغذیه فارسی برای ثبت غذای روزانه و پیگیری غذای روزانه. با جیرو وعده‌ها را ثبت کنید و الگوی غذایی‌تان را ببینید.",
  ogTitle: "دفتر تغذیه فارسی | جیرو",
  ogDescription:
    "دفتر تغذیه فارسی برای ثبت و پیگیری غذای روزانه؛ وعده‌ها، کالری و خلاصه روز در یک ابزار ساده.",
  imageAlt: "دفتر تغذیه فارسی جیرو",
});

const steps = [
  {
    icon: UtensilsIcon,
    title: "صبحانه، ناهار، شام، میان‌وعده",
    description: "وعده‌های غذایی از قبل دسته‌بندی شده‌اند. کافی است وعده مورد نظر را انتخاب کنید.",
  },
  {
    icon: SearchIcon,
    title: "غذا را انتخاب کنید",
    description: "در میان غذاهای فارسی جست‌وجو کنید و غذایی که خورده‌اید را پیدا کنید.",
  },
  {
    icon: ClipboardListIcon,
    title: "مقدار را وارد کنید",
    description: "اندازه وعده را مشخص کنید تا کالری و ماکروها به‌صورت خودکار محاسبه شود.",
  },
  {
    icon: CheckCircleIcon,
    title: "خلاصه روز را ببینید",
    description: "در پایان روز، خلاصه‌ای از تمام وعده‌ها و میزان دریافتی را یکجا مشاهده کنید.",
  },
];

const benefits = [
  {
    icon: BookOpenIcon,
    title: "آگاهی از الگوی غذایی",
    description: "وقتی غذاهای روزانه‌تان را می‌نویسید، الگوهایی که قبلا نمی‌دیدید مشخص می‌شوند.",
  },
  {
    icon: CheckCircleIcon,
    title: "پاسخگویی به خود",
    description: "ثبت روزانه باعث می‌شود بیشتر به آنچه می‌خورید دقت کنید و مسئولیت انتخاب‌هایتان را بپذیرید.",
  },
  {
    icon: SearchIcon,
    title: "شناسایی عوامل مؤثر",
    description: "ببینید کدام غذاها روی احساس و انرژی شما تأثیر می‌گذارند و تصمیم‌های بهتری بگیرید.",
  },
  {
    icon: LockKeyholeIcon,
    title: "حمایت از اهداف",
    description: "چه هدف شما کاهش وزن باشد چه بهبود تغذیه، داشتن یک رکورد دقیق اولین قدم است.",
  },
];

const faqs = [
  {
    question: "دفتر تغذیه چیست؟",
    answer:
      "دفتر تغذیه ابزاری برای ثبت وعده‌های غذایی روزانه است. با نوشتن آنچه می‌خورید، می‌توانید کالری، ماکروها و الگوی غذایی‌تان را پیگیری کنید.",
  },
  {
    question: "چطور شروع کنم؟",
    answer:
      "کافی است حساب رایگان بسازید، وعده مورد نظر را انتخاب کنید و غذایی که خورده‌اید را ثبت کنید. مراحل ساده و سریع است.",
  },
  {
    question: "آیا می‌توانم خلاصه هفتگی ببینم؟",
    answer:
      "بله. در پایان هر روز خلاصه‌ای از وعده‌ها و کالری دریافتی خواهید داشت و می‌توانید روند هفتگی خود را پیگیری کنید.",
  },
  {
    question: "آیا داده‌هایم خصوصی است؟",
    answer:
      "بله. اطلاعات غذایی شما فقط برای حساب شخصی‌تان ذخیره می‌شود و در اختیار هیچ شخص یا سرویس دیگری قرار نمی‌گیرد.",
  },
  {
    question: "آیا باید هر وعده را ثبت کنم؟",
    answer:
      "لازم نیست همه چیز را ثبت کنید. حتی ثبت یک یا دو وعده در روز هم می‌تواند کمک‌کننده باشد و با گذشت زمان عادت می‌کنید.",
  },
];

const jsonLd = jsonLdGraph([
  softwareApplicationJsonLd({
    name: "جیرو",
    path: canonicalPath,
    operatingSystem: "Web, iOS, Android",
    description:
      "جیرو یک دفتر تغذیه فارسی است که ثبت غذای روزانه و پیگیری کالری را ساده می‌کند.",
  }),
  breadcrumbJsonLd([
    {name: "جیرو", path: "/"},
    {name: "محصول", path: "/fa"},
    {name: "دفتر تغذیه", path: canonicalPath},
  ]),
  faqPageJsonLd(faqs),
]);

export default function FoodDiaryPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />

      <section className="relative isolate border-b border-border/70">
        <PagePattern />
        <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
          <PageNav />
          <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:gap-14 lg:py-16">
            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-right">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-black text-primary">
                <BookOpenIcon className="size-4" aria-hidden="true" />
                ثبت غذای روزانه
              </p>
              <h1 className="mt-6 text-balance font-heading text-[clamp(2.5rem,10vw,5.25rem)] font-black leading-[1.16] tracking-normal lg:leading-[1.1]">
                دفتر تغذیه فارسی
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-base font-semibold leading-8 text-muted-foreground sm:text-lg sm:leading-9 lg:mx-0">
                غذای امروز را ساده ثبت کنید، وعده‌ها را پیگیری کنید و ببینید
                در طول روز چه خورده‌اید — بدون پیچیدگی و با زبان خودتان.
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
                  href="/fa/app/calorie-counter"
                  className={cn(
                    buttonVariants({variant: "outline", size: "xl"}),
                    "h-12 rounded-full px-6",
                  )}
                >
                  کالری شمار فارسی
                </Link>
              </div>
              <div className="mt-5">
                <SeoPageMeta
                  updatedAt="۱۴ تیر ۱۴۰۵"
                  disclaimer="این صفحه راهنمای محصول است و توصیه پزشکی یا رژیم درمانی ارائه نمی‌کند."
                />
              </div>
            </div>

            <DiaryScene />
          </div>
        </div>
      </section>

      <section className="border-b border-border/70 bg-card/20 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <SectionIntro
            eyebrow="دفتر تغذیه چطور کار می‌کند"
            title="از انتخاب وعده تا دیدن خلاصه روز، همه در چهار مرحله."
            description="مسیر ثبت غذا در جیرو طوری طراحی شده که حتی اگر برای اولین بار دفتر تغذیه باز کنید، گیج نشوید."
          />
          <ol className="grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => (
              <StepCard key={step.title} index={index + 1} {...step} />
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <SectionIntro
            eyebrow="چرا دفتر تغذیه داشته باشیم"
            title="ثبت غذا فقط شمردن کالری نیست؛ آگاهی از عادت‌های روزانه است."
            description="وقتی می‌دانید چه می‌خورید، چه وقت می‌خورید و چرا می‌خورید، تصمیم‌های بهتری می‌گیرید."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <FeatureCard key={benefit.title} {...benefit} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-card/20 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <SectionIntro
            eyebrow="حریم خصوصی"
            title="داده‌های غذایی شما متعلق به خودتان است."
            description="اطلاعات ثبت‌شده در دفتر تغذیه جیرو فقط برای مدیریت حساب شخصی شما ذخیره می‌شود. هیچ‌کس دیگری به غذاها و عادت‌های غذایی شما دسترسی ندارد."
          />
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-border/80 bg-background/60 p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                  <LockKeyholeIcon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-lg font-black">ذخیره اختصاصی</span>
              </div>
              <p className="mt-3 leading-8 text-muted-foreground">
                تمام وعده‌ها و اطلاعات تغذیه‌ای فقط روی حساب شما ذخیره می‌شوند.
              </p>
            </div>
            <div className="rounded-3xl border border-border/80 bg-background/60 p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                  <CheckCircleIcon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-lg font-black">بدون اشتراک‌گذاری</span>
              </div>
              <p className="mt-3 leading-8 text-muted-foreground">
                داده‌های غذایی شما با هیچ شخص، سرویس یا تبلیغ‌کننده‌ای به اشتراک گذاشته نمی‌شود.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <SectionIntro
            eyebrow="پرسش‌های رایج"
            title="قبل از شروع، تکلیف چند سؤال را روشن کنیم."
            description="دفتر تغذیه جیرو ساده طراحی شده اما ممکن است سؤالاتی داشته باشید."
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

      <section className="border-b border-border/70 bg-card/20 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <SectionIntro
              eyebrow="ابزارهای مرتبط"
              title="دفتر تغذیه را با ابزارهای دیگر جیرو تکمیل کنید."
              description="جیرو ابزارهای مختلفی برای مدیریت تغذیه دارد. هر کدام بخشی از مسیر سلامتی شما را پوشش می‌دهند."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
            <Link
              href="/fa/app/calorie-counter"
              className="group rounded-3xl border border-border/80 bg-card/55 p-5 transition-colors hover:border-primary/40 hover:bg-card/75"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                  <UtensilsIcon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-lg font-black group-hover:text-primary">کالری شمار</span>
              </div>
              <p className="mt-3 leading-8 text-muted-foreground">
                ثبت غذا و محاسبه کالری و ماکروها با زبان فارسی.
              </p>
            </Link>
            <Link
              href="/fa/app/macro-tracker"
              className="group rounded-3xl border border-border/80 bg-card/55 p-5 transition-colors hover:border-primary/40 hover:bg-card/75"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                  <ClipboardListIcon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-lg font-black group-hover:text-primary">ماکرو شمار</span>
              </div>
              <p className="mt-3 leading-8 text-muted-foreground">
                پیگیری پروتئین، کربوهیدرات و چربی دریافتی روزانه.
              </p>
            </Link>
            <Link
              href="/fa/foods"
              className="group rounded-3xl border border-border/80 bg-card/55 p-5 transition-colors hover:border-primary/40 hover:bg-card/75"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                  <SearchIcon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-lg font-black group-hover:text-primary">پایگاه داده غذاها</span>
              </div>
              <p className="mt-3 leading-8 text-muted-foreground">
                جست‌وجوی غذاهای ایرانی و بین‌المللی با اطلاعات تغذیه‌ای کامل.
              </p>
            </Link>
            <Link
              href="/fa/guides/calorie-deficit"
              className="group rounded-3xl border border-border/80 bg-card/55 p-5 transition-colors hover:border-primary/40 hover:bg-card/75"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                  <BookOpenIcon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-lg font-black group-hover:text-primary">کسری کالری</span>
              </div>
              <p className="mt-3 leading-8 text-muted-foreground">
                راهنمای ساده کسری کالری برای کاهش وزن اصولی.
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border/70 bg-card/20 py-14">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-5 px-4 text-center sm:px-6 lg:px-8">
          <h2 className="max-w-2xl text-balance font-heading text-3xl font-black leading-tight sm:text-4xl">
            امروز اولین قدم را بردارید: یک وعده ثبت کنید.
          </h2>
          <p className="max-w-2xl leading-8 text-muted-foreground">
            لازم نیست از روز اول همه چیز را کامل ثبت کنید. با یک وعده شروع
            کنید و کم‌کم عادت دفتر تغذیه را بسازید.
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
      <nav className="flex items-center gap-2" aria-label="ناوبری صفحه دفتر تغذیه">
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

function PagePattern() {
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

function DiaryScene() {
  return (
    <div className="relative mx-auto w-full max-w-[34rem]" aria-label="نمای دفتر تغذیه جیرو">
      <div className="absolute -left-6 top-14 z-20 hidden rounded-3xl border border-border/80 bg-card/85 p-4 shadow-2xl backdrop-blur lg:block">
        <div className="flex items-center gap-2 text-sm font-black">
          <BookOpenIcon className="size-4 text-primary" aria-hidden="true" />
          دفتر تغذیه امروز
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Image src="/brand/gyro-symbol-48.png" alt="" width={42} height={42} className="size-10" />
          <span className="grid">
            <b>جیرو</b>
            <small className="font-bold text-muted-foreground">ثبت غذای روزانه</small>
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
                <small className="text-[0.7rem] font-bold text-muted-foreground">دفتر تغذیه</small>
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-border/80 bg-background/55 p-4">
            <p className="text-sm font-bold text-muted-foreground">خلاصه امروز</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <strong className="text-4xl font-black tracking-normal">۱٬۸۵۰</strong>
              <span className="pb-1 text-xs font-black text-primary">کالری</span>
            </div>
            <div className="mt-4 grid gap-2">
              {[
                ["صبحانه", "نان سنگک، تخم‌مرغ، چای", "۴۲۰"],
                ["ناهار", "مرغ، برنج، سالاد", "۶۸۰"],
                ["میان‌وعده", "ماست، موز", "۲۴۰"],
                ["شام", "سوپ سبزیجات، نان", "۵۱۰"],
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
  icon: typeof BookOpenIcon;
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
  icon: typeof UtensilsIcon;
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
