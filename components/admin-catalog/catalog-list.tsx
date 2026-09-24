"use client";

import Link from "next/link";
import {PlusIcon, SearchIcon, UtensilsIcon} from "lucide-react";
import type {FormEvent} from "react";
import {useEffect, useState, useTransition} from "react";

import {AppTopBar} from "@/components/design-system/app-top-bar";
import {Button, buttonVariants} from "@/components/ui/button";
import {Field, FieldGroup, FieldLabel} from "@/components/ui/field";
import {FormSelect} from "@/components/ui/form-select";
import {Input} from "@/components/ui/input";
import {Spinner} from "@/components/ui/spinner";
import type {AdminCatalogPageDto, AdminFoodSummaryDto,} from "@/lib/api/admin-catalog";
import {toPersianDigits} from "@/lib/format";

type CatalogSearch = {
  query?: string;
  curationStatus?: string;
  archived?: string;
  ownership?: "USER" | "ALL";
  page?: number;
};

export function AdminCatalogListView({
                                       catalogPage,
                                       loadFailed,
                                       search,
                                     }: {
  catalogPage: AdminCatalogPageDto | null;
  loadFailed: boolean;
  search: CatalogSearch;
}) {
  const [currentPage, setCurrentPage] = useState(catalogPage);
  const [currentLoadFailed, setCurrentLoadFailed] = useState(loadFailed);
  const [query, setQuery] = useState(search.query ?? "");
  const [curationStatus, setCurationStatus] = useState(
    search.curationStatus ?? "",
  );
  const [archived, setArchived] = useState(search.archived ?? "");
  const [ownership, setOwnership] = useState(search.ownership ?? "");
  const [appliedSearch, setAppliedSearch] = useState(search);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, startSearchTransition] = useTransition();

  useEffect(() => {
    setCurrentPage(catalogPage);
    setCurrentLoadFailed(loadFailed);
    setQuery(search.query ?? "");
    setCurationStatus(search.curationStatus ?? "");
    setArchived(search.archived ?? "");
    setOwnership(search.ownership ?? "");
    setAppliedSearch(search);
  }, [catalogPage, loadFailed, search]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch({
      query,
      curationStatus,
      archived,
      ownership: ownership as CatalogSearch["ownership"],
      page: 0,
    });
  }

  function clearSearch() {
    setQuery("");
    setCurationStatus("");
    setArchived("");
    setOwnership("");
    runSearch({page: 0});
  }

  function runSearch(next: CatalogSearch) {
    setSearchError(null);
    startSearchTransition(async () => {
      try {
        const normalized = normalizedSearch(next);
        const response = await fetch(
          adminCatalogSearchUrl(normalized),
          {
            method: "GET",
            headers: {Accept: "application/json"},
          },
        );
        if (!response.ok)
          throw new Error(
            `Admin catalog search failed with ${response.status}`,
          );
        const nextPage = (await response.json()) as AdminCatalogPageDto;
        setCurrentPage(nextPage);
        setCurrentLoadFailed(false);
        setAppliedSearch(normalized);
        syncSearchUrl(normalized);
      } catch (error) {
        console.warn(
          "event=admin_catalog_client_search outcome=failure",
          error,
        );
        setSearchError("جستجوی کاتالوگ انجام نشد. دوباره تلاش کنید.");
      }
    });
  }

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10"
    >
      <AppTopBar
        title="کاتالوگ غذا"
        description="مدیریت همه غذاها"
        backLink={{href: "/admin", label: "بازگشت به پنل ادمین"}}
        showDateControl={false}
        showMobileDateAction={false}
      />

      {currentLoadFailed ? (
        <p
          className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-bold text-destructive">
          فهرست کاتالوگ از backend دریافت نشد.
        </p>
      ) : null}

      <p
        className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-xs font-bold leading-6 text-muted-foreground">
        به صورت پیش‌فرض فقط غذاهای ساخته‌شده توسط ادمین (GYRO_CURATED)
        نمایش داده می‌شوند. با فیلتر «مالکیت» می‌توانید غذاهای سفارشی
        کاربران را هم ببینید؛ این غذاها همیشه فقط‌خواندنی هستند و از
        طریق پنل ادمین قابل ویرایش، آرشیو یا حذف نیستند — فقط می‌توانید
        از روی آن‌ها یک کپی کاتالوگی بسازید.
      </p>

      <section
        className="rounded-3xl border bg-card/90 p-4 shadow-sm sm:p-5"
        aria-label="جستجوی کاتالوگ"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black text-primary">
              کاتالوگ غذا
            </p>
            <h2 className="mt-1 text-xl font-black">
              جستجو و فیلتر
            </h2>
          </div>
          <Link
            href="/admin/catalog/new"
            className={buttonVariants({
              className: "h-11 rounded-full font-black",
            })}
          >
            <PlusIcon className="size-4"/>
            غذای جدید
          </Link>
        </div>
        <form className="grid gap-4" onSubmit={submitSearch}>
          <FieldGroup className="md:grid-cols-2 xl:grid-cols-4">
            <Field>
              <FieldLabel htmlFor="catalog-query">
                نام، برند یا شناسه غذا
              </FieldLabel>
              <Input
                id="catalog-query"
                name="query"
                type="search"
                value={query}
                maxLength={120}
                onChange={(event) =>
                  setQuery(event.currentTarget.value)
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="catalog-curation">
                وضعیت بازبینی
              </FieldLabel>
              <FormSelect
                id="catalog-curation"
                value={curationStatus || "all"}
                options={curationOptions}
                className="h-10 rounded-md font-bold"
                onValueChange={(value) =>
                  setCurationStatus(
                    value === "all" ? "" : value,
                  )
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="catalog-archived">
                وضعیت آرشیو
              </FieldLabel>
              <FormSelect
                id="catalog-archived"
                value={archived || "all"}
                options={archiveOptions}
                className="h-10 rounded-md font-bold"
                onValueChange={(value) =>
                  setArchived(value === "all" ? "" : value)
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="catalog-ownership">
                مالکیت
              </FieldLabel>
              <FormSelect
                id="catalog-ownership"
                value={ownership || "catalog"}
                options={ownershipOptions}
                className="h-10 rounded-md font-bold"
                onValueChange={(value) =>
                  setOwnership(
                    value === "catalog" ? "" : value,
                  )
                }
              />
            </Field>
          </FieldGroup>
          <div className="flex flex-wrap justify-end gap-2">
            {query || curationStatus || archived || ownership ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full font-black"
                disabled={isSearching}
                onClick={clearSearch}
              >
                پاک‌کردن فیلترها
              </Button>
            ) : null}
            <Button
              className="h-11 rounded-full font-black"
              type="submit"
              disabled={isSearching}
            >
              {isSearching ? (
                <Spinner data-icon="inline-start"/>
              ) : (
                <SearchIcon data-icon="inline-start"/>
              )}
              {isSearching ? "در حال جستجو" : "جستجو"}
            </Button>
          </div>
          {searchError ? (
            <p
              role="alert"
              className="text-sm font-bold text-destructive"
            >
              {searchError}
            </p>
          ) : null}
        </form>
      </section>

      <section
        className="rounded-3xl border bg-card/90 p-4 shadow-sm sm:p-5"
        aria-label="نتایج کاتالوگ"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black text-primary">نتایج</p>
            <h2 className="mt-1 text-xl font-black">
              {currentPage
                ? `${toPersianDigits(currentPage.totalItems)} غذا`
                : "غذاها"}
            </h2>
          </div>
          <span className="text-primary">
						<UtensilsIcon className="size-4"/>
					</span>
        </div>

        {currentPage?.items.length ? (
          <div className="grid gap-2">
            {currentPage.items.map((food) => (
              <CatalogRow key={food.id} food={food}/>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed p-5 text-sm font-bold text-muted-foreground">
            غذایی مطابق فیلترها پیدا نشد.
          </p>
        )}

        {currentPage && currentPage.totalPages > 1 ? (
          <Paginator
            page={currentPage.page}
            totalPages={currentPage.totalPages}
            disabled={isSearching}
            onPageChange={(page) =>
              runSearch({...appliedSearch, page})
            }
          />
        ) : null}
      </section>
    </main>
  );
}

function CatalogRow({food}: { food: AdminFoodSummaryDto }) {
  const statusChips = [
    food.archived ? {label: "آرشیوشده", tone: "warn" as const} : null,
    !food.isSearchable
      ? {label: "غیرقابل جستجو", tone: "warn" as const}
      : null,
    food.curationStatus === "HIDDEN"
      ? {label: "مخفی", tone: "warn" as const}
      : null,
    !food.hasNutrition
      ? {label: "بدون ارزش غذایی", tone: "warn" as const}
      : null,
  ].filter((chip) => chip !== null);

  return (
    <Link
      href={
        food.editable
          ? `/admin/catalog/${food.id}`
          : `/admin/catalog/new?copyFrom=${encodeURIComponent(food.id)}`
      }
      className="grid gap-3 rounded-2xl border bg-background/45 p-4 transition-colors hover:border-primary/50 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-base font-black text-foreground">
            {food.name}
          </strong>
          {food.editable ? (
            <span
              className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
							ساخت ادمین
						</span>
          ) : (
            <span
              className="rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
							غذای کاربر · فقط‌خواندنی
						</span>
          )}
          {food.brandName ? (
            <span className="rounded-full border px-2 py-0.5 text-xs font-bold text-primary">
							{food.brandName}
						</span>
          ) : null}
          {statusChips.map((chip) => (
            <span
              key={chip.label}
              className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive"
            >
							{chip.label}
						</span>
          ))}
        </div>
        <p className="mt-1 text-xs font-bold text-muted-foreground">
          {food.curationStatus} · زبان‌ها:{" "}
          {food.localeCoverage.length
            ? food.localeCoverage.join("، ")
            : "فقط نام پایه"}{" "}
          · سروینگ‌ها: {toPersianDigits(food.portionCount)}
          {food.categoryName ? ` · ${food.categoryName}` : ""}
        </p>
      </div>
      <span className="text-xs font-bold text-muted-foreground">
				{food.editable ? "ویرایش ←" : "کپی به کاتالوگ ←"}
			</span>
    </Link>
  );
}

function Paginator({
                     page,
                     totalPages,
                     disabled,
                     onPageChange,
                   }: {
  page: number;
  totalPages: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav
      className="mt-4 flex items-center justify-between gap-2"
      aria-label="صفحه‌بندی"
    >
      {page > 0 ? (
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-full font-black"
          disabled={disabled}
          onClick={() => onPageChange(page - 1)}
        >
          صفحه قبل
        </Button>
      ) : (
        <span/>
      )}
      <span className="text-xs font-bold text-muted-foreground">
				صفحه {toPersianDigits(page + 1)} از{" "}
        {toPersianDigits(totalPages)}
			</span>
      {page + 1 < totalPages ? (
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-full font-black"
          disabled={disabled}
          onClick={() => onPageChange(page + 1)}
        >
          صفحه بعد
        </Button>
      ) : (
        <span/>
      )}
    </nav>
  );
}

const curationOptions = [
  {value: "all", label: "همه وضعیت‌ها"},
  {value: "REVIEWED", label: "بازبینی‌شده"},
  {value: "UNREVIEWED", label: "بازبینی‌نشده"},
  {value: "HIDDEN", label: "مخفی"},
] as const;
const archiveOptions = [
  {value: "all", label: "همه"},
  {value: "false", label: "فعال"},
  {value: "true", label: "آرشیوشده"},
] as const;
const ownershipOptions = [
  {value: "catalog", label: "فقط کاتالوگ ادمین (پیش‌فرض)"},
  {value: "ALL", label: "کاتالوگ + غذاهای کاربران"},
  {value: "USER", label: "فقط غذاهای کاربران"},
] as const;

function normalizedSearch(search: CatalogSearch): CatalogSearch {
  const query = search.query?.trim().slice(0, 120);
  const curationStatus = ["REVIEWED", "UNREVIEWED", "HIDDEN"].includes(
    search.curationStatus ?? "",
  )
    ? search.curationStatus
    : undefined;
  const archived =
    search.archived === "true" || search.archived === "false"
      ? search.archived
      : undefined;
  const ownership =
    search.ownership === "USER" || search.ownership === "ALL"
      ? search.ownership
      : undefined;
  return {
    query: query || undefined,
    curationStatus,
    archived,
    ownership,
    page: Math.max(0, search.page ?? 0),
  };
}

function searchParamsFrom(search: CatalogSearch) {
  const params = new URLSearchParams();
  if (search.query) params.set("query", search.query);
  if (search.curationStatus)
    params.set("curationStatus", search.curationStatus);
  if (search.archived) params.set("archived", search.archived);
  if (search.ownership) params.set("ownership", search.ownership);
  if (search.page) params.set("page", String(search.page));
  return params;
}

function adminCatalogSearchUrl(search: CatalogSearch) {
  return `/api/admin/catalog/search?${searchParamsFrom(search).toString()}`;
}

function syncSearchUrl(search: CatalogSearch) {
  const query = searchParamsFrom(search).toString();
  window.history.replaceState(
    null,
    "",
    query ? `/admin/catalog?${query}` : "/admin/catalog",
  );
}
