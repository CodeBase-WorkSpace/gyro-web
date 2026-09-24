import {cookies, headers} from "next/headers";

import {localeCookieMaxAge, localeCookieName, negotiateLocale, type SupportedLocale,} from "@/lib/i18n/config";

export async function resolveRequestLocale(profileLocale?: string | null) {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);

  return negotiateLocale({
    profileLocale,
    cookieLocale: cookieStore.get(localeCookieName)?.value,
    acceptLanguage: headerStore.get("accept-language"),
  });
}

export async function setLocaleCookie(locale: SupportedLocale) {
  const cookieStore = await cookies();
  cookieStore.set(localeCookieName, locale, localeCookieOptions());
}

export function localeCookieOptions() {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: localeCookieMaxAge,
  };
}
