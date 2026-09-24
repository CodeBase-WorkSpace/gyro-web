"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";

import {ApiClientError} from "@/lib/api/errors";
import {createCustomFood} from "@/lib/api/foods";
import {authenticatedServerRequest} from "@/lib/auth/authenticated-api";
import {safeRedirectPath} from "@/lib/auth/redirects";
import {
	customFoodFieldErrors,
	type CustomFoodFormValues,
	customFoodSchema,
	type CustomFoodValidatedValues,
} from "@/lib/foods/custom-food-validation";
import {customFoodFormValuesFrom} from "@/lib/foods/custom-food-draft";
import {CUSTOM_FOOD_PORTIONS_FIELD, parseCustomFoodPortionsJson} from "@/lib/foods/custom-food-portions";
import {planLimitNoticeFromMetadata, type PlanLimitNotice} from "@/lib/subscription/plan-limits";

export type CustomFoodActionState = {
	message?: string;
	successMessage?: string;
	createdFoodId?: string;
	requestId?: string;
	planLimit?: PlanLimitNotice;
  fieldErrors?: Partial<Record<keyof CustomFoodFormValues | "portions", string>>;
	formValues?: Record<keyof CustomFoodFormValues, string>;
};

export async function createCustomFoodAction(
	_prevState: CustomFoodActionState,
	formData: FormData,
): Promise<CustomFoodActionState> {
	const formValues = customFoodFormValuesFrom(formData);
  const nextPath = safeRedirectPath(formData.get("nextPath"), "/foods");
	const parsed = customFoodSchema.safeParse(formValues);

	if (!parsed.success) {
		return {
			message: "اطلاعات غذای سفارشی را بررسی کنید.",
			fieldErrors: customFoodFieldErrors(parsed.error),
			formValues,
		};
	}

  const parsedPortions = parseCustomFoodPortionsJson(
    formData.get(CUSTOM_FOOD_PORTIONS_FIELD)?.toString(),
  );
  if (parsedPortions.error) {
    return {
      message: "اطلاعات غذای سفارشی را بررسی کنید.",
      fieldErrors: {portions: parsedPortions.error},
      formValues,
    };
  }

  const request = customFoodRequestFrom(parsed.data, parsedPortions.portions ?? []);
	const idempotencyKey = createIdempotencyKey();

	try {
		const createdFood = await authenticatedServerRequest(
			(accessToken) => createCustomFood(request, accessToken, idempotencyKey),
			{ nextPath, retryPolicy: "idempotent" },
		);

    revalidatePath(nextPath);
    if (nextPath !== "/foods") revalidatePath("/foods");
		revalidatePath("/dashboard");

		return {
			successMessage: "غذای سفارشی ذخیره شد.",
			createdFoodId: createdFood.id,
			formValues: emptyCustomFoodFormValues(),
		};
	} catch (error) { return customFoodFailureState(error, formValues); }
}

function customFoodFailureState(
	error: unknown,
	formValues: Record<keyof CustomFoodFormValues, string>,
): CustomFoodActionState {
	unstable_rethrow(error);
	if (error instanceof ApiClientError) {
		return {
			message: error.message || "غذای سفارشی ذخیره نشد.",
			requestId: error.requestId,
			planLimit: planLimitNoticeFromMetadata(error.metadata),
			fieldErrors: customFoodApiFieldErrors(error.fieldErrors),
			formValues,
		};
	}

	return {
		message: "غذای سفارشی ذخیره نشد. کمی بعد دوباره تلاش کنید.",
		formValues,
	};
}

function customFoodApiFieldErrors(fieldErrors?: Record<string, string>) {
	if (!fieldErrors) return undefined;

	return Object.fromEntries(
		Object.entries(fieldErrors).map(([field, message]) => [
			field as keyof CustomFoodFormValues,
			message,
		]),
	) as Partial<Record<keyof CustomFoodFormValues, string>>;
}

function customFoodRequestFrom(
  values: CustomFoodValidatedValues,
  portions: Array<{ name: string; gramWeight: number }>,
) {
	return {
		name: values.name,
		servingQuantity: values.servingQuantity,
		servingUnit: values.servingUnit,
		calories: values.calories,
		protein: values.protein,
		carbs: values.carbs,
		fat: values.fat,
		fiber: values.fiber,
		sugar: values.sugar,
		sodium: values.sodium,
    portions: values.servingUnit === "GRAM" ? portions : [],
	};
}

function emptyCustomFoodFormValues() {
	return {
		name: "",
		servingQuantity: "",
		servingUnit: "GRAM",
		calories: "",
		protein: "",
		carbs: "",
		fat: "",
		fiber: "",
		sugar: "",
		sodium: "",
	};
}

function createIdempotencyKey() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}

	return `custom-food-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
