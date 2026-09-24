import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {notFound} from "next/navigation";
import {ArrowLeftIcon} from "lucide-react";

import {PublicPageShell} from "@/components/public/public-page-shell";
import {SeoPageMeta} from "@/components/seo/seo-page-meta";
import {buttonVariants} from "@/components/ui/button";
import {articleJsonLd, breadcrumbJsonLd, jsonLdGraph} from "@/lib/seo/json-ld";
import {appBaseUrl, createPersianPageMetadata} from "@/lib/seo/metadata";
import {
  findPublicFood,
  foodCategoryLabels,
  proteinPer1000Kcal,
  publicFoods,
  servingNutrition,
  similarFoods,
} from "@/lib/seo/foods";
import {cn} from "@/lib/utils";

export function generateStaticParams() {
  return publicFoods.map((food) => ({slug: food.slug}));
}

export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> {
  const {slug} = await params;
  const food = findPublicFood(slug);
  if (!food) return {};
  return createPersianPageMetadata({
    path: `/fa/foods/${food.slug}`,
    title: `کالری ${food.nameFa} | جدول کالری و ماکروی ${food.nameFa}`,
    description: food.summary,
    imageAlt: `جدول کالری ${food.nameFa} در جیرو`,
  });
}

function faNumber(value: number) {
  return value.toLocaleString("fa-IR");
}

export default async function FoodPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  const food = findPublicFood(slug);
  if (!food) notFound();

  const canonicalPath = `/fa/foods/${food.slug}`;
  const jsonLd = jsonLdGraph([
    articleJsonLd({
      headline: `کالری و ارزش غذایی ${food.nameFa}`,
      description: food.summary,
      path: canonicalPath,
      dateModified: food.updatedAt,
    }),
    breadcrumbJsonLd([
      {name: "جیرو", path: "/"},
      {name: "غذاها", path: "/fa/foods"},
      {name: food.nameFa, path: canonicalPath},
    ]),
  ]);
  const density = proteinPer1000Kcal(food);
  const mainServing = food.servings[0];
  const similar = similarFoods(food);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} />
      <PublicPageShell
        eyebrow={foodCategoryLabels[food.category]}
        title={`کالری ${food.nameFa}`}
        description={food.summary}
      >
        <article className="mx-auto max-w-3xl space-y-10 text-[1.02rem] leading-9 text-muted-foreground">
          {food.artwork ? (
            <figure className="overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-5 sm:p-7">
              <div className="mx-auto flex max-w-md items-center justify-center rounded-2xl bg-background/70 p-4">
                <Image
                  src={food.artwork.src}
                  alt={food.artwork.alt}
                  width={720}
                  height={720}
                  className="h-auto w-full max-h-[22rem] object-contain"
                  priority
                />
              </div>
              <figcaption className="mt-4 text-center text-sm font-bold text-muted-foreground">
                برای انتخاب راحت‌تر، مقدار و مشخصات {food.nameFa} را یک‌جا ببینید.
              </figcaption>
            </figure>
          ) : null}

          <section aria-labelledby="nutrition-100">
            <h2 id="nutrition-100" className="text-2xl font-black text-foreground">
              ارزش غذایی در ۱۰۰ گرم
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[26rem] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-border text-center text-sm font-bold">
                <thead>
                  <tr className="bg-card text-foreground">
                    <th className="border-b border-border px-3 py-3">کالری</th>
                    <th className="border-b border-border px-3 py-3">پروتئین</th>
                    <th className="border-b border-border px-3 py-3">کربوهیدرات</th>
                    <th className="border-b border-border px-3 py-3">چربی</th>
                    {food.per100.fiber !== undefined ? <th className="border-b border-border px-3 py-3">فیبر</th> : null}
                  </tr>
                </thead>
                <tbody>
                  <tr className="tabular-nums">
                    <td className="px-3 py-3">{faNumber(food.per100.calories)} کیلوکالری</td>
                    <td className="px-3 py-3">{faNumber(food.per100.protein)} گرم</td>
                    <td className="px-3 py-3">{faNumber(food.per100.carbs)} گرم</td>
                    <td className="px-3 py-3">{faNumber(food.per100.fat)} گرم</td>
                    {food.per100.fiber !== undefined ? <td className="px-3 py-3">{faNumber(food.per100.fiber)} گرم</td> : null}
                  </tr>
                </tbody>
              </table>
            </div>
            {food.approximate ? (
              <p className="mt-3 text-sm font-bold">
                مقادیر این غذا برآوردی است؛ دستور خانگی، میزان روغن و غلظت می‌تواند اعداد را به‌شکل محسوسی تغییر دهد.
              </p>
            ) : null}
          </section>

          <section aria-labelledby="protein-density" className="rounded-3xl border border-primary/25 bg-primary/5 p-6">
            <h2 id="protein-density" className="text-sm font-black text-primary">
              شاخص تراکم پروتئین
            </h2>
            <p className="mt-2 text-2xl font-black text-foreground">
              {faNumber(density)} گرم پروتئین در هر ۱۰۰۰ کیلوکالری
            </p>
            <p className="mt-2 text-sm font-bold">
              این شاخص نشان می‌دهد در ازای کالری‌ای که می‌گیرید چقدر پروتئین دریافت می‌کنید — معیاری صادقانه‌تر از
              «پرپروتئین» بودنِ صرف.
            </p>
          </section>

          <section aria-labelledby="servings">
            <h2 id="servings" className="text-2xl font-black text-foreground">
              اندازه‌های رایج ایرانی
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[26rem] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-border text-center text-sm font-bold">
                <thead>
                  <tr className="bg-card text-foreground">
                    <th className="border-b border-border px-3 py-3 text-right">اندازه</th>
                    <th className="border-b border-border px-3 py-3">وزن تقریبی</th>
                    <th className="border-b border-border px-3 py-3">کالری</th>
                    <th className="border-b border-border px-3 py-3">پروتئین</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {food.servings.map((serving) => {
                    const nutrition = servingNutrition(food, serving.grams);
                    return (
                      <tr key={serving.label}>
                        <td className="px-3 py-3 text-right font-black text-foreground">{serving.label}</td>
                        <td className="px-3 py-3">{faNumber(serving.grams)} گرم</td>
                        <td className="px-3 py-3">{faNumber(nutrition.calories)} کیلوکالری</td>
                        <td className="px-3 py-3">{faNumber(nutrition.protein)} گرم</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {mainServing ? (
              <p className="mt-3 text-sm font-bold">
                برای مقایسه: {mainServing.label} {food.nameFa} حدود{" "}
                {faNumber(Math.round((servingNutrition(food, mainServing.grams).calories / 2000) * 100))} درصد از یک
                بودجه روزانه ۲۰۰۰ کیلوکالری را پر می‌کند.
              </p>
            ) : null}
          </section>

          <section aria-labelledby="tips">
            <h2 id="tips" className="text-2xl font-black text-foreground">
              نکته‌های ثبت دقیق‌تر
            </h2>
            <ul className="mt-3 list-disc space-y-2 pr-6">
              {food.loggingTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>

          {similar.length > 0 ? (
            <section aria-labelledby="similar">
              <h2 id="similar" className="text-2xl font-black text-foreground">
                غذاهای مشابه
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {similar.map((entry) => (
                  <Link
                    key={entry.slug}
                    href={`/fa/foods/${entry.slug}`}
                    className={cn(buttonVariants({variant: "outline", size: "lg"}), "rounded-full")}
                  >
                    کالری {entry.nameFa}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-3xl border border-primary/25 bg-primary/5 p-6">
            <p className="text-sm font-black text-primary">قدم بعدی</p>
            <h2 className="mt-2 text-2xl font-black text-foreground">این غذا را در دفتر امروزتان ثبت کنید.</h2>
            <p className="mt-2 text-sm font-bold">
              جیرو همین اندازه‌های ایرانی را موقع ثبت پیشنهاد می‌دهد تا لازم نباشد هر بار حساب کنید.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`${appBaseUrl}/auth/signup`}
                className={cn(buttonVariants({size: "lg"}), "rounded-full")}
              >
                ثبت این غذا در جیرو <ArrowLeftIcon data-icon="inline-end" />
              </Link>
              <Link
                href="/fa/tools/calorie-calculator"
                className={cn(buttonVariants({variant: "outline", size: "lg"}), "rounded-full")}
              >
                محاسبه هدف روزانه
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
            updatedAt={food.updatedAtFa}
            disclaimer={`منبع داده: ${food.source.label}. مقدار نهایی به دستور، روش پخت و اندازه مصرف بستگی دارد.`}
          />
        </article>
      </PublicPageShell>
    </>
  );
}
