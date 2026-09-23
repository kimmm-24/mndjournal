"use client";
import { useState, type ReactNode } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { OptionSelect } from "./ui/option-select";
import { DatePicker } from "./ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Field, fieldClass } from "./filter-fields";
import { Attachments } from "./attachments";
import { useApi, postJson } from "@/lib/use-api";
import { decodeImportFile } from "@/lib/decode-import";
import {
  fromMinor,
  label as baseLabel,
  PROP_PROGRAMS,
  PROP_STATES,
  PAYOUT_STATES,
  EXPENSE_CATEGORIES,
  type PropAccount,
  type PropEntry,
  type PropData,
  type PropAudit,
} from "@/lib/prop-firms";
import { useT } from "./i18n";
export type PropModal =
  | { kind: "account"; account?: PropAccount; parent?: PropAccount }
  | {
      kind: "entry";
      entry?: PropEntry;
      type: PropEntry["kind"];
      accountId?: string;
      category?: string;
      expense?: PropEntry;
    }
  | { kind: "receipt"; payout: PropEntry }
  | { kind: "detail"; type: "account" | "entry"; id: string }
  | {
      kind: "change";
      action: string;
      id: string;
      revision: number;
      payoutId?: string;
      value: boolean;
      name: string;
    }
  | { kind: "import" };
type Props = { modal: PropModal; data: PropData; close: () => void; refresh: () => void };
/** Stored enum value → display name in the current language. */
function useLabel() {
  const labels = useT("prop").labels;
  return (value: string) => labels[value] ?? baseLabel(value);
}
export function PropFirmModal(props: Props) {
  const { modal, close } = props;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-w-2xl">
        {modal.kind === "account" ? (
          <AccountForm {...props} modal={modal} />
        ) : modal.kind === "entry" ? (
          <EntryForm {...props} modal={modal} />
        ) : modal.kind === "receipt" ? (
          <ReceiptForm {...props} modal={modal} />
        ) : modal.kind === "change" ? (
          <ChangeForm {...props} modal={modal} />
        ) : modal.kind === "import" ? (
          <ImportForm {...props} />
        ) : (
          <Detail {...props} modal={modal} />
        )}
      </DialogContent>
    </Dialog>
  );
}
function useSave(close: () => void, refresh: () => void) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const save = async (body: unknown) => {
    setBusy(true);
    setError("");
    try {
      await postJson("/api/prop-firms", body);
      refresh();
      close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, save };
}
function Form({
  title,
  description,
  busy,
  error,
  children,
  submit,
}: {
  title: string;
  description: string;
  busy: boolean;
  error: string;
  children: ReactNode;
  submit: () => void;
}) {
  const t = useT("prop").forms;
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) submit();
        }}
      >
        <fieldset disabled={busy} className="space-y-4">
          {children}
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? t.saving : t.save}
        </Button>
      </form>
    </>
  );
}
const blankAccount = (today: string, parent?: PropAccount) => ({
  firm: parent?.firm ?? "",
  name: "",
  program: "evaluation",
  status: "active",
  currency: parent?.currency ?? "",
  size: parent?.sizeMinor == null ? "" : fromMinor(parent.sizeMinor, parent.currency),
  parentId: parent?.id ?? "",
  journalAccountId: "",
  openedOn: today,
  closedOn: "",
  renewalOn: "",
  renewalAmount: "",
  notes: "",
  reason: "",
});
function AccountForm({
  modal,
  data,
  close,
  refresh,
}: Props & { modal: Extract<PropModal, { kind: "account" }> }) {
  const old = modal.account;
  const t = useT("prop").forms;
  const label = useLabel();
  const [id] = useState(() => old?.id ?? crypto.randomUUID());
  const [values, set] = useState(() =>
    old
      ? {
          firm: old.firm,
          name: old.name,
          program: old.program,
          status: old.status,
          currency: old.currency,
          size: old.sizeMinor == null ? "" : fromMinor(old.sizeMinor, old.currency),
          parentId: old.parentId ?? "",
          journalAccountId: old.journalAccountId ?? "",
          openedOn: old.openedOn,
          closedOn: old.closedOn ?? "",
          renewalOn: old.renewalOn ?? "",
          renewalAmount: old.renewalMinor == null ? "" : fromMinor(old.renewalMinor, old.currency),
          notes: old.notes,
          reason: "",
        }
      : blankAccount(data.today, modal.parent),
  );
  const { data: journal } = useApi<{ accounts: { id: string; name: string }[] }>(
    "/api/accounts?summary=1",
  );
  const { busy, error, save } = useSave(close, refresh);
  const input = (key: keyof typeof values, title: string, required = false) => (
    <Field label={title}>
      <Input
        value={values[key]}
        required={required}
        onChange={(e) =>
          set({
            ...values,
            [key]: key === "currency" ? e.target.value.toUpperCase() : e.target.value,
          })
        }
      />
    </Field>
  );
  return (
    <Form
      title={old ? t.editAccount : modal.parent ? t.nextPhase : t.newAccount}
      description={t.accountBody}
      busy={busy}
      error={error}
      submit={() =>
        void save({ action: "account.save", id, revision: old?.revision ?? 0, ...values })
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {input("firm", t.firmName, true)}
        {input("name", t.accountName, true)}
        <Field label={t.program}>
          <OptionSelect
            value={values.program}
            onValueChange={(program) => set({ ...values, program })}
          >
            {PROP_PROGRAMS.map((v) => (
              <option key={v} value={v}>
                {label(v)}
              </option>
            ))}
          </OptionSelect>
        </Field>
        <Field label={t.status}>
          <OptionSelect
            value={values.status}
            onValueChange={(status) =>
              set({
                ...values,
                status,
                closedOn: status === "active" ? "" : values.closedOn || data.today,
                renewalOn: status === "active" ? values.renewalOn : "",
              })
            }
          >
            {PROP_STATES.map((v) => (
              <option key={v} value={v}>
                {label(v)}
              </option>
            ))}
          </OptionSelect>
        </Field>
        {input("currency", t.currencyCode, true)}
        {input("size", t.size)}
        <Field label={t.openedOn}>
          <DatePicker
            label={t.openedOnLabel}
            value={values.openedOn}
            max={data.today}
            onValueChange={(openedOn) => set({ ...values, openedOn })}
          />
        </Field>
        {values.status !== "active" && (
          <Field label={t.resolvedOn}>
            <DatePicker
              label={t.resolvedOnLabel}
              value={values.closedOn}
              max={data.today}
              onValueChange={(closedOn) => set({ ...values, closedOn })}
            />
          </Field>
        )}
        <Field label={t.previousPhase}>
          <OptionSelect
            value={values.parentId}
            onValueChange={(parentId) => set({ ...values, parentId })}
          >
            <option value="">{t.none}</option>
            {data.accounts
              .filter(
                (a) =>
                  a.id !== id &&
                  a.firm.toLowerCase() === values.firm.trim().toLowerCase() &&
                  a.currency === values.currency,
              )
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
          </OptionSelect>
        </Field>
        <Field label={t.linkJournal}>
          <OptionSelect
            value={values.journalAccountId}
            onValueChange={(journalAccountId) => set({ ...values, journalAccountId })}
          >
            <option value="">{t.noJournal}</option>
            {journal?.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </OptionSelect>
        </Field>
      </div>
      <details>
        <summary className="cursor-pointer text-sm">{t.renewal}</summary>
        <p className="my-2 text-xs text-muted-foreground">{t.renewalNote}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t.nextRenewal}>
            <DatePicker
              label={t.nextRenewalLabel}
              value={values.renewalOn}
              onValueChange={(renewalOn) => set({ ...values, renewalOn })}
            />
          </Field>
          {input("renewalAmount", t.renewalAmount)}
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => set({ ...values, renewalOn: "", renewalAmount: "" })}
        >
          {t.clearReminder}
        </Button>
      </details>
      <Field label={t.notesRules}>
        <textarea
          className={`${fieldClass} h-24 py-2`}
          value={values.notes}
          onChange={(e) => set({ ...values, notes: e.target.value })}
        />
      </Field>
      {old && input("reason", t.reason, true)}
    </Form>
  );
}
function EntryForm({
  modal,
  data,
  close,
  refresh,
}: Props & { modal: Extract<PropModal, { kind: "entry" }> }) {
  const old = modal.entry,
    expense = modal.expense;
  const t = useT("prop").forms;
  const label = useLabel();
  const [id] = useState(() => old?.id ?? crypto.randomUUID());
  const initialAccount = data.accounts.find(
    (a) => a.id === (old?.accountId ?? expense?.accountId ?? modal.accountId),
  );
  const [values, set] = useState({
    accountId: old?.accountId ?? expense?.accountId ?? initialAccount?.id ?? "",
    firm: old?.firm ?? expense?.firm ?? initialAccount?.firm ?? "",
    currency: old?.currency ?? expense?.currency ?? initialAccount?.currency ?? "",
    category: old?.category ?? modal.category ?? "evaluation",
    amount: old ? fromMinor(old.amountMinor, old.currency) : "",
    splitPercent: old ? (old.splitBps / 100).toFixed(2) : "",
    fee: old ? fromMinor(old.feeMinor, old.currency) : "0",
    occurredOn: old?.occurredOn ?? data.today,
    dueOn: old?.dueOn ?? "",
    status: old?.status ?? "requested",
    parentId: old?.parentId ?? expense?.id ?? "",
    reference: old?.reference ?? "",
    notes: old?.notes ?? "",
    reason: "",
  });
  const kind = old?.kind ?? modal.type,
    payout = kind === "payout",
    refund = kind === "refund";
  const { busy, error, save } = useSave(close, refresh);
  const input = (key: keyof typeof values, title: string, required = false, disabled = false) => (
    <Field label={title}>
      <Input
        required={required}
        disabled={disabled}
        value={values[key]}
        onChange={(e) =>
          set({
            ...values,
            [key]: key === "currency" ? e.target.value.toUpperCase() : e.target.value,
          })
        }
      />
    </Field>
  );
  return (
    <Form
      title={
        old
          ? t.editEntry(label(kind))
          : payout
            ? t.logPayout
            : refund
              ? t.recordRefund
              : t.recordSpending
      }
      description={payout ? t.payoutBody : t.spendingBody}
      busy={busy}
      error={error}
      submit={() =>
        void save({ action: "entry.save", id, revision: old?.revision ?? 0, kind, ...values })
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.propAccount}>
          <OptionSelect
            disabled={Boolean(old || refund)}
            value={values.accountId}
            onValueChange={(accountId) => {
              const a = data.accounts.find((a) => a.id === accountId);
              set({ ...values, accountId, firm: a?.firm ?? "", currency: a?.currency ?? "" });
            }}
          >
            <option value="">{payout ? t.chooseFunded : t.sharedExpense}</option>
            {data.accounts
              .filter((a) => !payout || ["funded", "instant_funded", "live"].includes(a.program))
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.firm} · {a.name}
                  {a.archived ? t.archivedSuffix : ""}
                </option>
              ))}
          </OptionSelect>
        </Field>
        {input("firm", t.firm, true, Boolean(values.accountId || old || refund))}
        {input("currency", t.currency, true, Boolean(values.accountId || old || refund))}
        {!payout && !refund && (
          <Field label={t.category}>
            <OptionSelect
              value={values.category}
              onValueChange={(category) => set({ ...values, category })}
            >
              {EXPENSE_CATEGORIES.map((v) => (
                <option key={v} value={v}>
                  {label(v)}
                </option>
              ))}
            </OptionSelect>
          </Field>
        )}
        {input("amount", payout ? t.grossRequested : t.actualAmount, true)}
        {payout && (
          <>
            {input("splitPercent", t.share, true)}
            {input("fee", t.fees, true)}
            <p className="col-span-full text-xs text-muted-foreground">{t.splitNote}</p>
          </>
        )}
        <Field label={payout ? t.requestDate : t.cashDate}>
          <DatePicker
            label={payout ? t.requestDateLabel : t.transactionDate}
            value={values.occurredOn}
            max={data.today}
            onValueChange={(occurredOn) => set({ ...values, occurredOn })}
          />
        </Field>
        {payout && (
          <>
            <Field label={t.expectedDate}>
              <DatePicker
                label={t.expectedDateLabel}
                value={values.dueOn}
                onValueChange={(dueOn) => set({ ...values, dueOn })}
              />
            </Field>
            <Field label={t.payoutStatus}>
              <OptionSelect
                value={values.status}
                onValueChange={(status) =>
                  set({ ...values, status: status as PropEntry["status"] })
                }
              >
                {PAYOUT_STATES.filter((s) => old || s !== "completed").map((v) => (
                  <option key={v} value={v}>
                    {label(v)}
                  </option>
                ))}
              </OptionSelect>
            </Field>
          </>
        )}
        {input("reference", t.reference)}
      </div>
      <Field label={t.notes}>
        <textarea
          className={`${fieldClass} h-20 py-2`}
          value={values.notes}
          onChange={(e) => set({ ...values, notes: e.target.value })}
        />
      </Field>
      {refund && (
        <p className="text-xs text-muted-foreground">{t.linkedExpense(values.parentId)}</p>
      )}
      {old && input("reason", t.reason, true)}
    </Form>
  );
}
function ReceiptForm({
  modal,
  data,
  close,
  refresh,
}: Props & { modal: Extract<PropModal, { kind: "receipt" }> }) {
  const { payout } = modal;
  const t = useT("prop").forms;
  const [id] = useState(() => crypto.randomUUID());
  const [values, set] = useState({
    kind: "receipt",
    amount: "",
    occurredOn: data.today,
    reference: "",
    notes: "",
  });
  const { busy, error, save } = useSave(close, refresh);
  return (
    <Form
      title={t.receiptTitle}
      description={t.receiptBody(payout.currency)}
      busy={busy}
      error={error}
      submit={() =>
        void save({
          action: "receipt.add",
          id,
          payoutId: payout.id,
          revision: payout.revision,
          ...values,
        })
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.movement}>
          <OptionSelect value={values.kind} onValueChange={(kind) => set({ ...values, kind })}>
            <option value="receipt">{t.moneyReceived}</option>
            <option value="reversal">{t.moneyReturned}</option>
          </OptionSelect>
        </Field>
        <Field label={t.actualIn(payout.currency)}>
          <Input
            required
            value={values.amount}
            onChange={(e) => set({ ...values, amount: e.target.value })}
          />
        </Field>
        <Field label={t.settlement}>
          <DatePicker
            label={t.settlement}
            value={values.occurredOn}
            max={data.today}
            onValueChange={(occurredOn) => set({ ...values, occurredOn })}
          />
        </Field>
        <Field label={t.bankReference}>
          <Input
            value={values.reference}
            onChange={(e) => set({ ...values, reference: e.target.value })}
          />
        </Field>
      </div>
      <Field label={t.notes}>
        <textarea
          className={`${fieldClass} h-20 py-2`}
          value={values.notes}
          onChange={(e) => set({ ...values, notes: e.target.value })}
        />
      </Field>
      <p className="text-xs text-muted-foreground">{t.partialNote}</p>
    </Form>
  );
}
function ChangeForm({
  modal,
  close,
  refresh,
}: Props & { modal: Extract<PropModal, { kind: "change" }> }) {
  const [reason, setReason] = useState("");
  const t = useT("prop").forms;
  const { busy, error, save } = useSave(close, refresh);
  return (
    <Form
      title={modal.name}
      description={modal.action === "account.archive" ? t.archiveBody : t.voidBody}
      busy={busy}
      error={error}
      submit={() =>
        void save({
          action: modal.action,
          id: modal.id,
          revision: modal.revision,
          payoutId: modal.payoutId,
          [modal.action === "account.archive" ? "archived" : "voided"]: modal.value,
          reason,
        })
      }
    >
      <Field label={t.reasonLabel}>
        <Input required value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </Form>
  );
}
function Detail({ modal, data }: Props & { modal: Extract<PropModal, { kind: "detail" }> }) {
  const account = modal.type === "account" ? data.accounts.find((a) => a.id === modal.id) : null;
  const entry = modal.type === "entry" ? data.entries.find((e) => e.id === modal.id) : null;
  const t = useT("prop").forms;
  const label = useLabel();
  const { data: history } = useApi<{ history: PropAudit[] }>(
    `/api/prop-firms?type=${modal.type}&history=${encodeURIComponent(modal.id)}`,
  );
  return (
    <>
      <DialogHeader>
        <DialogTitle>{account?.name ?? t.entryDetails(label(entry?.kind ?? "entry"))}</DialogTitle>
        <DialogDescription>
          {account?.firm ?? entry?.firm} · {modal.id}
        </DialogDescription>
      </DialogHeader>
      <p className="whitespace-pre-wrap text-sm">{account?.notes || entry?.notes || t.noNotes}</p>
      {account && (
        <>
          <p className="break-all text-xs text-muted-foreground">{t.accountId(account.id)}</p>
          {account.parentId && (
            <p className="text-sm">
              {t.previousLabel}{" "}
              {data.accounts.find((a) => a.id === account.parentId)?.name ?? account.parentId}
            </p>
          )}
          {account.journalAccountId && (
            <a
              className="text-sm underline"
              href={`/trades?accounts=${encodeURIComponent(account.journalAccountId)}`}
            >
              {t.openJournal}
            </a>
          )}
        </>
      )}
      <Attachments type={modal.type === "account" ? "prop-account" : "prop-entry"} id={modal.id} />
      <details>
        <summary className="cursor-pointer text-sm">{t.history}</summary>
        <div className="mt-3 space-y-3">
          {history?.history.map((item) => (
            <details key={item.id} className="rounded-md border p-2 text-xs">
              <summary className="cursor-pointer">
                {item.createdAt} ·{" "}
                {item.reason.startsWith("CSV import") ? t.csvImport : item.reason}
              </summary>
              <p className="my-2 font-medium">{t.before}</p>
              <pre className="whitespace-pre-wrap break-all">
                {item.beforeJson
                  ? JSON.stringify(JSON.parse(item.beforeJson), null, 2)
                  : t.newRecord}
              </pre>
              <p className="my-2 font-medium">{t.after}</p>
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(JSON.parse(item.afterJson), null, 2)}
              </pre>
            </details>
          ))}
        </div>
      </details>
    </>
  );
}
function ImportForm({ close, refresh }: Props) {
  const t = useT("prop").forms;
  const [content, setContent] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState<{
      imported: number;
      skipped: number;
      sample: Record<string, string>[];
    } | null>(null);
  const act = async (action: "preview" | "import") => {
    setBusy(true);
    setError("");
    try {
      const data = await postJson<typeof result>("/api/prop-firms/csv", { action, content });
      if (action === "preview") setResult(data);
      else {
        refresh();
        close();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <DialogHeader>
        <DialogTitle>{t.importTitle}</DialogTitle>
        <DialogDescription>{t.importBody}</DialogDescription>
      </DialogHeader>
      <a className="text-sm underline" href="/prop-cash-template.csv" download>
        {t.template}
      </a>
      <p className="text-xs text-muted-foreground">{t.importHelp}</p>
      <Input
        type="file"
        aria-label={t.csvFile}
        accept=".csv,text/csv"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          setContent("");
          setResult(null);
          setError("");
          if (!file) return;
          if (file.size > 2 * 1024 * 1024) {
            setError(t.csvTooLarge);
            return;
          }
          try {
            setContent(decodeImportFile(await file.arrayBuffer()));
          } catch {
            setError(t.csvUnreadable);
          }
        }}
      />
      <Button variant="outline" disabled={!content || busy} onClick={() => void act("preview")}>
        {busy ? t.validating : t.validate}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {result && (
        <>
          <p className="text-sm">{t.previewResult(result.imported, result.skipped)}</p>
          <div className="space-y-2">
            {result.sample.map((row) => (
              <p key={row.id} className="rounded border p-2 text-xs">
                {row.date} · {row.firm} · {row.kind} · {row.amount} {row.currency}
              </p>
            ))}
          </div>
          <Button disabled={busy || result.imported === 0} onClick={() => void act("import")}>
            {t.importRecords(result.imported)}
          </Button>
        </>
      )}
    </>
  );
}
