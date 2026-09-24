import { TargetEvidencePanel } from "@/components/dashboard/target-evidence-panel";
import { formatPersianNumber } from "@/lib/format";
import {
  parseRecalibrationEvidence,
  type RecalibrationConfidence,
} from "@/lib/recalibration/evidence";

const confidenceLabels: Record<RecalibrationConfidence, string> = {
  LOW: "کم",
  MEDIUM: "متوسط",
  HIGH: "زیاد",
};

export function RecalibrationEvidencePanel({
  basis,
  suggestedCalories,
}: {
  basis: Record<string, unknown>;
  suggestedCalories: number;
}) {
  const evidence = parseRecalibrationEvidence(basis);
  const rows = [
    evidence.averageLoggedCalories === null
      ? null
      : {
          label: "میانگین کالری ثبت‌شده",
          value: calorie(evidence.averageLoggedCalories),
        },
    evidence.observedKgPerWeek === null
      ? null
      : {
          label: "روند وزن بر اساس اندازه‌گیری‌ها",
          value: `${signed(evidence.observedKgPerWeek, 2)} کیلوگرم در هفته`,
        },
    evidence.estimatedTdee === null
      ? null
      : {
          label: "متابولیسم برآوردی",
          value: calorie(evidence.estimatedTdee),
        },
    evidence.intendedDailyEnergyDelta === null
      ? null
      : {
          label: "کسری یا مازاد برنامه",
          value: `${signed(evidence.intendedDailyEnergyDelta, 0)} کالری در روز`,
        },
    {
      label: "هدف پیشنهادی",
      value: calorie(suggestedCalories),
      emphasized: true,
    },
  ].filter((row) => row !== null);

  return (
    <TargetEvidencePanel
      summary="این عدد از کجا می‌آید؟"
      rows={rows}
      footer={evidenceFooter(evidence)}
    />
  );
}

function evidenceFooter(
  evidence: ReturnType<typeof parseRecalibrationEvidence>,
) {
  const parts: string[] = [];
  if (
    evidence.weighInDays !== null &&
    evidence.weightSpanDays !== null
  ) {
    parts.push(
      `وزن‌کشی در ${formatPersianNumber(evidence.weighInDays)} روز، طی ${formatPersianNumber(evidence.weightSpanDays)} روز`,
    );
  }
  if (evidence.loggedDays !== null && evidence.windowDays !== null) {
    parts.push(
      `ثبت غذا در ${formatPersianNumber(evidence.loggedDays)} روز از ${formatPersianNumber(evidence.windowDays)} روز`,
    );
  }
  if (evidence.confidence !== null) {
    parts.push(`میزان اطمینان: ${confidenceLabels[evidence.confidence]}`);
  }
  return parts.length ? parts.join(" · ") : undefined;
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
