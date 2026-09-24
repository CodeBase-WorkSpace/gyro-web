import {z} from "zod/v4";

import {supportedLocales} from "../i18n/config";

export const profileLocaleValues = supportedLocales;
export type ProfileLocale = (typeof profileLocaleValues)[number];

export const profileLocaleOptions: Array<{
  value: ProfileLocale;
  label: string;
  language: string;
  direction: "rtl" | "ltr";
}> = [
  {value: "fa-IR", label: "فارسی (ایران)", language: "فارسی", direction: "rtl"},
  {value: "en-US", label: "English (US)", language: "English", direction: "ltr"},
];

export const profileTimezoneValues = [
  "Asia/Tehran",
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
] as const;

export const profileTimezoneOptions: Array<{
  value: string;
  label: string;
  helper: string;
}> = [
  {value: "Asia/Tehran", label: "تهران", helper: "ایران، UTC+03:30"},
  {value: "UTC", label: "UTC", helper: "زمان هماهنگ جهانی"},
  {value: "Europe/London", label: "لندن", helper: "بریتانیا"},
  {value: "Europe/Berlin", label: "برلین", helper: "اروپای مرکزی"},
  {value: "America/New_York", label: "نیویورک", helper: "شرق آمریکا"},
  {value: "America/Los_Angeles", label: "لس‌آنجلس", helper: "غرب آمریکا"},
];

export const profileSchema = z.object({
  displayName: z.string().trim().max(120, "نام نمایشی باید حداکثر ۱۲۰ نویسه باشد.").optional(),
  timezone: z.string().trim().min(1, "منطقه زمانی را انتخاب کنید.").max(64, "منطقه زمانی باید حداکثر ۶۴ نویسه باشد.").refine(isSupportedTimezone, "منطقه زمانی معتبر نیست."),
  locale: z.enum(profileLocaleValues, "زبان و قالب را انتخاب کنید."),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

function isSupportedTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", {timeZone: value});
    return true;
  } catch {
    return false;
  }
}
