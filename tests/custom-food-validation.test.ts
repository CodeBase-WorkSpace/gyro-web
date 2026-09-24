import assert from "node:assert/strict";
import test from "node:test";

import { customFoodFormValuesFrom, customFoodFormValuesFromFood } from "../lib/foods/custom-food-draft";
import { customFoodFieldErrors, customFoodSchema, normalizeDecimalInput } from "../lib/foods/custom-food-validation";

const validCustomFood = {
  name: "خوراک مرغ خانگی",
  servingQuantity: "100",
  servingUnit: "GRAM",
  calories: "210",
  protein: "28",
  carbs: "4",
  fat: "8",
  fiber: "1",
  sugar: "0",
  sodium: "320",
};

test("customFoodSchema accepts valid custom food values", () => {
  const parsed = customFoodSchema.safeParse(validCustomFood);

  assert.equal(parsed.success, true);

  if (parsed.success) {
    assert.equal(parsed.data.servingQuantity, 100);
    assert.equal(parsed.data.calories, 210);
  }
});

test("customFoodSchema rejects empty name and invalid serving quantity", () => {
  const parsed = customFoodSchema.safeParse({
    ...validCustomFood,
    name: "",
    servingQuantity: "0",
  });

  assert.equal(parsed.success, false);

  if (!parsed.success) {
    const errors = customFoodFieldErrors(parsed.error);
    assert.equal(errors.name, "نام غذا را وارد کنید.");
    assert.equal(errors.servingQuantity, "مقدار سروینگ باید بیشتر از صفر باشد.");
  }
});

test("customFoodSchema rejects negative nutrition values", () => {
  const parsed = customFoodSchema.safeParse({
    ...validCustomFood,
    protein: "-1",
  });

  assert.equal(parsed.success, false);

  if (!parsed.success) {
    assert.equal(customFoodFieldErrors(parsed.error).protein, "پروتئین نمی‌تواند منفی باشد.");
  }
});

test("customFoodSchema accepts Persian decimal digits and normalizes numbers", () => {
  const parsed = customFoodSchema.safeParse({
    ...validCustomFood,
    servingQuantity: "۱۲٫۵",
    calories: "۲۱۰",
  });

  assert.equal(parsed.success, true);

  if (parsed.success) {
    assert.equal(parsed.data.servingQuantity, 12.5);
    assert.equal(parsed.data.calories, 210);
  }
});

test("customFoodSchema treats unavailable fiber sugar and sodium as zero", () => {
  const parsed = customFoodSchema.safeParse({
    ...validCustomFood,
    fiber: "",
    sugar: "",
    sodium: "",
  });

  assert.equal(parsed.success, true);

  if (parsed.success) {
    assert.equal(parsed.data.fiber, 0);
    assert.equal(parsed.data.sugar, 0);
    assert.equal(parsed.data.sodium, 0);
  }
});

test("customFoodFormValuesFrom preserves submitted custom food draft values", () => {
  const formData = new FormData();
  formData.set("name", "خوراک مرغ خانگی");
  formData.set("servingQuantity", "۱۵۰٫۵");
  formData.set("servingUnit", "SERVING");
  formData.set("calories", "۳۱۰");
  formData.set("protein", "۲۴");
  formData.set("carbs", "۶");
  formData.set("fat", "۱۸");
  formData.set("fiber", "۱٫۵");
  formData.set("sugar", "۲");
  formData.set("sodium", "۴۲۰");

  assert.deepEqual(customFoodFormValuesFrom(formData), {
    name: "خوراک مرغ خانگی",
    servingQuantity: "۱۵۰٫۵",
    servingUnit: "SERVING",
    calories: "۳۱۰",
    protein: "۲۴",
    carbs: "۶",
    fat: "۱۸",
    fiber: "۱٫۵",
    sugar: "۲",
    sodium: "۴۲۰",
  });
});

test("customFoodFormValuesFrom keeps default serving unit when missing", () => {
  const formData = new FormData();

  assert.equal(customFoodFormValuesFrom(formData).servingUnit, "GRAM");
});

test("customFoodFormValuesFromFood creates a duplicate-ready draft", () => {
	const values = customFoodFormValuesFromFood({
		name: "خوراک مرغ",
		servingQuantity: 150,
		servingUnit: { id: "unit-1", code: "GRAM", label: "Gram" },
		calories: 310,
		protein: 24,
		carbs: 6,
		fat: 18,
		fiber: 1.5,
		sugar: 2,
		sodium: 420,
	}, "کپی خوراک مرغ");

	assert.equal(values.name, "کپی خوراک مرغ");
	assert.equal(values.servingQuantity, "150");
	assert.equal(values.servingUnit, "GRAM");
	assert.equal(values.sodium, "420");
});

test("normalizeDecimalInput converts Farsi and Arabic digits in the background", () => {
  assert.equal(normalizeDecimalInput("۱۲۳٫۴۵"), "123.45");
  assert.equal(normalizeDecimalInput("١٢٣.٤٥"), "123.45");
});
