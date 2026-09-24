import assert from "node:assert/strict";
import test from "node:test";

import {withUtmParams} from "../lib/analytics";

test("signup links stay on the current origin and retain UTM parameters", () => {
  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {location: {origin: "http://localhost:3002", search: "?utm_source=local&ignored=1"}},
  });

  try {
    assert.equal(withUtmParams("/auth/signup"), "http://localhost:3002/auth/signup?utm_source=local");
  } finally {
    Object.defineProperty(globalThis, "window", {configurable: true, value: previousWindow});
  }
});
