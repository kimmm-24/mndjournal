"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { FilterBar } from "@/components/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ENTITLEMENT_CHANGED_EVENT,
  type BillingPayment,
  TRIAL_DAYS,
  type BillingInterval,
  type Entitlement,
  type Plan,
} from "@/lib/plan";
import { formatRupiah, PRICING_TIERS } from "@/lib/pricing-data";
import { postJson, useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";
import { useI18n, useT } from "@/components/i18n";

interface BillingState {
  entitlement: Entitlement;
  payments: BillingPayment[];
  configured: boolean;
  snap: { clientKey: string; production: boolean; scriptUrl: string };
}

interface SnapCallbacks {
  onSuccess: () => void;
  onPending: () => void;
  onError: () => void;
  onClose: () => void;
}

declare global {
  interface Window {
    snap?: { pay: (token: string, callbacks: SnapCallbacks) => void };
  }
}

let snapLoader: Promise<NonNullable<Window["snap"]>> | null = null;

/** Snap's script is environment-specific (sandbox vs production host), so it's loaded on demand. */
const loadSnap = (
  scriptUrl: string,
  clientKey: string,
  errors: { loadFailed: string; unreachable: string },
) => {
  if (window.snap) return Promise.resolve(window.snap);
  snapLoader ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.dataset.clientKey = clientKey;
    script.onload = () =>
      window.snap ? resolve(window.snap) : reject(new Error(errors.loadFailed));
    script.onerror = () => {
      snapLoader = null;
      script.remove();
      reject(new Error(errors.unreachable));
    };
    document.body.appendChild(script);
  });
  return snapLoader;
};

const planName = (plan: Plan) => PRICING_TIERS.find((tier) => tier.id === plan)?.name ?? plan;

const formatDate = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });

const daysLeft = (iso: string) =>
  Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000));

const STATUS_VARIANT: Record<
  BillingPayment["status"],
  "profit" | "loss" | "secondary" | "outline"
> = {
  paid: "profit",
  pending: "secondary",
  failed: "loss",
  expired: "outline",
  refunded: "outline",
};

export default function BillingPage() {
  return (
    <Suspense>
      <Billing />
    </Suspense>
  );
}

function Billing() {
  const t = useT("billing");
  const { dateLocale } = useI18n();
  const date = (iso: string) => formatDate(iso, dateLocale);
  const { data, error, refresh } = useApi<BillingState>("/api/billing");
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [interval, setBillingInterval] = useState<BillingInterval>("month");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(
    null,
  );

  const verify = useCallback(
    async (orderId: string) => {
      setBusy(orderId);
      try {
        const result = await postJson<{
          status: BillingPayment["status"];
          entitlement: Entitlement;
        }>("/api/billing/verify", { orderId });
        if (result.status === "paid") {
          const { entitlement } = result;
          setNotice({
            tone: "ok",
            text: t.received(
              planName(entitlement.plan),
              entitlement.endsAt ? date(entitlement.endsAt) : null,
            ),
          });
        } else if (result.status === "pending") {
          setNotice({
            tone: "info",
            text: t.waiting,
          });
        } else {
          setNotice({ tone: "error", text: t.notThrough });
        }
        window.dispatchEvent(new Event(ENTITLEMENT_CHANGED_EVENT));
      } catch (cause) {
        setNotice({
          tone: "error",
          text: cause instanceof Error ? cause.message : t.checkFailed,
        });
      } finally {
        setBusy(null);
        refresh();
      }
    },
    // `t` changes exactly when the language (and so the date format) does.
    [refresh, t],
  );

  // Redirect flow (mobile e-wallets, 3DS): Midtrans sends the user back to
  // /billing?order_id=… — settle that order once, then drop the query.
  const redirectOrder = search.get("order_id");
  const handledRedirect = useRef<string | null>(null);
  useEffect(() => {
    if (!redirectOrder || handledRedirect.current === redirectOrder) return;
    handledRedirect.current = redirectOrder;
    router.replace(pathname);
    void verify(redirectOrder);
  }, [redirectOrder, router, pathname, verify]);

  const openSnap = async (token: string, orderId: string) => {
    if (!data) return;
    const snap = await loadSnap(data.snap.scriptUrl, data.snap.clientKey, {
      loadFailed: t.snapLoadFailed,
      unreachable: t.snapUnreachable,
    });
    const settle = () => void verify(orderId);
    snap.pay(token, { onSuccess: settle, onPending: settle, onError: settle, onClose: settle });
  };

  const checkout = async (plan: Plan) => {
    setBusy(plan);
    setNotice(null);
    try {
      const { orderId, token } = await postJson<{ orderId: string; token: string }>(
        "/api/billing/checkout",
        { plan, interval },
      );
      await openSnap(token, orderId);
    } catch (cause) {
      setNotice({
        tone: "error",
        text: cause instanceof Error ? cause.message : t.checkoutFailed,
      });
      refresh();
    } finally {
      setBusy(null);
    }
  };

  const entitlement = data?.entitlement;
  const running = entitlement?.status === "active" || entitlement?.status === "trial";

  return (
    <div>
      <FilterBar title={t.title} />
      <div className="mx-auto max-w-5xl space-y-4 p-4">
        {error && <p className="text-sm text-loss">{error}</p>}
        {data && !data.snap.production && data.configured && (
          <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            {t.sandbox}
          </p>
        )}
        {data && !data.configured && (
          <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            {t.notConfigured}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className={cn(
              "rounded-md border px-3 py-2 text-sm",
              notice.tone === "ok" && "border-profit/40 bg-profit/10 text-profit",
              notice.tone === "error" && "border-loss/40 bg-loss/10 text-loss",
              notice.tone === "info" && "text-muted-foreground",
            )}
          >
            {notice.text}
          </p>
        )}

        {entitlement && (
          <Card>
            <CardHeader>
              <CardTitle>{t.currentPlan}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <CurrentPlan entitlement={entitlement} />
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{running ? t.extendOrChange : t.choosePlan}</h2>
          <div
            className="inline-flex rounded-md border p-0.5"
            role="group"
            aria-label={t.billingPeriod}
          >
            {(["month", "year"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={interval === option}
                onClick={() => setBillingInterval(option)}
                className={cn(
                  "rounded px-3 py-1 text-xs font-medium transition-colors",
                  interval === option
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option === "month" ? t.monthly : t.yearly}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {PRICING_TIERS.map((tier) => {
            const current = entitlement?.status === "active" && entitlement.lastPlan === tier.id;
            const switching = entitlement?.status === "active" && !current;
            const label = current
              ? t.extendTier(tier.name)
              : switching
                ? t.switchTier(tier.name)
                : t.chooseTier(tier.name);
            return (
              <Card key={tier.id} className={cn(current && "border-brand/60")}>
                <CardHeader className="flex-row items-center justify-between gap-2">
                  <CardTitle className="text-base font-semibold text-foreground normal-case tracking-normal">
                    {tier.name}
                  </CardTitle>
                  {current && <Badge variant="profit">{t.current}</Badge>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-2xl font-semibold tabular-nums">
                      {formatRupiah(interval === "month" ? tier.monthlyPrice : tier.yearlyPrice)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {interval === "month" ? t.perMonth : t.perYear}
                    </span>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {tier.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={current || tier.highlighted ? "default" : "outline"}
                    disabled={!data?.configured || busy !== null}
                    onClick={() => void checkout(tier.id)}
                  >
                    {busy === tier.id ? t.openingCheckout : label}
                  </Button>
                  {switching && (
                    <p className="text-xs text-muted-foreground">
                      {t.switchNote(planName(entitlement.lastPlan), tier.name)}
                    </p>
                  )}
                  {entitlement?.status === "trial" && (
                    <p className="text-xs text-muted-foreground">{t.trialNote}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {data && data.payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t.history}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.columns.date}</TableHead>
                    <TableHead>{t.columns.plan}</TableHead>
                    <TableHead className="text-right">{t.columns.amount}</TableHead>
                    <TableHead>{t.columns.method}</TableHead>
                    <TableHead>{t.columns.status}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.payments.map((payment) => (
                    <TableRow key={payment.orderId}>
                      <TableCell className="whitespace-nowrap">{date(payment.createdAt)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {planName(payment.plan)} ·{" "}
                        {payment.interval === "month" ? t.oneMonth : t.oneYear}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatRupiah(payment.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.paymentType?.replaceAll("_", " ") ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[payment.status]}>
                          {t.status[payment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {payment.status === "pending" && (
                          <div className="flex justify-end gap-1">
                            {payment.resumeToken && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy !== null}
                                onClick={() =>
                                  void openSnap(payment.resumeToken!, payment.orderId).catch(
                                    (cause: unknown) =>
                                      setNotice({
                                        tone: "error",
                                        text:
                                          cause instanceof Error ? cause.message : String(cause),
                                      }),
                                  )
                                }
                              >
                                {t.continuePayment}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy !== null}
                              onClick={() => void verify(payment.orderId)}
                            >
                              {busy === payment.orderId ? t.checking : t.checkStatus}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function CurrentPlan({ entitlement }: { entitlement: Entitlement }) {
  const t = useT("billing");
  const { dateLocale } = useI18n();
  const date = (iso: string) => formatDate(iso, dateLocale);
  const { status, lastPlan, endsAt } = entitlement;
  if (status === "trial" && endsAt) {
    return (
      <>
        <p className="text-lg font-semibold">{t.trialTitle(planName(lastPlan))}</p>
        <p className="text-sm text-muted-foreground">
          {t.trialBody(daysLeft(endsAt), TRIAL_DAYS, date(endsAt))}
        </p>
      </>
    );
  }
  if (status === "active" && endsAt) {
    return (
      <>
        <p className="text-lg font-semibold">{planName(lastPlan)}</p>
        <p className="text-sm text-muted-foreground">
          {t.paidThrough(date(endsAt), daysLeft(endsAt))}
        </p>
      </>
    );
  }
  if (status === "comp") {
    return (
      <>
        <p className="text-lg font-semibold">{planName(lastPlan)}</p>
        <p className="text-sm text-muted-foreground">{t.complimentary}</p>
      </>
    );
  }
  return (
    <>
      <p className="text-lg font-semibold text-loss">
        {entitlement.wasTrial ? t.trialEnded : t.planEnded(planName(lastPlan))}
        {endsAt ? ` (${date(endsAt)})` : ""}
      </p>
      <p className="text-sm text-muted-foreground">{t.readOnly}</p>
    </>
  );
}
