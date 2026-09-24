import assert from "node:assert/strict";
import test from "node:test";

import { selectVisibleLabelIndices } from "../lib/charts/label-thinning";

test("evenly spread labels are all kept when they clear the gap", () => {
	assert.deepEqual(
		selectVisibleLabelIndices([0, 0.25, 0.5, 0.75, 1], 0.1),
		[0, 1, 2, 3, 4],
	);
});

test("crowded labels are dropped from the middle", () => {
	// Six labels inside a 0.1 gap budget: the first is kept, then every label closer
	// than the gap to the last kept one is skipped.
	assert.deepEqual(
		selectVisibleLabelIndices([0, 0.02, 0.04, 0.5, 0.52, 1], 0.1),
		[0, 3, 5],
	);
});

test("the first and last labels always survive", () => {
	// Both endpoints anchor the range, so they are kept even when they are closer
	// together than the gap would allow.
	assert.deepEqual(selectVisibleLabelIndices([0, 0.01], 0.5), [0, 1]);
	// 0.8 clears the gap from 0 and is kept on the forward pass, then loses to the
	// final label it sits 0.2 from. Only the endpoints remain.
	assert.deepEqual(selectVisibleLabelIndices([0, 0.4, 0.8, 1], 0.5), [0, 3]);
});

test("a label colliding with the last one is dropped instead of the last", () => {
	// 0.95 clears the gap from 0 and would be kept on the forward pass, but it sits
	// 0.05 from the final label. The earlier label yields; the endpoint does not.
	assert.deepEqual(selectVisibleLabelIndices([0, 0.95, 1], 0.1), [0, 2]);
});

test("degenerate inputs are handled without throwing", () => {
	assert.deepEqual(selectVisibleLabelIndices([], 0.1), []);
	assert.deepEqual(selectVisibleLabelIndices([0.5], 0.1), [0]);
});

test("selection is stable regardless of gap when only endpoints exist", () => {
	for (const gap of [0, 0.1, 0.5, 1]) {
		assert.deepEqual(selectVisibleLabelIndices([0, 1], gap), [0, 1]);
	}
});
