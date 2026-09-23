"use client";

import { LOCALES } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useI18n, useT } from "./i18n";

/** ID | EN toggle. `compact` is the small corner version on the sign-in pages. */
export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const t = useT("common");
  return (
    <div
      role="group"
      aria-label={t.language}
      className={cn("inline-flex rounded-md border p-0.5", compact && "text-[11px]")}
    >
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={locale === option}
          title={t.languages[option]}
          onClick={() => setLocale(option)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            compact && "px-2 py-0.5",
            locale === option
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {compact ? option.toUpperCase() : t.languages[option]}
        </button>
      ))}
    </div>
  );
}
