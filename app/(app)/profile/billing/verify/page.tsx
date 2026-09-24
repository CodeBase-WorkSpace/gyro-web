import type {Metadata} from "next";
import {redirect} from "next/navigation";

import {AppTopBar} from "@/components/design-system/app-top-bar";
import {ApiClientError} from "@/lib/api/errors";
import {getPaymentAttemptStatus, getPayPingReturnStatus, type PaymentReturnStatus} from "@/lib/api/payping";
import {authenticatedRouteRequest, authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {getSession} from "@/lib/auth/session";
import {PaymentReturnPanel} from "./payment-return-panel";

export const metadata: Metadata = {
  title: "جیرو | تأیید پرداخت",
  description: "تأیید امن پرداخت PayPing و فعال‌سازی اشتراک جیرو",
};

type VerifyPaymentPageProps = {
  searchParams: Promise<{
    state?: string;
    paymentAttemptId?: string;
    invoiceId?: string;
    clientRefId?: string;
    providerRefId?: string;
    requestId?: string;
    code?: string;
    paymentCode?: string;
    refid?: string;
    refId?: string;
    paymentRefId?: string;
    clientrefid?: string;
    cardnumber?: string;
    cardhashpan?: string;
  }>;
};

export default async function VerifyPaymentPage({searchParams}: VerifyPaymentPageProps) {
  const params = await searchParams;
  const redirectState = safeParam(params.state);

  const initialStatus = redirectState
    ? await loadStatusFromRedirect(params, redirectState)
    : await loadStatusFromDirectAccess(params);

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10"
      aria-label="تأیید پرداخت"
    >
      <AppTopBar
        title="تأیید پرداخت"
        description="نتیجه پرداخت فقط بعد از تأیید server-to-server نمایش داده می‌شود"
        backLink={{href: "/profile/billing", label: "بازگشت به صورتحساب"}}
        showDateControl={false}
        showMobileDateAction={false}
      />

      <PaymentReturnPanel initialStatus={initialStatus}/>
    </main>
  );
}

async function loadStatusFromRedirect(
  params: Awaited<VerifyPaymentPageProps["searchParams"]>,
  state: string,
): Promise<PaymentReturnStatus> {
  const baseStatus = statusFromRedirectParams(params, state);

  if (
    (baseStatus.state === "PENDING" || baseStatus.state === "CONFIRMING") &&
    baseStatus.paymentAttemptId
  ) {
    const session = await getSession();
    if (session.isAuthenticated) {
      try {
        return await authenticatedRouteRequest(
          (accessToken) => getPaymentAttemptStatus(accessToken, baseStatus.paymentAttemptId!),
          {retryPolicy: "idempotent"},
        );
      } catch {
        return baseStatus;
      }
    }
  }

  return baseStatus;
}

async function loadStatusFromDirectAccess(
  params: Awaited<VerifyPaymentPageProps["searchParams"]>,
): Promise<PaymentReturnStatus> {
  const session = await getSession();

  if (!session.isAuthenticated) {
    redirect("/auth/login?next=%2Fprofile%2Fbilling%2Fverify&expired=1");
  }

  const returnParams = {
    code: safeParam(params.code),
    paymentCode: safeParam(params.paymentCode),
    refid: safeParam(params.refid ?? params.refId),
    paymentRefId: safeParam(params.paymentRefId),
    clientrefid: safeParam(params.clientrefid ?? params.clientRefId),
    cardnumber: safeParam(params.cardnumber),
    cardhashpan: safeParam(params.cardhashpan),
  };

  if (!returnParams.code && !returnParams.paymentCode && !returnParams.refid && !returnParams.paymentRefId && !returnParams.clientrefid) {
    return {
      state: "ABANDONED",
      message: "Payment was not completed.",
    };
  }

  try {
    return await authenticatedServerRequest(
      (accessToken) => getPayPingReturnStatus(accessToken, returnParams),
      {nextPath: "/profile/billing/verify", retryPolicy: "idempotent"},
    );
  } catch (error) {
    if (error instanceof ApiClientError) {
      return {
        state: "SUPPORT_NEEDED",
        clientRefId: returnParams.clientrefid,
        requestId: error.requestId,
        message: error.message,
      };
    }
    return {
      state: "PENDING",
      clientRefId: returnParams.clientrefid,
      message: "Payment verification is pending.",
    };
  }
}

function statusFromRedirectParams(
  params: Awaited<VerifyPaymentPageProps["searchParams"]>,
  state: string,
): PaymentReturnStatus {
  return {
    state: state as PaymentReturnStatus["state"],
    paymentAttemptId: safeParam(params.paymentAttemptId),
    invoiceId: safeParam(params.invoiceId),
    providerRefId: safeParam(params.providerRefId),
    clientRefId: safeParam(params.clientRefId),
    requestId: safeParam(params.requestId),
    message: "",
  };
}

function safeParam(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 128) : undefined;
}
