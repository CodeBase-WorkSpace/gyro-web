import assert from "node:assert/strict";
import test from "node:test";

import { safeRedirectPath } from "../lib/auth/redirects";

test("safeRedirectPath preserves internal app paths", () => {
  assert.equal(safeRedirectPath("/foods/custom?source=duplicate"), "/foods/custom?source=duplicate");
});

test("safeRedirectPath rejects external, protocol-relative, and malformed redirects", () => {
  assert.equal(safeRedirectPath("https://example.com"), "/dashboard");
  assert.equal(safeRedirectPath("//example.com"), "/dashboard");
  assert.equal(safeRedirectPath("/\\example.com"), "/dashboard");
  assert.equal(safeRedirectPath("/%2F%2Fexample.com"), "/dashboard");
  assert.equal(safeRedirectPath("/foods%"), "/dashboard");
  assert.equal(safeRedirectPath("/foods\u0000admin"), "/dashboard");
});

test("safeRedirectPath uses a caller-provided fallback for rejected redirects", () => {
  assert.equal(safeRedirectPath("//example.com", "/foods/custom"), "/foods/custom");
  assert.equal(safeRedirectPath("//example.com", "https://example.com"), "/dashboard");
});
