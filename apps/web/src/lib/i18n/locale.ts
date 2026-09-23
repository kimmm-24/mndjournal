/**
 * App language. Indonesian is the default (the product's market); English is
 * the alternative. The choice lives in a cookie so the server renders the
 * right language on the first request — no flash of the other one.
 */
export const LOCALES = ["id", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "id";
export const LOCALE_COOKIE = "mnd-locale";

export const isLocale = (value: unknown): value is Locale => value === "id" || value === "en";

/**
 * Intl locale for *dates* (month and weekday names). Numbers and money keep
 * the app's existing en-US formatting in both languages: forex prices like
 * 1.10500 are written with a decimal point everywhere, and switching the
 * separator would make prices ambiguous.
 */
export const dateLocale = (locale: Locale): string => (locale === "id" ? "id-ID" : "en-US");

/** Reads the locale from a Cookie header value (server) or document.cookie (browser). */
export const localeFromCookie = (cookie: string | null | undefined): Locale => {
  const value = cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LOCALE_COOKIE}=`))
    ?.slice(LOCALE_COOKIE.length + 1);
  return isLocale(value) ? value : DEFAULT_LOCALE;
};
