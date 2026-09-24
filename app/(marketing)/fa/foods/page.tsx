import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {ArrowLeftIcon} from "lucide-react";

import {PublicPageShell} from "@/components/public/public-page-shell";
import {SeoPageMeta} from "@/components/seo/seo-page-meta";
import {buttonVariants} from "@/components/ui/button";
import {breadcrumbJsonLd, jsonLdGraph, websiteJsonLd} from "@/lib/seo/json-ld";
import {createPersianPageMetadata} from "@/lib/seo/metadata";
import {type FoodCategory, foodCategoryLabels, proteinPer1000Kcal, publicFoods,} from "@/lib/seo/foods";
import {cn} from "@/lib/utils";

const canonicalPath = "/fa/foods";

export const metadata: Metadata = createPersianPageMetadata({
  path: canonicalPath,
  title: "جدول کالری غذاهای ایرانی | کالری و ماکروی غذاهای رایج",
  description:
    "کالری، پروتئین، کربوهیدرات و چربی غذاهای رایج سفره ایرانی با اندازه‌های واقعی: کفگیر، کف دست، کاسه و سیخ — نه فقط ۱۰۰ گرم.",
  imageAlt: "جدول کالری غذاهای ایرانی جیرو",
});

const jsonLd = jsonLdGraph([
  websiteJsonLd(),
  breadcrumbJsonLd([
    {name: "جیرو", path: "/"},
    {name: "غذاها", path: canonicalPath},
  ]),
]);

const categoryOrder: FoodCategory[] = ["dish", "protein", "grain", "bread", "dairy", "fruit"];

function faNumber(value: number) {
  return value.toLocaleString("fa-IR");
}

export default function FoodsHubPage() {
  const grouped = categoryOrder
    .map((category) => ({
      category,
      foods: publicFoods.filter((food) => food.category === category),
    }))
    .filter((group) => group.foods.length > 0);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} />
      <PublicPageShell
        eyebrow="پایگاه غذاها"
        title="کالری غذاهای ایرانی با اندازه‌های واقعی سفره"
        description="غذایت را با همان اندازه‌ای که می‌خوری پیدا کن: کفگیر، کف دست، کاسه یا سیخ. هر صفحه کالری، ماکرو و نکته ثبت دقیق‌تر را کنار هم نشان می‌دهد."
      >
        <div className="mx-auto max-w-3xl space-y-12">
          {grouped.map((group) => (
            <section key={group.category} aria-labelledby={`category-${group.category}`}>
              <h2 id={`category-${group.category}`} className="text-2xl font-black text-foreground">
                {foodCategoryLabels[group.category]}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {group.foods.map((food) => (
                  <Link
                    key={food.slug}
                    href={`/fa/foods/${food.slug}`}
                    className="group flex min-h-32 items-center gap-4 rounded-3xl border border-border bg-card/45 p-5 transition-colors hover:border-primary/40"
                  >
                    {food.artwork ? (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/5 p-2">
                        <Image
                          src={food.artwork.src}
                          alt=""
                          width={160}
                          height={160}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : null}
                    <div>
                      <p className="text-lg font-black text-foreground group-hover:text-primary">{food.nameFa}</p>
                      <p className="mt-2 text-sm font-bold tabular-nums text-muted-foreground">
                        {faNumber(food.per100.calories)} کیلوکالری در ۱۰۰ گرم ·{" "}
                        {faNumber(proteinPer1000Kcal(food))} گرم پروتئین در ۱۰۰۰ کیلوکالری
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-3xl border border-primary/25 bg-primary/5 p-6">
            <p className="text-sm font-black text-primary">قدم بعدی</p>
            <h2 className="mt-2 text-2xl font-black text-foreground">غذایتان را پیدا نکردید؟</h2>
            <p className="mt-2 text-sm font-bold leading-7 text-muted-foreground">
              پایگاه غذاهای داخل جیرو بسیار بزرگ‌تر از این فهرست است و غذاهای شخصی خودتان را هم می‌توانید بسازید.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/fa/app/calorie-counter" className={cn(buttonVariants({size: "lg"}), "rounded-full")}>
                شروع ثبت غذا با جیرو <ArrowLeftIcon data-icon="inline-end" />
              </Link>
              <Link
                href="/fa/guides/track-persian-foods"
                className={cn(buttonVariants({variant: "outline", size: "lg"}), "rounded-full")}
              >
                راهنمای ثبت غذاهای ایرانی
              </Link>
            </div>
          </section>

          <SeoPageMeta
            updatedAt="۳۰ تیر ۱۴۰۵"
            disclaimer="مقادیر غذاهای ساده از USDA FoodData Central و مقادیر غذاهای ترکیبی برآورد بر اساس دستورهای رایج است؛ روش پخت و مقدار مصرف می‌تواند نتیجه را تغییر دهد."
          />
        </div>
      </PublicPageShell>
    </>
  );
}
