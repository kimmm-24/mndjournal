"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/auth-card";
import { GoogleMark } from "@/components/google-mark";
import { authClient } from "@/lib/auth-client";
import { useT } from "@/components/i18n";
import { LanguageSwitch } from "@/components/language-switch";
import { authErrorMessage } from "@/lib/auth-errors";

export default function SignupPage() {
  const router = useRouter();
  const t = useT("auth");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [resent, setResent] = useState<"idle" | "sending" | "sent">("idle");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { data, error: signUpError } = await authClient.signUp.email({
      name: name.trim() || email,
      email,
      password,
      // Where the emailed verification link lands, signed in.
      callbackURL: "/dashboard",
    });
    setSubmitting(false);
    if (signUpError) {
      setError(authErrorMessage(signUpError, t.errors, t.signup.failed));
      return;
    }
    // No session token = email verification is required before signing in.
    if (!data?.token) {
      setVerifyEmail(email);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  const signUpWithGoogle = async () => {
    setGoogleSubmitting(true);
    setError(null);
    const { error: signInError } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
    if (signInError) {
      setGoogleSubmitting(false);
      setError(authErrorMessage(signInError, t.errors, t.signup.googleFailed));
    }
    // On success the client redirects to Google, so no further state update here.
  };

  const resend = async () => {
    if (!verifyEmail) return;
    setResent("sending");
    await authClient.sendVerificationEmail({ email: verifyEmail, callbackURL: "/dashboard" });
    setResent("sent");
  };

  if (verifyEmail) {
    return (
      <AuthCard title={t.signup.checkEmailTitle}>
        <p className="text-center text-sm text-muted-foreground">
          {t.signup.checkEmailBody} <span className="text-foreground">{verifyEmail}</span>.{" "}
          {t.signup.checkEmailAfter}
        </p>
        <Button
          variant="outline"
          className="w-full"
          disabled={resent !== "idle"}
          onClick={() => void resend()}
        >
          {resent === "sent"
            ? t.signup.resent
            : resent === "sending"
              ? t.signup.resending
              : t.signup.resend}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {t.signup.alreadyVerified}{" "}
          <Link href="/login" className="underline">
            {t.signup.signIn}
          </Link>
        </p>
      </AuthCard>
    );
  }

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
              <h1 className="text-sm font-semibold">{t.signup.title}</h1>
            </div>
            <Input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t.name}
              autoFocus
              autoComplete="name"
            />
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t.email}
              autoComplete="email"
            />
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t.signup.passwordHint}
              autoComplete="new-password"
            />
            {error && <p className="text-center text-xs text-loss">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {t.signup.submit}
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
              onClick={signUpWithGoogle}
            >
              <GoogleMark className="h-4 w-4" />
              {t.continueWithGoogle}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t.signup.haveAccount}{" "}
              <Link href="/login" className="underline">
                {t.signup.signIn}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
