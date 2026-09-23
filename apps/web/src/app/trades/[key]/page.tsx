"use client";
import { AiNotice } from "@/components/ai-notice";
import { Checkbox } from "@/components/ui/checkbox";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Star } from "lucide-react";
import { FilterBar } from "@/components/filter-bar";
import { Pnl } from "@/components/pnl";
import { MonetaryValue, MonetaryField } from "@/components/privacy";
import { TradeMarketData } from "@/components/trade-market-data";
import { EquityArea } from "@/components/charts/equity-area";
import { VoiceNote } from "@/components/voice-note";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RichEditor, type RichEditorHandle } from "@/components/rich-editor";
import { Attachments } from "@/components/attachments";
import { ReviewExport } from "@/components/review-export";
import { RuleChecklist } from "@/components/rule-checklist";
import { useAutosave } from "@/lib/use-autosave";
import { postJson, useApi } from "@/lib/use-api";
import { fmtDuration, fmtMoney, fmtNumber, fmtPercent } from "@/lib/utils";
import { tradeKeyFromSegment } from "@/lib/trade-links";
import { formatTimestamp } from "@/lib/timezone";
import { quotaExceededMessage, type AiAccessStatus } from "@/lib/ai-quota";
import { useT } from "@/components/i18n";

interface TradeDetail {
  riskAmount: number | null;
  realizedR: number | null;
  plannedR: number | null;
  contractMultiplier: number | null;
  currency: string;
  key: string;
  accountId: string;
  symbol: string;
  assetClass: string | null;
  direction: "long" | "short";
  status: string;
  openedAt: string;
  closedAt: string | null;
  quantity: number;
  avgEntry: number;
  avgExit: number | null;
  grossPnl: number;
  fees: number;
  netPnl: number;
  durationMs: number | null;
  exitsJson: string;
  notes: string | null;
  tagsJson: string | null;
  mistakesJson: string | null;
  playbookId: string | null;
  rating: number | null;
  stopLoss: number | null;
  profitTarget: number | null;
  reviewedAt: string | null;
}

interface ExecutionRow {
  id: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  fee: number;
  executedAt: string;
}

export default function TradePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params);
  const tradeKey = tradeKeyFromSegment(key);
  return <TradeView key={tradeKey} tradeKey={tradeKey} />;
}

function TradeView({ tradeKey }: { tradeKey: string }) {
  const { data, error, refresh } = useApi<{
    trade: TradeDetail;
    executions: ExecutionRow[];
    timeZone: string;
  }>(`/api/trades/${encodeURIComponent(tradeKey)}`);
  const { data: aiAccess } = useApi<AiAccessStatus>("/api/ai/status");
  const t = useT("trade");
  const [aiBusy, setAiBusy] = useState(false);
  const [critique, setCritique] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [quotaDismissed, setQuotaDismissed] = useState(false);
  const quotaMessage =
    aiAccess && aiAccess.plan !== "starter" && !aiAccess.allowed
      ? quotaExceededMessage(aiAccess)
      : null;
  const displayedAiError = aiError ?? (quotaDismissed ? null : quotaMessage);

  if (!data) {
    return (
      <div>
        <FilterBar title={t.title} />
        <div className="p-4">
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : (
            <Skeleton className="h-96" />
          )}
        </div>
      </div>
    );
  }
  const { trade, executions, timeZone } = data;

  const patch = async (body: Record<string, unknown>) => {
    if (Object.keys(body).length)
      await postJson(`/api/trades/${encodeURIComponent(tradeKey)}`, body, "PATCH");
    refresh();
  };

  const runningPnl = (() => {
    const exits = JSON.parse(trade.exitsJson) as {
      executionId: string;
      grossPnl: number;
      quantity: number;
    }[];
    const times = new Map(executions.map((e) => [e.id, e.executedAt]));
    const totalExitQty = exits.reduce((total, exit) => total + exit.quantity, 0);
    let cum = 0;
    return exits
      .map((exit) => ({
        t: times.get(exit.executionId) ?? trade.openedAt,
        pnl: exit.grossPnl - (totalExitQty > 0 ? trade.fees * (exit.quantity / totalExitQty) : 0),
      }))
      .sort((a, b) => Date.parse(a.t) - Date.parse(b.t))
      .map((event) => ({
        t: formatTimestamp(event.t, timeZone).slice(11, 16),
        cumNetPnl: (cum += event.pnl),
      }));
  })();

  const askCritique = async () => {
    setAiBusy(true);
    setAiError(null);
    try {
      const result = await postJson<{ critique: string }>("/api/ai/critique", { key: tradeKey });
      setCritique(result.critique);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : t.critiqueFailed);
    } finally {
      setAiBusy(false);
    }
  };

  const riskAmount = trade.riskAmount;

  return (
    <div>
      <FilterBar title={`${trade.symbol} · ${trade.direction.toUpperCase()}`} />
      <div className="grid gap-3 p-4 xl:grid-cols-3">
        <div className="min-w-0 space-y-3 xl:col-span-2">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 py-4">
              <div>
                <div className="text-xs text-muted-foreground">{t.netPnl}</div>
                <Pnl value={trade.netPnl} className="text-2xl font-semibold" />
              </div>
              <Badge
                variant={
                  trade.status === "win" ? "profit" : trade.status === "loss" ? "loss" : "secondary"
                }
                className="text-sm"
              >
                {trade.status.toUpperCase()}
              </Badge>
              <Meta label={t.gross} value={fmtMoney(trade.grossPnl)} monetary />
              <Meta label={t.fees} value={fmtMoney(trade.fees)} monetary />
              <Meta label={t.volume} value={fmtNumber(trade.quantity, 4)} />
              <Meta label={t.avgEntry} value={fmtNumber(trade.avgEntry)} monetary />
              <Meta
                label={t.avgExit}
                monetary
                value={trade.avgExit === null ? t.open : fmtNumber(trade.avgExit)}
              />
              <Meta label={t.duration} value={fmtDuration(trade.durationMs)} />
              <Meta
                label={t.netOverNotional}
                value={fmtPercent(
                  trade.avgEntry * trade.quantity > 0 &&
                    (trade.contractMultiplier !== null ||
                      !["futures", "option", "forex", "cfd"].includes(trade.assetClass ?? ""))
                    ? trade.netPnl /
                        (Math.abs(trade.avgEntry) *
                          trade.quantity *
                          (trade.contractMultiplier ?? 1))
                    : null,
                  2,
                )}
              />
              <Meta
                label={t.plannedR}
                value={trade.plannedR === null ? "–" : `${fmtNumber(trade.plannedR)}R`}
              />
              <Meta
                label={t.realizedR}
                value={trade.realizedR === null ? "–" : `${fmtNumber(trade.realizedR)}R`}
              />
            </CardContent>
          </Card>

          <TradeMarketData
            trade={trade}
            executions={executions}
            replayAllowed={aiAccess ? aiAccess.plan !== "starter" : undefined}
          />

          {runningPnl.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>{t.runningPnl}</CardTitle>
                <p className="text-xs text-muted-foreground">{t.timesIn(timeZone)}</p>
              </CardHeader>
              <CardContent>
                <EquityArea data={runningPnl} height={180} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t.executions}</CardTitle>
              <p className="text-xs text-muted-foreground">{t.timesIn(timeZone)}</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.columns.time}</TableHead>
                    <TableHead>{t.columns.side}</TableHead>
                    <TableHead>{t.columns.quantity}</TableHead>
                    <TableHead>{t.columns.price}</TableHead>
                    <TableHead>{t.columns.fee}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions
                    .sort((a, b) => a.executedAt.localeCompare(b.executedAt))
                    .map((execution) => (
                      <TableRow key={execution.id}>
                        <TableCell className="text-muted-foreground">
                          {formatTimestamp(execution.executedAt, timeZone)}
                        </TableCell>
                        <TableCell>
                          <span className={execution.side === "buy" ? "text-profit" : "text-loss"}>
                            {execution.side === "buy" ? t.buy : t.sell}
                          </span>
                        </TableCell>
                        <TableCell className="tnum">{fmtNumber(execution.quantity, 4)}</TableCell>
                        <TableCell className="tnum">
                          <MonetaryValue>{fmtNumber(execution.price)}</MonetaryValue>
                        </TableCell>
                        <TableCell className="tnum text-muted-foreground">
                          <MonetaryValue>{fmtMoney(execution.fee)}</MonetaryValue>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-3">
          <AnnotationsCard key={trade.key} trade={trade} onPatch={patch} aiAccess={aiAccess} />
          <RuleChecklist tradeKey={trade.key} playbookId={trade.playbookId} />
          {aiAccess && aiAccess.plan !== "starter" && (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{t.aiReview}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={askCritique}
                disabled={aiBusy || !aiAccess.allowed}
              >
                <Sparkles />
                {aiBusy ? t.thinking : t.critique}
              </Button>
            </CardHeader>
            {displayedAiError && (
              <CardContent>
                <AiNotice
                  error={displayedAiError}
                  onRetry={() => void askCritique()}
                  onDismiss={() => {
                    setAiError(null);
                    setQuotaDismissed(true);
                  }}
                />
              </CardContent>
            )}
            {critique && (
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{critique}</p>
              </CardContent>
            )}
          </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
  monetary = false,
}: {
  label: string;
  value: string;
  monetary?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="tnum text-sm font-medium">
        {monetary ? <MonetaryValue>{value}</MonetaryValue> : value}
      </div>
    </div>
  );
}

function AnnotationsCard({
  trade,
  onPatch,
  aiAccess,
}: {
  trade: TradeDetail;
  onPatch: (body: Record<string, unknown>) => Promise<void>;
  aiAccess: AiAccessStatus | null;
}) {
  const t = useT("trade");
  const [notes, setNotes] = useState(trade.notes ?? "");
  const noteEditor = useRef<RichEditorHandle>(null);
  const [tags, setTags] = useState((JSON.parse(trade.tagsJson ?? "[]") as string[]).join(", "));
  const [mistakes, setMistakes] = useState(
    (JSON.parse(trade.mistakesJson ?? "[]") as string[]).join(", "),
  );
  const [stopLoss, setStopLoss] = useState(trade.stopLoss?.toString() ?? "");
  const [profitTarget, setProfitTarget] = useState(trade.profitTarget?.toString() ?? "");
  const { data: playbookData } = useApi<{ playbooks: { id: string; name: string }[] }>(
    "/api/playbooks",
  );
  const {
    save: debounced,
    status: saveStatus,
    flush,
  } = useAutosave(`/api/trades/${encodeURIComponent(trade.key)}`, "PATCH", () => void onPatch({}));

  const [tagBusy, setTagBusy] = useState(false);
  const [tagSuggestion, setTagSuggestion] = useState<{
    playbookId: string | null;
    playbookName: string | null;
    reasoning: string;
  } | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);
  const [tagQuotaDismissed, setTagQuotaDismissed] = useState(false);
  const tagQuotaMessage =
    aiAccess && aiAccess.plan !== "starter" && !aiAccess.allowed
      ? quotaExceededMessage(aiAccess)
      : null;
  const displayedTagError = tagError ?? (tagQuotaDismissed ? null : tagQuotaMessage);

  const suggestPlaybook = async () => {
    setTagBusy(true);
    setTagError(null);
    setTagSuggestion(null);
    try {
      const result = await postJson<{
        playbookId: string | null;
        playbookName: string | null;
        reasoning: string;
      }>("/api/ai/tag", { key: trade.key });
      setTagSuggestion(result);
    } catch (cause) {
      setTagError(cause instanceof Error ? cause.message : t.suggestionFailed);
    } finally {
      setTagBusy(false);
    }
  };

  const parseList = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.journalThis}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => void onPatch({ rating: trade.rating === star ? null : star })}
                aria-label={t.rate(star)}
              >
                <Star
                  className={`h-4 w-4 ${trade.rating !== null && star <= trade.rating ? "fill-current text-series-4 text-yellow-600" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={trade.reviewedAt !== null}
              onCheckedChange={(checked) => void onPatch({ reviewed: checked === true })}
            />
            {t.reviewed}
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">{t.stopLoss}</label>
            <MonetaryField>
              <Input
                value={stopLoss}
                onChange={(event) => {
                  setStopLoss(event.target.value);
                  debounced({
                    stopLoss: event.target.value === "" ? null : Number(event.target.value),
                  });
                }}
                placeholder={t.stopPlaceholder}
                inputMode="decimal"
              />
            </MonetaryField>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t.profitTarget}</label>
            <MonetaryField>
              <Input
                value={profitTarget}
                onChange={(event) => {
                  setProfitTarget(event.target.value);
                  debounced({
                    profitTarget: event.target.value === "" ? null : Number(event.target.value),
                  });
                }}
                placeholder={t.targetPlaceholder}
                inputMode="decimal"
              />
            </MonetaryField>
          </div>
        </div>

        {aiAccess && aiAccess.plan !== "starter" && (
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">{t.playbook}</label>
            {playbookData &&
              playbookData.playbooks.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-1.5 text-xs text-muted-foreground"
                  onClick={() => void suggestPlaybook()}
                  disabled={tagBusy || !aiAccess.allowed}
                >
                  <Sparkles className="h-3 w-3" />
                  {tagBusy ? t.suggesting : t.suggest}
                </Button>
              )}
          </div>
          {playbookData &&
            playbookData.playbooks.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t.createPlaybookFirst}
              </p>
            )}
          <Select
            value={trade.playbookId ?? "none"}
            onValueChange={(value) => void onPatch({ playbookId: value === "none" ? null : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t.noPlaybook} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t.noPlaybook}</SelectItem>
              {playbookData?.playbooks.map((playbook) => (
                <SelectItem key={playbook.id} value={playbook.id}>
                  {playbook.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {displayedTagError && (
            <div className="mt-2">
              <AiNotice
                error={displayedTagError}
                onRetry={() => void suggestPlaybook()}
                onDismiss={() => {
                  setTagError(null);
                  setTagQuotaDismissed(true);
                }}
              />
            </div>
          )}

          {tagSuggestion && (
            <div className="mt-2 rounded-lg border bg-muted/25 p-3">
              {tagSuggestion.playbookId ? (
                <>
                  <p className="text-sm font-medium">{tagSuggestion.playbookName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{tagSuggestion.reasoning}</p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        void onPatch({ playbookId: tagSuggestion.playbookId });
                        setTagSuggestion(null);
                      }}
                    >
                      {t.apply}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setTagSuggestion(null)}
                    >
                      {t.ignore}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{tagSuggestion.reasoning}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() => setTagSuggestion(null)}
                  >
                    {t.close}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground">{t.tags}</label>
          <Input
            value={tags}
            onChange={(event) => {
              setTags(event.target.value);
              debounced({ tags: parseList(event.target.value) });
            }}
            placeholder={t.tagsPlaceholder}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t.mistakes}</label>
          <Input
            value={mistakes}
            onChange={(event) => {
              setMistakes(event.target.value);
              debounced({ mistakes: parseList(event.target.value) });
            }}
            placeholder={t.mistakesPlaceholder}
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs text-muted-foreground">{t.notes}</label>
            <VoiceNote
              onPrepare={() => noteEditor.current?.focus()}
              onText={(text) => {
                const next = notes ? `${notes} ${text}` : text;
                setNotes(next);
                debounced({ notes: next });
              }}
            />
          </div>
          <RichEditor
            editorRef={noteEditor}
            value={notes}
            onChange={(value) => {
              setNotes(value);
              debounced({ notes: value });
            }}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span role="status">{saveStatus}</span>
            <Button variant="ghost" size="sm" onClick={() => void flush()}>
              {t.saveNow}
            </Button>
          </div>
          <ReviewExport
            containsFinancialData
            document={{
              title: t.review.title(trade.symbol, trade.direction),
              subtitle: `${trade.openedAt} · ${trade.currency}`,
              lines: [
                t.review.status(trade.status, trade.quantity),
                t.review.prices(trade.avgEntry, String(trade.avgExit ?? t.review.open)),
                t.review.pnl(trade.netPnl.toFixed(2), trade.fees.toFixed(2)),
                t.review.plan(stopLoss || t.review.unspecified, profitTarget || t.review.unspecified),
                t.review.labels(tags || t.review.none, mistakes || t.review.none),
                "",
                notes,
              ],
            }}
          />
          <Attachments type="trade" id={trade.key} />
        </div>
      </CardContent>
    </Card>
  );
}
