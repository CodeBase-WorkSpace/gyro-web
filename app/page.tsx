import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import type {ReactNode} from "react";
import {
	ActivityIcon,
	ArrowLeftIcon,
	CalculatorIcon,
	CheckIcon,
	FlameIcon,
	LineChartIcon,
	PlusIcon,
	Repeat2,
	SearchIcon,
	ShieldCheckIcon,
	SmartphoneIcon,
	SparklesIcon,
	UtensilsIcon,
} from "lucide-react";

import {buttonVariants} from "@/components/ui/button";
import {DownloadBadges} from "@/components/public/download-badges";
import {MarketingInstallLink} from "@/components/public/marketing-install-link";
import {getSubscriptionCatalog, logSubscriptionCatalogLoadFailure} from "@/lib/api/subscription-catalog";
import {billingPeriodLabel, catalogPricePresentation, defaultDisplayPrice, formatPlanPrice, plansWithCatalog} from "@/lib/subscription/plans";
import {createPersianPageMetadata} from "@/lib/seo/metadata";
import {cn} from "@/lib/utils";

const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL ?? "";
const signupHref = `${appBaseUrl}/auth/signup`;
const loginHref = `${appBaseUrl}/auth/login`;

export const metadata: Metadata = createPersianPageMetadata({
	path: "/fa",
  title: "جیرو | دفتر تغذیه فارسی برای ثبت غذا و هدف روزانه",
	description:
    "جیرو یک دفتر تغذیه فارسی برای ثبت سریع غذا، دیدن هدف کالری، مرور وزن و دنبال کردن پیشرفت روزانه بدون فشار و شلوغی است.",
  ogTitle: "جیرو | دفتر تغذیه فارسی",
	ogDescription:
    "غذا را سریع ثبت کنید، هدف روزانه را بفهمید و روند تغذیه و وزن را بدون شلوغی دنبال کنید.",
	imageAlt: "صفحه فرود جیرو با نمای محصول",
});

const heroStats = [
	{ label: "ثبت امروز", value: "۷ غذا" },
	{ label: "ثبت هفته", value: "۵ روز" },
	{ label: "هدف فعال", value: "۱٬۸۵۰ کالری" },
];

const meals = [
	{ name: "صبحانه", items: "نان سنگک، تخم‌مرغ، آووکادو", calories: "۴۲۰" },
	{ name: "ناهار", items: "مرغ گریل، برنج، سالاد", calories: "۶۸۰" },
	{ name: "میان‌وعده", items: "ماست یونانی، موز، رایس کیک", calories: "۳۷۵" },
];

const productBenefits = [
	{
		icon: UtensilsIcon,
    title: "ثبت غذا وقتی وقت کم است",
		description:
      "غذا، وعده و مقدار مصرف را همان لحظه ثبت کنید تا گزارش روزتان ناقص نماند.",
	},
	{
		icon: CalculatorIcon,
    title: "هدف کالری قابل توضیح",
		description:
      "هدف روزانه بر اساس اطلاعات واردشده ساخته می‌شود و هر زمان لازم بود می‌توانید آن را تغییر دهید.",
	},
	{
		icon: LineChartIcon,
    title: "پیشرفت هفتگی قابل اسکن",
		description:
      "روزهای ثبت‌شده، میانگین کالری، ماکروها و وزن را در یک نگاه ببینید.",
	},
	{
		icon: Repeat2,
    title: "ساخته‌شده برای ادامه دادن",
		description:
      "مسیرهای پرتکرار کوتاه شده‌اند تا ثبت روزانه به یک کار سنگین تبدیل نشود.",
	},
];

const supportSections = [
	{
		icon: ShieldCheckIcon,
    title: "داده‌های شما در حساب شماست",
		description:
      "اطلاعات تغذیه، وزن و هدف برای ساخت گزارش و تجربه شخصی شما استفاده می‌شود.",
	},
	{
		icon: SmartphoneIcon,
    title: "مناسب استفاده روزانه روی موبایل",
		description:
      "جیرو روی موبایل مثل یک PWA نصب می‌شود و همیشه نزدیک دفتر روزانه شماست.",
	},
	{
		icon: SparklesIcon,
    title: "راهنمایی بدون اغراق",
    description:
      "محاسبه‌ها تخمینی‌اند و برای آگاهی بهتر از روند تغذیه استفاده می‌شوند.",
  },
];

const trustHighlights = [
  {
    icon: ShieldCheckIcon,
    title: "شفاف درباره داده‌ها",
    description:
      "قد، وزن، هدف و غذاهای ثبت‌شده برای محاسبه هدف و ساخت گزارش استفاده می‌شوند؛ نه برای فشار آوردن به شما.",
  },
  {
    icon: CalculatorIcon,
    title: "عددها تخمینی‌اند",
		description:
      "کالری و ماکروها بر اساس داده‌های واردشده و اطلاعات غذایی محاسبه می‌شوند و جایگزین نظر متخصص نیستند.",
  },
  {
    icon: ActivityIcon,
    title: "تمرکز روی روند، نه قضاوت",
    description:
      "گزارش‌ها کمک می‌کنند الگوها را ببینید؛ هیچ روزی با زبان سرزنش یا شکست نمایش داده نمی‌شود.",
	},
];

export default async function LandingPage() {
	const catalog = await loadSubscriptionCatalog();
	const plans = plansWithCatalog(catalog).map((plan) => {
		const displayPrice = defaultDisplayPrice(plan.prices);

		return {
			name: plan.localizedName,
			price: displayPrice ? formatPlanPrice(displayPrice) : plan.eyebrow,
			priceRows: plan.prices.map((price) => {
				const presentation = catalogPricePresentation(price);
				return {
					label: billingPeriodLabel(price.billingPeriodDays),
					value: presentation.finalPrice,
					baseValue: presentation.basePrice,
					discountLabel: presentation.discountLabel,
					badge: price.badge,
				};
			}),
			description: plan.summary,
			features: plan.features.slice(0, plan.featured ? 5 : 4).map((feature) => feature.label),
			cta: plan.featured ? "مشاهده وضعیت اشتراک" : plan.cta,
      href: plan.featured ? `${appBaseUrl}/profile/billing` : signupHref,
			featured: plan.featured,
		};
	});

	return (
		<main className="min-h-dvh overflow-hidden bg-background text-foreground">
			<section className="relative isolate border-b border-border/70">
				<LandingPattern />
				<div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
					<LandingNav />

					<div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(460px,1.08fr)] lg:gap-12 lg:py-14">
						<div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-right">
							<p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-black text-primary">
								<SparklesIcon
									className="size-4"
									aria-hidden="true"
								/>
                برای ثبت راحت روزانه
							</p>
							<h1 className="mt-6 text-balance font-heading text-[clamp(2.35rem,10vw,4.9rem)] font-black leading-[1.18] tracking-normal lg:leading-[1.12]">
                دفتر تغذیه فارسی برای انتخاب‌های روشن‌تر
							</h1>
							<p className="mx-auto mt-5 max-w-xl text-pretty text-base font-semibold leading-8 text-muted-foreground sm:text-lg sm:leading-9 lg:mx-0">
                غذا را سریع ثبت کنید، هدف کالری را بفهمید و
                روند تغذیه و وزن را بدون فشار دنبال کنید.
							</p>

							<div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
								<Link
									href={signupHref}
									className={cn(
										buttonVariants({ size: "xl" }),
										"h-12 rounded-full px-6",
									)}
								>
                  شروع رایگان
									<ArrowLeftIcon data-icon="inline-end" />
								</Link>
								<Link
									href="#plans"
									className={cn(
										buttonVariants({
											variant: "outline",
											size: "xl",
										}),
										"h-12 rounded-full px-6",
									)}
								>
                  مشاهده طرح‌ها
								</Link>
								{/* <Link
									href={loginHref}
									className={cn(
										buttonVariants({
											variant: "ghost",
											size: "xl",
										}),
										"h-12 rounded-full px-6 text-muted-foreground",
									)}
								>
									ورود به اپ
								</Link> */}
							</div>

							<div className="mt-6">
								<DownloadBadges />
							</div>

							<dl className="mt-8 grid gap-3 sm:grid-cols-3">
								{heroStats.map((stat) => (
									<div
										key={stat.label}
										className="rounded-2xl border border-border/80 bg-card/55 px-4 py-3 text-center lg:text-right"
									>
										<dt className="text-xs font-bold text-muted-foreground">
											{stat.label}
										</dt>
										<dd className="mt-1 text-lg font-black tabular-nums tracking-normal">
											{stat.value}
										</dd>
									</div>
								))}
							</dl>
						</div>

						<HeroProductScene />
					</div>
				</div>
			</section>

			<section id="why-gyro" className="scroll-mt-24 border-b border-border/70 bg-card/20 py-16 sm:py-24">
				<div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
					<SectionIntro
						eyebrow="چرا جیرو"
            title="برای روزهایی که می‌خواهید بدانید چه خورده‌اید."
            description="جیرو ثبت غذا، هدف کالری و گزارش پیشرفت را کنار هم می‌گذارد تا تصمیم بعدی ساده‌تر شود."
					/>
					<div className="grid gap-3 sm:grid-cols-2">
						{productBenefits.map((benefit) => (
							<FeatureCard key={benefit.title} {...benefit} />
						))}
					</div>
				</div>
			</section>

			<section id="how-it-works" className="scroll-mt-24 py-16 sm:py-24">
				<div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
					<div className="lg:col-span-5">
						<SectionIntro
							eyebrow="چطور کار می‌کند"
              title="از ثبت یک وعده تا دیدن روند هفته."
              description="مسیر اصلی کوتاه است: غذا را ثبت کنید، هدف همان روز را ببینید و آخر هفته روندتان را مرور کنید."
						/>
					</div>
					<div className="grid gap-3 lg:col-span-7">
						<LedgerLoopPanel />
						<div className="grid gap-3 sm:grid-cols-3">
							{supportSections.map((section) => (
								<FeatureCard
									key={section.title}
									{...section}
									compact
								/>
							))}
						</div>
					</div>
				</div>
			</section>

			<section
				id="plans"
				className="scroll-mt-24 border-y border-border/70 bg-card/20 py-16 sm:py-24"
			>
				<div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
						<SectionIntro
							eyebrow="پلن‌ها"
              title="رایگان شروع کنید؛ وقتی جزئیات بیشتری خواستید ارتقا دهید."
              description="نسخه رایگان برای شروع ثبت روزانه کافی است. طرح پیشرفته برای گزارش دقیق‌تر، هدف‌های روشن‌تر و برنامه‌ریزی منظم‌تر ساخته شده است."
						/>
						<p className="rounded-3xl border border-border/80 bg-background/55 p-5 leading-8 text-muted-foreground">
							با نسخه رایگان می‌توانید غذا، وزن و هدف روزانه را
              ثبت کنید و مسیرتان را ببینید. طرح پیشرفته برای
							کاربرانی است که کنترل بیشتر، تحلیل عمیق‌تر و
              برنامه‌ریزی دقیق‌تری می‌خواهند. قیمت، مدت و
              شرایط هر طرح قبل از پرداخت نمایش داده می‌شود.
						</p>
					</div>
					<div className="mt-8 grid gap-3 lg:grid-cols-3">
						{plans.map((plan) => (
							<PlanCard key={plan.name} {...plan} />
						))}
					</div>
				</div>
			</section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <SectionIntro
            eyebrow="اعتماد و سلامت"
            title="کمک برای آگاهی بیشتر، نه نسخه پزشکی."
            description="جیرو با داده‌هایی که وارد می‌کنید کار می‌کند. اگر بیماری، بارداری، دارو یا محدودیت غذایی خاص دارید، تغییر جدی برنامه غذایی را با متخصص بررسی کنید."
          />
          <div className="grid gap-3 sm:grid-cols-3">
            {trustHighlights.map((item) => (
              <FeatureCard
                key={item.title}
                {...item}
                compact
              />
            ))}
          </div>
        </div>
      </section>

			<footer className="border-t border-border/70 bg-card/20 py-12 sm:py-16">
				<div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_1.4fr] lg:px-8">
					<div>
						<GyroLandingMark />
						<p className="mt-5 max-w-md leading-8 text-muted-foreground">
              جیرو یک دفتر تغذیه فارسی برای ثبت غذا، دیدن هدف
              روزانه و دنبال کردن روند پیشرفت است.
						</p>
						<div className="mt-6 flex items-center gap-4">
							<a
								href="https://trustseal.enamad.ir/?id=750810&Code=A3KmfPoOpk3oerJO3KiqtJKLqrKkcd20"
								target="_blank"
								referrerPolicy="origin"
								aria-label="اینماد جیرو"
							>
								<Image
									src="https://trustseal.enamad.ir/logo.aspx?id=750810&Code=A3KmfPoOpk3oerJO3KiqtJKLqrKkcd20"
									alt="نماد اعتماد الکترونیکی"
									width={90}
									height={90}
									unoptimized
									className="h-20 w-auto cursor-pointer"
								/>
							</a>
						</div>
						<div className="mt-6 flex flex-col gap-3 sm:flex-row">
							<Link
								href={signupHref}
								className={cn(
									buttonVariants({ size: "lg" }),
									"h-11 rounded-full px-5",
								)}
							>
                شروع رایگان
								<ArrowLeftIcon data-icon="inline-end" />
							</Link>
							<Link
								href={loginHref}
								className={cn(
									buttonVariants({
										variant: "outline",
										size: "lg",
									}),
									"h-11 rounded-full px-5",
								)}
							>
								ورود به اپ
							</Link>
						</div>
					</div>

					<div className="grid gap-6 sm:grid-cols-3">
						<FooterColumn
							title="محصول"
							links={[
							{ label: "چرا جیرو", href: "#why-gyro" },
							{ label: "چطور کار می‌کند", href: "#how-it-works" },
								{
									label: "کالری شمار آیفون",
									href: "/fa/app/calorie-counter-iphone",
								},
                {label: "طرح‌ها", href: "#plans"},
							{label: "ابزارهای تغذیه", href: "/fa/tools"},
							{label: "راهنماهای تغذیه", href: "/fa/guides"},
							]}
						/>
						<FooterColumn
							title="حساب کاربری"
							links={[
								{ label: "ساخت حساب", href: signupHref },
								{ label: "ورود", href: loginHref },
								{
									label: "باز کردن اپ",
									href: appBaseUrl || loginHref,
								},
							]}
						/>
						<FooterColumn
							title="پشتیبانی"
							links={[
								{
									label: "تماس با ما",
									href: "/contact",
								},
								{ label: "حریم خصوصی", href: "/privacy" },
								{ label: "شرایط استفاده", href: "/terms" },
							]}
						/>
					</div>
				</div>

				<div className="mx-auto mt-10 flex w-full max-w-7xl flex-col gap-3 border-t border-border/70 px-4 pt-6 text-sm font-bold text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
					<p>
						© {new Date().getFullYear()} جیرو. همه حقوق محفوظ است.
					</p>
					<p>gyrohealth.ir</p>
				</div>
			</footer>
		</main>
	);
}

async function loadSubscriptionCatalog() {
	try {
		return await getSubscriptionCatalog("fa-IR", {
			cache: "force-cache",
			next: {revalidate: 300},
			timeoutMs: 3_000,
		});
	} catch (error) {
		logSubscriptionCatalogLoadFailure("landing", error);
		return null;
	}
}

function LandingNav() {
	return (
		<header className="flex items-center justify-between gap-4 py-3">
			<GyroLandingMark />
			<nav
				className="flex items-center gap-2"
				aria-label="ناوبری صفحه فرود"
			>
				<Link href="/fa/app" className="hidden px-2 py-1 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground lg:inline-flex">امکانات</Link>
				<Link href="/fa/tools" className="hidden px-2 py-1 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground lg:inline-flex">ابزارها</Link>
				<Link href="/fa/foods" className="hidden px-2 py-1 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground lg:inline-flex">غذاها</Link>
				<Link href="/fa/guides" className="hidden px-2 py-1 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground lg:inline-flex">راهنماها</Link>
				<Link
					href={loginHref}
					className={cn(
						buttonVariants({ variant: "ghost", size: "lg" }),
						"hidden rounded-full text-muted-foreground sm:inline-flex",
					)}
				>
					ورود
				</Link>
				<MarketingInstallLink />
				<Link
					href={signupHref}
					className={cn(
						buttonVariants({ variant: "outline", size: "lg" }),
						"rounded-full",
					)}
				>
					شروع
				</Link>
			</nav>
		</header>
	);
}

function GyroLandingMark() {
	return (
		<Link
			href="/"
			className="flex items-center gap-3 text-foreground"
			aria-label="صفحه اصلی جیرو"
		>
			<span className="relative grid size-12 place-items-center">
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
				<strong className="text-xl font-black tracking-normal">
					جیرو
				</strong>
				<small className="text-xs font-bold text-muted-foreground">
					دفتر سلامتی
				</small>
			</span>
		</Link>
	);
}

function LandingPattern() {
	return (
		<div
			className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
			aria-hidden="true"
		>
			<SoftAuroraBackground />
			<div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--background)_16%,transparent),var(--background)_88%)]" />
			<div className="absolute inset-x-0 top-0 h-full opacity-[0.07] [background-image:linear-gradient(to_left,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] [background-size:56px_56px]" />
		</div>
	);
}

function SoftAuroraBackground() {
	return (
		<div
			className="soft-aurora absolute inset-x-[-18%] top-[-22%] h-[66rem] opacity-80"
			aria-hidden="true"
		>
			<span className="soft-aurora__band soft-aurora__band--primary" />
			<span className="soft-aurora__band soft-aurora__band--card" />
			<span className="soft-aurora__band soft-aurora__band--muted" />
		</div>
	);
}

function HeroProductScene() {
	return (
		<div
			className="relative mx-auto w-full max-w-150 lg:max-w-none lg:py-10"
			aria-label="نمای محصول جیرو"
		>
			<div className="relative mx-auto w-full max-w-92.5 rounded-[2.35rem] border border-border/90 bg-background p-3 shadow-[0_34px_100px_color-mix(in_oklch,var(--background)_78%,black)] lg:mr-auto lg:ml-60">
				<div className="rounded-[2rem] border border-border/80 bg-card/95 p-4">
					<div className="flex items-center justify-between gap-4">
						<ProductMiniHeader />
						<button
							className="grid size-10 place-items-center rounded-2xl border border-border bg-muted/45 text-primary"
							type="button"
							aria-label="افزودن غذا"
						>
							<PlusIcon className="size-5" aria-hidden="true" />
						</button>
					</div>
					<div className="mt-6">
						<p className="text-sm font-bold text-muted-foreground">
							هدف امروز
						</p>
						<div className="mt-2 flex items-end justify-between gap-4">
							<strong className="text-5xl font-black tracking-normal">
								۱٬۹۴۲
							</strong>
							{/* <span className="pb-2 text-sm font-bold text-muted-foreground">
								کالری ثبت‌شده
							</span> */}
						</div>
					</div>
					<NutritionRingsPreview />
					<div className="mt-5 grid gap-2">
						{meals.map((meal) => (
							<div
								key={meal.name}
								className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/55 px-3 py-3"
							>
								<span className="min-w-0">
									<strong className="block text-sm">
										{meal.name}
									</strong>
									<small className="block truncate text-xs font-bold text-muted-foreground">
										{meal.items}
									</small>
								</span>
								<b className="shrink-0 text-sm tabular-nums">
									{meal.calories}
								</b>
							</div>
						))}
					</div>
				</div>
				<QuickAddSheetPreview />
			</div>

			<div className="mt-4 rounded-[2rem] border border-border/80 bg-card/80 p-4 shadow-[0_22px_72px_color-mix(in_oklch,var(--background)_62%,black)] lg:absolute lg:left-0 lg:top-16 lg:mt-0 lg:w-[52%]">
				<div className="flex items-center gap-2">
					<ActivityIcon
						className="size-4 text-primary"
						aria-hidden="true"
					/>
          <h2 className="font-black">پیشرفت هفتگی</h2>
				</div>
				<div className="mt-5 grid grid-cols-7 gap-1.5">
					{["ش", "ی", "د", "س", "چ", "پ", "ج"].map((day, index) => (
						<div
							key={day}
							className={cn(
								"grid min-h-16 place-items-center rounded-2xl border text-center",
								index < 5
									? "border-primary/45 bg-primary/10"
									: "border-dashed bg-muted/20 text-muted-foreground",
							)}
						>
							<span className="text-xs font-black">{day}</span>
							<span
								className={cn(
									"grid size-7 place-items-center rounded-full text-[0.65rem] font-black",
									index < 5
										? "bg-primary text-primary-foreground"
										: "border border-dashed",
								)}
							>
								{index < 5 ? (
									<CheckIcon className="size-3" />
								) : (
									"—"
								)}
							</span>
						</div>
					))}
				</div>
				<div className="mt-4 grid gap-2">
					<ProgressLine
						label="پروتئین"
						value="82%"
						className="bg-[var(--nutrient-protein)]"
					/>
					<ProgressLine
						label="کربوهیدرات"
						value="68%"
						className="bg-[var(--nutrient-carbs)]"
					/>
					<ProgressLine
						label="چربی"
						value="54%"
						className="bg-[var(--nutrient-fat)]"
					/>
				</div>
			</div>
		</div>
	);
}

function ProductMiniHeader() {
	return (
		<div className="flex items-center gap-2">
			<Image
				src="/brand/gyro-symbol-48.png"
				alt=""
				width={36}
				height={36}
				className="size-9 object-contain"
			/>
			<span className="grid leading-tight">
				<strong className="text-sm font-black">جیرو</strong>
				<small className="text-[0.7rem] font-bold text-muted-foreground">
					امروز، ۱۲ تیر
				</small>
			</span>
		</div>
	);
}

function NutritionRingsPreview() {
	return (
		<div className="relative mx-auto mt-5 grid size-52 place-items-center rounded-full border border-border/70 bg-background/45">
			<div className="absolute size-44 rounded-full border-[10px] border-primary/80" />
			<div
				className="absolute size-[8.5rem] rounded-full border-[8px]"
				style={{
					borderColor:
						"color-mix(in oklch, var(--nutrient-protein) 80%, transparent)",
				}}
			/>
			<div
				className="absolute size-[6.25rem] rounded-full border-[7px]"
				style={{
					borderColor:
						"color-mix(in oklch, var(--nutrient-carbs) 80%, transparent)",
				}}
			/>
			<div className="grid size-24 place-items-center rounded-full bg-card text-center shadow-sm">
				<span>
					<b className="block text-2xl font-black tabular-nums">
						۷۶٪
					</b>
					<small className="text-xs font-bold text-muted-foreground">
						هدف
					</small>
				</span>
			</div>
		</div>
	);
}

function QuickAddSheetPreview() {
	return (
		<div className="-mx-1 -mb-1 mt-3 rounded-[1.75rem] border border-border/90 bg-card p-4 shadow-[0_-18px_50px_color-mix(in_oklch,var(--background)_58%,transparent)]">
			<div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
			<div className="flex items-center gap-2 rounded-2xl border border-border bg-background/55 px-3 py-2 text-muted-foreground">
				<SearchIcon className="size-4" aria-hidden="true" />
				<span className="text-sm font-bold">جستجوی غذا یا وعده</span>
			</div>
			<div className="mt-3 flex gap-2">
				<span className="rounded-full bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground">
					صبحانه
				</span>
				<span className="rounded-full border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground">
					ناهار
				</span>
				<span className="rounded-full border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground">
					شام
				</span>
			</div>
		</div>
	);
}

function LedgerLoopPanel() {
	return (
		<div className="rounded-[2rem] border border-border/80 bg-card/80 p-5 sm:p-6">
			<div className="grid gap-3 sm:grid-cols-3">
				<LoopStep
					icon={<UtensilsIcon />}
					title="ثبت"
          description="غذا یا وعده را جست‌وجو کنید و مقدار مصرف را وارد کنید."
				/>
				<LoopStep
					icon={<FlameIcon />}
					title="هدف"
          description="کالری و ماکروها کنار ثبت‌های همان روز دیده می‌شوند."
				/>
				<LoopStep
					icon={<ActivityIcon />}
					title="مرور"
          description="هفته، وزن و روندها بدون نمودارهای شلوغ خلاصه می‌شوند."
				/>
			</div>
		</div>
	);
}

function LoopStep({
	icon,
	title,
	description,
}: {
	icon: ReactNode;
	title: string;
	description: string;
}) {
	return (
		<article className="rounded-3xl border border-border/80 bg-background/55 p-4">
			<div className="text-primary [&_svg]:size-5">{icon}</div>
			<h3 className="mt-4 text-xl font-black tracking-normal">{title}</h3>
			<p className="mt-2 text-sm leading-7 text-muted-foreground">
				{description}
			</p>
		</article>
	);
}

function FeatureCard({
	icon: Icon,
	title,
	description,
	compact = false,
}: {
	icon: typeof UtensilsIcon;
	title: string;
	description: string;
	compact?: boolean;
}) {
	return (
		<article
			className={cn(
				"rounded-3xl border border-border/80 bg-card/80 p-5 shadow-sm",
				compact && "bg-background/55 p-4",
			)}
		>
			<div className="grid size-11 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
				<Icon className="size-5" aria-hidden="true" />
			</div>
			<h3
				className={cn(
					"mt-5 font-black tracking-normal",
					compact ? "text-base" : "text-lg",
				)}
			>
				{title}
			</h3>
			<p className="mt-3 leading-8 text-muted-foreground">
				{description}
			</p>
		</article>
	);
}

function FooterColumn({
	title,
	links,
}: {
	title: string;
	links: { label: string; href: string }[];
}) {
	return (
		<nav aria-label={title}>
			<h3 className="text-sm font-black text-foreground">{title}</h3>
			<ul className="mt-4 grid gap-3 text-sm font-bold text-muted-foreground">
				{links.map((link) => (
					<li key={link.label}>
						<Link
							href={link.href}
							className="transition-colors hover:text-primary"
						>
							{link.label}
						</Link>
					</li>
				))}
			</ul>
		</nav>
	);
}

function PlanCard({
	name,
	price,
                    priceRows,
	description,
	features,
	cta,
	href,
	featured,
}: {
	name: string;
	price: string;
	priceRows: Array<{
		label: string;
		value: string;
		baseValue: string | null;
		discountLabel: string | null;
		badge: string | null;
	}>;
	description: string;
	features: string[];
	cta: string;
	href: string;
	featured: boolean;
}) {
	return (
		<article
			className={cn(
				"rounded-[2rem] border p-5",
				featured
					? "border-primary/45 bg-primary/10"
					: "border-border/80 bg-background/55",
			)}
		>
			<div className="flex items-center justify-between gap-4">
				<h3 className="text-2xl font-black tracking-normal">{name}</h3>
				{featured ? (
					<span className="rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground">
						برای رشد جدی‌تر
					</span>
				) : null}
			</div>
			<p className="mt-4 text-lg font-black tracking-normal">{price}</p>
			{priceRows.length ? (
				<div className="mt-4 grid gap-2 rounded-3xl border border-border/80 bg-background/45 p-3">
					{priceRows.map((row) => (
						<div
							key={row.label}
							className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold"
						>
							<span>{row.label}</span>
							<span className="tabular-nums tracking-normal">
								{row.baseValue ? (
									<span className="me-2 text-xs text-muted-foreground line-through">
										{row.baseValue}
									</span>
								) : null}
								{row.value}
								{row.discountLabel ? (
									<span className="me-2 rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] text-primary">
										{row.discountLabel}
									</span>
								) : null}
								{row.badge ? (
									<span className="me-2 rounded-full border px-2 py-0.5 text-[0.65rem] text-primary">
										{row.badge}
									</span>
								) : null}
							</span>
						</div>
					))}
				</div>
			) : null}
			<p className="mt-3 leading-8 text-muted-foreground">
				{description}
			</p>
			<ul className="mt-5 grid gap-2 text-sm font-bold leading-7 text-muted-foreground">
				{features.map((feature) => (
					<TrustItem key={feature}>{feature}</TrustItem>
				))}
			</ul>
			<Link
				href={href}
				className={cn(
					buttonVariants({
						variant: featured ? "default" : "outline",
						size: "lg",
					}),
					"mt-6 h-11 rounded-full px-5",
				)}
			>
				{cta}
			</Link>
		</article>
	);
}

function ProgressLine({
	label,
	value,
	className,
}: {
	label: string;
	value: string;
	className: string;
}) {
	return (
		<div className="grid gap-1">
			<div className="flex justify-between text-xs font-bold text-muted-foreground">
				<span>{label}</span>
				<span>{value}</span>
			</div>
			<div className="h-2 overflow-hidden rounded-full bg-muted">
				<div
					className={cn("h-full rounded-full", className)}
					style={{ width: value }}
				/>
			</div>
		</div>
	);
}

function SectionIntro({
	eyebrow,
	title,
	description,
}: {
	eyebrow: string;
	title: string;
	description: string;
}) {
	return (
		<div className="text-right">
			<p className="text-sm font-black text-primary">{eyebrow}</p>
			<h2 className="mt-3 text-balance font-heading text-3xl font-black leading-[1.35] tracking-normal sm:text-4xl">
				{title}
			</h2>
			<p className="mt-4 text-pretty leading-8 text-muted-foreground">
				{description}
			</p>
		</div>
	);
}

function TrustItem({ children }: { children: ReactNode }) {
	return (
		<li className="flex gap-2">
			<CheckIcon
				className="mt-1 size-4 shrink-0 text-primary"
				aria-hidden="true"
			/>
			<span>{children}</span>
		</li>
	);
}
