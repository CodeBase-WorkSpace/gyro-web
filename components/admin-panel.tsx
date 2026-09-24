import type {ReactNode} from "react";
import Link from "next/link";

import {AppTopBar} from "@/components/design-system/app-top-bar";
import {buttonVariants} from "@/components/ui/button";
import type {SubscriptionCatalogDto} from "@/lib/api/subscription-catalog";
import {toPersianDigits} from "@/lib/format";
import {billingPeriodLabel, catalogPricePresentation, plansWithCatalog,} from "@/lib/subscription/plans";

function Icon({name}: { name: "search" | "check" | "arrow" }) {
  const paths = {
    search: "m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4z",
    check: "m5 12 4 4L19 6",
    arrow: "M5 12h14m-6-6 6 6-6 6",
  };

  return (
    <svg
      aria-hidden="true"
      className="size-4 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
      viewBox="0 0 24 24"
    >
      <path d={paths[name]}/>
    </svg>
  );
}

export function AdminPanel({
                             subscriptionCatalog,
                             subscriptionCatalogLoadFailed = false,
                           }: {
  subscriptionCatalog?: SubscriptionCatalogDto | null;
  subscriptionCatalogLoadFailed?: boolean;
}) {
  const subscriptionPlans = plansWithCatalog(subscriptionCatalog);

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10"
      aria-label="پنل ادمین Gyro"
    >
      <AppTopBar
        title="پنل ادمین Gyro"
        description="مرکز کنترل سلامت محصول، کیفیت داده‌ها و آمادگی API"
        backLink={{href: "/dashboard", label: "داشبورد کاربر"}}
        showDateControl={false}
        showMobileDateAction={false}
      />

      {subscriptionCatalogLoadFailed ? (
        <div
          className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-bold leading-7 text-destructive">
          کاتالوگ اشتراک از backend دریافت نشد؛ داده‌های این بخش
          fallback محلی هستند و برای بررسی provider mapping قابل اتکا
          نیستند.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <section
          className="rounded-3xl border bg-card/90 p-5 shadow-sm"
          aria-label="عملیات صورتحساب"
        >
          <AdminSectionHeader
            eyebrow="پشتیبانی پرداخت"
            title="صورتحساب و پرداخت‌ها"
            action={<Icon name="search"/>}
          />
          <p className="text-sm font-medium leading-7 text-muted-foreground">
            جستجوی کاربر، ایمیل، شماره تماس، شناسه‌های پرداخت و
            مشاهده خط زمانی امن هر صورتحساب در صفحه تخصصی انجام
            می‌شود.
          </p>
          <Link
            href="/admin/billing"
            className={buttonVariants({
              className:
                "mt-4 h-11 w-full rounded-full font-black",
            })}
          >
            ورود به مرکز صورتحساب
            <Icon name="arrow"/>
          </Link>
        </section>

        <section
          className="rounded-3xl border bg-card/90 p-5 shadow-sm"
          aria-label="مدیریت کاربران"
        >
          <AdminSectionHeader
            eyebrow="حساب‌ها و حریم خصوصی"
            title="مدیریت کاربران"
            action={<Icon name="search"/>}
          />
          <p className="text-sm font-medium leading-7 text-muted-foreground">
            جستجوی کاربران، مشاهده همه داده‌های نگه‌داری‌شده برای هر
            حساب و حذف کامل داده‌ها با پیش‌نمایش، تأیید تایپی و ثبت
            ممیزی.
          </p>
          <Link
            href="/admin/users"
            className={buttonVariants({
              className:
                "mt-4 h-11 w-full rounded-full font-black",
            })}
          >
            ورود به مدیریت کاربران
            <Icon name="arrow"/>
          </Link>
        </section>

        <section
          className="rounded-3xl border bg-card/90 p-5 shadow-sm"
          aria-label="کدهای تخفیف"
        >
          <AdminSectionHeader
            eyebrow="اشتراک"
            title="کدهای تخفیف"
            action={<Icon name="search"/>}
          />
          <p className="text-sm font-medium leading-7 text-muted-foreground">
            ساخت، ویرایش و بایگانی کدها و مشاهده مصرف آن‌ها.
          </p>
          <Link
            href="/admin/promotions"
            className={buttonVariants({
              className:
                "mt-4 h-11 w-full rounded-full font-black",
            })}
          >
            مدیریت کدهای تخفیف
            <Icon name="arrow"/>
          </Link>
        </section>

        <section
          className="rounded-3xl border bg-card/90 p-5 shadow-sm"
          aria-label="ارسال اعلان"
        >
          <AdminSectionHeader
            eyebrow="ارتباط با کاربران"
            title="ارسال اعلان"
            action={<Icon name="search"/>}
          />
          <p className="text-sm font-medium leading-7 text-muted-foreground">
            ارسال اعلان Push به کاربران دارای اشتراک اعلان و مشاهده
            وضعیت اعلان‌های ارسال‌شده.
          </p>
          <Link
            href="/admin/notifications"
            className={buttonVariants({
              className:
                "mt-4 h-11 w-full rounded-full font-black",
            })}
          >
            ورود به ارسال اعلان
            <Icon name="arrow"/>
          </Link>
        </section>

        <section
          className="rounded-3xl border bg-card/90 p-5 shadow-sm"
          aria-label="همکاران فروش"
        >
          <AdminSectionHeader
            eyebrow="جذب مشتری"
            title="همکاران فروش"
            action={<Icon name="search"/>}
          />
          <p className="text-sm font-medium leading-7 text-muted-foreground">
            ساخت کد اختصاصی، اتصال حساب تأییدشده و مشاهده فروش و
            درآمد تجمیعی.
          </p>
          <Link
            href="/admin/affiliates"
            className={buttonVariants({
              className:
                "mt-4 h-11 w-full rounded-full font-black",
            })}
          >
            مدیریت همکاران فروش
            <Icon name="arrow"/>
          </Link>
        </section>

        <section
          className="rounded-3xl border bg-card/90 p-5 shadow-sm"
          aria-label="مدیریت قیمت اشتراک"
        >
          <AdminSectionHeader
            eyebrow="اشتراک"
            title="قیمت‌های اشتراک"
            action={<Icon name="arrow"/>}
          />
          <p className="text-sm font-medium leading-7 text-muted-foreground">
            ساخت و زمان‌بندی نسخه جدید قیمت، بررسی اثر تغییر و
            مشاهده تاریخچه قیمت‌های ماهانه، سه‌ماهه و سالانه.
          </p>
          <Link
            href="/admin/subscription-prices"
            className={buttonVariants({
              className:
                "mt-4 h-11 w-full rounded-full font-black",
            })}
          >
            ورود به مدیریت قیمت‌ها
            <Icon name="arrow"/>
          </Link>
        </section>

        <section
          className="rounded-3xl border bg-card/90 p-5 shadow-sm"
          aria-label="کاتالوگ غذا"
        >
          <AdminSectionHeader
            eyebrow="داده غذایی"
            title="کاتالوگ غذا"
            action={<Icon name="search"/>}
          />
          <p className="text-sm font-medium leading-7 text-muted-foreground">
            ساخت و ویرایش غذاهای سیستمی با برند، ترجمه
            فارسی/انگلیسی، نام‌های مستعار، ارزش غذایی و چند گزینه
            سروینگ؛ همراه با آرشیو، بازیابی و هشدارهای اعتبارسنجی.
          </p>
          <Link
            href="/admin/catalog"
            className={buttonVariants({
              className:
                "mt-4 h-11 w-full rounded-full font-black",
            })}
          >
            ورود به کاتالوگ غذا
            <Icon name="arrow"/>
          </Link>
        </section>

        <section
          className="rounded-3xl border bg-card/90 p-5 shadow-sm xl:col-span-2"
          id="subscription-catalog"
          aria-label="کاتالوگ اشتراک"
        >
          <AdminSectionHeader
            eyebrow="اشتراک v1"
            title="کاتالوگ پلن و قیمت"
            action={
              <StatusChip>
                {subscriptionCatalog
                  ? "داده backend"
                  : subscriptionCatalogLoadFailed
                    ? "خطای backend"
                    : "fallback محلی"}
              </StatusChip>
            }
          />
          <div className="grid gap-3 lg:grid-cols-2">
            {subscriptionPlans.map((plan) => (
              <article
                key={plan.tier}
                className="grid gap-4 rounded-2xl border bg-background/45 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <strong className="text-base font-black">
                      {plan.localizedName}
                    </strong>
                    <p className="mt-1 text-xs font-bold text-muted-foreground">
                      {plan.name} · {plan.tier}
                    </p>
                  </div>
                  <StatusChip>
                    {plan.prices.length
                      ? toPersianDigits(
                        plan.prices.length,
                      )
                      : "رایگان"}
                  </StatusChip>
                </div>

                <div className="grid gap-2">
                  <p className="text-xs font-black text-muted-foreground">
                    قیمت‌ها
                  </p>
                  {plan.prices.length ? (
                    plan.prices.map((price) => {
                      const presentation = catalogPricePresentation(price);
                      return <div
                        key={price.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card/70 px-3 py-2 text-sm font-bold"
                      >
												<span>
													{billingPeriodLabel(
                            price.billingPeriodDays,
                          )}
												</span>
                        <span className="tabular-nums tracking-normal">
                          {presentation.basePrice ? (
                            <span className="me-2 text-xs text-muted-foreground line-through">
                              {presentation.basePrice}
                            </span>
                          ) : null}
                          {presentation.finalPrice}
                          {presentation.discountLabel ? (
                            <span className="me-2 rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] text-primary">
                              {presentation.discountLabel}
                            </span>
                          ) : null}
                          {price.badge ? (
                            <span className="me-2 rounded-full border px-2 py-0.5 text-[0.65rem] text-primary">
															{price.badge}
														</span>
                          ) : null}
												</span>
                      </div>;
                    })
                  ) : (
                    <p className="rounded-xl border bg-card/70 px-3 py-2 text-sm font-bold text-muted-foreground">
                      بدون قیمت پرداختی
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <p className="text-xs font-black text-muted-foreground">
                    قابلیت‌ها
                  </p>
                  <ul className="grid gap-1 text-xs font-bold leading-6 text-muted-foreground">
                    {(subscriptionCatalog
                        ? plan.catalogFeatures
                        : plan.features
                    )
                      .slice(0, 5)
                      .map((feature) => (
                        <li
                          key={
                            feature.key ??
                            feature.label
                          }
                        >
                          {feature.label}
                          {subscriptionCatalog ? (
                            <span className="me-2 text-[0.65rem] text-muted-foreground">
															{feature.included
                                ? "enabled"
                                : "disabled"}
														</span>
                          ) : null}
                        </li>
                      ))}
                  </ul>
                </div>

                <div className="grid gap-2 text-xs font-bold text-muted-foreground sm:grid-cols-2">
									<span className="rounded-xl border bg-card/70 px-3 py-2">
										locale دریافتی:{" "}
                    {plan.locale ?? "fallback محلی"}
									</span>
                  <span className="rounded-xl border bg-card/70 px-3 py-2">
										provider mappings: خارج از پاسخ عمومی؛
										نیازمند endpoint ادمین جداگانه
									</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function AdminSectionHeader({
                              eyebrow,
                              title,
                              action,
                            }: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-black text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-black tracking-normal text-foreground">
          {title}
        </h2>
      </div>
      {action ? (
        <div className="shrink-0 text-primary">{action}</div>
      ) : null}
    </div>
  );
}

function StatusChip({children}: { children: ReactNode }) {
  return (
    <span
      className="inline-flex h-8 items-center rounded-full border bg-background/70 px-3 text-xs font-black text-foreground">
			{children}
		</span>
  );
}
