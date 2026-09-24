import {apiGet} from "./client";

export type ActivityHeatmapBucketThresholdResponseDto = {
  bucket: number;
  minEntryCount: number;
  maxEntryCount: number | null;
};

export type ActivityHeatmapDayResponseDto = {
  date: string;
  entryCount: number;
  logged: boolean;
  intensity: number;
  score: number | null;
  scoreMode: "GOAL_ADHERENCE" | "CONSISTENCY" | null;
  scoreBand: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | null;
  finalizedAt: string | null;
};

export type ActivityHeatmapResponseDto = {
  from: string;
  to: string;
  timezone: string;
  locale: string;
  totalLoggedDays: number;
  maxEntryCount: number;
  bucketThresholds: ActivityHeatmapBucketThresholdResponseDto[];
  days: ActivityHeatmapDayResponseDto[];
};

export async function getActivityHeatmap(
  request: { from: string; to: string },
  accessToken: string,
) {
  const searchParams = new URLSearchParams({
    from: request.from,
    to: request.to,
  });

  return apiGet<ActivityHeatmapResponseDto>(
    `/users/me/activity-heatmap?${searchParams.toString()}`,
    accessToken,
  );
}
