import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { startLoginOtpAction } from "@/app/auth/actions";
import { LoginOtpStartForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Gyro | ورود با کد",
  description: "ارسال کد یک‌بارمصرف ورود به Gyro"
};

export default async function LoginOtpPage() {
  const session = await getSession();

  if (session.isAuthenticated) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="ورود با کد"
      title="دریافت کد ورود"
      description="ایمیل یا شماره موبایل حساب را وارد کنید تا کد ورود یک‌بارمصرف ارسال شود."
      footerLabel="ورود با رمز عبور؟"
      footerHref="/auth/login"
      footerAction="ورود"
    >
      <LoginOtpStartForm action={startLoginOtpAction} />
    </AuthShell>
  );
}
