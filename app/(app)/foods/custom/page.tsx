import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, UtensilsIcon } from "lucide-react";

import { AppTopBar } from "@/components/design-system/app-top-bar";
import { QuickAddClient } from "@/components/dashboard/quick-add-client";
import { MacroNutrient } from "@/components/foods/macro-nutrient";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type FoodSearchItem, type FoodSearchResponseDto, searchFoods } from "@/lib/api/foods";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-api";
import { getSession } from "@/lib/auth/session";
import { resolveDiaryDate } from "@/lib/diary/dashboard-loader";
import { localizedServingUnit } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Gyro | غذاهای سفارشی",
	description: "جستجو و مدیریت غذاهای سفارشی",
};

export default async function CustomFoodsPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string; page?: string }>;
}) {
	const [params, session] = await Promise.all([searchParams, getSession()]);
	if (!session.isAuthenticated)
		redirect("/auth/login?next=%2Ffoods%2Fcustom&expired=1");

	const query = params.q?.trim() ?? "";
	const page = parsePage(params.page);
	const date = resolveDiaryDate(undefined, session.user.timezone);
	const response = await loadCustomFoods(query, page);

	return (
		<main
			id="main-content"
      className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-[max(7rem,calc(5rem+env(safe-area-inset-bottom)))] pt-5 sm:px-6 lg:px-8 lg:pb-8"
		>
				<AppTopBar
					title="غذاهای سفارشی"
					description="غذاهای ساخته‌شده توسط شما برای ثبت سریع‌تر"
					showDateControl={false}
					showMobileDateAction={false}
					backLink={{ href: "/foods", label: "بازگشت به غذاها" }}
				/>

				<Card className="rounded-3xl border bg-card shadow-sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<UtensilsIcon className="size-5 text-primary" aria-hidden="true" />
							کتابخانه غذاهای سفارشی
						</CardTitle>
						<CardDescription>
							برای ویرایش یا ساخت نسخه جدید، وارد جزئیات غذا شوید.
						</CardDescription>
						<CardAction>
							<QuickAddClient
								surface="responsive"
								trigger="custom-food"
								date={date}
							/>
						</CardAction>
					</CardHeader>
					<CardContent className="flex flex-col gap-5">
						<form action="/foods/custom" method="get">
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="custom-food-library-search">
										جستجوی غذای سفارشی
									</FieldLabel>
									<div className="flex gap-2">
										<div className="relative min-w-0 flex-1">
											<SearchIcon
												className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
												aria-hidden="true"
											/>
											<Input
												id="custom-food-library-search"
												name="q"
												type="search"
												defaultValue={query}
												className="h-11 rounded-xl pr-10"
												placeholder="نام غذای سفارشی"
											/>
										</div>
										<Button type="submit" size="xl">
											جستجو
										</Button>
									</div>
								</Field>
							</FieldGroup>
						</form>

						{response.items.length ? (
							<div className="grid gap-3 sm:grid-cols-2">
								{response.items.map((food) => (
									<CustomFoodCard key={food.id} food={food} />
								))}
							</div>
						) : (
							<Empty>
								<EmptyHeader>
									<EmptyTitle>
										{query
											? "غذای سفارشی پیدا نشد"
											: "هنوز غذای سفارشی ندارید"}
									</EmptyTitle>
									<EmptyDescription>
										{query
											? "عبارت جستجو را تغییر دهید."
											: "اولین غذای سفارشی خود را بسازید."}
									</EmptyDescription>
								</EmptyHeader>
								{!query ? (
									<QuickAddClient
										surface="responsive"
										trigger="custom-food"
										date={date}
									/>
								) : null}
							</Empty>
						)}

						<Pagination response={response} query={query} />
					</CardContent>
				</Card>
		</main>
	);
}

async function loadCustomFoods(query: string, page: number) {
	return authenticatedServerRequest(
		(accessToken) =>
			searchFoods(
				{
					query: query || undefined,
					type: "CUSTOM",
					page,
					size: 12,
				},
				accessToken,
			),
		{ nextPath: customFoodsHref(query, page), retryPolicy: "idempotent" },
	);
}

function CustomFoodCard({ food }: { food: FoodSearchItem }) {
	return (
		<Card size="sm" className="border bg-muted/25 shadow-none">
			<CardHeader>
				<CardTitle className="truncate">{food.displayName}</CardTitle>
				<CardDescription>
					{food.servingQuantity.toLocaleString("fa-IR")}{" "}
					{localizedServingUnit(food.servingUnit.code, food.servingUnit.label)}
				</CardDescription>
				<CardAction>
					<strong className="text-sm tabular-nums">
						{food.calories.toLocaleString("fa-IR")} کالری
					</strong>
				</CardAction>
			</CardHeader>
			<CardContent className="flex items-end justify-between gap-3">
				<div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
					<MacroNutrient kind="protein" value={food.protein.toLocaleString("fa-IR")} />
					<MacroNutrient kind="carbs" value={food.carbs.toLocaleString("fa-IR")} />
					<MacroNutrient kind="fat" value={food.fat.toLocaleString("fa-IR")} />
				</div>
				<Link
					href={`/foods/${food.id}`}
					className={buttonVariants({ variant: "outline", size: "sm" })}
				>
					جزئیات
				</Link>
			</CardContent>
		</Card>
	);
}

function Pagination({
	response,
	query,
}: {
	response: FoodSearchResponseDto;
	query: string;
}) {
	if (response.totalPages <= 1) return null;

	return (
		<nav className="flex items-center justify-between gap-3" aria-label="صفحه‌بندی غذاهای سفارشی">
			<Link
				href={customFoodsHref(query, Math.max(0, response.page - 1))}
				className={cn(buttonVariants({ variant: "outline" }), response.page === 0 && "pointer-events-none opacity-50")}
				aria-disabled={response.page === 0}
			>
				<ChevronRightIcon data-icon="inline-start" />
				قبلی
			</Link>
			<span className="text-sm text-muted-foreground">
				صفحه {(response.page + 1).toLocaleString("fa-IR")} از{" "}
				{response.totalPages.toLocaleString("fa-IR")}
			</span>
			<Link
				href={customFoodsHref(query, response.page + 1)}
				className={cn(buttonVariants({ variant: "outline" }), response.page + 1 >= response.totalPages && "pointer-events-none opacity-50")}
				aria-disabled={response.page + 1 >= response.totalPages}
			>
				بعدی
				<ChevronLeftIcon data-icon="inline-end" />
			</Link>
		</nav>
	);
}

function parsePage(value?: string) {
	const parsed = Number.parseInt(value ?? "0", 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function customFoodsHref(query: string, page: number) {
	const params = new URLSearchParams();
	if (query) params.set("q", query);
	if (page > 0) params.set("page", String(page));
	const suffix = params.toString();
	return `/foods/custom${suffix ? `?${suffix}` : ""}`;
}
