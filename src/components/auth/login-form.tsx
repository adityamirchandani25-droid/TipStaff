"use client";

import { AccountSwitch } from "@/components/auth/account-switch";
import type { AccountPortal } from "@/lib/auth-routing";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "@/lib/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PORTAL_COPY: Record<
  AccountPortal,
  { title: string; subtitle: string; signupHref: (callbackUrl: string) => string }
> = {
  CUSTOMER: {
    title: "Customer login",
    subtitle: "Sign in to book help or check your requests.",
    signupHref: (callbackUrl) => `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`,
  },
  PROVIDER: {
    title: "Worker login",
    subtitle: "Sign in to your worker account to check your jobs.",
    signupHref: () => "/worker/signup",
  },
  COMPANY: {
    title: "Company login",
    subtitle: "Sign in to manage your workers and their availability.",
    signupHref: () => "/company/signup",
  },
};

export function LoginForm({
  callbackUrl,
  portal = "CUSTOMER",
  initialError = null,
  initialMessage = null,
}: {
  callbackUrl: string;
  portal?: AccountPortal;
  initialError?: string | null;
  initialMessage?: string | null;
}) {
  const copy = PORTAL_COPY[portal];
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(initialError);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    try {
      const result = await login(values, portal);
      if (!result.ok) {
        setFormError(result.error ?? "Couldn’t sign in. Try again.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setFormError("Couldn’t connect. Please try signing in again.");
    }
  }

  return (
    <div className="ts-auth-form">
      <AccountSwitch portal={portal} />
      <h1 className="font-display text-2xl tracking-tight text-ink-900">{copy.title}</h1>
      <p className="mt-1.5 text-sm text-ink-500">{copy.subtitle}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 flex flex-col gap-4" noValidate>
        <Field label="Email or phone number" htmlFor="identifier" error={errors.identifier?.message}>
          <Input
            id="identifier"
            autoComplete="username"
            invalid={!!errors.identifier}
            {...register("identifier")}
          />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            invalid={!!errors.password}
            {...register("password")}
          />
        </Field>

        <Link
          href={`/forgot-password?portal=${portal}`}
          className="-mt-2 self-end text-[13px] font-medium text-brand-700 hover:underline"
        >
          Forgot password?
        </Link>

        {formError && <p role="alert" className="text-[13px] text-red-600">{formError}</p>}
        {initialMessage && !formError && <p role="status" className="text-[13px] text-emerald-700">{initialMessage}</p>}

        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        New to FixItFast?{" "}
        <Link href={copy.signupHref(callbackUrl)} className="font-medium text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
