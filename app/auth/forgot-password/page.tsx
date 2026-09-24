import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { startPasswordResetAction } from "@/app/auth/actions";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Gyro | بازیابی رمز عبور",
  description: "ارسال کد بازیابی رمز عبور Gyro"
};

export default async function ForgotPasswordPage() {
  const session = await getSession();

  if (session.isAuthenticated) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="بازیابی"
      title="دریافت کد بازیابی"
      description="ایمیل یا شماره موبایل حساب را وارد کنید تا کد یک‌بارمصرف بازیابی ارسال شود."
      footerLabel="رمز عبور را به خاطر دارید؟"
      footerHref="/auth/login"
      footerAction="ورود"
    >
      <ForgotPasswordForm action={startPasswordResetAction} />
    </AuthShell>
  );
}
