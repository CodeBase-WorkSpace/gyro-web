"use client";

import Link from "next/link";
import {SearchIcon, UsersIcon} from "lucide-react";
import type {FormEvent} from "react";
import {useEffect, useState, useTransition} from "react";

import {AppTopBar} from "@/components/design-system/app-top-bar";
import {Button} from "@/components/ui/button";
import {Field, FieldGroup, FieldLabel} from "@/components/ui/field";
import {FormSelect} from "@/components/ui/form-select";
import {Input} from "@/components/ui/input";
import {Spinner} from "@/components/ui/spinner";
import type {AdminUsersPageDto, AdminUserSummaryDto} from "@/lib/api/admin-users";
import {toPersianDigits} from "@/lib/format";

type UsersSearch = {
  query?: string;
  role?: string;
  status?: string;
  page?: number;
};

export function AdminUsersListView({
                                     usersPage,
                                     loadFailed,
                                     search,
                                   }: {
  usersPage: AdminUsersPageDto | null;
  loadFailed: boolean;
  search: UsersSearch;
}) {
  const [currentPage, setCurrentPage] = useState(usersPage);
  const [currentLoadFailed, setCurrentLoadFailed] = useState(loadFailed);
  const [query, setQuery] = useState(search.query ?? "");
  const [role, setRole] = useState(search.role ?? "");
  const [status, setStatus] = useState(search.status ?? "");
  const [appliedSearch, setAppliedSearch] = useState(search);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, startSearchTransition] = useTransition();

  useEffect(() => {
    setCurrentPage(usersPage);
    setCurrentLoadFailed(loadFailed);
    setQuery(search.query ?? "");
    setRole(search.role ?? "");
    setStatus(search.status ?? "");
    setAppliedSearch(search);
  }, [loadFailed, search, usersPage]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch({query, role, status, page: 0});
  }

  function clearSearch() {
    setQuery("");
    setRole("");
    setStatus("");
    runSearch({page: 0});
  }

  function runSearch(next: UsersSearch) {
    setSearchError(null);
    startSearchTransition(async () => {
      try {
        const normalized = normalizedSearch(next);
        const response = await fetch(adminUsersSearchUrl(normalized), {
          method: "GET",
          headers: {Accept: "application/json"},
        });
        if (!response.ok) throw new Error(`Admin users search failed with ${response.status}`);

        const nextPage = await response.json() as AdminUsersPageDto;
        setCurrentPage(nextPage);
        setCurrentLoadFailed(false);
        setAppliedSearch(normalized);
        syncSearchUrl(normalized);
      } catch (error) {
        console.warn("event=admin_users_client_search outcome=failure", error);
        setSearchError("جستجوی کاربران انجام نشد. دوباره تلاش کنید.");
      }
    });
  }

  return (
    <main id="main-content"
          className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">
      <AppTopBar
        title="مدیریت کاربران"
        description="جستجوی کاربران، مشاهده داده‌های نگه‌داری‌شده و حذف کامل حساب"
        backLink={{href: "/admin", label: "بازگشت به پنل ادمین"}}
        showDateControl={false}
        showMobileDateAction={false}
      />

      {currentLoadFailed ? (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-bold text-destructive">
          فهرست کاربران از backend دریافت نشد.
        </p>
      ) : null}

      <section className="rounded-3xl border bg-card/90 p-4 shadow-sm sm:p-5" aria-label="جستجوی کاربران">
        <div className="mb-4">
          <p className="text-xs font-black text-primary">کاربران</p>
          <h2 className="mt-1 text-xl font-black">جستجو و فیلتر</h2>
        </div>
        <form className="grid gap-4" onSubmit={submitSearch}>
          <FieldGroup className="md:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="users-query">ایمیل، شماره تماس، نام نمایشی یا UUID</FieldLabel>
              <Input id="users-query" name="query" type="search" value={query} maxLength={320}
                     onChange={(event) => setQuery(event.currentTarget.value)}/>
            </Field>
            <Field>
              <FieldLabel htmlFor="users-role">نقش</FieldLabel>
              <FormSelect id="users-role" value={role || "all"} options={roleOptions}
                          className="h-10 rounded-md font-bold"
                          onValueChange={(value) => setRole(value === "all" ? "" : value)}/>
            </Field>
            <Field>
              <FieldLabel htmlFor="users-status">وضعیت حساب</FieldLabel>
              <FormSelect id="users-status" value={status || "all"} options={accountStatusOptions}
                          className="h-10 rounded-md font-bold"
                          onValueChange={(value) => setStatus(value === "all" ? "" : value)}/>
            </Field>
          </FieldGroup>
          <div className="flex flex-wrap justify-end gap-2">
            {query || role || status ? (
              <Button type="button" variant="outline" className="h-11 rounded-full font-black"
                      disabled={isSearching} onClick={clearSearch}>پاک‌کردن فیلترها</Button>
            ) : null}
            <Button className="h-11 rounded-full font-black" type="submit" disabled={isSearching}>
              {isSearching ? <Spinner data-icon="inline-start"/> : <SearchIcon className="size-4"/>}
              {isSearching ? "در حال جستجو" : "جستجو"}
            </Button>
          </div>
          {searchError ? <p role="alert" className="text-sm font-bold text-destructive">{searchError}</p> : null}
        </form>
      </section>

      <section className="rounded-3xl border bg-card/90 p-4 shadow-sm sm:p-5" aria-label="نتایج کاربران">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black text-primary">نتایج</p>
            <h2 className="mt-1 text-xl font-black">
              {currentPage ? `${toPersianDigits(currentPage.totalItems)} کاربر` : "کاربران"}
            </h2>
          </div>
          <span className="text-primary"><UsersIcon className="size-4"/></span>
        </div>

        {currentPage?.items.length ? (
          <div className="grid gap-2">
            {currentPage.items.map((user) => (
              <UserRow key={user.id} user={user}/>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed p-5 text-sm font-bold text-muted-foreground">
            کاربری مطابق فیلترها پیدا نشد.
          </p>
        )}

        {currentPage && currentPage.totalPages > 1 ? (
          <Paginator page={currentPage.page} totalPages={currentPage.totalPages} disabled={isSearching}
                     onPageChange={(page) => runSearch({...appliedSearch, page})}/>
        ) : null}
      </section>
    </main>
  );
}

function UserRow({user}: { user: AdminUserSummaryDto }) {
  const identityLabel = user.displayName || user.email || user.phoneNumber || user.id;
  const statusView = statusLabels[user.status] ?? {label: user.status, tone: "quiet" as const};

  return (
    <Link
      href={`/admin/users/${user.id}`}
      className="grid gap-3 rounded-2xl border bg-background/45 p-4 transition-colors hover:border-primary/50 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-base font-black text-foreground">{identityLabel}</strong>
          {user.role === "ADMIN" ? (
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              ادمین
            </span>
          ) : null}
          <span className={statusView.tone === "warn"
            ? "rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive"
            : "rounded-full border px-2 py-0.5 text-xs font-bold text-muted-foreground"}>
            {statusView.label}
          </span>
          {user.subscriptionStatus ? (
            <span className="rounded-full border px-2 py-0.5 text-xs font-bold text-muted-foreground">
              اشتراک: {user.subscriptionStatus}
            </span>
          ) : null}
          {user.promotionRedemptions > 0 ? <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-black text-primary">کد تخفیف: {user.promotionRedemptions.toLocaleString("fa-IR")}</span> : null}
        </div>
        <p className="mt-1 break-all text-xs font-bold text-muted-foreground" dir="ltr">
          {user.email ?? "—"} · {user.phoneNumber ?? "—"} · {user.id}
        </p>
      </div>
      <span className="text-xs font-bold text-muted-foreground">جزئیات ←</span>
    </Link>
  );
}

function Paginator({page, totalPages, disabled, onPageChange}: {
  page: number;
  totalPages: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav className="mt-4 flex items-center justify-between gap-2" aria-label="صفحه‌بندی">
      {page > 0 ? (
        <Button type="button" variant="outline" className="h-10 rounded-full font-black" disabled={disabled}
                onClick={() => onPageChange(page - 1)}>صفحه قبل</Button>
      ) : <span/>}
      <span className="text-xs font-bold text-muted-foreground">
        صفحه {toPersianDigits(page + 1)} از {toPersianDigits(totalPages)}
      </span>
      {page + 1 < totalPages ? (
        <Button type="button" variant="outline" className="h-10 rounded-full font-black" disabled={disabled}
                onClick={() => onPageChange(page + 1)}>صفحه بعد</Button>
      ) : <span/>}
    </nav>
  );
}

const statusLabels: Record<string, { label: string; tone: "quiet" | "warn" }> = {
  ACTIVE: {label: "فعال", tone: "quiet"},
  PENDING_VERIFICATION: {label: "در انتظار تأیید", tone: "quiet"},
  DISABLED: {label: "غیرفعال‌شده", tone: "warn"},
  DEACTIVATED: {label: "لغو فعالیت", tone: "warn"},
  DELETED: {label: "حذف‌شده", tone: "warn"},
};

const roleOptions = [
  {value: "all", label: "همه نقش‌ها"},
  {value: "USER", label: "کاربر"},
  {value: "ADMIN", label: "ادمین"},
] as const;

const accountStatusOptions = [
  {value: "all", label: "همه وضعیت‌ها"},
  {value: "ACTIVE", label: "فعال"},
  {value: "PENDING_VERIFICATION", label: "در انتظار تأیید"},
  {value: "DISABLED", label: "غیرفعال‌شده"},
  {value: "DEACTIVATED", label: "لغو فعالیت"},
  {value: "DELETED", label: "حذف‌شده"},
] as const;

function normalizedSearch(search: UsersSearch): UsersSearch {
  const query = search.query?.trim().slice(0, 320);
  const role = search.role === "USER" || search.role === "ADMIN" ? search.role : undefined;
  const status = accountStatusOptions.some((option) => option.value === search.status && option.value !== "all")
    ? search.status
    : undefined;
  return {query: query || undefined, role, status, page: Math.max(0, search.page ?? 0)};
}

function adminUsersSearchUrl(search: UsersSearch) {
  const params = searchParamsFrom(search);
  return `/api/admin/users/search?${params.toString()}`;
}

function syncSearchUrl(search: UsersSearch) {
  const params = searchParamsFrom(search);
  const queryString = params.toString();
  window.history.replaceState(null, "", queryString ? `/admin/users?${queryString}` : "/admin/users");
}

function searchParamsFrom(search: UsersSearch) {
  const params = new URLSearchParams();
  if (search.query) params.set("query", search.query);
  if (search.role) params.set("role", search.role);
  if (search.status) params.set("status", search.status);
  if (search.page) params.set("page", String(search.page));
  return params;
}
