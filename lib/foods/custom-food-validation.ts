import { z } from "zod/v4";

const servingUnits = ["GRAM", "MILLILITER", "PIECE", "SERVING"] as const;
const persianDigitMap: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

export function normalizeDecimalInput(value: string) {
  return value
    .trim()
    .replace(/[۰-۹٠-٩]/g, (digit) => persianDigitMap[digit] ?? digit)
    .replace(/[٫٬،]/g, ".")
    .replace(/,/g, ".");
}

function decimalField(label: string) {
  return z
    .string()
    .transform(normalizeDecimalInput)
    .refine((value: string) => value.length > 0, `${label} را وارد کنید.`)
    .refine((value: string) => Number.isFinite(Number(value)), `${label} باید عدد معتبر باشد.`)
    .refine((value: string) => Number(value) >= 0, `${label} نمی‌تواند منفی باشد.`)
    .transform((value: string) => Number(value));
}

function optionalDecimalField(label: string) {
  return z
    .string()
    .transform(normalizeDecimalInput)
    .refine((value: string) => value === "" || Number.isFinite(Number(value)), `${label} باید عدد معتبر باشد.`)
    .refine((value: string) => value === "" || Number(value) >= 0, `${label} نمی‌تواند منفی باشد.`)
    .transform((value: string) => (value === "" ? 0 : Number(value)));
}

export const customFoodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "نام غذا را وارد کنید.")
    .max(160, "نام غذا باید حداکثر ۱۶۰ نویسه باشد."),
  servingQuantity: decimalField("مقدار سروینگ").refine(
    (value) => value > 0,
    "مقدار سروینگ باید بیشتر از صفر باشد.",
  ),
  servingUnit: z.enum(servingUnits, "واحد سروینگ را انتخاب کنید."),
  calories: decimalField("کالری"),
  protein: decimalField("پروتئین"),
  carbs: decimalField("کربوهیدرات"),
  fat: decimalField("چربی"),
  fiber: optionalDecimalField("فیبر"),
  sugar: optionalDecimalField("قند"),
  sodium: optionalDecimalField("سدیم"),
});

export const customFoodBasicsSchema = customFoodSchema.pick({
  name: true,
  servingQuantity: true,
  servingUnit: true,
});

export const customFoodNutritionSchema = customFoodSchema.pick({
  calories: true,
  protein: true,
  carbs: true,
  fat: true,
  fiber: true,
  sugar: true,
  sodium: true,
});

export type CustomFoodFormValues = z.input<typeof customFoodSchema>;
export type CustomFoodValidatedValues = z.output<typeof customFoodSchema>;

export function customFoodFieldErrors(error: z.ZodError): Partial<Record<keyof CustomFoodFormValues, string>> {
  const fieldErrors: Partial<Record<keyof CustomFoodFormValues, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0] as keyof CustomFoodFormValues | undefined;

    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}
