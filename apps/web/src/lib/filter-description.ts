import type { AnalysisFilters } from "@luxalgo/journal-core";
import { messagesFor, type Messages } from "./i18n";

/**
 * One-line summary of the active filters ("Symbols: AAPL · Outcome: win").
 * `t` is the caller's `useT("filters")`; English is the default so a caller
 * outside React still gets readable text.
 */
export function describeFilters(
  filters: AnalysisFilters,
  accounts: { id: string; name: string }[] = [],
  playbooks: { id: string; name: string }[] = [],
  privateMode = false,
  t: Messages<"filters"> = messagesFor("filters", "en"),
) {
  return (
    Object.entries(filters)
      .filter(([, v]) => v)
      .map(([k, v]) => {
        let value = v;
        if (k === "accounts")
          value = v
            .split(",")
            .map((id) => accounts.find((a) => a.id === id)?.name ?? t.selectedAccount)
            .join(", ");
        if (k === "playbookId")
          value = playbooks.find((p) => p.id === v)?.name ?? t.selectedStrategy;
        if (k === "weekdays")
          value = v
            .split(",")
            .map((d) => t.weekdays[Number(d)] ?? d)
            .join(", ");
        if (privateMode && /^(entry|exit|pnl)(Min|Max)$/.test(k)) value = "••••";
        return `${t.summary[k] ?? k}: ${value}`;
      })
      .join(" · ") || t.allTrades
  );
}
