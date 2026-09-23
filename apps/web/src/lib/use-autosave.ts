"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n, useT } from "@/components/i18n";
import { localizeServerError } from "./i18n/server-errors";

type SaveState = { kind: "idle" | "saving" | "saved" } | { kind: "error"; reason: string };
/** Merge rapid edits and send one request at a time. Failed writes retain the latest fields for retry. */
export function useAutosave(url: string, method: "PATCH" | "PUT" = "PATCH", onSaved?: () => void) {
  const [state, setStatus] = useState<SaveState>({ kind: "idle" });
  const t = useT("common");
  const { locale } = useI18n();
  const pending = useRef<Record<string, unknown>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef<Promise<void> | null>(null);
  const mounted = useRef(true);
  const callback = useRef(onSaved);
  callback.current = onSaved;
  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (running.current) return running.current;
    const work = async () => {
      while (Object.keys(pending.current).length) {
        const body = pending.current;
        pending.current = {};
        try {
          const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            keepalive: JSON.stringify(body).length < 50000,
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error ?? "Save failed");
          if (mounted.current) {
            setStatus({ kind: Object.keys(pending.current).length ? "saving" : "saved" });
            callback.current?.();
          }
        } catch (e) {
          pending.current = { ...body, ...pending.current };
          if (mounted.current)
            setStatus({ kind: "error", reason: e instanceof Error ? e.message : "" });
          break;
        }
      }
    };
    running.current = work().finally(() => {
      running.current = null;
    });
    return running.current;
  }, [url, method]);
  useEffect(() => {
    mounted.current = true;
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length || running.current) {
        void flush();
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      mounted.current = false;
      window.removeEventListener("beforeunload", beforeUnload);
      void flush();
    };
  }, [flush]);
  const save = useCallback(
    (body: Record<string, unknown>) => {
      pending.current = { ...pending.current, ...body };
      setStatus({ kind: "saving" });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), 500);
    },
    [flush],
  );
  const status =
    state.kind === "saving"
      ? t.saving
      : state.kind === "saved"
        ? t.saved
        : state.kind === "error"
          ? t.notSaved(
              state.reason ? localizeServerError(state.reason, locale) : t.connectionFailed,
            )
          : "";
  return { save, status, flush };
}
