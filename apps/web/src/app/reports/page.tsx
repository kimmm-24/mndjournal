"use client";
import { OptionSelect } from "@/components/ui/option-select";

import { HoverHint } from "@/components/ui/tooltip";
import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import {
  DIMENSIONS,
  type Dimension,
  type AnalysisFilters,
  type GroupSummary,
} from "@luxalgo/journal-core";
import { FilterBar, useFilters } from "@/components/filter-bar";
import { FilterFields, Field, fieldClass } from "@/components/filter-fields";
import { ReviewExport } from "@/components/review-export";
import { AskJournal } from "@/components/ask-journal";
import { ReportOverview } from "@/components/report-overview";
import { MonetaryValue, usePrivacy } from "@/components/privacy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApi } from "@/lib/use-api";
import { describeFilters } from "@/lib/filter-description";
import { fmtDuration } from "@/lib/utils";
import { useT } from "@/components/i18n";
function LoadingNote({ which }: { which: "loadingExplorer" | "loadingTrends" }) {
  const t = useT("reports");
  return (
    <p role="status" className="py-6 text-sm text-muted-foreground">
      {t[which]}
    </p>
  );
}
const TradeExplorer = dynamic(
  () => import("@/components/trade-explorer").then((module) => module.TradeExplorer),
  { loading: () => <LoadingNote which="loadingExplorer" /> },
);
const PerformanceTrendsReport = dynamic(
  () => import("@/components/performance-trends").then((module) => module.PerformanceTrendsReport),
  { loading: () => <LoadingNote which="loadingTrends" /> },
);
interface Group extends GroupSummary {
  row: string;
  column: string;
}
interface Analysis {
  accounts: { id: string; name: string }[];
  summary: GroupSummary;
  groups: Group[];
  playbooks: { id: string; name: string }[];
  currencies: string[];
  timeZone: string;
}
const number = (n: number | null) =>
  n === null ? "-" : n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const percent = (n: number | null) => (n === null ? "-" : `${(n * 100).toFixed(1)}%`);
const money = (n: number, currency: string) => `${number(n)} ${currency}`;
function Summary({ data }: { data: Analysis }) {
  const t = useT("reports").summary;
  const s = data.summary;
  return (
    <div className="report-summary">
      <div className="report-summary-grid grid grid-cols-2 gap-4">
        {(
          [
            [t.closedTrades, String(s.trades), false],
            [t.netPnl, money(s.netPnl, data.currencies[0] ?? "USD"), true],
            [t.winRate, percent(s.winRate), false],
            [t.profitFactor, s.noLosses ? "∞" : number(s.profitFactor), false],
            [t.volume, number(s.volume), false],
            [t.holding, fmtDuration(s.avgDurationMs), false],
            [t.plannedR, number(s.avgPlannedR), false],
            [t.realizedR, number(s.avgRealizedR), false],
          ] as const
        ).map(([label, value, monetary]) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 break-words text-base font-semibold tabular-nums sm:text-lg">
              {monetary ? <MonetaryValue>{value}</MonetaryValue> : value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
function DimensionSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Dimension;
  onChange: (d: Dimension) => void;
}) {
  const t = useT("reports");
  return (
    <Field label={label}>
      <OptionSelect
        className={fieldClass}
        value={value}
        onValueChange={(next) => onChange(next as Dimension)}
      >
        {(Object.keys(DIMENSIONS) as Dimension[]).map((key) => (
          <option key={key} value={key}>
            {t.dimensions[key]}
          </option>
        ))}
      </OptionSelect>
    </Field>
  );
}
const labels = (data: Analysis, key: string, buckets: Record<string, string> = {}) =>
  data.playbooks.find((p) => p.id === key)?.name ?? buckets[key] ?? key;
function GroupLabel({ dimension, children }: { dimension: Dimension; children: string }) {
  return dimension === "entryPrice" || dimension === "exitPrice" ? (
    <MonetaryValue>{children}</MonetaryValue>
  ) : (
    children
  );
}
function Breakdown({
  data,
  cross,
  primary,
  secondary,
}: {
  data: Analysis;
  cross: boolean;
  primary: Dimension;
  secondary: Dimension;
}) {
  const t = useT("reports");
  const bucket = (k: string) => t.buckets[k] ?? k;
  const rowLabel = (k: string) => (primary === "playbook" ? labels(data, k, t.buckets) : bucket(k)),
    colLabel = (k: string) => (secondary === "playbook" ? labels(data, k, t.buckets) : bucket(k));
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const rows = [...new Set(data.groups.map((g) => g.row))],
    columns = [...new Set(data.groups.map((g) => g.column))].sort((a, b) =>
      secondary === "weekday"
        ? weekdays.indexOf(a) - weekdays.indexOf(b)
        : a.localeCompare(b, undefined, { numeric: true }),
    );
  if (primary === "weekday") rows.sort((a, b) => weekdays.indexOf(a) - weekdays.indexOf(b));
  const max = data.groups.reduce((max, g) => Math.max(max, Math.abs(g.netPnl)), 1);
  const cells = new Map(data.groups.map((g) => [JSON.stringify([g.row, g.column]), g]));
  return (
    <div className="space-y-4">
      {cross && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="p-3 text-left">
                  {t.dimensions[primary]} / {t.dimensions[secondary]}
                </th>
                {columns.map((c) => (
                  <th key={c} className="min-w-24 p-2">
                    <GroupLabel dimension={secondary}>{colLabel(c)}</GroupLabel>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r}>
                  <th className="p-3 text-left font-medium">
                    <GroupLabel dimension={primary}>{rowLabel(r)}</GroupLabel>
                  </th>
                  {columns.map((c) => {
                    const g = cells.get(JSON.stringify([r, c]));
                    return (
                      <HoverHint
                        key={c}
                        content={g ? t.tradesWin(g.trades, percent(g.winRate)) : t.noTrades}
                      >
                        <td
                          key={c}
                          className="border border-background p-2 text-center tabular-nums"
                          style={{
                            background: g
                              ? `color-mix(in srgb, ${g.netPnl >= 0 ? "var(--profit-fill)" : "var(--loss)"} ${8 + (Math.abs(g.netPnl) / max) * 35}%, transparent)`
                              : undefined,
                          }}
                          tabIndex={0}
                        >
                          {g ? <MonetaryValue>{number(g.netPnl)}</MonetaryValue> : "-"}
                        </td>
                      </HoverHint>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted-foreground">
            {t.cellNote(data.currencies[0] ?? null)}
          </p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              {[
                t.dimensions[primary],
                ...(cross ? [t.dimensions[secondary]] : []),
                t.columns.trades,
                t.columns.win,
                t.columns.netPnl,
                t.columns.volume,
                t.columns.plannedR,
                t.columns.realizedR,
                t.columns.duration,
              ].map((h) => (
                <th key={h} className="whitespace-nowrap border-b px-3 py-3 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.groups.map((g) => (
              <tr
                key={JSON.stringify([g.row, g.column])}
                className="border-b border-border/50 hover:bg-accent/30"
              >
                <td className="px-3 py-3 font-medium">
                  <GroupLabel dimension={primary}>{rowLabel(g.row)}</GroupLabel>
                </td>
                {cross && (
                  <td className="px-3 py-3">
                    <GroupLabel dimension={secondary}>{colLabel(g.column)}</GroupLabel>
                  </td>
                )}
                <td className="px-3">{g.trades}</td>
                <td className="px-3">{percent(g.winRate)}</td>
                <td
                  className={`whitespace-nowrap px-3 tabular-nums ${g.netPnl >= 0 ? "text-profit" : "text-loss"}`}
                >
                  <MonetaryValue>{money(g.netPnl, data.currencies[0] ?? "USD")}</MonetaryValue>
                </td>
                <td className="px-3">{number(g.volume)}</td>
                <td className="px-3">{number(g.avgPlannedR)}</td>
                <td className="px-3">{number(g.avgRealizedR)}</td>
                <td className="whitespace-nowrap px-3">{fmtDuration(g.avgDurationMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data.groups.length && (
        <p className="py-12 text-center text-sm text-muted-foreground">{t.noMatch}</p>
      )}
    </div>
  );
}
export default function ReportsPage() {
  return (
    <Suspense>
      <Reports />
    </Suspense>
  );
}
function Reports() {
  const { query, values } = useFilters();
  const [mode, setMode] = useState<
      "overview" | "trends" | "explorer" | "breakdown" | "cross" | "compare"
    >("overview"),
    [primary, setPrimary] = useState<Dimension>("symbol"),
    [secondary, setSecondary] = useState<Dimension>("weekday");
  const { data, error, loading } = useApi<Analysis>(
    mode === "breakdown" || mode === "cross"
      ? `/api/analysis?${query}&primary=${primary}${mode === "cross" ? `&secondary=${secondary}` : ""}`
      : null,
  );
  const multi = (data?.currencies.length ?? 0) > 1;
  const t = useT("reports");
  const tf = useT("filters");
  return (
    <div>
      <FilterBar title={t.title} />
      <div className="space-y-4 p-4">
        <AskJournal />
        <div className="flex flex-wrap items-center gap-2">
          {(["overview", "trends", "explorer", "breakdown", "cross", "compare"] as const).map(
            (key) => (
              <Button
                key={key}
                size="sm"
                variant={mode === key ? "default" : "outline"}
                aria-pressed={mode === key}
                onClick={() => setMode(key)}
              >
                {t.modes[key]}
              </Button>
            ),
          )}
        </div>
        <div key={mode} className="journal-report-section space-y-4" data-report-section={mode}>
          {mode === "overview" ? (
            <ReportOverview query={query} filters={values} />
          ) : mode === "trends" ? (
            <PerformanceTrendsReport key={query} query={query} />
          ) : mode === "explorer" ? (
            <TradeExplorer key={query} query={query} />
          ) : mode === "compare" ? (
            <Comparison key={query} initial={values} />
          ) : (
            <>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex flex-wrap gap-3">
                      <DimensionSelect label={t.groupBy} value={primary} onChange={setPrimary} />
                      {mode === "cross" && (
                        <DimensionSelect
                          label={t.thenBy}
                          value={secondary}
                          onChange={setSecondary}
                        />
                      )}
                    </div>
                    {data && !multi && (
                      <ReviewExport
                        containsFinancialData
                        document={{
                          title:
                            mode === "cross"
                              ? t.export.byTitle(t.dimensions[primary], t.dimensions[secondary])
                              : t.export.performance(t.dimensions[primary]),
                          subtitle: `${data.timeZone} · ${data.currencies[0] ?? t.export.accountCurrency}`,
                          lines: [
                            t.export.filters(
                              describeFilters(values, data.accounts, data.playbooks, false, tf),
                            ),
                            t.export.totals(
                              data.summary.trades,
                              number(data.summary.netPnl),
                              percent(data.summary.winRate),
                            ),
                            "",
                            ...data.groups.map((g) =>
                              t.export.row(
                                `${labels(data, g.row, t.buckets)}${g.column ? ` / ${labels(data, g.column, t.buckets)}` : ""}`,
                                g.trades,
                                number(g.netPnl),
                                percent(g.winRate),
                                number(g.avgPlannedR),
                                number(g.avgRealizedR),
                                number(g.volume),
                                fmtDuration(g.avgDurationMs),
                              ),
                            ),
                          ],
                        }}
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {error ? (
                    <p role="alert" className="text-destructive">
                      {error}
                    </p>
                  ) : loading ? (
                    <p className="text-sm text-muted-foreground">{t.loadingReport}</p>
                  ) : multi ? (
                    <p className="text-sm">{t.mixed(data?.currencies.join(", ") ?? "")}</p>
                  ) : data ? (
                    <Summary data={data} />
                  ) : null}
                </CardContent>
              </Card>
              {data && !multi && !loading && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {mode === "cross"
                        ? t.crossTitle(t.dimensions[primary], t.dimensions[secondary])
                        : t.byTitle(t.dimensions[primary])}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Breakdown
                      data={data}
                      cross={mode === "cross"}
                      primary={primary}
                      secondary={secondary}
                    />
                  </CardContent>
                </Card>
              )}
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t.footnote(data?.timeZone ?? null)}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
function Comparison({ initial }: { initial: AnalysisFilters }) {
  const privateMode = usePrivacy();
  const t = useT("reports").compare;
  const tf = useT("filters");
  const [a, setA] = useState<AnalysisFilters>({ ...initial, direction: "long" }),
    [b, setB] = useState<AnalysisFilters>({ ...initial, direction: "short" }),
    [nameA, setNameA] = useState(t.longTrades),
    [nameB, setNameB] = useState(t.shortTrades),
    [editing, setEditing] = useState<"a" | "b" | null>(null),
    [draft, setDraft] = useState<AnalysisFilters>({});
  const aa = useApi<Analysis>(`/api/analysis?${new URLSearchParams(a).toString()}`),
    bb = useApi<Analysis>(`/api/analysis?${new URLSearchParams(b).toString()}`);
  const currencies = new Set([...(aa.data?.currencies ?? []), ...(bb.data?.currencies ?? [])]),
    multi = currencies.size > 1;
  const metricLines = (name: string, d: Analysis) => [
    name,
    t.tradesLine(d.summary.trades, number(d.summary.netPnl), d.currencies[0] ?? ""),
    t.rateLine(
      percent(d.summary.winRate),
      number(d.summary.avgPlannedR),
      number(d.summary.avgRealizedR),
    ),
  ];
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t.intro}</p>
      {multi && (
        <p role="alert" className="rounded-md border p-3 text-sm">
          {t.mixed}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {(
          [
            { key: "a", name: nameA, setName: setNameA, filters: a, result: aa },
            { key: "b", name: nameB, setName: setNameB, filters: b, result: bb },
          ] as const
        ).map((group) => (
          <Card key={group.key}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  aria-label={t.groupName(group.key.toUpperCase())}
                  className={`${fieldClass} min-w-32 flex-1 font-semibold`}
                  value={group.name}
                  onChange={(e) => group.setName(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDraft({ ...group.filters });
                    setEditing(group.key);
                  }}
                >
                  {t.editFilters}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground break-words">
                {describeFilters(
                  group.filters,
                  group.result.data?.accounts,
                  group.result.data?.playbooks,
                  privateMode,
                  tf,
                )}
              </p>
            </CardHeader>
            <CardContent>
              {group.result.error ? (
                <p role="alert" className="text-destructive">
                  {group.result.error}
                </p>
              ) : group.result.loading ? (
                <p>{t.loading}</p>
              ) : group.result.data && !multi ? (
                <Summary data={group.result.data} />
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
      {aa.data && bb.data && !aa.loading && !bb.loading && !multi && (
        <Card>
          <CardContent className="space-y-4 pt-5">
            <p className="text-sm">
              {t.difference(nameB, nameA)}{" "}
              <strong>
                <MonetaryValue>
                  {money(
                    bb.data.summary.netPnl - aa.data.summary.netPnl,
                    [...currencies][0] ?? "USD",
                  )}
                </MonetaryValue>
              </strong>
              {t.netPnlTrades(number(bb.data.summary.trades - aa.data.summary.trades))}
            </p>
            <ReviewExport
              containsFinancialData
              document={{
                title: t.exportTitle(nameA, nameB),
                lines: [
                  t.groupFilters(
                    "A",
                    describeFilters(a, aa.data.accounts, aa.data.playbooks, false, tf),
                  ),
                  t.groupFilters(
                    "B",
                    describeFilters(b, bb.data.accounts, bb.data.playbooks, false, tf),
                  ),
                  "",
                  ...metricLines(nameA, aa.data),
                  "",
                  ...metricLines(nameB, bb.data),
                ],
              }}
            />
          </CardContent>
        </Card>
      )}
      <Dialog
        open={editing !== null}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t.dialog(editing?.toUpperCase() ?? "")}</DialogTitle>
          </DialogHeader>
          <FilterFields value={draft} onChange={setDraft} />
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setDraft({})}>
              {t.clear}
            </Button>
            <Button
              onClick={() => {
                if (editing === "a") setA(draft);
                else setB(draft);
                setEditing(null);
              }}
            >
              {t.apply}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
