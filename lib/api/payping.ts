import {apiGet} from "./client";

export type PaymentReturnState =
  | "CONFIRMING"
  | "SUCCESS"
  | "PENDING"
  | "ABANDONED"
  | "FAILED"
  | "SUPPORT_NEEDED";

export type PaymentReturnStatus = {
  state: PaymentReturnState;
  paymentAttemptId?: string;
  invoiceId?: string;
  providerCode?: string;
  providerRefId?: string;
  clientRefId?: string;
  requestId?: string;
  message: string;
};

export type PayPingReturnParams = {
  code?: string;
  paymentCode?: string;
  refid?: string;
  paymentRefId?: string;
  clientrefid?: string;
  cardnumber?: string;
  cardhashpan?: string;
};

export async function getPayPingReturnStatus(
  accessToken: string,
  params: PayPingReturnParams,
): Promise<PaymentReturnStatus> {
  const query = new URLSearchParams();
  if (params.code) query.set("code", params.code);
  if (params.paymentCode) query.set("paymentCode", params.paymentCode);
  if (params.refid) query.set("refid", params.refid);
  if (params.paymentRefId) query.set("paymentRefId", params.paymentRefId);
  if (params.clientrefid) query.set("clientrefid", params.clientrefid);
  if (params.cardnumber) query.set("cardnumber", params.cardnumber);
  if (params.cardhashpan) query.set("cardhashpan", params.cardhashpan);

  return apiGet<PaymentReturnStatus>(
    `/billing/payping/return-status${query.size ? `?${query.toString()}` : ""}`,
    accessToken,
  );
}

export async function getPaymentAttemptStatus(
  accessToken: string,
  paymentAttemptId: string,
): Promise<PaymentReturnStatus> {
  const query = new URLSearchParams({paymentAttemptId});
  return apiGet<PaymentReturnStatus>(`/billing/payping/attempt-status?${query.toString()}`, accessToken);
}
