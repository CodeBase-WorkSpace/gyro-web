import type { CustomFoodFormValues } from "./custom-food-validation";
import type { FoodDetailDto } from "@/lib/api/foods";

export function customFoodFormValuesFrom(formData: FormData): Record<keyof CustomFoodFormValues, string> {
	return {
		name: String(formData.get("name") ?? ""),
		servingQuantity: String(formData.get("servingQuantity") ?? ""),
		servingUnit: String(formData.get("servingUnit") ?? "GRAM"),
		calories: String(formData.get("calories") ?? ""),
		protein: String(formData.get("protein") ?? ""),
		carbs: String(formData.get("carbs") ?? ""),
		fat: String(formData.get("fat") ?? ""),
		fiber: String(formData.get("fiber") ?? ""),
		sugar: String(formData.get("sugar") ?? ""),
		sodium: String(formData.get("sodium") ?? ""),
	};
}

export function customFoodFormValuesFromFood(
	food: Pick<
		FoodDetailDto,
		"name" | "servingQuantity" | "servingUnit" | "calories" | "protein" | "carbs" | "fat" | "fiber" | "sugar" | "sodium"
	>,
	name = food.name,
): Record<keyof CustomFoodFormValues, string> {
	return {
		name,
		servingQuantity: String(food.servingQuantity),
		servingUnit: food.servingUnit.code,
		calories: String(food.calories),
		protein: String(food.protein),
		carbs: String(food.carbs),
		fat: String(food.fat),
		fiber: String(food.fiber),
		sugar: String(food.sugar),
		sodium: String(food.sodium),
	};
}
