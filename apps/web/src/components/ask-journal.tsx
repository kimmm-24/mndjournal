"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { postJson, useApi } from "@/lib/use-api";
import { quotaExceededMessage, type AiAccessStatus } from "@/lib/ai-quota";
import { AiNotice } from "./ai-notice";
import { useT } from "./i18n";

/** Natural-language questions against your own aggregates — BYO AI provider key. */
export function AskJournal() {
  const { data: aiAccess } = useApi<AiAccessStatus>("/api/ai/status");
  const t = useT("ai").ask;
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
      setError(cause instanceof Error ? cause.message : t.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
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
            aria-label={t.label}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={t.placeholder}
          />
          <Button type="submit" disabled={busy || !question.trim() || !aiAccess.allowed}>
            <Sparkles />
            {busy ? t.thinking : t.submit}
          </Button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {t.suggestions.map((suggestion) => (
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
