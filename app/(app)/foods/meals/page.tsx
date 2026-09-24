import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {ChefHatIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon} from "lucide-react";

import {AppTopBar} from "@/components/design-system/app-top-bar";
import {QuickAddClient} from "@/components/dashboard/quick-add-client";
import {MacroNutrient} from "@/components/foods/macro-nutrient";
import {Button, buttonVariants} from "@/components/ui/button";
import {Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Empty, EmptyDescription, EmptyHeader, EmptyTitle} from "@/components/ui/empty";
import {Field, FieldGroup, FieldLabel} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {listMeals, type MealListResponseDto, type MealSummaryDto} from "@/lib/api/meals";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {getSession} from "@/lib/auth/session";
import {resolveDiaryDate} from "@/lib/diary/dashboard-loader";
import {cn} from "@/lib/utils";

export const metadata: Metadata = {
	title: "Gyro | وعده‌های سفارشی",
	description: "جستجو و مدیریت وعده‌های سفارشی",
};

export default async function MealsPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string; page?: string }>;
}) {
	const [params, session] = await Promise.all([searchParams, getSession()]);
	if (!session.isAuthenticated) redirect("/auth/login?next=%2Ffoods%2Fmeals&expired=1");
	const query = params.q?.trim() ?? "";
	const page = parsePage(params.page);
  const date = resolveDiaryDate(undefined, session.user.timezone);
	const response = await loadMeals(query, page);

	return (
		<main
			id="main-content"
			className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8"
		>
				<AppTopBar
					title="وعده‌های سفارشی"
					description="الگوهای فعال و مالک‌شده توسط شما"
					showDateControl={false}
					showMobileDateAction={false}
					backLink={{ href: "/foods", label: "بازگشت به غذاها" }}
				/>

				<Card className="rounded-3xl border bg-card shadow-sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ChefHatIcon className="size-5 text-primary" aria-hidden="true" />
							کتابخانه وعده‌ها
						</CardTitle>
						<CardDescription>
							وعده‌های بایگانی‌شده در نتایج پیش‌فرض نمایش داده نمی‌شوند.
						</CardDescription>
						<CardAction>
              <QuickAddClient
                surface="responsive"
                trigger="custom-meal"
                date={date}
              />
						</CardAction>
					</CardHeader>
					<CardContent className="flex flex-col gap-5">
						<form action="/foods/meals" method="get">
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="meal-library-search">جستجوی وعده</FieldLabel>
									<div className="flex gap-2">
										<div className="relative min-w-0 flex-1">
											<SearchIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
											<Input id="meal-library-search" name="q" type="search" defaultValue={query} className="h-11 rounded-xl pr-10" placeholder="نام وعده سفارشی" />
										</div>
										<Button type="submit" size="xl">جستجو</Button>
									</div>
								</Field>
							</FieldGroup>
						</form>

						{response.items.length ? (
							<div className="grid gap-3 sm:grid-cols-2">
								{response.items.map((meal) => <MealCard key={meal.id} meal={meal} />)}
							</div>
						) : (
							<Empty>
								<EmptyHeader>
									<EmptyTitle>{query ? "وعده‌ای پیدا نشد" : "هنوز وعده سفارشی ندارید"}</EmptyTitle>
									<EmptyDescription>{query ? "عبارت جستجو را تغییر دهید." : "اولین وعده سفارشی خود را بسازید."}</EmptyDescription>
								</EmptyHeader>
								{!query ? (
                  <QuickAddClient
                    surface="responsive"
                    trigger="custom-meal"
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

async function loadMeals(query: string, page: number) {
	return authenticatedServerRequest(
		(accessToken) => listMeals({ query: query || undefined, page, size: 12 }, accessToken),
		{ nextPath: mealsHref(query, page), retryPolicy: "idempotent" },
	);
}

function MealCard({ meal }: { meal: MealSummaryDto }) {
	return (
		<Card size="sm" className="border bg-muted/25 shadow-none">
			<CardHeader>
				<CardTitle className="truncate">{meal.name}</CardTitle>
				<CardDescription>{meal.itemCount.toLocaleString("fa-IR")} جزء</CardDescription>
				<CardAction><strong className="text-sm tabular-nums">{meal.calories.toLocaleString("fa-IR")} کالری</strong></CardAction>
			</CardHeader>
			<CardContent className="flex items-end justify-between gap-3">
				<div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
					<MacroNutrient kind="protein" value={meal.protein.toLocaleString("fa-IR")} />
					<MacroNutrient kind="carbs" value={meal.carbs.toLocaleString("fa-IR")} />
					<MacroNutrient kind="fat" value={meal.fat.toLocaleString("fa-IR")} />
				</div>
				<Link href={`/foods/meals/${meal.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>جزئیات</Link>
			</CardContent>
		</Card>
	);
}

function Pagination({ response, query }: { response: MealListResponseDto; query: string }) {
	if (response.totalPages <= 1) return null;
	return (
		<nav className="flex items-center justify-between gap-3 border-t pt-4" aria-label="صفحه‌بندی وعده‌ها">
			<Link
				href={mealsHref(query, Math.max(0, response.page - 1))}
				aria-disabled={response.page === 0}
				className={cn(buttonVariants({ variant: "outline" }), response.page === 0 && "pointer-events-none opacity-50")}
			>
				<ChevronRightIcon data-icon="inline-start" />
				قبلی
			</Link>
			<span className="text-sm text-muted-foreground">صفحه {(response.page + 1).toLocaleString("fa-IR")} از {response.totalPages.toLocaleString("fa-IR")}</span>
			<Link
				href={mealsHref(query, Math.min(response.totalPages - 1, response.page + 1))}
				aria-disabled={response.page + 1 >= response.totalPages}
				className={cn(buttonVariants({ variant: "outline" }), response.page + 1 >= response.totalPages && "pointer-events-none opacity-50")}
			>
				بعدی
				<ChevronLeftIcon data-icon="inline-end" />
			</Link>
		</nav>
	);
}

function mealsHref(query: string, page: number) {
	const params = new URLSearchParams();
	if (query) params.set("q", query);
	if (page > 0) params.set("page", String(page));
	const suffix = params.toString();
	return `/foods/meals${suffix ? `?${suffix}` : ""}`;
}

function parsePage(value?: string) {
	const parsed = Number.parseInt(value ?? "0", 10);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
