"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  dateLocale,
  LOCALE_COOKIE,
  messagesFor,
  type Locale,
  type Messages,
  type Namespace,
} from "@/lib/i18n";

interface I18nState {
  locale: Locale;
  /** Intl locale for dates in the current language. */
  dateLocale: string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nState | null>(null);

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Given the locale the server read from the cookie, so SSR and hydration agree. */
export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initialLocale);
  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
      document.documentElement.lang = next;
      setLocaleState(next);
      // Server-rendered parts (the <html lang>, metadata) follow on refresh.
      router.refresh();
    },
    [router],
  );
  const value = useMemo(
    () => ({ locale, dateLocale: dateLocale(locale), setLocale }),
    [locale, setLocale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = (): I18nState => {
  const state = useContext(I18nContext);
  if (!state) throw new Error("useI18n must be used inside <I18nProvider>");
  return state;
};

/** One namespace of UI text in the current language. */
export const useT = <N extends Namespace>(namespace: N): Messages<N> =>
  messagesFor(namespace, useI18n().locale);
