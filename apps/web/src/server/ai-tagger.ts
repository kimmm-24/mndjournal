import { asc, eq } from "drizzle-orm";
import { db, playbooks } from "@/db";
import { clipForAi } from "@/lib/ai-quota";
import { replyLanguage, runAi } from "./ai";

const MAX_PLAYBOOKS = 20;
import { getTradeByKey, rowToTrade } from "./trades-query";

export interface PlaybookSuggestion {
  playbookId: string | null;
  playbookName: string | null;
  reasoning: string;
}

const FALLBACK_NO_MATCH_REASON = {
  Indonesian: "Tidak ada playbook yang cukup cocok dengan trade ini.",
  English: "No playbook fits this trade closely enough.",
};

/** AI picks the single best-fitting playbook for a trade from the user's own list. */
export const suggestPlaybook = async (
  tradeKey: string,
  userId: string,
): Promise<PlaybookSuggestion> => {
  const row = getTradeByKey(tradeKey, userId);
  if (!row) throw new Error("Trade not found");
  const trade = rowToTrade(row);

  const userPlaybooks = db
    .select()
    .from(playbooks)
    .where(eq(playbooks.userId, userId))
    .orderBy(asc(playbooks.createdAt))
    .all();
  if (userPlaybooks.length === 0) {
    throw new Error("You don't have any playbooks yet — create one first to get a suggestion.");
  }

  // Bounded prompt: at most MAX_PLAYBOOKS playbooks, descriptions and rules
  // trimmed. Names stay whole, since the answer must echo one exactly.
  const playbookLines = userPlaybooks
    .slice(0, MAX_PLAYBOOKS)
    .map((playbook, index) => {
      const rules = clipForAi((JSON.parse(playbook.rulesJson || "[]") as string[]).join("; "), 400);
      return `${index + 1}. "${playbook.name}" — description: ${clipForAi(playbook.description || "(none)", 300)}; rules: ${rules || "(none)"}`;
    })
    .join("\n");

  const language = await replyLanguage();
  const text = await runAi(
    `Match this single trade to the ONE best-fitting playbook from the trader's own playbook list
below, based on its rules and description. If none genuinely fit, say so.

Playbooks:
${playbookLines}

Trade to match:
Symbol: ${trade.symbol}
Direction: ${trade.direction}
Status: ${trade.status}
Opened: ${trade.openedAt}
Closed: ${trade.closedAt ?? "still open"}
Entry: ${trade.avgEntry} -> Exit: ${trade.avgExit ?? "n/a"}
Notes: ${row.notes ? clipForAi(row.notes, 2_000) : "(none)"}

Reply in EXACTLY this format and nothing else — REASON in ${language}, one short sentence:
PLAYBOOK: <exact playbook name from the list above, or NONE>
REASON: <one short sentence in ${language}>`,
    300,
    userId,
  );

  const nameMatch = /PLAYBOOK:\s*(.+)/i.exec(text);
  const reasonMatch = /REASON:\s*(.+)/i.exec(text);
  const suggestedName = nameMatch?.[1]?.trim() ?? "";
  const reasoning = reasonMatch?.[1]?.trim() || FALLBACK_NO_MATCH_REASON[language];

  if (!suggestedName || /^none$/i.test(suggestedName)) {
    return { playbookId: null, playbookName: null, reasoning };
  }
  // Never guess: only apply if the AI echoed back an exact, known playbook name.
  const matched = userPlaybooks.find(
    (playbook) => playbook.name.trim().toLowerCase() === suggestedName.toLowerCase(),
  );
  if (!matched)
    return { playbookId: null, playbookName: null, reasoning: FALLBACK_NO_MATCH_REASON[language] };

  return { playbookId: matched.id, playbookName: matched.name, reasoning };
};
