import type {Metadata} from "next";
import {redirect} from "next/navigation";

import {confirmLoginOtpAction, resendLoginOtpAction} from "@/app/auth/actions";
import {LoginOtpConfirmForm} from "@/components/auth/auth-forms";
import {AuthShell} from "@/components/auth/auth-shell";
import {getSession} from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Gyro | تایید کد ورود",
  description: "تایید کد یک‌بارمصرف ورود به Gyro"
};

type LoginOtpVerifyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginOtpVerifyPage({ searchParams }: LoginOtpVerifyPageProps) {
  const sessionPromise = getSession();
  const paramsPromise = searchParams;
  const session = await sessionPromise;

  if (session.isAuthenticated) {
    redirect("/dashboard");
  }

  const params = await paramsPromise;
  const identifier = typeof params?.identifier === "string" ? params.identifier : "";

  return (
    <AuthShell
      eyebrow="تایید ورود"
      title="کد ورود را وارد کنید"
      description="کد یک‌بارمصرف ارسال‌شده را وارد کنید تا وارد حساب شوید."
      footerLabel="کد دریافت نکردید؟"
      footerHref="/auth/login/otp"
      footerAction="ارسال دوباره"
    >
      <LoginOtpConfirmForm
        action={confirmLoginOtpAction}
        resendAction={resendLoginOtpAction}
        defaultIdentifier={identifier}
      />
    </AuthShell>
  );
}
