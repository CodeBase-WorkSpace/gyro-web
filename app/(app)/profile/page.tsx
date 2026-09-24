import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {
	CameraIcon,
	CreditCardIcon,
	BellRingIcon,
	HandshakeIcon,
	LogOutIcon,
	MailIcon,
	PhoneIcon,
	SendIcon,
	Trash2Icon,
	UserRoundIcon,
} from "lucide-react";

import {updateProfileAction} from "@/app/(app)/profile/actions";
import {
	changePasswordAction,
	confirmStepUpAction,
	removePasswordAction,
	setPasswordAction,
	startStepUpAction,
} from "@/app/(app)/profile/security-actions";
import {AppTopBar} from "@/components/design-system/app-top-bar";
import {AccountSecuritySection} from "@/components/profile/account-security-section";
import {ProfileEditForm} from "@/components/profile/profile-edit-form";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button, buttonVariants} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from "@/components/ui/card";
import {getSession} from "@/lib/auth/session";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {getAffiliateAvailability, getAffiliateSummary} from "@/lib/api/affiliates";
import {publicContactChannels} from "@/lib/public-contact";
import {cn} from "@/lib/utils";

export const metadata: Metadata = {
	title: "جیرو | پروفایل و تنظیمات",
  description: "اطلاعات حساب و وضعیت اشتراک در جیرو",
};

type ProfilePageProps = {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
	const sessionPromise = getSession();
	const paramsPromise = searchParams;
	const session = await sessionPromise;

	if (!session.isAuthenticated) {
		redirect("/auth/login?next=/profile&expired=1");
	}

	const params = await paramsPromise;
	const saved = params?.saved === "1";
	const user = {
		email: session.user.email,
		phoneNumber: session.user.phoneNumber,
		displayName: session.user.displayName,
		timezone: session.user.timezone,
		locale: session.user.locale,
	};
	const primaryContact =
		user.email || user.phoneNumber || "حساب بدون راه ارتباطی";
	const avatarFallback = getAvatarFallback(
		user.displayName || user.email || user.phoneNumber,
	);
	const premiumGatingDisabled = process.env.PREMIUM_GATING_DISABLED === "true";
	const affiliateSummary = await loadAffiliateSummary();
	return (
		<main
			id="main-content"
			className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8"
		>
			<AppTopBar
				title="پروفایل و تنظیمات"
				description={primaryContact}
				backLink={{ href: "/dashboard", label: "بازگشت به داشبورد امروز" }}
			/>

			<section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
				<Card className="rounded-3xl border border-primary/30 bg-primary/5 shadow-sm lg:col-span-2">
					<CardHeader>
						<div className="flex items-center gap-3">
							<span className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary"><BellRingIcon className="size-6" /></span>
							<div><CardTitle className="text-lg font-semibold">اعلان‌ها و یادآوری‌ها</CardTitle><CardDescription className="leading-7">اعلان مرورگر، یادآوری ثبت غذا و ساعات آرام را از اینجا تنظیم کن.</CardDescription></div>
						</div>
					</CardHeader>
					<CardFooter><Link href="/profile/notifications" className={cn(buttonVariants({variant: "default", size: "lg"}), "h-11 rounded-full")}><BellRingIcon data-icon="inline-start" />تنظیم اعلان‌ها</Link></CardFooter>
				</Card>
				{affiliateSummary ? <Card className="rounded-3xl border border-primary/25 bg-primary/5 shadow-sm lg:col-span-2"><CardHeader><div className="flex items-center gap-3"><HandshakeIcon className="size-6 text-primary"/><div><CardTitle className="text-lg font-semibold">همکاری در فروش</CardTitle><CardDescription>کد {affiliateSummary.code} و گزارش تجمیعی درآمد شما</CardDescription></div></div></CardHeader><CardFooter><Link href="/profile/affiliate" className={cn(buttonVariants({variant:"default",size:"lg"}),"h-11 rounded-full")}>مشاهده گزارش همکاری</Link></CardFooter></Card> : null}

				<Card className="rounded-3xl border bg-card shadow-sm">
					<CardHeader>
						<div className="flex items-center gap-3">
							<Avatar size="lg">
								<AvatarFallback className="text-base font-bold">
									{avatarFallback}
								</AvatarFallback>
							</Avatar>
							<div className="min-w-0">
								<CardTitle className="text-lg font-semibold">
									اطلاعات حساب شما
								</CardTitle>
								<CardDescription className="truncate">
									{primaryContact}
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<ProfileField
							icon={UserRoundIcon}
							label="نام نمایشی"
							value={user.displayName || "ثبت نشده"}
						/>
						<ProfileField
							icon={MailIcon}
							label="ایمیل"
							value={user.email || "ثبت نشده"}
						/>
						<ProfileField
							icon={PhoneIcon}
							label="شماره موبایل"
							value={user.phoneNumber || "ثبت نشده"}
						/>
					</CardContent>
				</Card>

				<Card className="rounded-3xl border bg-card shadow-sm">
					<CardHeader>
						<CardTitle className="text-lg font-semibold">
							ویرایش پروفایل
						</CardTitle>
						<CardDescription className="leading-7">
              نامی که در داشبورد و بخش‌های حساب نمایش داده می‌شود.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{saved ? (
							<p className="mb-4 rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm leading-6 text-primary">
								تغییرات پروفایل ذخیره شد.
							</p>
						) : null}
						<ProfileEditForm
							action={updateProfileAction}
							user={user}
						/>
					</CardContent>
				</Card>

				<Card className="rounded-3xl border bg-card shadow-sm">
					<CardHeader>
						<CardTitle className="text-lg font-semibold">
							امنیت حساب
						</CardTitle>
						<CardDescription className="leading-7">
							رمز عبور حساب خود را تنظیم، تغییر یا حذف کنید. ورود با کد یک‌بارمصرف همیشه فعال است.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<AccountSecuritySection
							hasPassword={session.user.hasPassword}
							setPasswordAction={setPasswordAction}
							changePasswordAction={changePasswordAction}
							removePasswordAction={removePasswordAction}
							startStepUpAction={startStepUpAction}
							confirmStepUpAction={confirmStepUpAction}
						/>
					</CardContent>
				</Card>

				<Card className="rounded-3xl border bg-card shadow-sm">
					<CardHeader>
						<CardTitle className="text-lg font-semibold">
							حساب و خروج
						</CardTitle>
						<CardDescription className="leading-7">
							راه‌های ورود، اشتراک و خروج از حساب را از همین بخش مدیریت کنید.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-3">
						<AccountMeta
							label="راه ارتباطی اصلی"
							value={primaryContact}
						/>
					</CardContent>
					<CardFooter className="flex flex-col items-stretch gap-2">
						{!premiumGatingDisabled ? <Link
              href="/profile/billing"
							className={cn(
								buttonVariants({
                  variant: "default",
									size: "lg",
								}),
								"h-11 rounded-full",
							)}
						>
							<CreditCardIcon data-icon="inline-start" />
							اشتراک و پرداخت‌ها
						</Link> : null}
						<Link
							href="/logout"
							prefetch={false}
							className={cn(
								buttonVariants({
									variant: "default",
									size: "lg",
								}),
								"h-11 rounded-full",
							)}
						>
							<LogOutIcon data-icon="inline-start" />
							خروج از حساب
						</Link>
						<Button
							type="button"
							variant="destructive"
							size="lg"
							className="h-11 rounded-full"
							disabled
						>
							<Trash2Icon data-icon="inline-start" />
							درخواست حذف حساب
						</Button>
						<p className="text-center text-xs leading-5 text-muted-foreground">
							حذف حساب هنوز فعال نیست. تا زمان آماده شدن، می‌توانید با پشتیبانی تماس بگیرید.
						</p>
					</CardFooter>
				</Card>

				<Card className="rounded-3xl border bg-card shadow-sm lg:col-span-2">
					<CardHeader>
						<CardTitle className="text-lg font-semibold">
							ارتباط با ما
						</CardTitle>
						<CardDescription className="leading-7">
							برای سؤال، پیشنهاد یا گزارش مشکل از تلگرام یا اینستاگرام پیام بده.
						</CardDescription>
					</CardHeader>
					<CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row">
						<a
							href={publicContactChannels.telegram}
							target="_blank"
							rel="noopener noreferrer"
							className={cn(
								buttonVariants({variant: "outline", size: "lg"}),
								"h-11 rounded-full",
							)}
						>
							<SendIcon data-icon="inline-start" />
							تلگرام جیرو
						</a>
						<a
							href={publicContactChannels.instagram}
							target="_blank"
							rel="noopener noreferrer"
							className={cn(
								buttonVariants({variant: "outline", size: "lg"}),
								"h-11 rounded-full",
							)}
						>
							<CameraIcon data-icon="inline-start" />
							اینستاگرام جیرو
						</a>
					</CardFooter>
				</Card>
			</section>
		</main>
	);
}

async function loadAffiliateSummary() {
	try {
		const availability = await authenticatedServerRequest(token => getAffiliateAvailability(token), {nextPath: "/profile", retryPolicy: "idempotent"});
		if (!availability.available) return null;
		return await authenticatedServerRequest(token => getAffiliateSummary(token), {nextPath: "/profile", retryPolicy: "idempotent"});
	} catch {
		// Unlinked users intentionally receive no affiliate navigation or disclosure.
		return null;
	}
}

function ProfileField({
	icon: Icon,
	label,
	value,
}: {
	icon: typeof UserRoundIcon;
	label: string;
	value: string;
}) {
	return (
		<div className="flex items-start gap-3 rounded-2xl bg-muted/40 p-3">
			<Icon
				className="mt-0.5 size-4 shrink-0 text-primary"
				aria-hidden="true"
			/>
			<span className="min-w-0">
				<strong className="block text-sm">{label}</strong>
				<small className="block truncate text-xs leading-5 text-muted-foreground">
					{value}
				</small>
			</span>
		</div>
	);
}

function getAvatarFallback(value: string | null | undefined) {
	const normalizedValue = value?.trim();

	if (!normalizedValue) {
		return "G";
	}

	const words = normalizedValue.split(/\s+/).filter(Boolean);

	if (words.length > 1) {
		return words
			.slice(0, 2)
			.map((word) => Array.from(word)[0])
			.join("")
			.toUpperCase();
	}

	return Array.from(normalizedValue).slice(0, 2).join("").toUpperCase();
}


function AccountMeta({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-2xl bg-muted/40 p-3">
			<p className="text-xs font-bold text-muted-foreground">{label}</p>
			<p className="mt-1 break-all text-sm font-semibold">{value}</p>
		</div>
	);
}
