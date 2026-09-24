import assert from "node:assert/strict";
import test from "node:test";
import {calculateCatalogAmount, durationLabel, formatToman} from "../lib/api/admin-subscription-prices";

test("formats IRR catalog amounts as Persian toman", () => {
  assert.equal(formatToman(1_990_000), "۱۹۹٬۰۰۰ تومان");
});

test("maps supported durations to human-readable Persian labels", () => {
  assert.deepEqual([30, 90, 365].map(durationLabel), ["ماهانه", "سه‌ماهه", "سالانه"]);
});

test("previews the payable amount from base price and catalog discount", () => {
  assert.equal(calculateCatalogAmount(6_000_000, 8.5), 5_490_000);
  assert.equal(calculateCatalogAmount(1_999.99, 12.5), 1_749.99);
});
