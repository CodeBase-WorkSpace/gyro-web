import assert from "node:assert/strict";
import test from "node:test";
import { apiUrl, getApiBaseUrl } from "../lib/api/base-url";

test("server API URL uses API_BASE_URL and joins endpoint paths", () => {
  const previous = process.env.API_BASE_URL;
  process.env.API_BASE_URL = "https://api.example.com/api/v1/";
  assert.equal(getApiBaseUrl(), "https://api.example.com/api/v1");
  assert.equal(apiUrl("/foods"), "https://api.example.com/api/v1/foods");
  process.env.API_BASE_URL = previous;
});

test("API URL rejects a base URL outside the versioned API path", () => {
  const previous = process.env.API_BASE_URL;
  process.env.API_BASE_URL = "https://api.example.com";
  assert.throws(getApiBaseUrl, /end with \/api\/v1/);
  process.env.API_BASE_URL = previous;
});
