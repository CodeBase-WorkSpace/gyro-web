"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";

import {ApiClientError, localizedApiErrorMessage} from "@/lib/api/errors";
import {saveWeightEntry, type WeightEntryResponseDto, type WeightUnit,} from "@/lib/api/weight";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {normalizeDecimalInput} from "@/lib/foods/custom-food-validation";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const weightUnits = new Set<WeightUnit>(["KG", "LB"]);

export type WeightEntryFormValues = {
  recordedDate: string;
  weight: string;
  unit: WeightUnit;
  notes: string;
  nextPath: string;
};

export type WeightEntryFormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Partial<Record<keyof WeightEntryFormValues, string>>;
  formValues?: WeightEntryFormValues;
  entry?: WeightEntryResponseDto;
  requestId?: string;
};

export async function saveWeightEntryAction(
  _prevState: WeightEntryFormState,
  formData: FormData,
): Promise<WeightEntryFormState> {
  const formValues = weightEntryFormValuesFrom(formData);
  const parsed = parseWeightEntryFormValues(formValues);

  if (!parsed.ok) {
    return {
      message: "اطلاعات وزن را بررسی کنید.",
      fieldErrors: parsed.fieldErrors,
      formValues,
    };
  }

  const idempotencyKey = createIdempotencyKey();
  const nextPath = sanitizeNextPath(formValues.nextPath);

  try {
    const entry = await authenticatedServerRequest(
      (accessToken) =>
        saveWeightEntry(
          {
            recordedDate: parsed.value.recordedDate,
            weight: parsed.value.weight,
            unit: parsed.value.unit,
            source: "MANUAL",
            notes: parsed.value.notes || undefined,
          },
          accessToken,
          idempotencyKey,
        ),
      {nextPath, retryPolicy: "idempotent"},
    );

    revalidateWeightEntryPaths();

    return {
      ok: true,
      message: "وزن ذخیره شد.",
      formValues: {
        ...formValues,
        weight: "",
        notes: "",
      },
      entry,
    };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiClientError) {
      return {
        message: weightEntryApiErrorMessage(error),
        fieldErrors: mapWeightEntryFieldErrors(error.fieldErrors),
        formValues,
        requestId: error.requestId,
      };
    }

    return {
      message: "ثبت وزن انجام نشد. کمی بعد دوباره تلاش کنید.",
      formValues,
    };
  }
}

function weightEntryFormValuesFrom(formData: FormData): WeightEntryFormValues {
  return {
    recordedDate: String(formData.get("recordedDate") ?? ""),
    weight: String(formData.get("weight") ?? ""),
    unit: String(formData.get("unit") ?? "KG") as WeightUnit,
    notes: String(formData.get("notes") ?? ""),
    nextPath: String(formData.get("nextPath") ?? "/progress/weight"),
  };
}

function parseWeightEntryFormValues(values: WeightEntryFormValues):
  | {
  ok: true;
  value: {
    recordedDate: string;
    weight: number;
    unit: WeightUnit;
    notes: string;
  };
}
  | {
  ok: false;
  fieldErrors: Partial<Record<keyof WeightEntryFormValues, string>>;
} {
  const fieldErrors: Partial<Record<keyof WeightEntryFormValues, string>> = {};
  const normalizedWeight = normalizeDecimalInput(values.weight);
  const weight = Number(normalizedWeight);
  const notes = values.notes.trim();

  if (!ISO_DATE.test(values.recordedDate)) {
    fieldErrors.recordedDate = "تاریخ ثبت وزن معتبر نیست.";
  }

  if (!normalizedWeight) {
    fieldErrors.weight = "وزن را وارد کنید.";
  } else if (!Number.isFinite(weight)) {
    fieldErrors.weight = "وزن باید عدد معتبر باشد.";
  } else if (weight <= 0) {
    fieldErrors.weight = "وزن باید بیشتر از صفر باشد.";
  } else {
    const weightKg = values.unit === "LB" ? weight * 0.453_592_37 : weight;
    if (weightKg < 20 || weightKg > 500) {
      fieldErrors.weight = "وزن باید بین ۲۰ تا ۵۰۰ کیلوگرم باشد.";
    }
  }

  if (!weightUnits.has(values.unit)) {
    fieldErrors.unit = "واحد وزن معتبر نیست.";
  }

  if (notes.length > 2000) {
    fieldErrors.notes = "یادداشت باید حداکثر ۲۰۰۰ نویسه باشد.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {ok: false, fieldErrors};
  }

  return {
    ok: true,
    value: {
      recordedDate: values.recordedDate,
      weight,
      unit: values.unit,
      notes,
    },
  };
}

function mapWeightEntryFieldErrors(fieldErrors?: Record<string, string>) {
  if (!fieldErrors) return undefined;

  return {
    recordedDate: fieldErrors.recordedDate,
    weight: fieldErrors.weight,
    unit: fieldErrors.unit,
    notes: fieldErrors.notes,
  };
}

function weightEntryApiErrorMessage(error: ApiClientError) {
  if (error.code === "IDEMPOTENCY_KEY_CONFLICT") {
    return "این درخواست با اطلاعات متفاوت تکرار شده است. دوباره تلاش کنید.";
  }

  return localizedApiErrorMessage(error) || "ثبت وزن انجام نشد.";
}

function revalidateWeightEntryPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  revalidatePath("/progress/weight");
}

function sanitizeNextPath(nextPath: string) {
  return nextPath.startsWith("/") ? nextPath : "/progress/weight";
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `weight-entry-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
