import assert from "node:assert/strict";
import test from "node:test";

import { diaryDateHref, shiftDiaryDate } from "../lib/diary/date";
import { localWeekDates, localWeekEnd, localWeekStart } from "../lib/diary/week";

test("shiftDiaryDate moves across month and year boundaries", () => {
  assert.equal(shiftDiaryDate("2026-01-01", -1), "2025-12-31");
  assert.equal(shiftDiaryDate("2026-02-28", 1), "2026-03-01");
});

test("diaryDateHref keeps ISO dates in the canonical query URL", () => {
  assert.equal(diaryDateHref("2026-02-26"), "/dashboard?date=2026-02-26");
  assert.equal(diaryDateHref("2026-02-26", "/foods"), "/foods?date=2026-02-26");
});

test("a local week always contains the date it was derived from", () => {
  // The foods page used to fetch this whole week only to pick one day out of
  // it, which was safe precisely because of this invariant — and wasteful for
  // the same reason. Keep it asserted so the reasoning stays visible.
  for (let offset = 0; offset < 14; offset += 1) {
    const date = shiftDiaryDate("2026-06-27", offset);
    assert.ok(
      localWeekDates(date, "fa-IR").includes(date),
      `week for ${date} should contain ${date}`,
    );
  }
});

test("fa-IR local week runs from Saturday through Friday", () => {
  assert.equal(localWeekStart("2026-06-28", "fa-IR"), "2026-06-27");
  assert.equal(localWeekEnd("2026-06-28", "fa-IR"), "2026-07-03");
  assert.deepEqual(localWeekDates("2026-06-28", "fa-IR"), [
    "2026-06-27",
    "2026-06-28",
    "2026-06-29",
    "2026-06-30",
    "2026-07-01",
    "2026-07-02",
    "2026-07-03",
  ]);
});

test("non fa-IR local week defaults to Monday through Sunday", () => {
  assert.equal(localWeekStart("2026-06-28", "en-US"), "2026-06-22");
  assert.equal(localWeekEnd("2026-06-28", "en-US"), "2026-06-28");
});
