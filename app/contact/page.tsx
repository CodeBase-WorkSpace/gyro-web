import type { Metadata } from "next";
import {
	CameraIcon,
	MailIcon,
	MapPinIcon,
	PhoneIcon,
	SendIcon,
} from "lucide-react";

import { PublicPageShell } from "@/components/public/public-page-shell";
import { buttonVariants } from "@/components/ui/button";
import {
	publicContactChannels,
	supportEmail,
	supportLandlineDisplay,
	supportPhoneDisplay,
} from "@/lib/public-contact";
import { createPersianPageMetadata } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";

const canonicalPath = "/contact";

export const metadata: Metadata = createPersianPageMetadata({
	path: canonicalPath,
	title: "تماس با ما | جیرو",
	description:
		"راه‌های رسمی تماس با جیرو: اینستاگرام، تلگرام، ایمیل، موبایل و تلفن ثابت پشتیبانی.",
	ogTitle: "تماس با جیرو",
	ogDescription:
		"برای سؤال‌های عمومی از شبکه‌های اجتماعی جیرو و برای پشتیبانی حساب یا پرداخت از ایمیل رسمی استفاده کنید.",
	imageAlt: "صفحه تماس با جیرو",
});

const channels = [
	{
		title: "اینستاگرام",
		description:
			"برای خبرها، معرفی قابلیت‌ها و سؤال‌های عمومی درباره محصول.",
		href: publicContactChannels.instagram,
		label: "باز کردن اینستاگرام",
		icon: CameraIcon,
	},
	{
		title: "تلگرام",
		description:
			"برای پیام‌های کوتاه عمومی و پیگیری اطلاع‌رسانی‌های محصول.",
		href: publicContactChannels.telegram,
		label: "باز کردن تلگرام",
		icon: SendIcon,
	},
	{
		title: "ایمیل پشتیبانی",
		description:
			"برای حساب، پرداخت، دسترسی، بازیابی یا موضوعی که نیاز به بررسی دقیق دارد.",
		href: publicContactChannels.email,
		label: supportEmail,
		icon: MailIcon,
	},
	{
		title: "موبایل پشتیبانی",
		description:
			"برای تماس مستقیم با پشتیبانی در زمان‌هایی که نیاز به پیگیری سریع‌تر دارید.",
		href: publicContactChannels.phone,
		label: supportPhoneDisplay,
		icon: PhoneIcon,
	},
	{
		title: "تلفن ثابت",
		description:
			"برای تماس با دفتر پشتیبانی از طریق شماره ثابت همراه با کد شهر.",
		href: publicContactChannels.landline,
		label: supportLandlineDisplay,
		icon: PhoneIcon,
	},
	{
		title: "نشانی دفتر",
		description:
			"استان مرکزی، شهرستان اراک، بخش مرکزی، شهر اراک، محله شهرک قدس، کوچه مهرابی، کوچه بهار ۳ کدپستی ۳۸۱۸۸۳۵۳۳۴",
		icon: MapPinIcon,
	},
];

export default function ContactPage() {
	return (
		<PublicPageShell
			eyebrow="تماس با جیرو"
			title="راه‌های رسمی ارتباط با ما"
			description=""
		>
			<div className="grid gap-8">
				<section
					className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
					aria-label="کانال‌های تماس"
				>
					{channels.map((channel) => (
						<article
							key={channel.title}
							className="rounded-3xl border border-border/80 bg-card/55 p-5"
						>
							<div className="grid size-11 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
								<channel.icon
									className="size-5"
									aria-hidden="true"
								/>
							</div>
							<h2 className="mt-5 text-lg font-black">
								{channel.title}
							</h2>
							<p className="mt-3 leading-8 text-muted-foreground">
								{channel.description}
							</p>
							{channel.href && channel.label && (
								<a
									href={channel.href}
									target={
										channel.href.startsWith("http")
											? "_blank"
											: undefined
									}
									rel={
										channel.href.startsWith("http")
											? "noopener noreferrer"
											: undefined
									}
									dir={
										channel.href.startsWith("tel:")
											? "ltr"
											: undefined
									}
									className={cn(
										buttonVariants({
											variant: "outline",
											size: "lg",
										}),
										"mt-5 rounded-full",
										channel.href.startsWith("tel:") &&
											"font-mono whitespace-nowrap text-left justify-center",
									)}
								>
									{channel.label}
								</a>
							)}
						</article>
					))}
				</section>

				<section className="rounded-3xl border border-border/80 bg-card/35 p-5 sm:p-6">
					<h2 className="text-xl font-black">
						کدام مسیر را انتخاب کنم؟
					</h2>
					<div className="mt-5 grid gap-3 sm:grid-cols-2">
						<div className="rounded-2xl border border-border/80 bg-background/45 p-4">
							<h3 className="font-black">پرسش‌های عمومی</h3>
							<p className="mt-2 leading-8 text-muted-foreground">
								اگر درباره قابلیت‌های جیرو، زمان عرضه یا خبرهای
								محصول سؤال دارید، اینستاگرام و تلگرام
								مناسب‌ترند.
							</p>
						</div>
						<div className="rounded-2xl border border-border/80 bg-background/45 p-4">
							<h3 className="font-black">حساب و پرداخت</h3>
							<p className="mt-2 leading-8 text-muted-foreground">
								برای موضوعات حساب، اشتراک، پرداخت یا بازیابی
								دسترسی، از مسیر پشتیبانی داخل حساب استفاده کنید.
								اگر آن مسیر در دسترس نبود، به {supportEmail}{" "}
								ایمیل بزنید و شناسه پیگیری را هم بفرستید.
							</p>
						</div>
					</div>
				</section>
			</div>
		</PublicPageShell>
	);
}
