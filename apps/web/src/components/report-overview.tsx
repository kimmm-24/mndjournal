"use client";

import type { AnalysisFilters, BucketStats } from "@luxalgo/journal-core";
import { TimeHeatmap } from "./charts/time-heatmap";
import { ReviewExport } from "./review-export";
import { MonetaryValue } from "./privacy";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { useApi } from "@/lib/use-api";
import { fmtMoney, fmtPercent, pnlClass } from "@/lib/utils";
import { describeFilters } from "@/lib/filter-description";
import { useT } from "./i18n";

interface OverviewData {
  buckets: Record<
    "symbol" | "tag" | "mistake" | "playbook" | "weekday" | "hour" | "duration" | "direction",
    BucketStats[]
  >;
  currencies: string[];
  timeZone: string;
  accounts: { id: string; name: string }[];
  playbooks: { id: string; name: string }[];
}

// Keep the original overview's aggregations and ordering alongside the advanced reports.
const SECTIONS = [
  "symbol",
  "direction",
  "weekday",
  "duration",
  "tag",
  "mistake",
  "playbook",
] as const;

export function ReportOverview({ query, filters }: { query: string; filters: AnalysisFilters }) {
  const { data, error, loading } = useApi<OverviewData>(`/api/stats?${query}`);
  const tr = useT("reports");
  const t = tr.overview;
  const tf = useT("filters");
  if (error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    );
  if (loading || !data) return <Skeleton className="h-72" />;
  if (data.currencies.length > 1)
    return <p className="rounded-lg border p-4 text-sm">{t.mixed(data.currencies.join(", "))}</p>;
  const currency = data.currencies[0] ?? "USD";
  const label = (dimension: string, key: string) =>
    dimension === "playbook"
      ? (data.playbooks.find((book) => book.id === key)?.name ?? tr.buckets[key] ?? key)
      : (tr.buckets[key] ?? key);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{t.scope(data.timeZone, currency)}</p>
        <ReviewExport
          containsFinancialData
          document={{
            title: t.title,
            subtitle: `${data.timeZone} · ${currency}`,
            lines: [
              tr.export.filters(describeFilters(filters, data.accounts, data.playbooks, false, tf)),
              "",
              t.hourSection,
              ...data.buckets.hour.map((b) =>
                t.hourLine(b.key, b.trades, fmtMoney(b.netPnl, currency)),
              ),
              ...SECTIONS.flatMap((section) => [
                "",
                t.sections[section].title,
                ...data.buckets[section].map((b) =>
                  t.bucketLine(
                    label(section, b.key),
                    b.trades,
                    fmtPercent(b.winRate, 0),
                    fmtMoney(b.netPnl, currency),
                  ),
                ),
              ]),
            ],
          }}
        />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t.timePerformance}</CardTitle>
          </CardHeader>
          <CardContent>
            <TimeHeatmap hours={data.buckets.hour} currency={currency} />
          </CardContent>
        </Card>
        {SECTIONS.map((section) => (
          <Card key={section}>
            <CardHeader>
              <CardTitle>{t.sections[section].title}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.buckets[section].length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {section === "tag" || section === "mistake" || section === "playbook"
                    ? t.annotate
                    : t.noData}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.sections[section].column}</TableHead>
                      <TableHead className="text-right">{tr.columns.trades}</TableHead>
                      <TableHead className="text-right">{tr.columns.win}</TableHead>
                      <TableHead className="text-right">{tr.columns.netPnl}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.buckets[section].map((bucket) => (
                      <TableRow key={bucket.key}>
                        <TableCell className="font-medium">{label(section, bucket.key)}</TableCell>
                        <TableCell className="tnum text-right text-muted-foreground">
                          {bucket.trades}
                        </TableCell>
                        <TableCell className="tnum text-right">
                          {fmtPercent(bucket.winRate, 0)}
                        </TableCell>
                        <TableCell className={`tnum text-right ${pnlClass(bucket.netPnl)}`}>
                          <MonetaryValue>{fmtMoney(bucket.netPnl, currency)}</MonetaryValue>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{t.footnote}</p>
    </div>
  );
}
