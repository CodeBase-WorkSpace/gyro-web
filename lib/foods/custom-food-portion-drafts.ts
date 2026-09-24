import type {FoodServingPortionDto} from "@/lib/api/foods";

// The zod-free half of custom-food-portions. Kept separate so a client
// component that only needs to shape drafts — the food detail page, say — does
// not drag zod (~63 KB gzipped) into its route bundle just to reach these.
// Anything that validates lives next door and imports zod there.

export const CUSTOM_FOOD_PORTIONS_FIELD = "portionsJson";
export const CUSTOM_FOOD_PORTIONS_MAX = 10;

export type CustomFoodPortionDraft = {
  id: string;
  name: string;
  gramWeightInput: string;
};

export function serializeCustomFoodPortionDrafts(drafts: CustomFoodPortionDraft[]): string {
  return JSON.stringify(
    drafts.map((draft) => ({name: draft.name, gramWeight: draft.gramWeightInput})),
  );
}

export function customFoodPortionDraftsFrom(portions: FoodServingPortionDto[] | undefined): CustomFoodPortionDraft[] {
  return (portions ?? [])
    .filter((portion) => typeof portion.gramWeight === "number" && portion.gramWeight > 0)
    .map((portion, index) => ({
      id: `portion-${index}-${portion.unitName ?? portion.displayText}`,
      name: portion.unitName ?? portion.displayText,
      gramWeightInput: String(portion.gramWeight),
    }));
}
