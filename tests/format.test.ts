import assert from "node:assert/strict";
import test from "node:test";

import {formatPersianNumber, localizedServingUnit, toPersianDigits,} from "../lib/format";

test("toPersianDigits converts Latin digits in numbers", () => {
  assert.equal(toPersianDigits(12045), "۱۲۰۴۵");
});

test("toPersianDigits preserves non-digit text", () => {
  assert.equal(toPersianDigits("کالری 250 از 1800"), "کالری ۲۵۰ از ۱۸۰۰");
});

test("formatPersianNumber rounds fractional values to two decimal places", () => {
  assert.equal(formatPersianNumber(881.0500000000001), "۸۸۱٫۰۵");
  assert.equal(formatPersianNumber(285.6), "۲۸۵٫۶");
});

test("localizedServingUnit uses Farsi labels for diary unit codes", () => {
  assert.equal(localizedServingUnit("GRAM"), "گرم");
  assert.equal(localizedServingUnit("SERVING"), "وعده");
  assert.equal(localizedServingUnit("UNKNOWN", "Unknown"), "Unknown");
});
