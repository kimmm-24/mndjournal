"use client";
import { OptionSelect } from "@/components/ui/option-select";
import { Checkbox } from "@/components/ui/checkbox";

import type { AnalysisFilters, FilterKey } from "@luxalgo/journal-core";
import { useApi } from "@/lib/use-api";
import { MonetaryField } from "./privacy";
import { ChevronDown, CircleHelp } from "lucide-react";
import { HoverHint } from "./ui/tooltip";
import { DatePicker } from "./ui/date-picker";
import { useT } from "./i18n";

export const fieldClass = "h-9 w-full min-w-0 rounded-md border bg-background px-2 text-sm";
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  /** Optional explainer shown behind a help icon next to the label. */
  hint?: string;
  children: React.ReactNode;
}) {
  const t = useT("filters");
  return (
    <label className="journal-filter-field grid min-w-0 gap-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        {label}
        {hint && (
          <HoverHint heading={label} content={hint}>
            <span
              tabIndex={0}
              aria-label={t.about(label)}
              className="inline-flex cursor-help rounded-sm text-muted-foreground/70 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CircleHelp aria-hidden="true" className="h-3 w-3" />
            </span>
          </HoverHint>
        )}
      </span>
      {children}
    </label>
  );
}
export function FilterFields({
  value,
  onChange,
}: {
  value: AnalysisFilters;
  onChange: (v: AnalysisFilters) => void;
}) {
  const t = useT("filters");
  const { data: accounts } = useApi<{
    accounts: { id: string; name: string; archivedAt: string | null }[];
  }>("/api/accounts");
  const { data: playbooks } = useApi<{ playbooks: { id: string; name: string }[] }>(
    "/api/playbooks",
  );
  const set = (key: FilterKey, v: string) => onChange({ ...value, [key]: v });
  const input = (key: FilterKey, label: string, type = "text", hint?: string) => (
    <Field key={key} label={label} hint={hint}>
      <MonetaryField sensitive={/^(entry|exit|pnl)(Min|Max)$/.test(key)}>
        {type === "date" ? (
          <DatePicker
            value={value[key] ?? ""}
            onValueChange={(next) => set(key, next)}
            label={label}
          />
        ) : (
          <input
            className={fieldClass}
            aria-label={label}
            type={type}
            step={type === "number" ? "any" : undefined}
            value={value[key] ?? ""}
            onChange={(e) => set(key, e.target.value)}
          />
        )}
      </MonetaryField>
    </Field>
  );
  const select = (key: FilterKey, label: string, choices: [string, string][], hint?: string) => (
    <Field key={key} label={label} hint={hint}>
      <span className="journal-filter-select relative block min-w-0">
        <OptionSelect
          className={fieldClass}
          value={value[key] ?? ""}
          onValueChange={(next) => set(key, next)}
        >
          <option value="">{t.all}</option>
          {choices.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </OptionSelect>
      </span>
    </Field>
  );
  const { fields: f, hints: h, choices: c } = t;
  return (
    <div className="journal-filter-fields space-y-5">
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3">
        {input("from", f.from, "date", h.from)}
        {input("to", f.to, "date", h.to)}
        {select(
          "playbookId",
          f.strategy,
          (playbooks?.playbooks ?? []).map((p) => [p.id, p.name]),
          h.strategy,
        )}
        {input("symbol", f.symbols, "text", h.symbols)}
        {input("excludeSymbol", f.excludeSymbols, "text", h.excludeSymbols)}
        {input("tag", f.tags, "text", h.tags)}
        {input("mistake", f.mistakes, "text", h.mistakes)}
        {select("direction", f.direction, [
          ["long", c.long],
          ["short", c.short],
        ])}
        {select("status", f.outcome, [
          ["closed", c.allClosed],
          ["open", c.open],
          ["win", c.win],
          ["loss", c.loss],
          ["breakeven", c.breakeven],
        ])}
        {select(
          "reviewed",
          f.reviewStatus,
          [
            ["yes", c.reviewed],
            ["no", c.unreviewed],
          ],
          h.reviewStatus,
        )}
        {select(
          "assetClass",
          f.assetClass,
          ["equity", "futures", "forex", "option", "crypto", "cfd", "other"].map((v) => [v, v]),
        )}
      </div>
      <fieldset className="journal-filter-accounts rounded-lg border p-3">
        <legend className="px-1 text-xs text-muted-foreground">{t.accountsLegend}</legend>
        <div className="flex flex-wrap gap-3">
          {accounts?.accounts
            .filter((a) => !a.archivedAt)
            .map((a) => (
              <label key={a.id} className="journal-filter-choice flex items-center gap-2 text-xs">
                <Checkbox
                  checked={(value.accounts ?? "").split(",").includes(a.id)}
                  onCheckedChange={(checked) => {
                    const ids = new Set((value.accounts ?? "").split(",").filter(Boolean));
                    if (checked === true) ids.add(a.id);
                    else ids.delete(a.id);
                    set("accounts", [...ids].join(","));
                  }}
                />
                {a.name}
              </label>
            ))}
        </div>
      </fieldset>
      <details className="journal-filter-advanced">
        <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm">
          <span>{t.advanced}</span>
          <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
        </summary>
        <div className="journal-filter-advanced-grid mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-4">
          {(
            [
              ["quantity", f.quantity, undefined],
              ["entry", f.entry, undefined],
              ["exit", f.exit, undefined],
              ["duration", f.duration, h.duration],
              ["r", f.r, h.r],
              ["plannedR", f.plannedR, h.plannedR],
              ["pnl", f.pnl, undefined],
              ["rating", f.rating, undefined],
            ] as const
          ).flatMap(([k, l, hint]) => [
            input(`${k}Min` as FilterKey, `${l} · ${t.min}`, "number", hint),
            input(`${k}Max` as FilterKey, `${l} · ${t.max}`, "number", hint),
          ])}
          {input("entryAfter", f.entryAfter, "time")}
          {input("entryBefore", f.entryBefore, "time")}
          {input("exitAfter", f.exitAfter, "time")}
          {input("exitBefore", f.exitBefore, "time")}
        </div>
        <div className="journal-filter-weekdays mt-3 flex flex-wrap gap-2">
          {t.weekdays.map((day, i) => (
            <label key={i} className="journal-filter-choice flex items-center gap-2 text-xs">
              <Checkbox
                checked={(value.weekdays ?? "").split(",").includes(String(i))}
                onCheckedChange={(checked) => {
                  const days = new Set((value.weekdays ?? "").split(",").filter(Boolean));
                  if (checked === true) days.add(String(i));
                  else days.delete(String(i));
                  set("weekdays", [...days].join(","));
                }}
              />
              {day}
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
