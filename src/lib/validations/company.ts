import { z } from "zod";
import { CATEGORY_ORDER } from "@/lib/categories";
import { normalizePhone } from "@/lib/phone";

// Company signup collects the same fields as a customer/worker signup (name
// doubles as the company name) — see signUpSchema in validations/auth.ts.

export const addWorkerSchema = z.object({
  name: z.string().trim().min(2, "Enter the worker's full name"),
  email: z.email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || normalizePhone(v) !== null, "Enter a valid US phone number"),
  password: z.string().min(8, "Use at least 8 characters"),
  category: z.enum(CATEGORY_ORDER, "Choose the service this worker provides"),
});

export type AddWorkerInput = z.infer<typeof addWorkerSchema>;
