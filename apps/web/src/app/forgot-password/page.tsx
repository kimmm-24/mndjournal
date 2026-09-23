"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useT } from "@/components/i18n";
import { authErrorMessage } from "@/lib/auth-errors";

export default function ForgotPasswordPage() {
  const t = useT("auth");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: requestError } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    setSubmitting(false);
    if (requestError) {
      setError(authErrorMessage(requestError, t.errors, t.forgot.failed));
      return;
    }
    setSentTo(email);
  };

  if (sentTo) {
    return (
      <AuthCard title={t.forgot.sentTitle}>
        {/* Same wording whether or not the account exists — no account enumeration. */}
        <p className="text-center text-sm text-muted-foreground">
          {t.forgot.sentBefore} <span className="text-foreground">{sentTo}</span>,{" "}
          {t.forgot.sentAfter}
        </p>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="underline">
            {t.forgot.backToSignIn}
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t.forgot.title}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-center text-xs text-muted-foreground">{t.forgot.intro}</p>
        <Input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t.email}
          autoFocus
          autoComplete="email"
        />
        {error && <p className="text-center text-xs text-loss">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? t.forgot.submitting : t.forgot.submit}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="underline">
            {t.forgot.backToSignIn}
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
