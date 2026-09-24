import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/auth/actions";
import { LoginForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt";
import { getSession } from "@/lib/auth/session";
import { safeRedirectPath } from "@/lib/auth/redirects";

export const metadata: Metadata = {
	title: "جیرو | ورود",
	description: "ورود به حساب جیرو",
};

type LoginPageProps = {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
	const [session, params] = await Promise.all([getSession(), searchParams]);

	if (session.isAuthenticated) {
		redirect(params?.install === "1" ? "/dashboard?install=1" : "/dashboard");
	}

	const resetComplete = params?.reset === "complete";
	const expired = params?.expired === "1";
	const nextPath = safeRedirectPath(params?.next);

	return (
		<AuthShell
			eyebrow="ورود"
			title="بازگشت به دفتر تغذیه"
			description="با ایمیل یا شماره موبایل وارد شوید و ثبت‌های امروز را ادامه دهید."
			footerLabel="هنوز حساب ندارید؟"
			footerHref="/auth/signup"
			footerAction="ساخت حساب"
		>
			<LoginForm
				action={loginAction}
				nextPath={nextPath}
				resetComplete={resetComplete}
			/>
			{expired ? (
				<p className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive">
					نشست شما منقضی شده است. دوباره وارد شوید تا به مسیر قبلی
					برگردید.
				</p>
			) : null}
			<PwaInstallPrompt />
		</AuthShell>
	);
}
