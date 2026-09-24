import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
	resendRegistrationVerificationAction,
	verifyRegistrationAction,
} from "@/app/auth/actions";
import { SignupVerifyForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
	title: "جیرو | تایید ثبت‌نام",
	description: "تایید کد ثبت‌نام جیرو",
};

type SignupVerifyPageProps = {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignupVerifyPage({
	searchParams,
}: SignupVerifyPageProps) {
	const sessionPromise = getSession();
	const paramsPromise = searchParams;
	const session = await sessionPromise;

	if (session.isAuthenticated) {
		redirect("/dashboard");
	}

	const params = await paramsPromise;
	const identifier =
		typeof params?.identifier === "string" ? params.identifier : "";

	return (
		<AuthShell
			eyebrow="تایید ثبت‌نام"
			title="کد تایید حساب را وارد کنید"
			description="کد ارسال‌شده به ایمیل یا شماره موبایل را وارد کنید تا حساب ساخته شود."
			footerLabel="اطلاعات ثبت‌نام اشتباه است؟"
			footerHref="/auth/signup"
			footerAction="بازگشت"
		>
			<SignupVerifyForm
				action={verifyRegistrationAction}
				resendAction={resendRegistrationVerificationAction}
				defaultIdentifier={identifier}
			/>
		</AuthShell>
	);
}
