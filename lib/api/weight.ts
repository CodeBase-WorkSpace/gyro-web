import {apiGet, apiPost} from "./client";
import type {ApiPageResponse} from "./types";

export type WeightUnit = "KG" | "LB";
export type WeightEntrySource = "MANUAL" | "IMPORT";

export type SaveWeightEntryRequestDto = {
  recordedDate: string;
  recordedAt?: string;
  weight: number;
  unit: WeightUnit;
  source?: WeightEntrySource;
  notes?: string;
};

export type SaveWeightEntriesBatchRequestDto = {
  entries: Array<{
    clientEntryId?: string;
    recordedDate?: string;
    recordedAt?: string;
    weight?: number;
    unit?: WeightUnit;
    source?: WeightEntrySource;
    notes?: string;
  }>;
};

export type WeightEntryResponseDto = {
  id: string;
  recordedDate: string;
  recordedAt: string;
  weightKg: number;
  displayWeight: number;
  displayUnit: WeightUnit;
  source: WeightEntrySource;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WeightEntriesBatchResponseDto = {
  accepted: Array<{
    clientEntryId: string | null;
    entry: WeightEntryResponseDto;
  }>;
  diagnostics: Array<{
    index: number;
    clientEntryId: string | null;
    field: string;
    code: string;
    message: string;
  }>;
};

export type WeightEntriesListRequest = {
  from: string;
  to: string;
  page?: number;
  size?: number;
};

export async function getWeightEntries(
  request: WeightEntriesListRequest,
  accessToken: string,
) {
  const searchParams = new URLSearchParams({
    from: request.from,
    to: request.to,
    page: String(request.page ?? 0),
    size: String(request.size ?? 20),
  });

  return apiGet<ApiPageResponse<WeightEntryResponseDto>>(
    `/weight-entries?${searchParams.toString()}`,
    accessToken,
  );
}

export async function saveWeightEntry(
  request: SaveWeightEntryRequestDto,
  accessToken: string,
  idempotencyKey: string,
) {
  return apiPost<WeightEntryResponseDto>("/weight-entries", request, {
    accessToken,
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
  });
}

export async function saveWeightEntriesBatch(
  request: SaveWeightEntriesBatchRequestDto,
  accessToken: string,
  idempotencyKey: string,
) {
  return apiPost<WeightEntriesBatchResponseDto>(
    "/weight-entries/batch",
    request,
    {
      accessToken,
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    },
  );
}
