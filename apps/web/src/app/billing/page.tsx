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
const loadSnap = (scriptUrl: string, clientKey: string) => {
  if (window.snap) return Promise.resolve(window.snap);
  snapLoader ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.dataset.clientKey = clientKey;
    script.onload = () =>
      window.snap ? resolve(window.snap) : reject(new Error("Midtrans checkout failed to load"));
    script.onerror = () => {
      snapLoader = null;
      script.remove();
      reject(new Error("Couldn't load Midtrans checkout. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });
  return snapLoader;
};

const planName = (plan: Plan) => PRICING_TIERS.find((tier) => tier.id === plan)?.name ?? plan;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const daysLeft = (iso: string) =>
  Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000));

const STATUS_BADGE: Record<
  BillingPayment["status"],
  { label: string; variant: "profit" | "loss" | "secondary" | "outline" }
> = {
  paid: { label: "Paid", variant: "profit" },
  pending: { label: "Waiting for payment", variant: "secondary" },
  failed: { label: "Failed", variant: "loss" },
  expired: { label: "Expired", variant: "outline" },
  refunded: { label: "Refunded", variant: "outline" },
};

export default function BillingPage() {
  return (
    <Suspense>
      <Billing />
    </Suspense>
  );
}

function Billing() {
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
            text: `Payment received. ${planName(entitlement.plan)} is active${
              entitlement.endsAt ? ` until ${formatDate(entitlement.endsAt)}` : ""
            }.`,
          });
        } else if (result.status === "pending") {
          setNotice({
            tone: "info",
            text: "Waiting for your payment. Once you've paid (bank transfer, QRIS or e-wallet), it usually shows up within a minute — use “Check status” below if it doesn't.",
          });
        } else {
          setNotice({ tone: "error", text: "That payment didn't go through. You can try again." });
        }
        window.dispatchEvent(new Event(ENTITLEMENT_CHANGED_EVENT));
      } catch (cause) {
        setNotice({
          tone: "error",
          text: cause instanceof Error ? cause.message : "Couldn't check the payment status.",
        });
      } finally {
        setBusy(null);
        refresh();
      }
    },
    [refresh],
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
    const snap = await loadSnap(data.snap.scriptUrl, data.snap.clientKey);
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
        text: cause instanceof Error ? cause.message : "Couldn't start the checkout.",
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
      <FilterBar title="Billing" />
      <div className="mx-auto max-w-5xl space-y-4 p-4">
        {error && <p className="text-sm text-loss">{error}</p>}
        {data && !data.snap.production && data.configured && (
          <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            Sandbox mode: payments go through Midtrans&apos;s test environment and no real money is
            charged.
          </p>
        )}
        {data && !data.configured && (
          <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            Payments aren&apos;t configured on this server yet (MIDTRANS_SERVER_KEY /
            MIDTRANS_CLIENT_KEY).
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
              <CardTitle>Current plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <CurrentPlan entitlement={entitlement} />
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">
            {running ? "Extend or change your plan" : "Choose a plan"}
          </h2>
          <div
            className="inline-flex rounded-md border p-0.5"
            role="group"
            aria-label="Billing period"
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
                {option === "month" ? "Monthly" : "Yearly (3 months free)"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {PRICING_TIERS.map((tier) => {
            const current = entitlement?.status === "active" && entitlement.lastPlan === tier.id;
            const switching = entitlement?.status === "active" && !current;
            const label = current
              ? `Extend ${tier.name}`
              : switching
                ? `Switch to ${tier.name}`
                : `Choose ${tier.name}`;
            return (
              <Card key={tier.id} className={cn(current && "border-brand/60")}>
                <CardHeader className="flex-row items-center justify-between gap-2">
                  <CardTitle className="text-base font-semibold text-foreground normal-case tracking-normal">
                    {tier.name}
                  </CardTitle>
                  {current && <Badge variant="profit">Current</Badge>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-2xl font-semibold tabular-nums">
                      {formatRupiah(interval === "month" ? tier.monthlyPrice : tier.yearlyPrice)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {interval === "month" ? " / bulan" : " / tahun"}
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
                    {busy === tier.id ? "Opening checkout…" : label}
                  </Button>
                  {switching && (
                    <p className="text-xs text-muted-foreground">
                      Your unused {planName(entitlement.lastPlan)} time is converted to {tier.name}{" "}
                      days at the price ratio.
                    </p>
                  )}
                  {entitlement?.status === "trial" && (
                    <p className="text-xs text-muted-foreground">
                      Paid time starts after your trial ends — you keep your remaining trial days.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {data && data.payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment history</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.payments.map((payment) => (
                    <TableRow key={payment.orderId}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(payment.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {planName(payment.plan)} ·{" "}
                        {payment.interval === "month" ? "1 month" : "1 year"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatRupiah(payment.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.paymentType?.replaceAll("_", " ") ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[payment.status].variant}>
                          {STATUS_BADGE[payment.status].label}
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
                                Continue payment
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy !== null}
                              onClick={() => void verify(payment.orderId)}
                            >
                              {busy === payment.orderId ? "Checking…" : "Check status"}
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
  const { status, lastPlan, endsAt } = entitlement;
  if (status === "trial" && endsAt) {
    return (
      <>
        <p className="text-lg font-semibold">Free trial · {planName(lastPlan)} features</p>
        <p className="text-sm text-muted-foreground">
          {daysLeft(endsAt)} of {TRIAL_DAYS} days left — ends {formatDate(endsAt)}. Choose a plan
          before then to keep adding trades and notes.
        </p>
      </>
    );
  }
  if (status === "active" && endsAt) {
    return (
      <>
        <p className="text-lg font-semibold">{planName(lastPlan)}</p>
        <p className="text-sm text-muted-foreground">
          Paid through {formatDate(endsAt)} ({daysLeft(endsAt)} days left). Plans don&apos;t renew
          automatically — extend any time and the new period is added on top.
        </p>
      </>
    );
  }
  if (status === "comp") {
    return (
      <>
        <p className="text-lg font-semibold">{planName(lastPlan)}</p>
        <p className="text-sm text-muted-foreground">Complimentary plan — no expiry.</p>
      </>
    );
  }
  return (
    <>
      <p className="text-lg font-semibold text-loss">
        {entitlement.wasTrial
          ? "Your free trial has ended"
          : `Your ${planName(lastPlan)} plan has ended`}
        {endsAt ? ` (${formatDate(endsAt)})` : ""}
      </p>
      <p className="text-sm text-muted-foreground">
        Your journal is read-only: everything is still here to view and export, but adding or
        editing needs an active plan.
      </p>
    </>
  );
}
