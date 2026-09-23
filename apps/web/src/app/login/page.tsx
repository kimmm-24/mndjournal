"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GoogleMark } from "@/components/google-mark";
import { authClient } from "@/lib/auth-client";
import { useT } from "@/components/i18n";
import { LanguageSwitch } from "@/components/language-switch";
import { authErrorMessage } from "@/lib/auth-errors";

export default function LoginPage() {
  const router = useRouter();
  const t = useT("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);
    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
    });
    setSubmitting(false);
    if (signInError?.code === "EMAIL_NOT_VERIFIED") {
      // Better Auth has just emailed a fresh link (sendOnSignIn).
      setNotice(t.login.verifyFirst(email));
      return;
    }
    if (signInError) {
      setError(authErrorMessage(signInError, t.errors, t.errors.INVALID_EMAIL_OR_PASSWORD!));
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  const signInWithGoogle = async () => {
    setGoogleSubmitting(true);
    setError(null);
    const { error: signInError } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
    if (signInError) {
      setGoogleSubmitting(false);
      setError(authErrorMessage(signInError, t.errors, t.login.googleFailed));
    }
    // On success the client redirects to Google, so no further state update here.
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <div className="absolute right-4 top-4">
        <LanguageSwitch compact />
      </div>
      <Card className="w-80">
        <CardContent className="pt-6">
          <form onSubmit={submit} className="space-y-3">
            <div className="text-center">
              <Image
                src="/logo.png"
                alt="mndjournal"
                width={262}
                height={238}
                className="mx-auto mb-2 h-7 w-auto"
              />
              <h1 className="text-sm font-semibold">mndjournal</h1>
            </div>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t.email}
              autoFocus
              autoComplete="email"
            />
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t.password}
              autoComplete="current-password"
            />
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                {t.login.forgotPassword}
              </Link>
            </div>
            {error && <p className="text-center text-xs text-loss">{error}</p>}
            {notice && <p className="text-center text-xs text-muted-foreground">{notice}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {t.login.signIn}
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{t.or}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              disabled={googleSubmitting}
              onClick={signInWithGoogle}
            >
              <GoogleMark className="h-4 w-4" />
              {t.continueWithGoogle}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t.login.noAccount}{" "}
              <Link href="/signup" className="underline">
                {t.login.signUp}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
