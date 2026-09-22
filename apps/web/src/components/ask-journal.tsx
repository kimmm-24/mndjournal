"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { postJson, useApi } from "@/lib/use-api";
import { quotaExceededMessage, type AiAccessStatus } from "@/lib/ai-quota";
import { AiNotice } from "./ai-notice";

const SUGGESTIONS = [
  "What's my most expensive mistake?",
  "Which weekday should I stop trading?",
  "Am I better at longs or shorts?",
];

/** Natural-language questions against your own aggregates — BYO AI provider key. */
export function AskJournal() {
  const { data: aiAccess } = useApi<AiAccessStatus>("/api/ai/status");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState("");
  const [quotaDismissed, setQuotaDismissed] = useState(false);

  // Not offered at all on the starter plan — not just disabled, per the pricing page.
  if (!aiAccess || aiAccess.plan === "starter") return null;

  const quotaMessage = !aiAccess.allowed ? quotaExceededMessage(aiAccess) : null;
  const displayedError = error ?? (quotaDismissed ? null : quotaMessage);

  const ask = async (q: string) => {
    if (busy || !q.trim()) return;
    q = q.trim();
    setLastQuestion(q);
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      const result = await postJson<{ answer: string }>("/api/ai/ask", { question: q });
      setAnswer(result.answer);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask your journal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (question.trim()) void ask(question);
          }}
        >
          <Input
            aria-label="Ask your journal a question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Why do my Monday shorts keep failing?"
          />
          <Button type="submit" disabled={busy || !question.trim() || !aiAccess.allowed}>
            <Sparkles />
            {busy ? "Thinking…" : "Ask"}
          </Button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              disabled={busy || !aiAccess.allowed}
              className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent disabled:cursor-wait disabled:opacity-50"
              onClick={() => {
                setQuestion(suggestion);
                void ask(suggestion);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
        {displayedError && (
          <AiNotice
            error={displayedError}
            onRetry={() => void ask(lastQuestion)}
            onDismiss={() => {
              setError(null);
              setQuotaDismissed(true);
            }}
          />
        )}
        {answer && <p className="whitespace-pre-wrap pt-1 text-sm leading-relaxed">{answer}</p>}
      </CardContent>
    </Card>
  );
}
