"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { HoverHint } from "./ui/tooltip";
import { PRIVACY_KEY, LEGACY_LAYOUT_KEY, privacyPreference } from "@/lib/privacy-preference";
import { useT } from "./i18n";

type PrivacyError = "" | "readFailed" | "saveFailed";
const PrivacyContext = createContext({
  enabled: true,
  ready: false,
  error: "" as PrivacyError,
  toggle: () => {},
});
export const usePrivacy = () => useContext(PrivacyContext).enabled;

export function PrivacyProvider({ children }: { children: ReactNode }) {
  // Hide amounts until the saved preference has loaded, avoiding a flash on direct navigation.
  const [enabled, setEnabled] = useState(true),
    [ready, setReady] = useState(false),
    [error, setError] = useState<PrivacyError>("");
  useEffect(() => {
    const read = () => {
      try {
        const current = localStorage.getItem(PRIVACY_KEY);
        const saved = privacyPreference(current, localStorage.getItem(LEGACY_LAYOUT_KEY));
        setEnabled(saved);
        if (current === null) localStorage.setItem(PRIVACY_KEY, String(saved));
        setError("");
      } catch {
        setError("readFailed");
      }
      setReady(true);
    };
    read();
    const sync = (event: StorageEvent) => {
      if (event.key === PRIVACY_KEY || event.key === LEGACY_LAYOUT_KEY || event.key === null)
        read();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    try {
      localStorage.setItem(PRIVACY_KEY, String(next));
      setError("");
    } catch {
      setError("saveFailed");
    }
  };
  return (
    <PrivacyContext.Provider value={{ enabled, ready, error, toggle }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function PrivacyToggle({
  compact = false,
  iconOnly = false,
}: {
  compact?: boolean;
  iconOnly?: boolean;
}) {
  const { enabled, ready, error, toggle } = useContext(PrivacyContext);
  const t = useT("shell").privacy;
  return (
    <div className={compact ? "relative shrink-0" : "space-y-2"}>
      <Button
        className={
          iconOnly
            ? "h-9 w-9 rounded-lg p-0"
            : compact
              ? "h-9 gap-1.5 rounded-xl px-2.5 text-xs"
              : "w-full justify-start gap-2"
        }
        size="sm"
        variant={enabled ? "secondary" : "outline"}
        aria-label={t.label(enabled)}
        aria-pressed={enabled}
        disabled={!ready}
        onClick={toggle}
        title={t.hint}
      >
        {enabled ? <EyeOff /> : <Eye />}
        {!iconOnly && (compact ? t.short : t.long)}
        {!iconOnly && <span className="ml-auto text-xs">{enabled ? t.on : t.off}</span>}
      </Button>
      {error && (
        <p
          role="alert"
          className={
            compact
              ? "absolute right-0 top-full mt-2 w-64 rounded-lg border bg-card p-3 text-xs text-destructive shadow-lg"
              : "text-xs text-destructive"
          }
        >
          {error && t[error]}
        </p>
      )}
    </div>
  );
}

export function MonetaryValue({ children }: { children: ReactNode }) {
  const t = useT("shell").privacy;
  return usePrivacy() ? <span aria-label={t.hidden}>••••</span> : children;
}

export function MonetaryField({
  children,
  sensitive = true,
}: {
  children: ReactNode;
  sensitive?: boolean;
}) {
  const enabled = usePrivacy();
  const t = useT("shell").privacy;
  return enabled && sensitive ? (
    <HoverHint content={t.turnOffToEdit}>
      <div
        className="flex h-9 items-center rounded-md border px-3 text-sm"
        aria-label={t.hidden}
        tabIndex={0}
      >
        ••••
      </div>
    </HoverHint>
  ) : (
    children
  );
}
