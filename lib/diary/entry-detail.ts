import type {DiaryEntrySummary} from "@/lib/api/diary";

/** Returns the current source-detail route when a diary entry has a navigable source. */
export function diaryEntryDetailHref(entry: DiaryEntrySummary): string | null {
  if (entry.sourceType === "FOOD" && entry.sourceFoodId?.trim()) {
    return `/foods/${encodeURIComponent(entry.sourceFoodId)}`;
  }

  if (entry.sourceType === "MEAL" && entry.sourceMealId?.trim()) {
    return `/foods/meals/${encodeURIComponent(entry.sourceMealId)}`;
  }

  return null;
}
