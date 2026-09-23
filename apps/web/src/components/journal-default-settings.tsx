"use client";
import { OptionSelect } from "@/components/ui/option-select";

import { MonetaryField } from "./privacy";
import { useEffect, useState } from "react";
import { useApi, postJson } from "@/lib/use-api";
import {
  EMPTY_DEFAULTS,
  type JournalDefaults,
  type FeeRule,
  type RiskRule,
} from "@/lib/journal-defaults";
import { Field, fieldClass } from "@/components/filter-fields";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "./i18n";
export function JournalDefaultSettings() {
  const t = useT("settings").defaults;
  const { data, error } = useApi<JournalDefaults>("/api/workspace/defaults"),
    { data: accounts } = useApi<{ accounts: { id: string; name: string }[] }>("/api/accounts");
  const [draft, setDraft] = useState(EMPTY_DEFAULTS),
    [status, setStatus] = useState("");
  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);
  const matchFields = (r: FeeRule | RiskRule, update: (r: FeeRule | RiskRule) => void) => (
    <>
      <Field label={t.account}>
        <OptionSelect
          className={fieldClass}
          value={r.accountId}
          onValueChange={(next) => update({ ...r, accountId: next })}
        >
          <option value="">{t.allAccounts}</option>
          {accounts?.accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </OptionSelect>
      </Field>
      <Field label={t.symbol}>
        <input
          className={fieldClass}
          value={r.symbol}
          placeholder={t.symbolPlaceholder}
          onChange={(e) => update({ ...r, symbol: e.target.value.toUpperCase() })}
        />
      </Field>
    </>
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t.breakevenRange}>
            <MonetaryField sensitive={draft.breakevenMode === "money"}>
              <input
                type="number"
                step="any"
                min="0"
                className={fieldClass}
                value={draft.breakeven}
                onChange={(e) => setDraft({ ...draft, breakeven: Number(e.target.value) })}
              />
            </MonetaryField>
          </Field>
          <Field label={t.rangeUnit}>
            <OptionSelect
              className={fieldClass}
              value={draft.breakevenMode}
              onValueChange={(next) =>
                setDraft({ ...draft, breakevenMode: next as "money" | "percent" })
              }
            >
              <option value="money">{t.accountCurrency}</option>
              <option value="percent">{t.percentOfNotional}</option>
            </OptionSelect>
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">{t.breakevenHelp}</p>
        <div className="space-y-3">
          <h3 className="text-sm font-medium">{t.feesTitle}</h3>
          <p className="text-xs text-muted-foreground">{t.feesHelp}</p>
          {draft.feeRules.map((r, i) => {
            const update = (next: FeeRule | RiskRule) =>
              setDraft({
                ...draft,
                feeRules: draft.feeRules.map((old, j) => (j === i ? (next as FeeRule) : old)),
              });
            return (
              <div key={r.id} className="space-y-2 rounded-md border p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {matchFields(r, update)}
                  <Field label={t.feeAmount}>
                    <MonetaryField>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className={fieldClass}
                        value={r.amount}
                        onChange={(e) => update({ ...r, amount: Number(e.target.value) })}
                      />
                    </MonetaryField>
                  </Field>
                  <Field label={t.chargePer}>
                    <OptionSelect
                      className={fieldClass}
                      value={r.mode}
                      onValueChange={(next) => update({ ...r, mode: next as FeeRule["mode"] })}
                    >
                      <option value="execution">{t.perExecution}</option>
                      <option value="unit">{t.perUnit}</option>
                    </OptionSelect>
                  </Field>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setDraft({ ...draft, feeRules: draft.feeRules.filter((x) => x.id !== r.id) })
                  }
                >
                  {t.removeFeeRule}
                </Button>
              </div>
            );
          })}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setDraft({
                ...draft,
                feeRules: [
                  ...draft.feeRules,
                  {
                    id: crypto.randomUUID(),
                    accountId: "",
                    symbol: "",
                    amount: 0,
                    mode: "execution",
                  },
                ],
              })
            }
          >
            {t.addFeeRule}
          </Button>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-medium">{t.riskTitle}</h3>
          <p className="text-xs text-muted-foreground">{t.riskHelp}</p>
          {draft.riskRules.map((r, i) => {
            const update = (next: FeeRule | RiskRule) =>
              setDraft({
                ...draft,
                riskRules: draft.riskRules.map((old, j) => (j === i ? (next as RiskRule) : old)),
              });
            return (
              <div key={r.id} className="space-y-2 rounded-md border p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {matchFields(r, update)}
                  <Field label={t.stopDistance}>
                    <MonetaryField sensitive={r.mode === "price"}>
                      <input
                        type="number"
                        min="0.000001"
                        step="any"
                        className={fieldClass}
                        value={r.stop}
                        onChange={(e) => update({ ...r, stop: Number(e.target.value) })}
                      />
                    </MonetaryField>
                  </Field>
                  <Field label={t.targetDistance}>
                    <MonetaryField sensitive={r.mode === "price"}>
                      <input
                        type="number"
                        min="0.000001"
                        step="any"
                        className={fieldClass}
                        value={r.target}
                        onChange={(e) => update({ ...r, target: Number(e.target.value) })}
                      />
                    </MonetaryField>
                  </Field>
                  <Field label={t.distanceUnit}>
                    <OptionSelect
                      className={fieldClass}
                      value={r.mode}
                      onValueChange={(next) => update({ ...r, mode: next as RiskRule["mode"] })}
                    >
                      <option value="price">{t.pricePoints}</option>
                      <option value="percent">{t.percentOfPrice}</option>
                    </OptionSelect>
                  </Field>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setDraft({ ...draft, riskRules: draft.riskRules.filter((x) => x.id !== r.id) })
                  }
                >
                  {t.removeRiskRule}
                </Button>
              </div>
            );
          })}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setDraft({
                ...draft,
                riskRules: [
                  ...draft.riskRules,
                  {
                    id: crypto.randomUUID(),
                    accountId: "",
                    symbol: "",
                    stop: 1,
                    target: 2,
                    mode: "price",
                  },
                ],
              })
            }
          >
            {t.addRiskRule}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={!data}
            onClick={async () => {
              try {
                setStatus(t.saving);
                await postJson("/api/workspace/defaults", draft);
                setStatus(t.savedStatus);
              } catch (e) {
                setStatus(e instanceof Error ? e.message : t.saveFailed);
              }
            }}
          >
            {t.save}
          </Button>
          <span role="status" className="text-xs">
            {status}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
