import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeContactIdentifier,
  normalizeEmail,
  normalizeIranianPhone,
  validateContactIdentifier,
} from "../lib/auth/contact";
import { identifierSchema } from "../lib/auth/validation";

test("normalizeEmail trims and lowercases the entire email", () => {
  assert.equal(normalizeEmail(" Tester@Example.invalid "), "tester@example.invalid");
  assert.equal(normalizeEmail("SECOND@EXAMPLE.INVALID"), "second@example.invalid");
  assert.equal(normalizeEmail("user@EXAMPLE.COM"), "user@example.com");
});

test("normalizeIranianPhone canonicalizes accepted mobile formats", () => {
  assert.equal(normalizeIranianPhone("09121234567"), "+989121234567");
  assert.equal(normalizeIranianPhone("989121234567"), "+989121234567");
  assert.equal(normalizeIranianPhone("+989121234567"), "+989121234567");
  assert.equal(normalizeIranianPhone("۰۹۱۲۱۲۳۴۵۶۷"), "+989121234567");
  assert.equal(normalizeIranianPhone("٠٩١٢١٢٣٤٥٦٧"), "+989121234567");
});

test("normalizeIranianPhone rejects malformed phone numbers", () => {
  for (const phoneNumber of ["08121234567", "09123", "+9809121234567", "abc", "+98abc"]) {
    assert.equal(normalizeIranianPhone(phoneNumber), null);
    assert.ok(validateContactIdentifier(phoneNumber));
  }
});

test("identifier schema returns normalized contact identifiers", () => {
  assert.equal(identifierSchema.parse(" Tester@Example.invalid "), "tester@example.invalid");
  assert.equal(identifierSchema.parse("SECOND@EXAMPLE.INVALID"), "second@example.invalid");
  assert.equal(identifierSchema.parse("user@EXAMPLE.COM"), "user@example.com");
  assert.equal(identifierSchema.parse("09121234567"), "+989121234567");
  assert.equal(identifierSchema.parse("989121234567"), "+989121234567");
  assert.equal(identifierSchema.parse("+989121234567"), "+989121234567");
  assert.equal(identifierSchema.parse("۰۹۱۲۱۲۳۴۵۶۷"), "+989121234567");
  assert.equal(identifierSchema.parse("٠٩١٢١٢٣٤٥٦٧"), "+989121234567");
  assert.equal(normalizeContactIdentifier(" Tester@Example.invalid "), "tester@example.invalid");
});
