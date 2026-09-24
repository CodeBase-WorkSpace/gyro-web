"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { ApiClientError } from "@/lib/api/errors";
import {
	archiveCustomFood,
	favoriteFood,
	unfavoriteFood,
	updateCustomFood,
} from "@/lib/api/foods";
import { authenticatedServerRequest } from "@/lib/auth/authenticated-api";
import { customFoodFormValuesFrom } from "@/lib/foods/custom-food-draft";
import {CUSTOM_FOOD_PORTIONS_FIELD, parseCustomFoodPortionsJson} from "@/lib/foods/custom-food-portions";
import {
	customFoodFieldErrors,
	customFoodSchema,
	type CustomFoodFormValues,
	type CustomFoodValidatedValues,
} from "@/lib/foods/custom-food-validation";

export type FoodMutationState = {
	message?: string;
	successMessage?: string;
	requestId?: string;
	favorite?: boolean;
  fieldErrors?: Partial<Record<keyof CustomFoodFormValues | "portions", string>>;
	formValues?: Record<keyof CustomFoodFormValues, string>;
};

export async function toggleFavoriteAction(
	_prevState: FoodMutationState,
	formData: FormData,
): Promise<FoodMutationState> {
	const foodId = String(formData.get("foodId") ?? "");
	const shouldFavorite = String(formData.get("favorite") ?? "") === "true";

	if (!foodId) {
		return { message: "شناسه غذا معتبر نیست." };
	}

	try {
		const response = await mutateWithAuth(foodId, (accessToken) =>
			shouldFavorite
				? favoriteFood(foodId, accessToken)
				: unfavoriteFood(foodId, accessToken),
		);

		revalidateFoodPaths(foodId);

		return {
			successMessage: response.favorite
				? "غذا به علاقه‌مندی‌ها اضافه شد."
				: "غذا از علاقه‌مندی‌ها حذف شد.",
			favorite: response.favorite,
		};
	} catch (error) {
		return foodActionError(error, "وضعیت علاقه‌مندی ذخیره نشد.");
	}
}

export async function updateCustomFoodAction(
	_prevState: FoodMutationState,
	formData: FormData,
): Promise<FoodMutationState> {
	const foodId = String(formData.get("foodId") ?? "");
	const formValues = customFoodFormValuesFrom(formData);
	const parsed = customFoodSchema.safeParse(formValues);

	if (!foodId) {
		return { message: "شناسه غذا معتبر نیست.", formValues };
	}

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

	try {
		await mutateWithAuth(foodId, (accessToken) =>
      updateCustomFood(foodId, customFoodRequestFrom(parsed.data, parsedPortions.portions ?? []), accessToken),
		);

		revalidateFoodPaths(foodId);

		return {
			successMessage: "غذای سفارشی ویرایش شد.",
			formValues,
		};
	} catch (error) {
		return {
			...foodActionError(error, "غذای سفارشی ویرایش نشد."),
			formValues,
		};
	}
}

export async function archiveCustomFoodAction(
	_prevState: FoodMutationState,
	formData: FormData,
): Promise<FoodMutationState> {
	const foodId = String(formData.get("foodId") ?? "");
	const confirmed = String(formData.get("confirmArchive") ?? "") === "true";

	if (!foodId) {
		return { message: "شناسه غذا معتبر نیست." };
	}

	if (!confirmed) {
		return { message: "برای آرشیو، تأیید را فعال کنید." };
	}

	try {
		await mutateWithAuth(foodId, (accessToken) =>
			archiveCustomFood(foodId, accessToken),
		);
	} catch (error) {
		return foodActionError(error, "غذا آرشیو نشد.");
	}

	revalidateFoodPaths(foodId);
	redirect("/foods?archived=1");
}

async function mutateWithAuth<T>(
	foodId: string,
	mutation: (accessToken: string) => Promise<T>,
): Promise<T> {
	return authenticatedServerRequest(mutation, {
		nextPath: `/foods/${encodeURIComponent(foodId)}`,
		retryPolicy: "never",
	});
}

function revalidateFoodPaths(foodId: string) {
	revalidatePath(`/foods/${foodId}`);
	revalidatePath("/foods");
	revalidatePath("/dashboard");
}

function foodActionError(error: unknown, fallback: string): FoodMutationState {
	unstable_rethrow(error);
	if (error instanceof ApiClientError) {
		return {
			message: error.message || fallback,
			requestId: error.requestId,
			fieldErrors: customFoodApiFieldErrors(error.fieldErrors),
		};
	}

	return { message: `${fallback} کمی بعد دوباره تلاش کنید.` };
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
