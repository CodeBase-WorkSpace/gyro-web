import {apiGet} from "./client";

export type SubscriptionCatalogFeatureDto = {
  key: string;
  description: string;
  enabled: boolean;
};

export type SubscriptionCatalogPriceDto = {
  id: number;
  billingPeriodDays: number;
  baseAmount: number;
  discountPercent: number;
  amount: number;
  currency: string;
  badge: string | null;
};

export type SubscriptionCatalogPlanDto = {
  code: "FREE" | "ADVANCED" | string;
  name: string;
  free: boolean;
  gracePeriodDays: number;
  displayName: string;
  shortDescription: string | null;
  featureSummary: string | null;
  locale: string;
  features: SubscriptionCatalogFeatureDto[];
  prices: SubscriptionCatalogPriceDto[];
};

export type SubscriptionCatalogDto = {
  plans: SubscriptionCatalogPlanDto[];
};

export type SubscriptionCatalogRequestOptions = {
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  timeoutMs?: number;
};

export async function getSubscriptionCatalog(locale = "fa-IR", options?: SubscriptionCatalogRequestOptions) {
  const searchParams = new URLSearchParams({locale});
  const response = await apiGet<unknown>(`/billing/plans?${searchParams.toString()}`, options);
  return parseSubscriptionCatalog(response);
}

export function logSubscriptionCatalogLoadFailure(surface: "admin" | "billing" | "landing", error: unknown) {
  const errorName = error instanceof Error ? error.name : typeof error;
  const errorMessage = error instanceof Error ? error.message : "Unknown catalog fetch failure";
  console.warn(
    `event=subscription_catalog_fetch outcome=failure surface=${surface} error_name=${errorName} error_message=${JSON.stringify(errorMessage)}`,
  );
}

export function parseSubscriptionCatalog(input: unknown): SubscriptionCatalogDto {
  if (!isRecord(input) || !Array.isArray(input.plans)) {
    throw new Error("Invalid subscription catalog response.");
  }

  return {
    plans: input.plans.map(parsePlan),
  };
}

function parsePlan(input: unknown): SubscriptionCatalogPlanDto {
  if (!isRecord(input)) {
    throw new Error("Invalid subscription catalog plan.");
  }

  const code = readString(input.code, "plan.code");
  return {
    code,
    name: readString(input.name, "plan.name"),
    free: readBoolean(input.free, "plan.free"),
    gracePeriodDays: readNumber(input.gracePeriodDays, "plan.gracePeriodDays"),
    displayName: readString(input.displayName, "plan.displayName"),
    shortDescription: readOptionalString(input.shortDescription, "plan.shortDescription"),
    featureSummary: readOptionalString(input.featureSummary, "plan.featureSummary"),
    locale: readString(input.locale, "plan.locale"),
    features: readArray(input.features, "plan.features").map(parseFeature),
    prices: readArray(input.prices, "plan.prices").map(parsePrice),
  };
}

function parseFeature(input: unknown): SubscriptionCatalogFeatureDto {
  if (!isRecord(input)) {
    throw new Error("Invalid subscription catalog feature.");
  }

  return {
    key: readString(input.key, "feature.key"),
    description: readString(input.description, "feature.description"),
    enabled: readBoolean(input.enabled, "feature.enabled"),
  };
}

function parsePrice(input: unknown): SubscriptionCatalogPriceDto {
  if (!isRecord(input)) {
    throw new Error("Invalid subscription catalog price.");
  }

  return {
    id: readNumber(input.id, "price.id"),
    billingPeriodDays: readNumber(input.billingPeriodDays, "price.billingPeriodDays"),
    baseAmount: readNumber(input.baseAmount, "price.baseAmount"),
    discountPercent: readNumber(input.discountPercent, "price.discountPercent"),
    amount: readNumber(input.amount, "price.amount"),
    currency: readString(input.currency, "price.currency"),
    badge: readOptionalString(input.badge, "price.badge"),
  };
}

function readArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid subscription catalog response: ${field}.`);
  }

  return value;
}

function readString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`Invalid subscription catalog response: ${field}.`);
  }

  return value;
}

function readOptionalString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return readString(value, field);
}

function readNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid subscription catalog response: ${field}.`);
  }

  return value;
}

function readBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`Invalid subscription catalog response: ${field}.`);
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
