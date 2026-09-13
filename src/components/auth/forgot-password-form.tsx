"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { requestPasswordReset } from "@/lib/actions/auth";
import type { AccountPortal } from "@/lib/auth-routing";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm({
  portal,
  initialError,
}: {
  portal: AccountPortal;
  initialError?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await requestPasswordReset({ email, portal });
      if (!result.ok) {
        setError(result.error ?? "We couldn’t send the reset email.");
        return;
      }
      setSent(true);
    } catch {
      setError("We couldn’t send the reset email. Try again shortly.");
    } finally {
      setSubmitting(false);
    }
  }

  const loginHref = portal === "PROVIDER" ? "/worker/login" : portal === "COMPANY" ? "/company/login" : "/login";

  return (
    <div className="ts-auth-form">
      <span className="auth-guide-icon"><Mail size={24} /></span>
      <h1 className="font-display text-2xl tracking-tight text-ink-900">Reset your password</h1>
      <p className="mt-1.5 text-sm leading-6 text-ink-500">
        Enter the email on your account. We’ll send a secure link to choose a new password.
      </p>

      {sent ? (
        <div className="mt-7 rounded-[var(--radius-lg)] border border-emerald-200 bg-emerald-50 p-5">
          <p role="status" className="text-sm font-semibold text-emerald-900">Check your inbox</p>
          <p className="mt-1 text-sm leading-6 text-emerald-800">
            If an account exists for {email}, FixItFast has sent its password-reset instructions.
          </p>
          <Button type="button" variant="secondary" className="mt-4" onClick={() => setSent(false)}>
            Send another link
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4" noValidate>
          <Field label="Email address" htmlFor="reset-email">
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Sending reset link…" : "Email me a reset link"}
          </Button>
        </form>
      )}

      <Link href={loginHref} className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
        <ArrowLeft size={14} /> Back to login
      </Link>
    </div>
  );
}
