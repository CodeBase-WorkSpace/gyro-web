import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
	BeefIcon,
	BadgeCheckIcon,
	ChefHatIcon,
	FlameIcon,
	GrapeIcon,
	NutIcon,
} from "lucide-react";

import { AppTopBar } from "@/components/design-system/app-top-bar";
import { MealArchiveControl } from "@/components/foods/meal-archive-control";
import {CustomMealDuplicateSheet, CustomMealEditDialog} from "@/components/foods/meal-edit-dialog";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ApiClientError } from "@/lib/api/errors";
import {getFoodDetail} from "@/lib/api/foods";
import { getMealDetail, type MealDetailDto } from "@/lib/api/meals";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-api";
import { getSession } from "@/lib/auth/session";
import { localizedServingUnit, toPersianDigits } from "@/lib/format";
import {mealEditorItemsFrom, type MealTemplateFormItem} from "@/lib/foods/meal-editor";

type MealDetailPageProps = {
	params: Promise<{ mealId: string }>;
};

export const metadata: Metadata = {
	title: "Gyro | جزئیات وعده سفارشی",
	description: "اجزا و ارزش غذایی وعده سفارشی",
};

export default async function MealDetailPage({ params }: MealDetailPageProps) {
	const [{ mealId }, session] = await Promise.all([params, getSession()]);
	if (!session.isAuthenticated) {
		redirect(`/auth/login?next=${encodeURIComponent(`/foods/meals/${mealId}`)}&expired=1`);
	}

  const {meal, editorItems} = await loadMealDetail(mealId);

	return (
		<main
			id="main-content"
      className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-[max(7rem,calc(5rem+env(safe-area-inset-bottom)))] pt-5 sm:px-6 lg:px-8 lg:pb-8"
			aria-label="جزئیات وعده سفارشی"
		>
				<AppTopBar
					title="جزئیات وعده سفارشی"
					description={meal.name}
					showDateControl={false}
					showMobileDateAction={false}
					backLink={{ href: "/foods/meals", label: "بازگشت به وعده‌های سفارشی" }}
				/>
      <MealHero meal={meal} editorItems={editorItems}/>
				<section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
					<MealComponents meal={meal} />
					<MealNutrition meal={meal} />
				</section>
      <CustomMealOwnerActions meal={meal} editorItems={editorItems}/>
		</main>
	);
}

async function loadMealDetail(mealId: string) {
	try {
		return await authenticatedServerRequest(
      async (accessToken) => {
        const meal = await getMealDetail(mealId, accessToken);
        const foods = await Promise.all(meal.items.map((item) =>
          getFoodDetail(item.foodId, accessToken, "fa").catch(() => null)
        ));
        return {meal, editorItems: mealEditorItemsFrom(meal, foods)};
      },
			{
				nextPath: `/foods/meals/${encodeURIComponent(mealId)}`,
				retryPolicy: "idempotent",
			},
		);
	} catch (error) {
		if (error instanceof ApiClientError && error.status === 404) notFound();
		throw error;
	}
}

function MealHero({meal, editorItems}: { meal: MealDetailDto; editorItems: MealTemplateFormItem[] }) {
	return (
		<Card className="rounded-3xl border bg-card shadow-sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-xl font-bold">
					<ChefHatIcon className="size-5 text-primary" aria-hidden="true" />
					{meal.name}
				</CardTitle>
				<CardDescription>یک الگوی ذخیره‌شده با {toPersianDigits(meal.items.length)} جزء</CardDescription>
			</CardHeader>
			<CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
				<SummaryTile icon={FlameIcon} label="کالری" value={`${toPersianDigits(formatNumber(meal.calories))} کالری`} />
				<SummaryTile icon={BeefIcon} label="پروتئین" value={`${toPersianDigits(formatNumber(meal.protein))} گرم`} />
				<SummaryTile icon={GrapeIcon} label="کربوهیدرات" value={`${toPersianDigits(formatNumber(meal.carbs))} گرم`} />
				<SummaryTile icon={NutIcon} label="چربی" value={`${toPersianDigits(formatNumber(meal.fat))} گرم`} />
				<SummaryTile icon={BadgeCheckIcon} label="وضعیت" value="آماده ثبت" />
      </CardContent>
    </Card>
  );
}

function CustomMealOwnerActions({meal, editorItems}: { meal: MealDetailDto; editorItems: MealTemplateFormItem[] }) {
  return <Card className="rounded-3xl border bg-card shadow-sm">
    <CardHeader>
      <CardTitle>مدیریت وعده سفارشی</CardTitle>
      <CardDescription>تغییرات فقط برای وعده ساخته‌شده توسط شما اعمال می‌شود.</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-2 [&>button]:h-11 [&>button]:w-full [&>button]:rounded-full">
      <CustomMealEditDialog meal={meal} initialItems={editorItems}/>
      <CustomMealDuplicateSheet meal={meal} initialItems={editorItems}/>
      <MealArchiveControl mealId={meal.id} mealName={meal.name}/>
    </CardContent>
  </Card>;
}

function MealComponents({ meal }: { meal: MealDetailDto }) {
	return (
		<Card className="rounded-3xl border bg-card shadow-sm">
			<CardHeader>
				<CardTitle>اجزای وعده</CardTitle>
				<CardDescription>مقدار و واحد ذخیره‌شده هر غذا</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{meal.items.map((item) => (
					<div key={item.id} className="rounded-2xl border bg-muted/25 p-4">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<strong className="block truncate">{item.foodName}</strong>
								<span className="mt-1 block text-sm text-muted-foreground">
									{toPersianDigits(formatNumber(item.quantity))} {localizedServingUnit(item.servingUnit.code, item.servingUnit.label)}
								</span>
							</div>
							<strong className="shrink-0 text-sm tabular-nums">{toPersianDigits(formatNumber(item.calories))} کالری</strong>
						</div>
						<div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
							<span className="flex items-center gap-1"><BeefIcon className="size-3.5 text-[oklch(0.58_0.2_31)]" aria-hidden="true" />پروتئین {toPersianDigits(formatNumber(item.protein))} گرم</span>
							<span className="flex items-center gap-1"><GrapeIcon className="size-3.5 text-[oklch(0.72_0.16_82)]" aria-hidden="true" />کربوهیدرات {toPersianDigits(formatNumber(item.carbs))} گرم</span>
							<span className="flex items-center gap-1"><NutIcon className="size-3.5 text-[oklch(0.56_0.16_146)]" aria-hidden="true" />چربی {toPersianDigits(formatNumber(item.fat))} گرم</span>
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}

function MealNutrition({ meal }: { meal: MealDetailDto }) {
	const nutrients = [
		{ label: "کالری", value: meal.calories, unit: "کالری" },
		{ label: "پروتئین", value: meal.protein, unit: "گرم", icon: BeefIcon },
		{ label: "کربوهیدرات", value: meal.carbs, unit: "گرم", icon: GrapeIcon },
		{ label: "چربی", value: meal.fat, unit: "گرم", icon: NutIcon },
		{ label: "فیبر", value: meal.fiber, unit: "گرم" },
		{ label: "قند", value: meal.sugar, unit: "گرم" },
		{ label: "سدیم", value: meal.sodium, unit: "میلی‌گرم" },
	];

	return (
		<Card className="h-fit rounded-3xl border bg-card shadow-sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<FlameIcon className="size-4 text-primary" aria-hidden="true" />
					جمع ارزش غذایی
				</CardTitle>
				<CardDescription>مجموع همه اجزای ذخیره‌شده</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-2">
				{nutrients.map((nutrient) => {
					const Icon = nutrient.icon;
					return <div key={nutrient.label} className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 px-3 py-2">
						<span className="flex items-center gap-1 text-sm font-bold text-muted-foreground">{Icon ? <Icon className="size-3.5 text-primary" aria-hidden="true" /> : null}{nutrient.label}</span>
						<strong className="text-sm tabular-nums">{toPersianDigits(formatNumber(nutrient.value))} {nutrient.unit}</strong>
					</div>;
				})}
			</CardContent>
		</Card>
	);
}

function SummaryTile({ icon: Icon, label, value }: { icon: typeof BeefIcon; label: string; value: string }) {
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

function formatNumber(value: number) {
	return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}
