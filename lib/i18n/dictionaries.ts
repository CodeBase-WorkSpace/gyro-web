import type {SupportedLocale} from "@/lib/i18n/config";

export type AppDictionary = {
  metadata: {
    title: string;
    description: string;
    applicationName: string;
    appleTitle: string;
  };
  pwa: {
    name: string;
    shortName: string;
    description: string;
    installPrompt: string;
  };
  common: {
    offlineNotice: string;
    loading: string;
    emptyState: string;
    validationError: string;
  };
};

const dictionaries: Record<SupportedLocale, AppDictionary> = {
  "fa-IR": {
    metadata: {
      title: "جیرو | دفتر تغذیه",
      description: "ثبت سریع غذا و پیگیری کالری روزانه",
      applicationName: "جیرو",
      appleTitle: "جیرو",
    },
    pwa: {
      name: "جیرو | دفتر تغذیه",
      shortName: "جیرو",
      description: "ثبت سریع غذا و پیگیری کالری روزانه با تجربه PWA فارسی.",
      installPrompt: "نصب جیرو",
    },
    common: {
      offlineNotice: "آفلاین هستید؛ داده‌های ذخیره‌نشده پس از اتصال دوباره ارسال می‌شوند.",
      loading: "در حال بارگذاری",
      emptyState: "هنوز داده‌ای ثبت نشده است.",
      validationError: "اطلاعات واردشده را بررسی کنید.",
    },
  },
  "en-US": {
    metadata: {
      title: "Gyro | Nutrition log",
      description: "Fast food logging and daily calorie tracking",
      applicationName: "Gyro",
      appleTitle: "Gyro",
    },
    pwa: {
      name: "Gyro | Nutrition log",
      shortName: "Gyro",
      description: "Fast food logging and calorie tracking in an installable PWA.",
      installPrompt: "Install Gyro",
    },
    common: {
      offlineNotice: "You are offline. Unsaved data will sync after reconnecting.",
      loading: "Loading",
      emptyState: "No data has been added yet.",
      validationError: "Check the entered information.",
    },
  },
};

export async function getDictionary(locale: SupportedLocale) {
  return dictionaries[locale];
}
