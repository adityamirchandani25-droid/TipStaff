"use client";

import { AccountSwitch } from "@/components/auth/account-switch";
import type { AccountPortal } from "@/lib/auth-routing";
import { CATEGORY_ORDER, CATEGORY_LABELS } from "@/lib/categories";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { signUp, signUpWorker } from "@/lib/actions/auth";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SignupForm({ callbackUrl, portal = "CUSTOMER" }: { callbackUrl: string; portal?: AccountPortal }) {
  const worker = portal === "PROVIDER";
  const [category, setCategory] = useState<string>("HANDYMAN");
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  async function onSubmit(values: SignUpInput) {
    setFormError(null);
    try {
    const result = worker ? await signUpWorker({ ...values, category }) : await signUp(values);
    if (!result.ok) {
      setFormError(result.error ?? "Something went wrong. Try again.");
      return;
    }

    const signInResult = await signIn("credentials", {
      portal,
      identifier: values.email,
      password: values.password,
      redirect: false,
    });
    if (signInResult?.error) {
      setFormError("Account created — log in to continue.");
      router.push(worker ? "/worker/login" : "/login");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
    } catch {
      setFormError("Couldn’t create your account. Please try again.");
    }
  }

  return (
    <div className="ts-auth-form">
      <AccountSwitch portal={portal} signup />
      <h1 className="font-display text-2xl tracking-tight text-ink-900">{worker ? "Create a worker account" : "Create your account"}</h1>
      <p className="mt-1.5 text-sm text-ink-500">
        {worker ? "Create your worker account. Your profile will be reviewed before you can take jobs." : "Create a customer account to request help nearby."}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 flex flex-col gap-4" noValidate>
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            invalid={!!errors.email}
            {...register("email")}
          />
        </Field>
        <Field
          label="Phone number"
          htmlFor="phone"
          error={errors.phone?.message}
          hint="Optional — lets your pro text you when they're close."
        >
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="(512) 555-0100"
            invalid={!!errors.phone}
            {...register("phone")}
          />
        </Field>
        {worker && <Field label="Your main service" htmlFor="category"><select id="category" value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-lg border border-border bg-white p-3 text-sm">{CATEGORY_ORDER.map(item => <option key={item} value={item}>{CATEGORY_LABELS[item]}</option>)}</select></Field>}
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            invalid={!!errors.password}
            {...register("password")}
          />
        </Field>

        {formError && <p role="alert" className="text-[13px] text-red-600">{formError}</p>}

        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href={worker ? "/worker/login" : `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-brand-700 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
