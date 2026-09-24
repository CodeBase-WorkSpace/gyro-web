import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
	confirmPasswordResetAction,
	resendPasswordResetAction,
} from "@/app/auth/actions";
import { OtpForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
	title: "جیرو | کد یک‌بارمصرف",
	description: "تایید کد یک‌بارمصرف و ثبت رمز عبور جدید",
};

type OtpPageProps = {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OtpPage({ searchParams }: OtpPageProps) {
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
			eyebrow="کد یک‌بارمصرف"
			title="تایید کد بازیابی"
			description="کد دریافتی و رمز عبور جدید را وارد کنید تا دسترسی حساب بازیابی شود."
			footerLabel="کد ندارید؟"
			footerHref="/auth/forgot-password"
			footerAction="ارسال کد"
		>
			<OtpForm
				action={confirmPasswordResetAction}
				resendAction={resendPasswordResetAction}
				defaultIdentifier={identifier}
			/>
		</AuthShell>
	);
}
