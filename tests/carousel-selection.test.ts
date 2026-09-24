import assert from "node:assert/strict";
import test from "node:test";

import { selectVisibleSlide } from "../lib/dom/carousel-selection";

const THRESHOLD = 0.6;

const entry = (target: string, intersectionRatio: number) => ({
  target,
  intersectionRatio,
});

test("selects the only slide that meets the threshold", () => {
  const selected = selectVisibleSlide([entry("a", 1)], THRESHOLD);

  assert.equal(selected, "a");
});

test("ignores a slide crossing back down through the threshold", () => {
  // The regression this guards: IntersectionObserver still reports
  // isIntersecting: true here, so filtering on that flag would re-select the
  // slide the user is swiping away from.
  const selected = selectVisibleSlide([entry("a", 0.59)], THRESHOLD);

  assert.equal(selected, null);
});

test("picks the incoming slide when the outgoing one drops below the threshold", () => {
  const selected = selectVisibleSlide(
    [entry("a", 0.59), entry("b", 0.72)],
    THRESHOLD,
  );

  assert.equal(selected, "b");
});

test("result does not depend on the order entries are delivered in", () => {
  const forward = selectVisibleSlide(
    [entry("a", 0.62), entry("b", 0.94)],
    THRESHOLD,
  );
  const reversed = selectVisibleSlide(
    [entry("b", 0.94), entry("a", 0.62)],
    THRESHOLD,
  );

  assert.equal(forward, "b");
  assert.equal(reversed, "b");
});

test("treats a ratio exactly at the threshold as qualifying", () => {
  const selected = selectVisibleSlide([entry("a", THRESHOLD)], THRESHOLD);

  assert.equal(selected, "a");
});

test("returns null mid-drag when no slide covers enough of the viewport", () => {
  const selected = selectVisibleSlide(
    [entry("a", 0.48), entry("b", 0.52)],
    THRESHOLD,
  );

  assert.equal(selected, null);
});

test("returns null for an empty batch", () => {
  assert.equal(selectVisibleSlide([], THRESHOLD), null);
});

test("ignores slides that have scrolled fully out of view", () => {
  const selected = selectVisibleSlide(
    [entry("a", 0), entry("b", 0.81)],
    THRESHOLD,
  );

  assert.equal(selected, "b");
});
