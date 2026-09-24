import { TargetEvidencePanel } from "@/components/dashboard/target-evidence-panel";
import type { GoalResponseDto } from "@/lib/api/goals";
import { formatPersianNumber } from "@/lib/format";

const sexLabels = {
  FEMALE: "زن",
  MALE: "مرد",
} as const;

const movementLabels = {
  SEDENTARY: "کم‌تحرک",
  LIGHT: "فعالیت سبک",
  MODERATE: "فعالیت متوسط",
  ACTIVE: "فعال",
  VERY_ACTIVE: "بسیار فعال",
} as const;

const workoutLabels = {
  ZERO_DAYS: "بدون تمرین هفتگی",
  ONE_TO_TWO_DAYS: "۱ تا ۲ تمرین در هفته",
  THREE_TO_FOUR_DAYS: "۳ تا ۴ تمرین در هفته",
  FIVE_TO_SIX_DAYS: "۵ تا ۶ تمرین در هفته",
  DAILY: "تمرین روزانه",
} as const;

export function GoalTargetExplainer({
  goal,
  measuredTdee,
}: {
  goal: GoalResponseDto;
  measuredTdee: number | null;
}) {
  const plan = goal.activePlan;
  const calculator = plan?.calculator;
  if (!plan || !calculator) return null;

  const profile = calculator.profile;
  const rows = [
    profile
      ? {
          label: "سن هنگام محاسبه",
          value: `${formatPersianNumber(ageAt(profile.birthDate, plan.startDate))} سال`,
        }
      : null,
    profile
      ? { label: "جنسیت در محاسبه", value: sexLabels[profile.sex] }
      : null,
    profile
      ? {
          label: "قد و وزن هنگام محاسبه",
          value: `${formatPersianNumber(profile.heightCm)} سانتی‌متر · ${formatPersianNumber(profile.currentWeightKg)} کیلوگرم`,
        }
      : null,
    profile
      ? {
          label: "سطح فعالیت",
          value: `${movementLabels[profile.dailyMovementLevel]} · ${workoutLabels[profile.workoutFrequency]}`,
        }
      : null,
    {
      label: "سرعت تغییر وزن هدف",
      value: `${signed(calculator.expectedWeeklyWeightChangeKg, 2)} کیلوگرم در هفته`,
    },
    {
      label: "متابولیسم برآوردشده با فرمول",
      value: calorie(calculator.maintenanceCalories),
    },
    measuredTdee === null
      ? null
      : {
          label: "متابولیسم اندازه‌گیری‌شده",
          value: calorie(measuredTdee),
        },
    {
      label: "کسری یا مازاد برنامه",
      value: `${signed(calculator.dailyEnergyDelta, 0)} کالری در روز`,
    },
    {
      label: "هدف کالری فعلی",
      value: calorie(plan.baseTargets.calories),
      emphasized: true,
    },
  ].filter((row) => row !== null);

  return (
    <TargetEvidencePanel
      summary="چرا هدف کالری من این عدد است؟"
      rows={rows}
      footer={
        measuredTdee === null
          ? "این هدف با اطلاعاتی که هنگام ساخت برنامه وارد کردی محاسبه شده است. با ثبت منظم غذا و وزن، جیرو متابولیسمت را بر اساس روند واقعی خودت اندازه‌گیری می‌کند."
          : "فرمول فقط نقطه شروع بود. حالا متابولیسمت بر اساس کالری‌های ثبت‌شده و روند واقعی وزنت اندازه‌گیری شده است. پیشنهادهای بعدی با این عدد محاسبه می‌شوند؛ عدد فرمول و عدد اندازه‌گیری‌شده با هم ترکیب نمی‌شوند."
      }
      defaultOpen
    />
  );
}

function ageAt(birthDate: string, date: string) {
  const birth = new Date(`${birthDate}T12:00:00Z`);
  const at = new Date(`${date}T12:00:00Z`);
  let age = at.getUTCFullYear() - birth.getUTCFullYear();
  const birthdayHasPassed =
    at.getUTCMonth() > birth.getUTCMonth() ||
    (at.getUTCMonth() === birth.getUTCMonth() &&
      at.getUTCDate() >= birth.getUTCDate());
  if (!birthdayHasPassed) age -= 1;
  return Math.max(0, age);
}

function calorie(value: number) {
  return `${formatPersianNumber(Math.round(value))} کالری`;
}

function signed(value: number, maximumFractionDigits: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatPersianNumber(Math.abs(value), {
    maximumFractionDigits,
  })}`;
}
