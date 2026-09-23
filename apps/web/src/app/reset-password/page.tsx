"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useT } from "@/components/i18n";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPassword />
    </Suspense>
  );
}

/**
 * Landing page of the emailed link: Better Auth's /api/auth/reset-password/:token
 * checks the token and redirects here with ?token=… (or ?error=INVALID_TOKEN).
 */
function ResetPassword() {
  const t = useT("auth").reset;
  const search = useSearchParams();
  const token = search.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!token || search.get("error")) {
    return (
      <AuthCard title={t.expiredTitle}>
        <p className="text-center text-sm text-muted-foreground">{t.expiredBody}</p>
        <Button asChild className="w-full">
          <Link href="/forgot-password">{t.sendNewLink}</Link>
        </Button>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title={t.doneTitle}>
        <p className="text-center text-sm text-muted-foreground">{t.doneBody}</p>
        <Button asChild className="w-full">
          <Link href="/login">{t.signIn}</Link>
        </Button>
      </AuthCard>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t.tooShort(MIN_PASSWORD_LENGTH));
      return;
    }
    if (password !== confirm) {
      setError(t.mismatch);
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: resetError } = await authClient.resetPassword({ newPassword: password, token });
    setSubmitting(false);
    if (resetError) {
      setError(
        resetError.code === "INVALID_TOKEN" ? t.linkExpired : (resetError.message ?? t.failed),
      );
      return;
    }
    setDone(true);
  };

  return (
    <AuthCard title={t.title}>
      <form onSubmit={submit} className="space-y-3">
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t.newPassword(MIN_PASSWORD_LENGTH)}
          autoFocus
          autoComplete="new-password"
        />
        <Input
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          placeholder={t.confirm}
          autoComplete="new-password"
        />
        {error && <p className="text-center text-xs text-loss">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? t.submitting : t.submit}
        </Button>
      </form>
    </AuthCard>
  );
}
