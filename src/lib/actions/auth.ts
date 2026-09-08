"use server";

import { z } from "zod";
import { CATEGORY_ORDER } from "@/lib/categories";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validations/auth";
import { normalizePhone } from "@/lib/phone";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function signUp(input: unknown): Promise<ActionResult> {
  return createAccount(input, "CUSTOMER");
}

export async function signUpWorker(input: unknown): Promise<ActionResult> {
  return createAccount(input, "PROVIDER");
}

async function createAccount(input: unknown, role: "CUSTOMER" | "PROVIDER"): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again" };
  }
  const { name, email, phone, password } = parsed.data;
  const normalizedPhone = phone ? normalizePhone(phone) : null;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, ...(normalizedPhone ? [{ phone: normalizedPhone }] : [])],
    },
  });
  if (existing) {
    return { ok: false, error: "An account with that email or phone already exists" };
  }

  const workerInput = z.object({ category: z.enum(CATEGORY_ORDER) }).safeParse(input);
  if (role === "PROVIDER" && !workerInput.success) return { ok: false, error: "Choose the service you provide" };
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name, email, phone: normalizedPhone, passwordHash, role,
      ...(role === "PROVIDER" && workerInput.success ? {
        provider: { create: { categories: [workerInput.data.category], approvalStatus: "PENDING" } },
      } : {}),
    },
  });

  return { ok: true };
}
