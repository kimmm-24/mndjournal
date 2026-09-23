"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
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
      setError(requestError.message ?? "Could not send the reset email. Try again.");
      return;
    }
    setSentTo(email);
  };

  if (sentTo) {
    return (
      <AuthCard title="Check your email">
        {/* Same wording whether or not the account exists — no account enumeration. */}
        <p className="text-center text-sm text-muted-foreground">
          If an account exists for <span className="text-foreground">{sentTo}</span>, we&apos;ve
          sent a link to reset your password. It&apos;s valid for 1 hour — check your spam folder if
          it doesn&apos;t arrive.
        </p>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="underline">
            Back to sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset your password">
      <form onSubmit={submit} className="space-y-3">
        <p className="text-center text-xs text-muted-foreground">
          Enter your account&apos;s email and we&apos;ll send you a reset link.
        </p>
        <Input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          autoFocus
          autoComplete="email"
        />
        {error && <p className="text-center text-xs text-loss">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
