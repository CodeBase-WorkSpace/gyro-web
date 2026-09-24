import {describe, it} from "node:test";
import assert from "node:assert/strict";

import {
  type CheckoutRequest,
  type CheckoutResponse,
  initiateCheckout,
  redeemPromotion,
  validatePromotionCode,
} from "../lib/api/checkout";

process.env.API_BASE_URL ??= "http://localhost:8080/api/v1";

// Test the CheckoutResponse type shape
describe("CheckoutResponse type", () => {
  it("status field accepts SUCCESS and FAILED values", () => {
    const successResponse: CheckoutResponse = {status: "SUCCESS", invoiceId: "abc", gatewayUrl: "https://pay.example.com"};
    const failedResponse: CheckoutResponse = {status: "FAILED", failureReason: "error"};
    assert.equal(successResponse.status, "SUCCESS");
    assert.equal(failedResponse.status, "FAILED");
  });

  it("invoiceId and paymentAttemptId are optional strings", () => {
    const response: CheckoutResponse = {status: "SUCCESS"};
    assert.equal(response.invoiceId, undefined);
    assert.equal(response.paymentAttemptId, undefined);
  });

  it("failureReason is present only on FAILED status", () => {
    const failedResponse: CheckoutResponse = {status: "FAILED", failureReason: "Provider timeout"};
    assert.equal(failedResponse.failureReason, "Provider timeout");

    const successResponse: CheckoutResponse = {status: "SUCCESS"};
    assert.equal(successResponse.failureReason, undefined);
  });
});

describe("CheckoutRequest shape", () => {
  it("priceId is required", () => {
    const request: CheckoutRequest = {priceId: 123};
    assert.equal(typeof request.priceId, "number");
  });

  it("promotionCode is optional", () => {
    const requestWithPromo: CheckoutRequest = {priceId: 123, promotionCode: "SAVE20"};
    const requestWithoutPromo: CheckoutRequest = {priceId: 123};
    assert.equal(requestWithPromo.promotionCode, "SAVE20");
    assert.equal(requestWithoutPromo.promotionCode, undefined);
  });
});

describe("initiateCheckout sends Idempotency-Key header", () => {
  it("sends Idempotency-Key header when idempotencyKey is provided", async () => {
    const originalFetch = global.fetch;
    let requestedUrl = "";
    let method = "";
    let authorizationHeader = "";
    let idempotencyHeader = "";
    let requestBody = "";

    global.fetch = async (input, init) => {
      requestedUrl = String(input);
      method = init?.method ?? "";
      const headers = new Headers(init?.headers);
      authorizationHeader = headers.get("Authorization") ?? "";
      idempotencyHeader = headers.get("Idempotency-Key") ?? "";
      requestBody = String(init?.body ?? "");

      return new Response(JSON.stringify({status: "SUCCESS", invoiceId: "test-invoice"}), {
        status: 200,
        headers: {"Content-Type": "application/json"},
      });
    };

    try {
      await initiateCheckout("access-token", 123, "SAVE20", "checkout-key-123");

      assert.equal(requestedUrl, "http://localhost:8080/api/v1/billing/checkout");
      assert.equal(method, "POST");
      assert.equal(authorizationHeader, "Bearer access-token");
      assert.equal(idempotencyHeader, "checkout-key-123");
      assert.deepEqual(JSON.parse(requestBody), {priceId: 123, promotionCode: "SAVE20"});
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("CheckoutRequest supports optional promotionCode", () => {
    const withPromo: CheckoutRequest = {priceId: 1, promotionCode: "CODE"};
    const withoutPromo: CheckoutRequest = {priceId: 1};
    assert.equal(withPromo.promotionCode, "CODE");
    assert.equal(withoutPromo.promotionCode, undefined);
  });
});

describe("validatePromotionCode", () => {
  it("posts selected price and promotion code to the validation endpoint", async () => {
    const originalFetch = global.fetch;
    let requestedUrl = "";
    let method = "";
    let authorizationHeader = "";
    let requestBody = "";

    global.fetch = async (input, init) => {
      requestedUrl = String(input);
      method = init?.method ?? "";
      const headers = new Headers(init?.headers);
      authorizationHeader = headers.get("Authorization") ?? "";
      requestBody = String(init?.body ?? "");

      return new Response(
        JSON.stringify({
          valid: true,
          promotionCode: "SAVE20",
          amountBeforeDiscount: {amount: 1000000, currency: "IRR"},
          amountAfterDiscount: {amount: 800000, currency: "IRR"},
          discountAmount: {amount: 200000, currency: "IRR"},
        }),
        {
          status: 200,
          headers: {"Content-Type": "application/json"},
        },
      );
    };

    try {
      const response = await validatePromotionCode("access-token", 123, "SAVE20");

      assert.equal(requestedUrl, "http://localhost:8080/api/v1/billing/promotions/validate");
      assert.equal(method, "POST");
      assert.equal(authorizationHeader, "Bearer access-token");
      assert.deepEqual(JSON.parse(requestBody), {priceId: 123, promotionCode: "SAVE20"});
      assert.equal(response.valid, true);
      assert.equal(response.discountAmount.amount, 200000);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe("redeemPromotion", () => {
  it("posts a free activation with its idempotency key", async () => {
    const originalFetch = global.fetch;
    let requestedUrl = "";
    let idempotencyHeader = "";
    let requestBody = "";

    global.fetch = async (input, init) => {
      requestedUrl = String(input);
      idempotencyHeader = new Headers(init?.headers).get("Idempotency-Key") ?? "";
      requestBody = String(init?.body ?? "");
      return new Response(
        JSON.stringify({status: "REDEEMED", grantId: "grant-id", planId: 1, freeDays: 30, expiresAt: null}),
        {status: 200, headers: {"Content-Type": "application/json"}},
      );
    };

    try {
      const response = await redeemPromotion("access-token", "SUPPORT30", "redemption-key-123");

      assert.equal(requestedUrl, "http://localhost:8080/api/v1/billing/promotions/redeem");
      assert.equal(idempotencyHeader, "redemption-key-123");
      assert.deepEqual(JSON.parse(requestBody), {promotionCode: "SUPPORT30"});
      assert.equal(response.status, "REDEEMED");
      assert.equal(response.freeDays, 30);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
