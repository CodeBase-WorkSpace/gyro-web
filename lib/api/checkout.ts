import {apiPost} from "./client";

export type CheckoutResponse = {
  status: "SUCCESS" | "FAILED";
  invoiceId?: string;
  paymentAttemptId?: string;
  gatewayUrl?: string;
  requestId?: string;
  failureReason?: string;
};

export type CheckoutRequest = {
  priceId: number;
  promotionCode?: string;
};

export type CheckoutMoney = {
  amount: number;
  currency: string;
};

export type PromotionValidationResponse = {
  valid: true;
  promotionCode: string;
  amountBeforeDiscount: CheckoutMoney;
  amountAfterDiscount: CheckoutMoney;
  discountAmount: CheckoutMoney;
  promotionType: string;
  redemptionMode: "PAID_CHECKOUT" | "FREE_ACTIVATION";
  freeDays: number | null;
};
export type PromotionRedemptionResponse = {status: string; grantId: string; planId: number; freeDays: number; expiresAt: string | null};

export async function initiateCheckout(
  accessToken: string,
  priceId: number,
  promotionCode?: string,
  idempotencyKey?: string,
): Promise<CheckoutResponse> {
  return apiPost<CheckoutResponse>(
    "/billing/checkout",
    {priceId, promotionCode},
    {
      accessToken,
      headers: idempotencyKey ? {"Idempotency-Key": idempotencyKey} : undefined,
    },
  );
}

export async function redeemPromotion(accessToken: string, promotionCode: string, idempotencyKey: string): Promise<PromotionRedemptionResponse> {
  return apiPost("/billing/promotions/redeem", {promotionCode}, {accessToken, headers: {"Idempotency-Key": idempotencyKey}});
}

export async function validatePromotionCode(
  accessToken: string,
  priceId: number,
  promotionCode: string,
): Promise<PromotionValidationResponse> {
  return apiPost<PromotionValidationResponse>(
    "/billing/promotions/validate",
    {priceId, promotionCode},
    {accessToken},
  );
}
