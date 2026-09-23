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

export default function SignupPage() {
  const router = useRouter();
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
      setError(signUpError.message ?? "Could not create account");
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
      setError(signInError.message ?? "Could not sign up with Google");
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
      <AuthCard title="Check your email">
        <p className="text-center text-sm text-muted-foreground">
          We&apos;ve sent a verification link to{" "}
          <span className="text-foreground">{verifyEmail}</span>. Click it to activate your account
          and start your free trial. Check your spam folder if it doesn&apos;t arrive.
        </p>
        <Button
          variant="outline"
          className="w-full"
          disabled={resent !== "idle"}
          onClick={() => void resend()}
        >
          {resent === "sent"
            ? "Sent — check your inbox"
            : resent === "sending"
              ? "Sending…"
              : "Resend email"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Already verified?{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
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
              <h1 className="text-sm font-semibold">Create your account</h1>
            </div>
            <Input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name"
              autoFocus
              autoComplete="name"
            />
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              autoComplete="email"
            />
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password (min. 8 characters)"
              autoComplete="new-password"
            />
            {error && <p className="text-center text-xs text-loss">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              Sign up
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
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
              Continue with Google
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
