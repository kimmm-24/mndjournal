"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MIN_TREND_POINTS, type PerformanceTrendsResponse } from "@/lib/performance-trends";
import { useApi } from "@/lib/use-api";
import { fmtPercent } from "@/lib/utils";
import { Pnl } from "./pnl";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { useI18n, useT } from "./i18n";

const RollingTradeChart = dynamic(
  () => import("./charts/rolling-trade-chart").then((module) => module.RollingTradeChart),
  { loading: () => <ChartLoading /> },
);
function ChartLoading() {
  const t = useT("reports").trends;
  return (
    <div role="status" aria-label={t.loadingChart}>
      <Skeleton className="h-60" />
    </div>
  );
}
const tradeHref = (key: string) => `/trades/${encodeURIComponent(key)}`;

export function PerformanceTrendsReport({ query }: { query: string }) {
  const { data, loading, error, refresh } = useApi<PerformanceTrendsResponse>(
    `/api/performance-trends?${query}`,
  );
  const [tableOpen, setTableOpen] = useState(false);
  const t = useT("reports").trends;
  const { dateLocale } = useI18n();
  const dateFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(dateLocale, {
        timeZone: data?.timeZone ?? "UTC",
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [data?.timeZone, dateLocale],
  );
  if (loading)
    return (
      <div role="status" aria-label={t.loading} className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  if (error || !data)
    return (
      <div role="alert" className="rounded-xl border p-5">
        <p className="text-sm text-destructive">{error ?? t.failed}</p>
        <Button onClick={refresh} variant="outline" size="sm" className="mt-3">
          {t.tryAgain}
        </Button>
      </div>
    );
  const { trends, timeZone, currencies } = data;
  const currency = currencies[0] ?? "USD";
  const monetary = currencies.length <= 1;
  const latest = trends.points.at(-1);
  const chartReady = trends.points.length >= MIN_TREND_POINTS;
  return (
    <section
      className="space-y-4"
      aria-labelledby="performance-trends-title"
      data-performance-trends
    >
      <div>
        <h2 id="performance-trends-title" className="text-lg font-semibold">
          {t.title}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {t.scope(trends.count, timeZone, monetary && trends.count > 0 ? currency : null)}
        </p>
      </div>
      {trends.count === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <h3 className="font-medium">{t.emptyTitle}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t.emptyBody}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {!monetary && (
            <p
              role="note"
              className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground"
            >
              {t.mixed(currencies.join(", "))}
            </p>
          )}
          <div className={`grid items-start gap-3 ${monetary ? "lg:grid-cols-2" : ""}`}>
            {(["winRate", ...(monetary ? ["avgNetPnl" as const] : [])] as const).map((metric) => {
              const rate = metric === "winRate";
              const reference = rate ? trends.overallWinRate! : trends.overallAvgNetPnl!;
              return (
                <Card key={metric} className="min-w-0 overflow-hidden">
                  <CardHeader>
                    <CardTitle>{rate ? t.winTrend : t.pnlTrend}</CardTitle>
                    <p className="text-xs text-muted-foreground">{t.last20(rate)}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">{t.latest}</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">
                          {latest ? (
                            rate ? (
                              fmtPercent(latest.winRate, 1)
                            ) : (
                              <Pnl value={latest.avgNetPnl} currency={currency} />
                            )
                          ) : (
                            "—"
                          )}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{t.selectedPeriod(rate)}</p>
                        <p className="mt-1 text-sm tabular-nums">
                          {rate ? (
                            fmtPercent(reference, 1)
                          ) : (
                            <Pnl value={reference} currency={currency} />
                          )}
                        </p>
                      </div>
                    </div>
                    {chartReady ? (
                      <>
                        <RollingTradeChart
                          data={trends.points}
                          metric={metric}
                          reference={reference}
                          currency={currency}
                          timeZone={timeZone}
                        />
                        <p className="text-xs text-muted-foreground">{t.sequence(rate)}</p>
                      </>
                    ) : (
                      <div className="rounded-lg bg-muted/30 px-4 py-6 text-sm leading-relaxed text-muted-foreground">
                        {!latest ? t.moreNeeded(20 - trends.count) : t.latestOnly}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {monetary && (
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>{t.largest}</CardTitle>
                <p className="text-xs text-muted-foreground">{t.largestNote}</p>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    [t.largestWinner, trends.largestWin, t.noWinning],
                    [t.largestLoser, trends.largestLoss, t.noLosing],
                  ] as const
                ).map(([label, trade, none]) => (
                  <div key={label} className="min-w-0 rounded-lg border p-4">
                    <h3 className="text-xs text-muted-foreground">{label}</h3>
                    {trade ? (
                      <>
                        <p className="mt-2 text-xl font-semibold">
                          <Pnl value={trade.netPnl} currency={currency} />
                        </p>
                        <Link
                          href={tradeHref(trade.key)}
                          className="mt-2 inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded text-sm underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-current"
                        >
                          <span className="break-all font-medium">
                            {trade.symbol} · {trade.direction}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {dateFormat.format(new Date(trade.closedAt))} ↗
                          </span>
                        </Link>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">{none}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {latest && (
            <details
              className="rounded-xl border bg-card"
              onToggle={(event) => setTableOpen(event.currentTarget.open)}
            >
              <summary className="cursor-pointer rounded-xl px-4 py-3 text-sm font-medium">
                {t.explore}
              </summary>
              {tableOpen && (
                <div className="max-h-72 overflow-auto px-4 pb-4">
                  <table className="w-full text-left text-xs">
                    <caption className="pb-3 text-left text-muted-foreground">
                      {t.caption(timeZone)}
                    </caption>
                    <thead>
                      <tr className="border-b">
                        <th scope="col" className="py-2 pr-3">
                          {t.window}
                        </th>
                        <th scope="col" className="px-2 text-right">
                          {t.winRate}
                        </th>
                        {monetary && (
                          <th scope="col" className="pl-2 text-right">
                            {t.avgNet}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {trends.points.map((point) => (
                        <tr key={point.key} className="border-b last:border-0">
                          <th scope="row" className="py-3 pr-3 font-normal">
                            <Link
                              className="rounded underline underline-offset-4"
                              href={tradeHref(point.key)}
                            >
                              #{point.sequence - 19}–{point.sequence}
                              <span className="mt-1 block text-muted-foreground">
                                {dateFormat.format(new Date(point.closedAt))}
                              </span>
                            </Link>
                          </th>
                          <td className="px-2 text-right tabular-nums">
                            {fmtPercent(point.winRate, 1)}
                          </td>
                          {monetary && (
                            <td className="pl-2 text-right">
                              <Pnl value={point.avgNetPnl} currency={currency} />
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </details>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">{t.footnote}</p>
        </>
      )}
    </section>
  );
}
