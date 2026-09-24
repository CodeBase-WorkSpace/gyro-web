import {apiGet, apiPost} from "./client";
import {
  subscriptionStateFromEntitlement,
  type EntitlementStatus,
  type SubscriptionState,
  type TrialState,
} from "../subscription/entitlements";

export type EntitlementDto = {
  planKey: string;
  status: EntitlementStatus;
  features: string[];
  currentPeriodEnd: string | null;
  gracePeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  supportReasonCode: string | null;
  source: "FREE" | "SUBSCRIPTION" | "MANUAL_GRANT";
  premiumGatingDisabled?: boolean;
  trial?: TrialState | null;
};

export async function getCurrentEntitlement(accessToken: string): Promise<SubscriptionState> {
  const response = await apiGet<unknown>("/billing/me/entitlement", accessToken);
  return subscriptionStateFromEntitlement(parseEntitlement(response));
}

export async function claimTrial(accessToken: string): Promise<SubscriptionState> {
  const response = await apiPost<unknown>("/billing/me/trial/claim", undefined, {accessToken});
  if (!isRecord(response)) {
    throw new Error("Invalid trial claim response.");
  }
  return subscriptionStateFromEntitlement(parseEntitlement(response.entitlement));
}

export function parseEntitlement(input: unknown): EntitlementDto {
  if (!isRecord(input)) {
    throw new Error("Invalid entitlement response.");
  }

  return {
    planKey: readString(input.planKey, "entitlement.planKey"),
    status: readStatus(input.status),
    features: readArray(input.features, "entitlement.features").map((feature) =>
      readString(feature, "entitlement.features[]"),
    ),
    currentPeriodEnd: readOptionalString(input.currentPeriodEnd, "entitlement.currentPeriodEnd"),
    gracePeriodEnd: readOptionalString(input.gracePeriodEnd, "entitlement.gracePeriodEnd"),
    cancelAtPeriodEnd: readBoolean(input.cancelAtPeriodEnd, "entitlement.cancelAtPeriodEnd"),
    supportReasonCode: readOptionalString(input.supportReasonCode, "entitlement.supportReasonCode"),
    source: readSource(input.source),
    premiumGatingDisabled:
      input.premiumGatingDisabled === undefined
        ? false
        : readBoolean(input.premiumGatingDisabled, "entitlement.premiumGatingDisabled"),
    trial: readTrial(input.trial),
  };
}

function readTrial(value: unknown): TrialState | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (!isRecord(value)) {
    throw new Error("Invalid entitlement response: entitlement.trial.");
  }

  return {
    active: readBoolean(value.active, "entitlement.trial.active"),
    eligible: readBoolean(value.eligible, "entitlement.trial.eligible"),
    expiresAt: readOptionalString(value.expiresAt, "entitlement.trial.expiresAt"),
  };
}

function readStatus(value: unknown): EntitlementStatus {
  const status = readString(value, "entitlement.status");
  if (
    status === "FREE" ||
    status === "ACTIVE" ||
    status === "GRACE_PERIOD" ||
    status === "EXPIRED" ||
    status === "CANCELED" ||
    status === "BILLED_BLOCKED" ||
    status === "ADMIN_OVERRIDE"
  ) {
    return status;
  }

  throw new Error("Invalid entitlement response: entitlement.status.");
}

function readSource(value: unknown): EntitlementDto["source"] {
  const source = readString(value, "entitlement.source");
  if (source === "FREE" || source === "SUBSCRIPTION" || source === "MANUAL_GRANT") {
    return source;
  }

  throw new Error("Invalid entitlement response: entitlement.source.");
}

function readArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid entitlement response: ${field}.`);
  }

  return value;
}

function readString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`Invalid entitlement response: ${field}.`);
  }

  return value;
}

function readOptionalString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return readString(value, field);
}

function readBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`Invalid entitlement response: ${field}.`);
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
