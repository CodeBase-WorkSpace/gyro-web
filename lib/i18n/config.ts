export const defaultLocale = "fa-IR";
export const appShellLocale = "fa-IR";
export const supportedLocales = ["fa-IR", "en-US"] as const;
export const localeCookieName = "NEXT_LOCALE";
export const localeCookieMaxAge = 60 * 60 * 24 * 365;
export const localeRoutingMode = "profile-cookie" as const;

export type SupportedLocale = (typeof supportedLocales)[number];
export type LocaleDirection = "rtl" | "ltr";

export type LocaleDefinition = {
  locale: SupportedLocale;
  language: string;
  dir: LocaleDirection;
  htmlLang: string;
};

export const localeDefinitions: Record<SupportedLocale, LocaleDefinition> = {
  "fa-IR": {
    locale: "fa-IR",
    language: "فارسی",
    dir: "rtl",
    htmlLang: "fa-IR",
  },
  "en-US": {
    locale: "en-US",
    language: "English",
    dir: "ltr",
    htmlLang: "en-US",
  },
};

export function localeDefinitionFor(locale: SupportedLocale) {
  return localeDefinitions[locale];
}

export function normalizeLocale(value: string | null | undefined): SupportedLocale | undefined {
  if (!value) return undefined;

  const normalized = value.trim().replace("_", "-");
  const exactMatch = supportedLocales.find(
    (locale) => locale.toLowerCase() === normalized.toLowerCase()
  );

  if (exactMatch) return exactMatch;

  const language = normalized.split("-")[0]?.toLowerCase();
  if (language === "fa") return "fa-IR";
  if (language === "en") return "en-US";

  return undefined;
}

export function negotiateLocale({
                                  profileLocale,
                                  cookieLocale,
                                  acceptLanguage,
                                }: {
  profileLocale?: string | null;
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
}) {
  return (
    normalizeLocale(profileLocale) ??
    normalizeLocale(cookieLocale) ??
    negotiateAcceptLanguage(acceptLanguage) ??
    defaultLocale
  );
}

function negotiateAcceptLanguage(header: string | null | undefined) {
  if (!header) return undefined;

  return header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const qValue = params
        .map((param) => param.trim())
        .find((param) => param.startsWith("q="))
        ?.slice(2);
      const q = qValue ? Number(qValue) : 1;

      return {
        locale: normalizeLocale(tag),
        q: Number.isFinite(q) ? q : 0,
        index,
      };
    })
    .filter((item): item is { locale: SupportedLocale; q: number; index: number } => Boolean(item.locale))
    .sort((a, b) => b.q - a.q || a.index - b.index)[0]?.locale;
}
