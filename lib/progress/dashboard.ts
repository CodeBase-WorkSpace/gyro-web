import type {NutritionProgressPoint} from "@/lib/api/progress";

export function isDashboardLoggedDay(day: NutritionProgressPoint) {
  return day.logged;
}
