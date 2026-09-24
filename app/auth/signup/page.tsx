import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { registerAction } from "@/app/auth/actions";
import { SignupForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
	title: "جیرو | ثبت‌نام",
	description: "ساخت حساب کاربری جیرو",
};

export default async function SignupPage() {
	const session = await getSession();

	if (session.isAuthenticated) {
		redirect("/dashboard");
	}

	return (
		<AuthShell
			eyebrow="ثبت‌نام"
			title="شروع دفتر تغذیه شخصی"
			description="حساب بسازید تا ثبت غذا، هدف کالری و وعده‌های پرتکرار شما ذخیره بماند."
			footerLabel="قبلا حساب ساخته‌اید؟"
			footerHref="/auth/login"
			footerAction="ورود"
		>
			<SignupForm action={registerAction} />
		</AuthShell>
	);
}
