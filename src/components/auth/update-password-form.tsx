"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { updatePassword } from "@/lib/actions/auth";
import type { AccountPortal } from "@/lib/auth-routing";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function UpdatePasswordForm({ portal }: { portal: AccountPortal }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await updatePassword({ password, confirmPassword });
      if (!result.ok) {
        setError(result.error ?? "We couldn’t update your password.");
        return;
      }
      const loginPath = portal === "PROVIDER" ? "/worker/login" : portal === "COMPANY" ? "/company/login" : "/login";
      router.replace(`${loginPath}?status=password-updated`);
      router.refresh();
    } catch {
      setError("We couldn’t update your password. Try again shortly.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ts-auth-form">
      <span className="auth-guide-icon"><LockKeyhole size={24} /></span>
      <h1 className="font-display text-2xl tracking-tight text-ink-900">Choose a new password</h1>
      <p className="mt-1.5 text-sm leading-6 text-ink-500">Use at least eight characters and keep it unique to FixItFast.</p>
      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4" noValidate>
        <Field label="New password" htmlFor="new-password">
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm-password">
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            required
          />
        </Field>
        {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Updating password…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
