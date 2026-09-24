import {z} from "zod/v4";

import {normalizeDecimalInput} from "./custom-food-validation";
import type {CustomFoodPortionRequestDto} from "@/lib/api/foods";
import type {CustomFoodPortionDraft} from "./custom-food-portion-drafts";

// Validation only. The draft shaping helpers live in custom-food-portion-drafts
// so importers that never validate stay clear of zod; they are re-exported here
// so existing call sites keep working.
export {
  CUSTOM_FOOD_PORTIONS_FIELD,
  CUSTOM_FOOD_PORTIONS_MAX,
  customFoodPortionDraftsFrom,
  serializeCustomFoodPortionDrafts,
  type CustomFoodPortionDraft,
} from "./custom-food-portion-drafts";

import {CUSTOM_FOOD_PORTIONS_MAX} from "./custom-food-portion-drafts";

const portionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "نام سروینگ را وارد کنید.")
    .max(80, "نام سروینگ باید حداکثر ۸۰ نویسه باشد."),
  gramWeight: z
    .string()
    .transform(normalizeDecimalInput)
    .refine((value) => value.length > 0, "وزن سروینگ را وارد کنید.")
    .refine((value) => Number.isFinite(Number(value)), "وزن سروینگ باید عدد معتبر باشد.")
    .refine((value) => Number(value) > 0, "وزن سروینگ باید بیشتر از صفر باشد.")
    .transform((value) => Number(value)),
});

const portionsSchema = z
  .array(portionSchema)
  .max(CUSTOM_FOOD_PORTIONS_MAX, `حداکثر ${CUSTOM_FOOD_PORTIONS_MAX} سروینگ سفارشی می‌توانید تعریف کنید.`)
  .refine(
    (portions) => new Set(portions.map((portion) => portion.name)).size === portions.length,
    "نام سروینگ‌ها نباید تکراری باشد.",
  );

export type ParsedCustomFoodPortions =
  | { portions: CustomFoodPortionRequestDto[]; error?: undefined }
  | { portions?: undefined; error: string };

export function parseCustomFoodPortionsJson(raw: string | null | undefined): ParsedCustomFoodPortions {
  const trimmed = raw?.trim();
  if (!trimmed) return {portions: []};

  let candidate: unknown;
  try {
    candidate = JSON.parse(trimmed);
  } catch {
    return {error: "سروینگ‌های سفارشی معتبر نیستند."};
  }

  const parsed = portionsSchema.safeParse(candidate);
  if (!parsed.success) {
    return {error: parsed.error.issues[0]?.message ?? "سروینگ‌های سفارشی معتبر نیستند."};
  }

  return {portions: parsed.data};
}

export function validateCustomFoodPortionDraft(draft: CustomFoodPortionDraft): string | null {
  const parsed = portionSchema.safeParse({name: draft.name, gramWeight: draft.gramWeightInput});
  return parsed.success ? null : (parsed.error.issues[0]?.message ?? "سروینگ سفارشی معتبر نیست.");
}
