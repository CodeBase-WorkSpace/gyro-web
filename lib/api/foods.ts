import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

export type FoodType = "CUSTOM" | "SYSTEM";

export type FoodSearchType = FoodType;

export type QuickAddFoodFilter = "all" | "recent" | "favorite" | "custom" | "system";

export type FoodSearchRequestDto = {
  query?: string;
  type?: FoodSearchType;
  favorite?: boolean;
  recent?: boolean;
  locale?: string;
  page?: number;
  size?: number;
};

export type FoodServingUnitDto = {
  id: string;
  code: string;
  label: string;
};

export type FoodServingPortionDto = {
  amount: number;
  unitName?: string | null;
  unitAbbreviation?: string | null;
  modifier?: string | null;
  gramWeight?: number | null;
  displayText: string;
  servingUnitId?: string | null;
  servingUnitCode?: string | null;
};

export type FoodNutritionDto = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
};

export type FoodSearchItemDto = FoodNutritionDto & {
  id: string;
  type: FoodType;
  name: string;
  displayName: string;
  locale?: string | null;
  servingQuantity: number;
  servingUnit: FoodServingUnitDto;
  portions: FoodServingPortionDto[];
  favorite: boolean;
  recent: boolean;
  source: string;
  dataQuality: string;
};

export type FoodSearchResponseDto = {
  items: FoodSearchItemDto[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export type FoodDetailDto = FoodNutritionDto & {
  id: string;
  type: FoodType;
  name: string;
  displayName: string;
  locale: string;
  servingQuantity: number;
  servingUnit: FoodServingUnitDto;
  portions: FoodServingPortionDto[];
  favorite: boolean;
  recent: boolean;
  source: string;
  dataQuality: string;
};

export type CustomFoodPortionRequestDto = {
  name: string;
  gramWeight: number;
};

export type CustomFoodRequestDto = FoodNutritionDto & {
  name: string;
  servingQuantity: number;
  servingUnit: string;
  portions?: CustomFoodPortionRequestDto[];
};

export type CreateCustomFoodRequestDto = CustomFoodRequestDto;

export type UpdateCustomFoodRequestDto = CustomFoodRequestDto;

export type CustomFoodDto = FoodNutritionDto & {
  id: string;
  name: string;
  type: FoodType;
  servingQuantity: number;
  servingUnit: FoodServingUnitDto;
  portions?: FoodServingPortionDto[];
};

export type FoodFavoriteResponseDto = {
  foodId: string;
  favorite: boolean;
};

export type CustomFoodArchiveResponseDto = {
  foodId: string;
  archived: boolean;
};

export type FoodSearchItem = FoodSearchItemDto;
export type QuickAddSearchSourceType = "FOOD" | "MEAL";
export type QuickAddSearchItem = FoodSearchItemDto & {
  quickAddSourceType?: QuickAddSearchSourceType;
};

export type QuickAddFoodSearchOptions = {
  query?: string;
  filter: QuickAddFoodFilter;
  locale?: string;
  page?: number;
  size?: number;
};

export function quickAddFoodSearchRequest({
  query,
  filter,
  locale,
  page,
  size,
}: QuickAddFoodSearchOptions): FoodSearchRequestDto {
  return {
    query: query?.trim() || undefined,
    recent: filter === "recent" ? true : undefined,
    favorite: filter === "favorite" ? true : undefined,
    type: filter === "custom" ? "CUSTOM" : filter === "system" ? "SYSTEM" : undefined,
    // Owner-created foods may use a different search-term locale than the UI.
    // Do not hide them when the user explicitly selects the custom filter.
    locale: filter === "custom" ? undefined : locale,
    page,
    size,
  };
}

export function foodSearchPath(request: FoodSearchRequestDto): string {
  const searchParams = new URLSearchParams();

  if (request.query) searchParams.append("query", request.query);
  if (request.type) searchParams.append("type", request.type);
  if (request.favorite !== undefined) searchParams.append("favorite", String(request.favorite));
  if (request.recent !== undefined) searchParams.append("recent", String(request.recent));
  if (request.locale) searchParams.append("locale", request.locale);
  searchParams.append("page", String(request.page ?? 0));
  searchParams.append("size", String(request.size ?? 20));

  return `/foods?${searchParams.toString()}`;
}

export function foodSearchProxyPath(request: FoodSearchRequestDto): string {
  return `/api/foods/search${foodSearchPath(request).slice("/foods".length)}`;
}

export function foodDetailPath(foodId: string, locale?: string): string {
  const searchParams = new URLSearchParams();

  if (locale) searchParams.append("locale", locale);

  const query = searchParams.toString();
  return `/foods/${encodeURIComponent(foodId)}${query ? `?${query}` : ""}`;
}

export async function searchFoods(
  request: FoodSearchRequestDto,
  accessToken?: string
): Promise<FoodSearchResponseDto> {
  return apiGet<FoodSearchResponseDto>(foodSearchPath(request), accessToken);
}

export async function getFoodDetail(
  foodId: string,
  accessToken: string,
  locale?: string
): Promise<FoodDetailDto> {
  return apiGet<FoodDetailDto>(foodDetailPath(foodId, locale), accessToken);
}

export async function createCustomFood(
  request: CreateCustomFoodRequestDto,
  accessToken: string,
  idempotencyKey: string
): Promise<CustomFoodDto> {
  return apiPost<CustomFoodDto>("/foods/custom", request, {
    accessToken,
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
  });
}

export async function updateCustomFood(
  foodId: string,
  request: UpdateCustomFoodRequestDto,
  accessToken: string
): Promise<CustomFoodDto> {
  return apiPatch<CustomFoodDto>(`/foods/custom/${encodeURIComponent(foodId)}`, request, {
    accessToken,
  });
}

export async function archiveCustomFood(
  foodId: string,
  accessToken: string
): Promise<CustomFoodArchiveResponseDto> {
  return apiPost<CustomFoodArchiveResponseDto>(
    `/foods/custom/${encodeURIComponent(foodId)}/archive`,
    undefined,
    { accessToken }
  );
}

export async function favoriteFood(
  foodId: string,
  accessToken: string
): Promise<FoodFavoriteResponseDto> {
  return apiPost<FoodFavoriteResponseDto>(
    `/foods/${encodeURIComponent(foodId)}/favorite`,
    undefined,
    { accessToken }
  );
}

export async function unfavoriteFood(
  foodId: string,
  accessToken: string
): Promise<FoodFavoriteResponseDto> {
  return apiDelete<FoodFavoriteResponseDto>(
    `/foods/${encodeURIComponent(foodId)}/favorite`,
    { accessToken }
  );
}
