import {apiGet, apiPost} from "./client";

export type RecalibrationTargetsDto = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type RecalibrationSuggestionDto = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DISMISSED" | "EXPIRED" | "SUPERSEDED";
  suggested: RecalibrationTargetsDto;
  previous: RecalibrationTargetsDto;
  basis: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
};

export type RecalibrationDecisionDto = {
  suggestion: RecalibrationSuggestionDto;
  applied: boolean;
};

export type RecalibrationDismissReason =
  | "TOO_AGGRESSIVE"
  | "DOESNT_FEEL_RIGHT"
  | "DATA_IS_WRONG"
  | "NOT_NOW";

export async function getPendingRecalibration(accessToken: string) {
  const response = await apiGet<{suggestion: RecalibrationSuggestionDto | null}>(
    "/goals/recalibration/pending",
    accessToken,
  );
  return response.suggestion;
}

export function acceptRecalibration(accessToken: string, suggestionId: string) {
  return apiPost<RecalibrationDecisionDto>(
    `/goals/recalibration/${suggestionId}/accept`,
    undefined,
    {accessToken},
  );
}

export function dismissRecalibration(
  accessToken: string,
  suggestionId: string,
  reason?: RecalibrationDismissReason,
) {
  return apiPost<RecalibrationDecisionDto>(
    `/goals/recalibration/${suggestionId}/dismiss`,
    reason ? { reason } : undefined,
    {accessToken},
  );
}
