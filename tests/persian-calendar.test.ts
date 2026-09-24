import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPersianCalendarMonth,
  getPersianDateParts,
  isIsoDiaryDate,
  isoDateForPersianMonth,
  shiftPersianMonth,
  startOfPersianMonth,
} from "../lib/diary/persian-calendar";

test("Persian calendar keeps ISO values while producing a Saturday-first six-week grid", () => {
  const selectedDate = "2026-06-23";
  const monthStart = startOfPersianMonth(selectedDate);
  const days = buildPersianCalendarMonth(selectedDate);

  assert.equal(getPersianDateParts(monthStart).day, 1);
  assert.equal(days.length, 42);
  assert.equal(new Date(`${days[0].isoDate}T12:00:00Z`).getUTCDay(), 6);
  assert.ok(days.some((day) => day.isoDate === selectedDate && day.inCurrentMonth));
  assert.ok(days.every((day) => isIsoDiaryDate(day.isoDate)));
});

test("Persian month navigation resolves adjacent month starts in both directions", () => {
  const currentStart = startOfPersianMonth("2026-06-23");
  const nextStart = shiftPersianMonth(currentStart, 1);
  const previousStart = shiftPersianMonth(currentStart, -1);
  const current = getPersianDateParts(currentStart);

  assert.equal(getPersianDateParts(nextStart).day, 1);
  assert.equal(getPersianDateParts(previousStart).day, 1);
  assert.notDeepEqual(getPersianDateParts(nextStart), current);
  assert.notDeepEqual(getPersianDateParts(previousStart), current);
  assert.equal(shiftPersianMonth(nextStart, -1), currentStart);
});

test("Persian month lookup resolves a selected year and month", () => {
  const isoDate = isoDateForPersianMonth(1405, 4);
  const parts = getPersianDateParts(isoDate);

  assert.equal(parts.year, 1405);
  assert.equal(parts.month, 4);
  assert.equal(parts.day, 1);
  assert.equal(startOfPersianMonth(isoDate), isoDate);
});

test("ISO validation rejects impossible and non-canonical dates", () => {
  assert.equal(isIsoDiaryDate("2026-06-23"), true);
  assert.equal(isIsoDiaryDate("2026-02-30"), false);
  assert.equal(isIsoDiaryDate("۱۴۰۵-۰۴-۰۲"), false);
});
