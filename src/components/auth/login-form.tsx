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

export function LoginForm({
  callbackUrl,
  portal = "CUSTOMER",
  initialError = null,
}: {
  callbackUrl: string;
  portal?: AccountPortal;
  initialError?: string | null;
}) {
  const worker = portal === "PROVIDER";
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
      <h1 className="font-display text-2xl tracking-tight text-ink-900">{worker ? "Worker login" : "Customer login"}</h1>
      <p className="mt-1.5 text-sm text-ink-500">{worker ? "Sign in to your worker account to check your jobs." : "Sign in to book help or check your requests."}</p>

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

        {formError && <p role="alert" className="text-[13px] text-red-600">{formError}</p>}

        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        New to TipStaff?{" "}
        <Link href={worker ? "/worker/signup" : `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
