import type {
  NutritionCoachInsight,
  NutritionCoachState,
} from "@/lib/api/nutrition-coach";
import { formatPersianNumber } from "../format";

export type NutritionCoachTone = "primary" | "muted";
export type NutritionCoachAction = "recalibration" | "billing" | "weight" | "food";

export type NutritionCoachPresentation = {
  tone: NutritionCoachTone;
  title: string;
  description: string;
  actions: NutritionCoachAction[];
  showCollectingProgress: boolean;
  showWaitingTime: boolean;
  insights: NutritionCoachInsight[];
  /**
   * The state is asking for something, rather than reporting. Drives ordering on
   * small screens, where only one card is visible at a time and bookkeeping states
   * should not sit in front of a decision the user needs to make.
   *
   * Kept separate from `tone` on purpose: tone is styling, this is layout, and the
   * two coinciding today is not a reason to let one silently define the other.
   */
  priority: boolean;
};

/** Keeps state-specific copy and actions testable without rendering React. */
export function getNutritionCoachPresentation(
  coach: NutritionCoachState,
): NutritionCoachPresentation | null {
  if (!coach.mode || !coach.state) return null;

  const insights = recognizedInsights(coach.insights);
  const isInsightsOnly = coach.mode === "INSIGHTS_ONLY";

  switch (coach.state) {
    case "RECOMMENDATION":
      if (isInsightsOnly) {
        return manualInsightsPresentation(insights);
      }
      if (!coach.recommendation) return null;
      return {
        tone: "primary",
        title: "پیشنهاد به‌روزرسانی برنامه",
        description: "بر اساس ثبت‌های اخیرت، یک پیشنهاد برای برنامه روزانه آماده شده است.",
        actions: ["recalibration"],
        showCollectingProgress: false,
        showWaitingTime: false,
        insights,
        priority: true,
      };
    case "RECOMMENDATION_LOCKED":
      if (isInsightsOnly) return manualInsightsPresentation(insights);
      return {
        tone: "primary",
        title: "تحلیل هدف شما آماده است",
        description: "برای دیدن جزئیات تحلیل و طرح مناسب، اشتراک خود را بررسی کن.",
        actions: ["billing"],
        showCollectingProgress: false,
        showWaitingTime: false,
        insights,
        priority: true,
      };
    case "RECOMMENDATION_PREPARING":
      if (isInsightsOnly) return manualInsightsPresentation(insights);
      return {
        tone: "primary",
        title: "تحلیل جدید برنامه‌ات در حال آماده‌سازی است",
        description:
          "روند اخیرت نشان می‌دهد برنامه‌ات به تنظیم نیاز دارد. پیشنهاد دقیق حداکثر تا فردا آماده می‌شود.",
        actions: [],
        showCollectingProgress: false,
        showWaitingTime: false,
        insights,
        priority: true,
      };
    case "WAITING":
      if (!coach.waiting) return null;
      return {
        tone: "muted",
        title: "زمان بررسی بعدی مشخص است",
        description: "تا بررسی بعدی، ثبت غذا و وزن را ادامه بده تا روندت به‌روز بماند.",
        actions: [],
        showCollectingProgress: false,
        showWaitingTime: true,
        insights,
        priority: false,
      };
    case "LEARNING":
      return {
        tone: "muted",
        title: "در حال شناختن روندت هستیم",
        description: "در ۱۴ روز اول، ثبت غذا و وزن را ادامه بده تا تصویر دقیق‌تری از روندت بسازیم.",
        actions: [],
        showCollectingProgress: false,
        showWaitingTime: false,
        insights,
        priority: false,
      };
    case "COLLECTING_DATA": {
      if (!coach.collecting) return null;
      const collectingCopy = readinessCopy(coach.collecting);
      return {
        tone: "muted",
        title: collectingCopy.title,
        description: collectingCopy.description,
        actions: collectingActions(coach.collecting),
        showCollectingProgress: true,
        showWaitingTime: false,
        insights,
        priority: false,
      };
    }
    case "NEEDS_ATTENTION":
      return {
        tone: "primary",
        title: "از یک ثبت کوچک شروع کن",
        description: "اگر امروز هنوز غذایی ثبت نکرده‌ای، یک وعده ساده هم برای ادامه روند کافی است.",
        actions: ["food"],
        showCollectingProgress: false,
        showWaitingTime: false,
        insights,
        priority: true,
      };
    case "ON_TRACK":
      return {
        tone: "muted",
        title: isInsightsOnly ? "روند ثبت‌هایت را ببین" : "روندت با هدفت هماهنگ است",
        description: isInsightsOnly
          ? "این گزارش، الگوهای ثبت روزانه‌ات را نشان می‌دهد."
          : "بررسی کردیم؛ هدف فعلی به تغییر نیاز ندارد.",
        actions: [],
        showCollectingProgress: false,
        showWaitingTime: false,
        insights,
        priority: false,
      };
    case "NO_CHANGE_RECOMMENDED":
      return {
        tone: "muted",
        title: "فعلاً تغییری پیشنهاد نمی‌کنیم",
        description:
          "با داده‌های فعلی، هنوز از تغییر هدف مطمئن نیستیم. با ثبت‌های بعدی دوباره بررسی می‌کنیم.",
        actions: [],
        showCollectingProgress: false,
        showWaitingTime: false,
        insights,
        priority: false,
      };
    case "OBSERVED_PROGRESS":
      if (!coach.observedProgress) return null;
      return {
        tone: "muted",
        title:
          coach.analysisScope === "TRIAL_HISTORY"
            ? "خلاصه روند دوره آزمایشی"
            : "روند ثبت‌های اخیرت",
        description:
          coach.analysisScope === "TRIAL_HISTORY"
            ? "این گزارش فقط از روزهایی ساخته شده که برنامه پیشرفته فعال بود."
            : "این گزارش از غذا و وزن ثبت‌شده ساخته شده و درباره موفقیت یا شکست هدفت قضاوت نمی‌کند.",
        actions: [],
        showCollectingProgress: false,
        showWaitingTime: false,
        insights,
        priority: false,
      };
    case "INSIGHTS":
      return manualInsightsPresentation(insights);
  }
}

export function recognizedInsights(insights: NutritionCoachInsight[]) {
  return insights.slice(0, 2);
}

function manualInsightsPresentation(
  insights: NutritionCoachInsight[],
): NutritionCoachPresentation {
  return {
    tone: "muted",
    title: "نگاهی به عادت‌های ثبتت",
    description: "این گزارش فقط برای آگاهی بهتر از روند ثبت‌هایت است.",
    actions: [],
    showCollectingProgress: false,
    showWaitingTime: false,
    insights,
    priority: false,
  };
}

function collectingActions(
  collecting: NonNullable<NutritionCoachState["collecting"]>,
): NutritionCoachAction[] {
  if (collecting.nextUsefulAction === "LOG_FOOD") return ["food"];
  if (collecting.nextUsefulAction === "LOG_WEIGHT_TODAY") return ["weight"];
  if (
    collecting.nextUsefulAction === "WAIT_FOR_ANOTHER_WEIGHT_DAY" ||
    collecting.nextUsefulAction === "EXTEND_WEIGHT_SPAN"
  ) {
    return [];
  }

  const actions: NutritionCoachAction[] = [];
  if (
    collecting.weighIns < collecting.weighInsRequired ||
    collecting.spanDays < collecting.spanDaysRequired
  ) {
    actions.push("weight");
  }
  if (collecting.coveragePercent < collecting.coverageRequired) {
    actions.push("food");
  }
  return actions;
}

function readinessCopy(
  collecting: NonNullable<NutritionCoachState["collecting"]>,
) {
  const foodDays = formatPersianNumber(collecting.foodEvidenceDays ?? 0);
  const foodRequired = formatPersianNumber(
    collecting.foodEvidenceDaysRequired ?? 0,
  );
  const weighInDays = formatPersianNumber(collecting.weighInDays ?? 0);
  const weighInDaysRequired = formatPersianNumber(
    collecting.weighInDaysRequired ?? 0,
  );
  const weightSpanDays = formatPersianNumber(collecting.weightSpanDays ?? 0);
  const weightSpanDaysRequired = formatPersianNumber(
    collecting.weightSpanDaysRequired ?? 0,
  );
  const weightNextStep = weightReadinessNextStep(
    collecting.nextUsefulAction,
    weightSpanDaysRequired,
  );

  switch (collecting.readinessReason) {
    case "INSUFFICIENT_FOOD_EVIDENCE":
      return {
        title: "برای بررسی هدفت، ثبت غذای بیشتری لازم است",
        description: `تا اینجا ${foodDays} روز ثبت غذا داریم؛ برای بررسی هدفت به ${foodRequired} روز نیاز داریم. ثبت غذای امروز بهترین قدم بعدی است.`,
      };
    case "INSUFFICIENT_WEIGH_IN_DAYS":
      return {
        title: "برای بررسی روندت، وزن روزهای بیشتری لازم است",
        description: `تا اینجا وزن ${weighInDays} روز را داریم؛ برای بررسی روند به ${weighInDaysRequired} روز نیاز داریم. ${weightNextStep}`,
      };
    case "INSUFFICIENT_WEIGHT_SPAN":
      return {
        title: "وزن‌کشی‌ها هنوز بازه کافی را پوشش نمی‌دهند",
        description: `ثبت‌های وزنت ${weightSpanDays} روز را پوشش می‌دهد؛ برای بررسی روند به بازه ${weightSpanDaysRequired} روزه نیاز داریم. ${weightNextStep}`,
      };
    case "INSUFFICIENT_FOOD_AND_WEIGHT_EVIDENCE":
      return {
        title: "برای بررسی هدفت، ثبت غذا و وزن بیشتری لازم است",
        description:
          collecting.nextUsefulAction === "LOG_FOOD"
            ? `فعلاً ${foodDays} روز غذا و ${weighInDays} روز وزن داریم. ثبت غذای امروز بهترین قدم بعدی است.`
            : `فعلاً ${foodDays} روز غذا و ${weighInDays} روز وزن داریم. ${weightNextStep}`,
      };
    default:
      return {
        title: "برای تحلیل دقیق‌تر، چند ثبت دیگر لازم است",
        description: "هر ثبت کوچک به کامل‌تر شدن تصویر روندت کمک می‌کند.",
      };
  }
}

function weightReadinessNextStep(
  action: NonNullable<NutritionCoachState["collecting"]>["nextUsefulAction"],
  weightSpanDaysRequired: string,
) {
  switch (action) {
    case "LOG_WEIGHT_TODAY":
      return "یک وزن‌کشی امروز کمک می‌کند.";
    case "WAIT_FOR_ANOTHER_WEIGHT_DAY":
      return "وزن امروزت ثبت شده؛ در یکی از روزهای آینده دوباره وزنت را ثبت کن.";
    case "EXTEND_WEIGHT_SPAN":
      return `وزن امروزت ثبت شده؛ در روزهای آینده هم ادامه بده تا ثبت‌ها بازه ${weightSpanDaysRequired} روزه را پوشش دهند.`;
    default:
      return "ثبت وزن در یک روز دیگر، تصویر روندت را کامل‌تر می‌کند.";
  }
}

export const coachTips = [
  "یک وعده ساده هم ارزش ثبت کردن دارد.",
  "ثبت نزدیک به زمان غذا، یادآوری جزئیات را آسان‌تر می‌کند.",
  "برای دیدن روند واقعی، وزن را در شرایط مشابه ثبت کن.",
  "پروتئین را بین وعده‌ها تقسیم کن تا پیگیری‌اش ساده‌تر شود.",
  "اگر روز شلوغی داشتی، از ثبت یک مورد شروع کن.",
  "مقدار غذا را همان‌طور که خورده‌ای ثبت کن.",
  "نوشیدنی‌ها هم می‌توانند روی کالری روز اثر بگذارند.",
  "ثبت میان‌وعده‌ها تصویر روزت را کامل‌تر می‌کند.",
  "یک ثبت تقریبی، از فراموش کردن کل وعده بهتر است.",
  "برای مقایسه وزن، ساعت ثبت را ثابت نگه دار.",
  "چند روز ثبت پیوسته، از یک روز بی‌نقص مفیدتر است.",
  "اگر مقدار دقیق را نمی‌دانی، نزدیک‌ترین اندازه را انتخاب کن.",
  "صبحانه را ثبت کن تا شروع روزت از قلم نیفتد.",
  "بعد از شام، یک نگاه کوتاه به جمع روز بینداز.",
  "غذاهای همیشگی‌ات را ذخیره کن تا ثبت سریع‌تر شود.",
  "پروتئین هر وعده را جداگانه ببین، نه فقط جمع روز.",
  "هدف کالری یک راهنماست؛ روند چندروزه مهم‌تر است.",
  "تغییرات کوچک روزانه در گزارش هفتگی دیده می‌شوند.",
  "وزن روزانه نوسان دارد؛ روند را در چند روز ببین.",
  "نمک و کربوهیدرات می‌توانند وزن آب را تغییر دهند.",
  "روزهای شلوغ را با ثبت غذاهای اصلی پوشش بده.",
  "مقدار روغن و سس را هم در ثبت وعده حساب کن.",
  "ثبت غذا پیش از فراموشی، دقیق‌تر و سریع‌تر است.",
  "اگر وعده‌ای تکراری است، از کپی روزهای قبل کمک بگیر.",
  "برای هدف پروتئین، سهم هر وعده را کمی بیشتر کن.",
  "میانگین هفتگی، تصویر آرام‌تری از پیشرفت می‌دهد.",
  "یک روز متفاوت، کل روندت را تعریف نمی‌کند.",
  "پس از تغییر برنامه، چند روز برای دیدن روند زمان بده.",
  "غذاهای خانگی را با مواد اصلی‌شان ثبت کن.",
  "اندازه ظرف ثابت، تخمین مقدار را آسان‌تر می‌کند.",
  "ثبت وزن در شرایط مشابه، مقایسه را قابل‌اعتمادتر می‌کند.",
  "اگر چیزی جا ماند، همان روز به ثبتت اضافه کن.",
  "جمع کالری را کنار کیفیت وعده‌ها ببین.",
  "برای روزهای بیرون از خانه، ثبت تقریبی هم مفید است.",
  "وعده‌های پرپروتئین را در غذاهای اخیرت پیدا کن.",
  "گزارش امروز را با روزهای مشابه مقایسه کن.",
  "به جای جبران سخت، روز بعد طبق برنامه ادامه بده.",
  "ثبت منظم کمک می‌کند پیشنهادها به داده واقعی تکیه کنند.",
  "تغییر هدف را با یک روز متفاوت قضاوت نکن.",
  "اگر گرسنگی تغییر کرد، الگوی وعده‌ها را هم بررسی کن.",
];

export function coachTipForDay(asOf: string, timeZone: string) {
  const date = new Date(asOf);
  if (Number.isNaN(date.getTime())) return coachTips[0];
  const parts = new Intl.DateTimeFormat("en-US", {
    calendar: "gregory",
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value ?? 1);
  const year = part("year");
  const month = part("month");
  const day = part("day");
  const dayOfYear = Math.floor(
    (Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / 86_400_000,
  );
  return coachTips[dayOfYear % coachTips.length];
}

export function formatCoachDateTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}
