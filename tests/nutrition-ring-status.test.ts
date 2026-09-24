import assert from "node:assert/strict";
import test from "node:test";

import { assessNutritionRange } from "../lib/nutrition/ring-status";

test("calories use the API full-credit range from 95 to 105 percent", () => {
	assert.equal(assessNutritionRange("calories", 949, 1000).status, "below");
	assert.equal(assessNutritionRange("calories", 950, 1000).status, "within");
	assert.equal(assessNutritionRange("calories", 1050, 1000).status, "within");
	assert.equal(assessNutritionRange("calories", 1051, 1000).status, "above");
});

test("carbohydrates and fat use the API full-credit range from 85 to 115 percent", () => {
	assert.equal(assessNutritionRange("carbs", 84, 100).status, "below");
	assert.equal(assessNutritionRange("carbs", 85, 100).status, "within");
	assert.equal(assessNutritionRange("fat", 115, 100).status, "within");
	assert.equal(assessNutritionRange("fat", 116, 100).status, "above");
});

test("protein has no upper penalty after reaching its target", () => {
	assert.equal(assessNutritionRange("protein", 89.9, 100).status, "below");
	assert.equal(assessNutritionRange("protein", 90, 100).status, "within");
	assert.equal(assessNutritionRange("protein", 100, 100).status, "within");
	assert.equal(assessNutritionRange("protein", 175, 100).status, "within");
});

test("display percentage keeps overflow while chart progress stays capped", () => {
	const result = assessNutritionRange("calories", 123, 100);

	assert.equal(result.percentage, 123);
	assert.equal(result.chartProgress, 100);
	assert.equal(result.status, "above");
	assert.equal(result.distance, 18);
});

test("distance rounds up so a small remaining gap stays visible", () => {
	const result = assessNutritionRange("carbs", 84.6, 100);

	assert.equal(result.percentage, 85);
	assert.equal(result.status, "below");
	assert.equal(result.distance, 1);
});

test("missing targets return an unconfigured state", () => {
	const result = assessNutritionRange("calories", 500, null);

	assert.equal(result.status, "unconfigured");
	assert.equal(result.percentage, 0);
	assert.equal(result.chartProgress, 0);
});
