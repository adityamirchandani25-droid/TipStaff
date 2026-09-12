"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addWorkerSchema, type AddWorkerInput } from "@/lib/validations/company";
import { addCompanyWorker } from "@/lib/actions/company";
import { CATEGORY_ORDER, CATEGORY_LABELS } from "@/lib/categories";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AddWorkerForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddWorkerInput>({
    resolver: zodResolver(addWorkerSchema),
    defaultValues: { category: "HANDYMAN" },
  });

  async function onSubmit(values: AddWorkerInput) {
    setFormError(null);
    setSuccessMessage(null);
    try {
      const result = await addCompanyWorker(values);
      if (!result.ok) {
        setFormError(result.error ?? "Couldn’t add that worker.");
        return;
      }
      setSuccessMessage(`${values.name} can now log in at /worker/login with the password you set.`);
      reset({ name: "", email: "", phone: "", password: "", category: values.category });
      router.refresh();
    } catch {
      setFormError("Couldn’t add that worker. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="ts-add-worker" noValidate>
      <div className="ts-add-worker-grid">
        <Field label="Full name" htmlFor="worker-name" error={errors.name?.message}>
          <Input id="worker-name" autoComplete="off" invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Email" htmlFor="worker-email" error={errors.email?.message}>
          <Input id="worker-email" type="email" autoComplete="off" invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field
          label="Phone number"
          htmlFor="worker-phone"
          error={errors.phone?.message}
          hint="Optional — lets customers' notifications reach them by text later."
        >
          <Input id="worker-phone" type="tel" placeholder="(512) 555-0100" invalid={!!errors.phone} {...register("phone")} />
        </Field>
        <Field label="Service" htmlFor="worker-category">
          <select
            id="worker-category"
            className="h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface-raised px-3.5 text-[15px] text-ink-900"
            {...register("category")}
          >
            {CATEGORY_ORDER.map((item) => (
              <option key={item} value={item}>
                {CATEGORY_LABELS[item]}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Temporary password"
          htmlFor="worker-password"
          error={errors.password?.message}
          hint="Set this now and share it with the worker — they can change it after they log in."
        >
          <Input id="worker-password" type="text" autoComplete="off" invalid={!!errors.password} {...register("password")} />
        </Field>
      </div>

      {formError && <p role="alert" className="mt-4 text-[13px] text-red-600">{formError}</p>}
      {successMessage && <p role="status" className="mt-4 text-[13px] text-emerald-700">{successMessage}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding worker..." : "Add worker"}
      </Button>
    </form>
  );
}
