import { z } from "zod";
import { CATEGORY_ORDER, URGENCY_ORDER } from "@/lib/categories";

export const addressInputSchema = z.object({
  label: z.string().trim().min(1).max(40).default("Home"),
  line1: z.string().trim().min(3, "Enter a street address"),
  line2: z.string().trim().max(80).optional(),
  city: z.string().trim().min(1, "Enter a city"),
  state: z.string().trim().length(2, "Use a 2-letter state code").toUpperCase(),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
});

export type AddressInput = z.infer<typeof addressInputSchema>;

export const createRequestSchema = z.object({
  category: z.enum(CATEGORY_ORDER),
  description: z
    .string()
    .trim()
    .min(10, "A few more details help your pro show up prepared")
    .max(1000),
  urgency: z.enum(URGENCY_ORDER),
  photos: z.array(z.string().max(5_600_000, "Each photo must be under 4MB").regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Choose a JPG, PNG, or WebP photo")).max(3, "Up to 3 photos").default([]),
  addressId: z.string().optional(),
  newAddress: addressInputSchema.optional(),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
