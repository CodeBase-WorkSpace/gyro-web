import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftIcon,
  GlobeIcon,
  LanguagesIcon,
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
const canonicalPath = "/fa/app/persian-calorie-counter";

export const metadata: Metadata = createPersianPageMetadata({
  path: canonicalPath,
  title: "کالری شمار فارسی | اپ ثبت غذای فارسی با رابط کاربری راست‌به‌چپ",
  description:
    "کالری شمار فارسی با پایگاه داده غذاهای ایرانی، رابط کاربری راست‌به‌چپ و ثبت ساده روزانه. غذاهای محلی، واحدهای آشنا و تجربه کاملاً فارسی.",
  ogTitle: "کالری شمار فارسی | جیرو",
  ogDescription:
    "اپ ثبت غذای فارسی با رابط کاربری راست‌به‌چپ، غذاهای ایرانی و مسیر ساده روزانه.",
  imageAlt: "کالری شمار فارسی جیرو",
});

const persianFoods = [
  {name: "نان سنگک", calories: "~250 kcal در هر پرس"},
  {name: "قورمه سبزی", calories: "~300 kcal در هر پرس"},
  {name: "برنج پخته", calories: "~200 kcal در هر پیمانه"},
  {name: "کباب کوبیده", calories: "~280 kcal در هر عدد"},
  {name: "ماست", calories: "~120 kcal در هر پیمانه"},
  {name: "تخم‌مرغ", calories: "~70 kcal در هر عدد"},
];

const features = [
  {
    icon: LanguagesIcon,
    title: "رابط کاربری فارسی",
    description: "تمام صفحه‌ها و منوها به فارسی و راست‌به‌چپ طراحی شده‌اند. نیازی به ترجمه ذهنی یا سوئیچ کردن بین زبان‌ها نیست.",
  },
  {
    icon: UtensilsIcon,
    title: "پایگاه داده غذاهای ایرانی",
    description: "غذاهای ایرانی با نام اصلی و اطلاعات دقیق کالری و ماکروها ثبت شده‌اند. از آش رشته تا زرشک پلو، همه در دسترس است.",
  },
  {
    icon: SearchIcon,
    title: "نمونه‌های محلی",
    description: "واحدهای اندازه‌گیری با عادت روزانه شما هماهنگ‌اند: پرس، پیمانه، عدد و بخش. دیگر لازم نیست بین اونس و گرم تبدیل کنید.",
  },
  {
    icon: GlobeIcon,
    title: "مسیر ساده روزانه",
    description: "ثبت غذا، دیدن هدف روزانه و ادامه دادن بدون پیچیدگی. جیرو برای استفاده روزمره طراحی شده، نه برای گم کردن کاربر در منوها.",
  },
];

const faqs = [
  {
    question: "چه چیزی این را از اپ‌های انگلیسی متفاوت می‌کند؟",
    answer:
      "بیشتر اپ‌های کالری شمار به زبان انگلیسی هستند و پایگاه داده غذایی آنها شامل غذاهای ایرانی نیست. جیرو از اول فارسی‌اول ساخته شده: رابط کاربری راست‌به‌چپ، غذاهای محلی با نام اصلی و واحدهای آشنا.",
  },
  {
    question: "آیا غذاهای ایرانی را پوشش می‌دهد؟",
    answer:
      "بله. جیرو پایگاه داده‌ای از غذاهای ایرانی دارد که شامل غذاهای محلی، خانگی و رستورانی است. هر غذا با کالری، پروتئین، کربوهیدرات و چربی ثبت شده است.",
  },
  {
    question: "آیا رابط کاربری کاملاً فارسی است؟",
    answer:
      "بله. تمام منوها، دکمه‌ها، عنوان‌ها و متن‌ها به فارسی هستند و جهت راست‌به‌چپ رعایت شده است. تجربه استفاده مانند هر اپ فارسی دیگری طبیعی است.",
  },
  {
    question: "آیا می‌توانم روی موبایل استفاده کنم؟",
    answer:
      "بله. جیرو یک وب اپ است که روی موبایل و دسکتاپ کار می‌کند. کافیست در مرورگر گوشی باز کنید و اولین غذا را ثبت کنید.",
  },
  {
    question: "آیا رایگان است؟",
    answer:
      "برای شروع می‌توانید حساب رایگان بسازید و ثبت غذا را آغاز کنید. امکانات پیشرفته می‌توانند در پلن‌های پولی ارائه شوند.",
  },
];

const jsonLd = jsonLdGraph([
  softwareApplicationJsonLd({
    name: "جیرو",
    path: canonicalPath,
    operatingSystem: "Web, iOS, Android",
    description:
      "جیرو یک کالری شمار فارسی با پایگاه داده غذاهای ایرانی و رابط کاربری راست‌به‌چپ است.",
  }),
  breadcrumbJsonLd([
    {name: "جیرو", path: "/"},
    {name: "محصول", path: "/fa/app"},
    {name: "کالری شمار فارسی", path: canonicalPath},
  ]),
  faqPageJsonLd(faqs),
]);

export default function PersianCalorieCounterPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
      <section className="relative isolate border-b border-border/70">
        <PersianPagePattern />
        <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
          <PageNav />
          <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:gap-14 lg:py-16">
            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-right">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-black text-primary">
                <GlobeIcon className="size-4" aria-hidden="true" />
                برای فارسی‌زبان‌ها
              </p>
              <h1 className="mt-6 text-balance font-heading text-[clamp(2.5rem,10vw,5.25rem)] font-black leading-[1.16] tracking-normal lg:leading-[1.1]">
                کالری شمار فارسی
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-base font-semibold leading-8 text-muted-foreground sm:text-lg sm:leading-9 lg:mx-0">
                غذاهای ایرانی را با نام اصلی ثبت کنید، کالری و ماکروها را همان‌جا
                ببینید و بدون درگیر شدن با ترجمه و تبدیل واحد، بفهمید چقدر به هدف
                روزانه نزدیک شده‌اید.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  href={signupHref}
                  className={cn(buttonVariants({size: "xl"}), "h-12 rounded-full px-6")}
                >
                  شروع ثبت غذا
                  <ArrowLeftIcon data-icon="inline-end" />
                </Link>
                <Link
                  href="/fa/app/calorie-counter"
                  className={cn(
                    buttonVariants({variant: "outline", size: "xl"}),
                    "h-12 rounded-full px-6",
                  )}
                >
                  دیدن کالری شمار
                </Link>
              </div>
              <div className="mt-5">
                <SeoPageMeta
                  updatedAt="۱۴ تیر ۱۴۰۵"
                  disclaimer="این صفحه راهنمای محصول است و توصیه پزشکی یا رژیم درمانی ارائه نمی‌کند."
                />
              </div>
            </div>

            <PersianFoodScene />
          </div>
        </div>
      </section>

      <section className="border-b border-border/70 bg-card/20 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <SectionIntro
            eyebrow="چرا فارسی؟"
            title="اپ‌های انگلیسی برای کاربر فارسی‌زبان اصطکاک می‌سازند."
            description="وقتی مجبورید اسم غذا را ترجمه کنید، بین اونس و گرم تبدیل بزنید یا بین نام‌های ناآشنا جست‌وجو کنید، ثبت غذا به جای کمک، خسته‌کننده می‌شود. جیرو این مشکل را حل کرده: رابط کاربری فارسی، غذاهای ایرانی و واحدهای آشنا."
          />
          <div className="overflow-hidden rounded-3xl border border-border/80 bg-background/60">
            <ComparisonRow
              label="زبان اپ"
              generic="اغلب انگلیسی یا نیمه‌فارسی"
              gyro="فارسی کامل با رابط راست‌به‌چپ"
            />
            <ComparisonRow
              label="غذاهای ایرانی"
              generic="جست‌وجوی سخت یا ورود دستی مکرر"
              gyro="پایگاه داده غذاهای ایرانی با نام اصلی"
            />
            <ComparisonRow
              label="واحدهای اندازه‌گیری"
              generic="اونس، فنجان و واحدهای ناآشنا"
              gyro="پرس، پیمانه و عدد با عادت روزانه"
            />
            <ComparisonRow
              label="تجربه استفاده"
              generic="ترجمه ذهنی هر بار ثبت غذا"
              gyro="مسیر ساده روزانه بدون اصطکاک"
            />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <SectionIntro
            eyebrow="غذاهای ایرانی"
            title="غذاهایی که هر روز می‌خورید، با کالری دقیق."
            description="دیگر لازم نیست بین غذاهای انگلیسی دنبال معادل بگردید. جیرو غذاهای ایرانی را با نام اصلی و اطلاعات تغذیه‌ای ثبت کرده است."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {persianFoods.map((food) => (
              <FoodExampleCard key={food.name} {...food} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-card/20 py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <SectionIntro
            eyebrow="امکانات"
            title="ابزاری که برای ثبت غذای روزانه لازم دارید."
            description="جیرو ساده طراحی شده تا عادت ثبت غذا بماند. نه منوهای شلوغ، نه گزینه‌های اضافه."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
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

      <section className="border-t border-border/70 bg-card/20 py-14">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-5 px-4 text-center sm:px-6 lg:px-8">
          <h2 className="max-w-2xl text-balance font-heading text-3xl font-black leading-tight sm:text-4xl">
            امروز فقط یک کار انجام دهید: اولین غذا را فارسی ثبت کنید.
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

      <section className="border-t border-border/70 bg-card/20 py-14">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-5 px-4 text-center sm:px-6 lg:px-8">
          <h2 className="max-w-2xl text-balance font-heading text-3xl font-black leading-tight sm:text-4xl">
            صفحات مرتبط
          </h2>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/fa/app/calorie-counter"
              className={cn(buttonVariants({variant: "outline", size: "lg"}), "rounded-full px-5")}
            >
              کالری شمار
            </Link>
            <Link
              href="/fa/foods"
              className={cn(buttonVariants({variant: "outline", size: "lg"}), "rounded-full px-5")}
            >
              پایگاه داده غذاها
            </Link>
            <Link
              href="/fa/app/calorie-counter-iphone"
              className={cn(buttonVariants({variant: "outline", size: "lg"}), "rounded-full px-5")}
            >
              کالری شمار آیفون
            </Link>
            <Link
              href="/fa/tools/calorie-calculator"
              className={cn(buttonVariants({variant: "outline", size: "lg"}), "rounded-full px-5")}
            >
              ماشین حساب کالری
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
      <nav className="flex items-center gap-2" aria-label="ناوبری کالری شمار فارسی">
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

function PersianPagePattern() {
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

function PersianFoodScene() {
  return (
    <div className="relative mx-auto w-full max-w-[34rem]" aria-label="نمای کالری شمار فارسی جیرو">
      <div className="relative mx-auto w-full max-w-[22rem] rounded-[2.75rem] border border-border/90 bg-background p-3 shadow-[0_38px_120px_color-mix(in_oklch,var(--background)_76%,black)]">
        <div className="rounded-[2.25rem] border border-border/80 bg-card/95 p-4">
          <div className="mx-auto mb-5 h-1.5 w-20 rounded-full bg-muted" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/brand/gyro-symbol-48.png" alt="" width={36} height={36} className="size-9" />
              <span className="grid leading-tight">
                <strong className="text-sm font-black">جیرو</strong>
                <small className="text-[0.7rem] font-bold text-muted-foreground">رابط فارسی</small>
              </span>
            </div>
            <span className="grid size-10 place-items-center rounded-2xl border border-border bg-muted/45 text-primary">
              <UtensilsIcon className="size-5" aria-hidden="true" />
            </span>
          </div>

          <div className="mt-6 rounded-3xl border border-border/80 bg-background/55 p-4">
            <p className="text-sm font-bold text-muted-foreground">هدف امروز</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <strong className="text-4xl font-black tracking-normal">۲٬۰۰۰</strong>
              <span className="pb-1 text-xs font-black text-primary">کالری</span>
            </div>
            <div className="mt-4 grid gap-2">
              <FoodLine label="پروتئین" value="۷۵٪" width="75%" className="bg-[var(--nutrient-protein)]" />
              <FoodLine label="کربوهیدرات" value="۶۰٪" width="60%" className="bg-[var(--nutrient-carbs)]" />
              <FoodLine label="چربی" value="۴۵٪" width="45%" className="bg-[var(--nutrient-fat)]" />
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            {[
              ["صبحانه", "نان سنگک، تخم‌مرغ", "۴۲۰"],
              ["ناهار", "قورمه سبزی، برنج", "۵۰۰"],
              ["میان‌وعده", "ماست، میوه", "۱۹۰"],
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

function FoodExampleCard({name, calories}: {name: string; calories: string}) {
  return (
    <article className="rounded-3xl border border-border/80 bg-card/55 p-5 shadow-[inset_0_1px_0_color-mix(in_oklch,var(--foreground)_5%,transparent)]">
      <div className="grid size-11 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
        <UtensilsIcon className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-5 text-lg font-black">{name}</h3>
      <p className="mt-2 text-sm font-bold text-muted-foreground">{calories}</p>
    </article>
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
        <svg className="mt-1 size-4 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {gyro}
      </div>
    </div>
  );
}

function FoodLine({label, value, width, className}: {
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
