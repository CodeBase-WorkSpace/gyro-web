import {apiGet, apiPost, apiPut} from "./client";

export type AdminCatalogWarning = {
  code: string;
  message: string;
};

export type AdminFoodLocalizationDto = {
  locale: "en" | "fa";
  displayName: string;
  reviewStatus?: string;
};

export type AdminFoodAliasDto = {
  locale: "en" | "fa";
  alias: string;
  reviewStatus?: string;
};

export type AdminFoodNutritionDto = {
  baseQuantity: number;
  baseUnitCode: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
};

export type AdminFoodPortionDto = {
  servingUnitCode?: string | null;
  amount: number;
  gramWeight?: number | null;
  modifier?: string | null;
  portionDescription?: string | null;
  sortOrder: number;
};

export type AdminFoodPayload = {
  name: string;
  brandName?: string | null;
  categoryId?: string | null;
  curationStatus: string;
  isSearchable: boolean;
  localizations: AdminFoodLocalizationDto[];
  aliases: AdminFoodAliasDto[];
  nutrition: AdminFoodNutritionDto;
  portions: AdminFoodPortionDto[];
};

export type AdminFoodSummaryDto = {
  id: string;
  name: string;
  brandName: string | null;
  type: string;
  source: string;
  dataQuality: string;
  curationStatus: string;
  isSearchable: boolean;
  archived: boolean;
  categoryName: string | null;
  localeCoverage: string[];
  hasNutrition: boolean;
  portionCount: number;
  lockVersion: number;
  updatedAt: string;
  editable: boolean;
};

export type AdminFoodDetailDto = {
  id: string;
  name: string;
  brandName: string | null;
  type: string;
  source: string;
  dataQuality: string;
  curationStatus: string;
  isSearchable: boolean;
  archived: boolean;
  categoryId: string | null;
  categoryName: string | null;
  localizations: Array<{ locale: string; displayName: string; source: string; reviewStatus: string }>;
  aliases: Array<{ locale: string; alias: string; source: string; reviewStatus: string }>;
  nutrition: AdminFoodNutritionDto | null;
  portions: Array<{
    id: string;
    servingUnitCode: string | null;
    amount: number;
    gramWeight: number | null;
    modifier: string | null;
    portionDescription: string | null;
    sortOrder: number;
  }>;
  lockVersion: number;
  createdAt: string;
  updatedAt: string;
  editable: boolean;
};

export type AdminFoodMutationDto = {
  food: AdminFoodDetailDto;
  warnings: AdminCatalogWarning[];
};

export type AdminCatalogPageDto = {
  items: AdminFoodSummaryDto[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export type AdminServingUnitDto = {
  id: string;
  code: string;
  unitType: string;
  gramMultiplier: number | null;
  milliliterMultiplier: number | null;
  isActive: boolean;
  sortOrder: number;
};

export type AdminFoodCategoryDto = {
  id: string;
  name: string;
  source: string;
};

export type AdminDuplicateSuggestionDto = {
  id: string;
  name: string;
  brandName: string | null;
  source: string;
  archived: boolean;
  matchedOn: string;
};

export type AdminCatalogOwnership = "CATALOG" | "USER" | "ALL";

export type AdminCatalogSearch = {
  query?: string;
  source?: string;
  curationStatus?: string;
  archived?: string;
  ownership?: AdminCatalogOwnership;
  page?: number;
};

export async function getAdminCatalogFoods(accessToken: string, search: AdminCatalogSearch = {}) {
  const params = new URLSearchParams({size: "20", page: String(search.page ?? 0)});
  if (search.query) params.set("query", search.query);
  if (search.source) params.set("source", search.source);
  if (search.curationStatus) params.set("curationStatus", search.curationStatus);
  if (search.archived === "true" || search.archived === "false") params.set("archived", search.archived);
  if (search.ownership && search.ownership !== "CATALOG") params.set("ownership", search.ownership);
  return apiGet<AdminCatalogPageDto>(`/admin/catalog/foods?${params.toString()}`, accessToken);
}

export function getAdminCatalogFood(accessToken: string, foodId: string) {
  return apiGet<AdminFoodDetailDto>(`/admin/catalog/foods/${encodeURIComponent(foodId)}`, accessToken);
}

export function createAdminCatalogFood(accessToken: string, payload: AdminFoodPayload) {
  return apiPost<AdminFoodMutationDto>("/admin/catalog/foods", payload, {accessToken});
}

export function updateAdminCatalogFood(
  accessToken: string,
  foodId: string,
  payload: AdminFoodPayload & { expectedLockVersion: number },
) {
  return apiPut<AdminFoodMutationDto>(`/admin/catalog/foods/${encodeURIComponent(foodId)}`, payload, {accessToken});
}

export function archiveAdminCatalogFood(accessToken: string, foodId: string) {
  return apiPost<{ id: string; archived: boolean }>(
    `/admin/catalog/foods/${encodeURIComponent(foodId)}/archive`,
    undefined,
    {accessToken},
  );
}

export function restoreAdminCatalogFood(accessToken: string, foodId: string) {
  return apiPost<{ id: string; archived: boolean }>(
    `/admin/catalog/foods/${encodeURIComponent(foodId)}/restore`,
    undefined,
    {accessToken},
  );
}

export function getAdminCatalogServingUnits(accessToken: string) {
  return apiGet<AdminServingUnitDto[]>("/admin/catalog/serving-units", accessToken);
}

export function getAdminCatalogCategories(accessToken: string) {
  return apiGet<AdminFoodCategoryDto[]>("/admin/catalog/categories", accessToken);
}

export function createAdminCatalogCategory(accessToken: string, name: string) {
  return apiPost<AdminFoodCategoryDto>("/admin/catalog/categories", {name}, {accessToken});
}

export function getAdminCatalogDuplicates(accessToken: string, name: string, excludeFoodId?: string) {
  const params = new URLSearchParams({name});
  if (excludeFoodId) params.set("excludeFoodId", excludeFoodId);
  return apiGet<AdminDuplicateSuggestionDto[]>(`/admin/catalog/foods/duplicates?${params.toString()}`, accessToken);
}
