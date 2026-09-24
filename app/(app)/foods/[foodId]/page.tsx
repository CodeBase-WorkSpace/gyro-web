import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  BadgeCheckIcon,
  BeefIcon,
  FlameIcon,
  GrapeIcon,
  HeartIcon,
  NutIcon,
  ScaleIcon,
  UtensilsIcon,
} from "lucide-react";

import { AppTopBar } from "@/components/design-system/app-top-bar";
import { CustomFoodOwnerActions, FoodFavoriteToggle } from "@/components/foods/food-detail-actions";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiClientError } from "@/lib/api/errors";
import { getFoodDetail, type FoodDetailDto, type FoodServingPortionDto } from "@/lib/api/foods";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-api";
import { getSession } from "@/lib/auth/session";
import { localizedServingUnit, toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

type FoodDetailPageProps = {
  params: Promise<{ foodId: string }>;
};

export async function generateMetadata({ params }: FoodDetailPageProps): Promise<Metadata> {
  const { foodId } = await params;

  return {
    title: "Gyro | جزئیات غذا",
    description: `جزئیات غذا ${foodId} در Gyro`,
  };
}

export default async function FoodDetailPage({ params }: FoodDetailPageProps) {
  const { foodId } = await params;
  const [food, session] = await Promise.all([loadFoodDetail(foodId), getSession()]);
  const isCustomFood = food.type === "CUSTOM";
  const isAdmin = session.isAuthenticated && session.user.role === "ADMIN";

  return (
    <main id="main-content">
      <div
        className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-[max(7rem,calc(5rem+env(safe-area-inset-bottom)))] pt-5 sm:px-6 lg:px-8 lg:pb-8">
        <AppTopBar
          title="جزئیات غذا"
          description={food.displayName}
          backLink={{ href: "/foods", label: "بازگشت به غذاها" }}
        />

        <section className={cn(
          "grid grid-cols-1 gap-4",
          "lg:grid-cols-[minmax(0,1fr)_320px]",
        )}>
          <div className="flex flex-col gap-4">
            <FoodHero food={food} />
            <NutritionFacts food={food} />
            <ServingOptions food={food} />
          </div>

          <aside className="flex flex-col gap-4">
            <FavoriteCard food={food} />
            {isAdmin ? <FoodStatusCard food={food} /> : null}
          </aside>
        </section>
        {isCustomFood ? <CustomFoodOwnerActions food={food}/> : null}
      </div>
    </main>
  );
}

function FavoriteCard({ food }: { food: FoodDetailDto }) {
  return (
    <Card className="rounded-3xl border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <HeartIcon className="size-4 text-primary" aria-hidden="true" />
          علاقه‌مندی
        </CardTitle>
        <CardDescription className="leading-7">
          این غذا را برای دسترسی سریع‌تر در جستجو نگه دارید.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FoodFavoriteToggle foodId={food.id} initialFavorite={food.favorite} />
      </CardContent>
    </Card>
  );
}

async function loadFoodDetail(foodId: string) {
  try {
    return await authenticatedServerRequest(
      (accessToken) => getFoodDetail(foodId, accessToken, "fa"),
      { nextPath: `/foods/${encodeURIComponent(foodId)}`, retryPolicy: "idempotent" },
    );
  } catch (error) {
    handleFoodDetailError(error);
  }
}

function handleFoodDetailError(error: unknown): never {
  if (error instanceof ApiClientError && error.status === 404) {
    notFound();
  }

  throw error;
}

function FoodHero({ food }: { food: FoodDetailDto }) {
  return (
    <Card className="rounded-3xl border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <UtensilsIcon className="size-5 text-primary" aria-hidden="true" />
          {food.displayName}
        </CardTitle>
        <CardDescription className="leading-7">
          {food.name === food.displayName ? "اطلاعات تغذیه و سروینگ غذا" : food.name}
        </CardDescription>
        <CardAction>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
            {food.type === "CUSTOM" ? "سفارشی" : "سیستمی"}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryTile icon={FlameIcon} label="کالری" value={`${toPersianDigits(formatNumber(food.calories))} کالری`} />
        <SummaryTile icon={ScaleIcon} label="سروینگ" value={`${toPersianDigits(formatNumber(food.servingQuantity))} ${localizedServingUnit(food.servingUnit.code, food.servingUnit.label)}`} />
        <SummaryTile icon={BeefIcon} label="پروتئین" value={`${toPersianDigits(formatNumber(food.protein))} گرم`} />
      </CardContent>
    </Card>
  );
}

function NutritionFacts({ food }: { food: FoodDetailDto }) {
  const nutrients = [
    { label: "پروتئین", value: food.protein, unit: "گرم", icon: BeefIcon },
    { label: "کربوهیدرات", value: food.carbs, unit: "گرم", icon: GrapeIcon },
    { label: "چربی", value: food.fat, unit: "گرم", icon: NutIcon },
    { label: "فیبر", value: food.fiber, unit: "گرم" },
    { label: "قند", value: food.sugar, unit: "گرم" },
    { label: "سدیم", value: food.sodium, unit: "میلی‌گرم" },
  ];

  return (
    <Card className="rounded-3xl border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">ارزش غذایی</CardTitle>
        <CardDescription>مقدارها برای سروینگ پایه غذا نمایش داده می‌شوند.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {nutrients.map((nutrient) => {
          const Icon = nutrient.icon;
          return <div key={nutrient.label} className="rounded-2xl border bg-muted/30 p-3">
            <p className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
              {Icon ? <Icon className="size-3.5 text-primary" aria-hidden="true" /> : null}
              {nutrient.label}
            </p>
            <p className="mt-1 text-lg font-black tabular-nums">
              {toPersianDigits(formatNumber(nutrient.value))}{" "}
              <span className="text-xs font-bold text-muted-foreground">{nutrient.unit}</span>
            </p>
          </div>;
        })}
      </CardContent>
    </Card>
  );
}

function ServingOptions({ food }: { food: FoodDetailDto }) {
  const portions = food.portions.length > 0 ? food.portions : [basePortionFrom(food)];

  return (
    <Card className="rounded-3xl border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">گزینه‌های سروینگ</CardTitle>
        <CardDescription>برای ثبت دقیق‌تر، مقدار مناسب سروینگ را انتخاب کنید.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {portions.map((portion, index) => (
          <div key={`${portion.displayText}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border bg-background/50 p-3">
            <span className="min-w-0">
              <strong className="block truncate text-sm">{portion.displayText}</strong>
              <small className="text-xs text-muted-foreground">
                {portion.modifier || localizedServingUnit(portion.unitAbbreviation ?? food.servingUnit.code, portion.unitName ?? food.servingUnit.label)}
              </small>
            </span>
            <b className="shrink-0 text-sm tabular-nums">
              {portion.gramWeight
                ? `${toPersianDigits(formatNumber(portion.gramWeight))} گرم`
                : `${toPersianDigits(formatNumber(portion.amount))} ${localizedServingUnit(portion.unitAbbreviation ?? food.servingUnit.code, portion.unitName ?? food.servingUnit.label)}`}
            </b>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FoodStatusCard({ food }: { food: FoodDetailDto }) {
  return (
    <Card className="rounded-3xl border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <BadgeCheckIcon className="size-4 text-primary" aria-hidden="true" />
          وضعیت غذا
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <StatusRow label="منبع" value={food.source} />
        <StatusRow label="کیفیت داده" value={food.dataQuality} />
        <StatusRow label="زبان" value={food.locale} />
        <StatusRow label="علاقه‌مندی" value={food.favorite ? "بله" : "خیر"} />
        <StatusRow label="اخیر" value={food.recent ? "بله" : "خیر"} />
      </CardContent>
    </Card>
  );
}

function SummaryTile({ icon: Icon, label, value }: { icon: typeof FlameIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-muted/30 p-3">
      <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
        <Icon className="size-4 text-primary" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-2 text-lg font-black tabular-nums">{value}</p>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/30 px-3 py-2">
      <span className="font-bold text-muted-foreground">{label}</span>
      <span className="truncate font-semibold">{value}</span>
    </div>
  );
}

function basePortionFrom(food: FoodDetailDto): FoodServingPortionDto {
  return {
    amount: food.servingQuantity,
    unitName: localizedServingUnit(food.servingUnit.code, food.servingUnit.label),
    unitAbbreviation: food.servingUnit.code,
    modifier: null,
    gramWeight: food.servingUnit.code === "GRAM" ? food.servingQuantity : null,
    displayText: `${toPersianDigits(formatNumber(food.servingQuantity))} ${localizedServingUnit(food.servingUnit.code, food.servingUnit.label)}`,
  };
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}
