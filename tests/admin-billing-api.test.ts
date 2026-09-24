import assert from "node:assert/strict";
import test from "node:test";

import {getAdminBillingSnapshot} from "../lib/api/admin";

process.env.API_BASE_URL ??= "http://localhost:8080/api/v1";

test("admin billing snapshot forwards safe payment search filters", async () => {
  const originalFetch = global.fetch;
  let requestedUrl = "";

  global.fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({
      counts: {openInvoices: 0, paidInvoices: 0, pendingAttempts: 0, failedAttempts: 0},
      recentAttempts: [],
    }), {status: 200, headers: {"Content-Type": "application/json"}});
  };

  try {
    await getAdminBillingSnapshot("admin-token", {
      query: "client/ref 123",
      status: "VERIFY_PENDING",
      limit: 25,
    });

    assert.equal(
      requestedUrl,
      "http://localhost:8080/api/v1/admin/billing?limit=25&query=client%2Fref+123&status=VERIFY_PENDING",
    );
  } finally {
    global.fetch = originalFetch;
  }
});
