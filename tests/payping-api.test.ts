import assert from "node:assert/strict";
import test from "node:test";

import {getPaymentAttemptStatus, getPayPingReturnStatus} from "../lib/api/payping";

process.env.API_BASE_URL ??= "http://localhost:8080/api/v1";

test("getPayPingReturnStatus sends safe return params to backend status endpoint", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  let authorizationHeader = "";

  global.fetch = async (input, init) => {
    requestedUrl = String(input);
    authorizationHeader = new Headers(init?.headers).get("Authorization") ?? "";

    return new Response(JSON.stringify({state: "PENDING", message: "pending"}), {
      status: 200,
      headers: {"Content-Type": "application/json"},
    });
  };

  try {
    const status = await getPayPingReturnStatus("access-token", {
      code: "ABCD",
      refid: "REF123",
      clientrefid: "CLIENT123",
    });

    assert.equal(
      requestedUrl,
      "http://localhost:8080/api/v1/billing/payping/return-status?code=ABCD&refid=REF123&clientrefid=CLIENT123",
    );
    assert.equal(authorizationHeader, "Bearer access-token");
    assert.equal(status.state, "PENDING");
  } finally {
    global.fetch = originalFetch;
  }
});

test("getPaymentAttemptStatus polls by payment attempt id only", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";

  global.fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({state: "SUCCESS", message: "verified"}), {
      status: 200,
      headers: {"Content-Type": "application/json"},
    });
  };

  try {
    const status = await getPaymentAttemptStatus("access-token", "attempt-123");

    assert.equal(
      requestedUrl,
      "http://localhost:8080/api/v1/billing/payping/attempt-status?paymentAttemptId=attempt-123",
    );
    assert.equal(status.state, "SUCCESS");
  } finally {
    global.fetch = originalFetch;
  }
});
