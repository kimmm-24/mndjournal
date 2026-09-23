"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

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
  const search = useSearchParams();
  const token = search.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!token || search.get("error")) {
    return (
      <AuthCard title="Link expired">
        <p className="text-center text-sm text-muted-foreground">
          This password reset link is invalid or has expired. Reset links work once and are valid
          for 1 hour.
        </p>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Send a new link</Link>
        </Button>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title="Password updated">
        <p className="text-center text-sm text-muted-foreground">
          Your password has been changed and you&apos;ve been signed out on all devices.
        </p>
        <Button asChild className="w-full">
          <Link href="/login">Sign in</Link>
        </Button>
      </AuthCard>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The passwords don't match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: resetError } = await authClient.resetPassword({ newPassword: password, token });
    setSubmitting(false);
    if (resetError) {
      setError(
        resetError.code === "INVALID_TOKEN"
          ? "This reset link has expired. Request a new one."
          : (resetError.message ?? "Could not reset your password."),
      );
      return;
    }
    setDone(true);
  };

  return (
    <AuthCard title="Choose a new password">
      <form onSubmit={submit} className="space-y-3">
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={`New password (min. ${MIN_PASSWORD_LENGTH} characters)`}
          autoFocus
          autoComplete="new-password"
        />
        <Input
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
        />
        {error && <p className="text-center text-xs text-loss">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Saving…" : "Set new password"}
        </Button>
      </form>
    </AuthCard>
  );
}
