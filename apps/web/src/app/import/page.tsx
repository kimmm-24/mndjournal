"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Landmark, PencilLine } from "lucide-react";
import { AccountPicker } from "@/components/account-picker";
import { ManualTradeEntry } from "@/components/manual-trade-entry";
import { FilterBar } from "@/components/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { postJson, useApi } from "@/lib/use-api";
import { decodeImportFile } from "@/lib/decode-import";
import { formatTimestamp, isTimeZone } from "@/lib/timezone";
import { dayKeyOf } from "@luxalgo/journal-core";
import { TimeZonePicker } from "@/components/timezone-picker";
import type { Plan } from "@/lib/plan";
import { useI18n, useT } from "@/components/i18n";
import { localizeServerError } from "@/lib/i18n/server-errors";

interface BrokerInfo {
  id: string;
  displayName: string;
  credentials: { key: string; label: string; secret?: boolean; options?: string[] }[];
  readOnlySetup: string;
}

interface PreviewTotals {
  executions: number;
  symbols: number;
  skippedRows: number;
  from: string | null;
  to: string | null;
}

interface PreviewResponse {
  detected: string | null;
  timeZone: string;
  needsMapping?: boolean;
  headers?: string[];
  totals?: PreviewTotals;
  warnings?: string[];
  errors?: string[];
  needsSymbol?: boolean;
  executions?: {
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    executedAt: string;
  }[];
}

export default function ImportPage() {
  return (
    <Suspense>
      <ImportView />
    </Suspense>
  );
}

function ImportView() {
  const router = useRouter();
  const { data: planData } = useApi<{ plan: Plan }>("/api/plan");
  // Hidden until confirmed non-starter — never flashes restricted tabs while loading.
  const syncImportAllowed = planData ? planData.plan !== "starter" : false;
  const [tab, setTab] = useState("manual");
  const t = useT("importer");
  useEffect(() => {
    if (syncImportAllowed) setTab((current) => (current === "manual" ? "file" : current));
  }, [syncImportAllowed]);
  return (
    <div>
      <FilterBar title={t.title} />
      <div className="mx-auto max-w-3xl p-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            {syncImportAllowed && (
              <TabsTrigger value="file" className="max-sm:px-2 max-sm:text-xs">
                <FileUp className="mr-1.5 hidden h-4 w-4 min-[420px]:block" />
                {t.tabs.file}
              </TabsTrigger>
            )}
            {syncImportAllowed && (
              <TabsTrigger value="sync" className="max-sm:px-2 max-sm:text-xs">
                <Landmark className="mr-1.5 hidden h-4 w-4 min-[420px]:block" />
                {t.tabs.sync}
              </TabsTrigger>
            )}
            <TabsTrigger value="manual" className="max-sm:px-2 max-sm:text-xs">
              <PencilLine className="mr-1.5 hidden h-4 w-4 min-[420px]:block" />
              {t.tabs.manual}
            </TabsTrigger>
          </TabsList>
          {syncImportAllowed && (
            <TabsContent value="file">
              <FileImport />
            </TabsContent>
          )}
          {syncImportAllowed && (
            <TabsContent value="sync">
              <BrokerConnect />
            </TabsContent>
          )}
          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>{t.manualTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <ManualTradeEntry onSaved={() => router.push("/trades")} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function FileImport() {
  const router = useRouter();
  const t = useT("importer");
  const { locale } = useI18n();
  const [accountId, setAccountId] = useState("");
  const [content, setContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [mappingApplied, setMappingApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const { data: formatData } = useApi<{ formats: { id: string; label: string }[] }>("/api/import");
  const { data: settingsData, error: settingsError } = useApi<{
    timeZone: string;
    importTimeZone: string;
  }>("/api/settings");
  const [statementTimeZone, setStatementTimeZone] = useState<string | null>(null);
  const timeZone = statementTimeZone ?? settingsData?.importTimeZone ?? "";
  const validTimeZone = isTimeZone(timeZone);
  const displayTimeZone = settingsData?.timeZone ?? "UTC";

  const onFile = async (file: File) => {
    if (!validTimeZone) return;
    setStatementTimeZone(timeZone);
    setPreview(null);
    setContent(null);
    setFileName(file.name);
    setSymbol("");
    setMapping({});
    setMappingApplied(false);
    setError(null);
    setBusy(true);
    try {
      const text = decodeImportFile(await file.arrayBuffer());
      setContent(text);
      setPreview(
        await postJson<PreviewResponse>("/api/import", {
          mode: "preview",
          content: text,
          fileName: file.name,
          timeZone,
        }),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.previewFailed);
    } finally {
      setBusy(false);
    }
  };

  const previewFile = async () => {
    if (!content || !validTimeZone) return;
    setBusy(true);
    setError(null);
    try {
      setPreview(
        await postJson<PreviewResponse>("/api/import", {
          mode: "preview",
          content,
          fileName,
          symbol,
          timeZone,
        }),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.previewFailed);
    } finally {
      setBusy(false);
    }
  };

  const previewWithMapping = async () => {
    if (!content || !validTimeZone) return;
    setBusy(true);
    setError(null);
    try {
      setPreview(
        await postJson<PreviewResponse>("/api/import", {
          mode: "preview",
          content,
          mapping,
          timeZone,
        }),
      );
      setMappingApplied(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.previewFailed);
    } finally {
      setBusy(false);
    }
  };

  const commit = async () => {
    if (!content || !accountId || !preview) return;
    setBusy(true);
    try {
      const result = await postJson<{
        inserted: number;
        duplicates: number;
        skipped?: number;
        warnings?: string[];
      }>("/api/import", {
        mode: "commit",
        content,
        accountId,
        mapping: mappingApplied ? mapping : undefined,
        fileName,
        symbol,
        // Commit with the exact parsing zone used by the reviewed preview.
        timeZone: preview.timeZone,
      });
      const skippedNote =
        result.skipped && result.skipped > 0
          ? t.skippedNote(
              result.skipped,
              localizeServerError((result.warnings ?? []).at(-1) ?? "", locale),
            )
          : "";
      alert(t.imported(result.inserted, result.duplicates, skippedNote));
      router.push("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.importFailed);
    } finally {
      setBusy(false);
    }
  };

  const mappingFields = ["symbol", "side", "quantity", "price", "fee", "timestamp"] as const;

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>{t.uploadTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label
              htmlFor="statement-timezone"
              className="mb-1 block text-xs text-muted-foreground"
            >
              {t.statementTimezone}
            </Label>
            <TimeZonePicker
              id="statement-timezone"
              label={t.statementTimezoneShort}
              value={timeZone}
              disabled={busy || !settingsData}
              describedBy="statement-timezone-help"
              onValueChange={(zone) => {
                setStatementTimeZone(zone);
                setPreview(null);
                setMappingApplied(false);
              }}
            />
            <p id="statement-timezone-help" className="mt-1 text-xs text-muted-foreground">
              {t.statementHelp(displayTimeZone)}
            </p>
            {timeZone && !validTimeZone && (
              <p role="alert" className="mt-1 text-xs text-loss">
                {t.invalidTimezone}
              </p>
            )}
            {settingsError && (
              <p role="alert" className="mt-1 text-xs text-loss">
                {settingsError}
              </p>
            )}
          </div>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center hover:border-ring">
            <FileUp className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm">{fileName || t.dropFile}</span>
            <span className="text-xs text-muted-foreground">
              {t.autoDetected(
                formatData?.formats.map((format) => format.label.split(" (")[0]).join(", ") ?? "",
              )}
            </span>
            <input
              type="file"
              accept=".csv,.txt,.htm,.html,.tsv"
              disabled={busy || !settingsData || !validTimeZone}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onFile(file);
              }}
            />
          </label>
          {content && !preview && (
            <Button onClick={previewFile} disabled={busy || !validTimeZone} variant="outline">
              {busy ? t.reading : t.previewFile}
            </Button>
          )}

          {error && (
            <p role="alert" className="text-sm text-loss">
              {error}
            </p>
          )}
          {preview?.needsSymbol && (
            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-0 flex-1 text-xs text-muted-foreground">
                {t.symbol}
                <Input
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value.toUpperCase())}
                  placeholder={t.symbolPlaceholder}
                  className="mt-1"
                />
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={previewFile}
                disabled={busy || !symbol.trim()}
              >
                {t.preview}
              </Button>
            </div>
          )}
          {preview?.needsMapping && preview.headers && (
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm">{t.unrecognized}</p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {mappingFields.map((field) => (
                  <div key={field}>
                    <Label className="mb-1 block text-xs text-muted-foreground">
                      {t.mappingFields[field]}
                    </Label>
                    <Select
                      value={mapping[field] ?? "none"}
                      onValueChange={(value) =>
                        setMapping((m) => ({ ...m, [field]: value === "none" ? "" : value }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={t.column} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {preview.headers!.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                onClick={previewWithMapping}
                disabled={
                  busy ||
                  !mapping.symbol ||
                  !mapping.side ||
                  !mapping.quantity ||
                  !mapping.price ||
                  !mapping.timestamp
                }
              >
                {t.previewMapping}
              </Button>
            </div>
          )}

          {preview && !preview.needsMapping && preview.totals && (
            <div className="space-y-2 rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">{preview.detected}</Badge>
                <span>{t.executions(preview.totals.executions)}</span>
                <span className="text-muted-foreground">{t.symbols(preview.totals.symbols)}</span>
                {preview.totals.from && (
                  <span className="text-muted-foreground">
                    · {dayKeyOf(preview.totals.from, displayTimeZone)} →{" "}
                    {preview.totals.to && dayKeyOf(preview.totals.to, displayTimeZone)}
                  </span>
                )}
                {preview.totals.skippedRows > 0 && (
                  <span className="text-muted-foreground">
                    {t.rowsSkipped(preview.totals.skippedRows)}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t.zones(preview.timeZone, displayTimeZone)}
              </p>
              {!!preview.executions?.length && (
                <div className="space-y-1 border-t pt-2 text-xs">
                  {preview.executions.slice(0, 5).map((execution, index) => (
                    <div key={index} className="flex flex-wrap gap-x-3">
                      <span>
                        {execution.symbol} · {execution.side.toUpperCase()}
                      </span>
                      <span className="text-muted-foreground">
                        {formatTimestamp(execution.executedAt, displayTimeZone)}
                      </span>
                    </div>
                  ))}
                  {preview.totals.executions > 5 && (
                    <p className="text-muted-foreground">{t.firstFive}</p>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">{t.correcting}</p>
              {preview.warnings?.map((warning, index) => (
                <p key={index} className="text-xs text-muted-foreground">
                  ⚠ {localizeServerError(warning, locale)}
                </p>
              ))}
              {!preview.needsSymbol &&
                preview.errors?.map((message, index) => (
                  <p key={index} role="alert" className="text-xs text-loss">
                    {localizeServerError(message, locale)}
                  </p>
                ))}
              <AccountPicker value={accountId} onChange={setAccountId} kind="import" />
              <Button
                onClick={commit}
                disabled={
                  !accountId || busy || !!preview.errors?.length || !preview.totals.executions
                }
              >
                {busy ? t.importing : t.import}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BrokerConnect() {
  const router = useRouter();
  const { data } = useApi<{ brokers: BrokerInfo[] }>("/api/brokers");
  const t = useT("importer").broker;
  const [brokerId, setBrokerId] = useState("");
  const [name, setName] = useState("");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const broker = data?.brokers.find((b) => b.id === brokerId) ?? null;
  const override = broker ? t.overrides[broker.id] : undefined;

  const connect = async () => {
    if (!broker) return;
    setBusy(true);
    setError(null);
    try {
      const created = await postJson<{ syncing?: boolean }>("/api/accounts", {
        name: name || broker.displayName,
        kind: "sync",
        broker: broker.id,
        credentials,
      });
      // Slow connectors (MetaTrader) finish their first sync in the background.
      router.push(created.syncing ? "/accounts" : "/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.connectFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="mb-1 block text-xs text-muted-foreground">{t.label}</Label>
          <Select
            value={brokerId}
            onValueChange={(value) => {
              setBrokerId(value);
              const next = data?.brokers.find((b) => b.id === value);
              // Choice fields start on their first option, like any select.
              setCredentials(
                Object.fromEntries(
                  (next?.credentials ?? [])
                    .filter((field) => field.options?.length)
                    .map((field) => [field.key, field.options![0]!]),
                ),
              );
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t.choose} />
            </SelectTrigger>
            <SelectContent>
              {data?.brokers.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {broker && (
          <>
            <p className="rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground">
              {override?.setup ?? broker.readOnlySetup}
            </p>
            <div>
              <Label className="mb-1 block text-xs text-muted-foreground">{t.accountName}</Label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={broker.displayName}
              />
            </div>
            {broker.credentials.map((field) => (
              <div key={field.key}>
                <Label className="mb-1 block text-xs text-muted-foreground">
                  {override?.fields?.[field.key] ?? field.label}
                </Label>
                {field.options ? (
                  <Select
                    value={credentials[field.key] ?? ""}
                    onValueChange={(value) => setCredentials((c) => ({ ...c, [field.key]: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={field.secret ? "password" : "text"}
                    value={credentials[field.key] ?? ""}
                    onChange={(event) =>
                      setCredentials((c) => ({ ...c, [field.key]: event.target.value }))
                    }
                    autoComplete="off"
                  />
                )}
              </div>
            ))}
            {error && <p className="text-sm text-loss">{error}</p>}
            <Button
              onClick={connect}
              disabled={busy || broker.credentials.some((field) => !credentials[field.key])}
            >
              {busy ? t.connecting : t.connect}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
