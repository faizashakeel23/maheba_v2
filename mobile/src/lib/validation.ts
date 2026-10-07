import { z } from "zod";

export const providerSchema = z.object({
  business_name: z.string().min(2).max(120),
  category: z.enum(["makeup", "henna", "baking"]),
  location: z.string().min(2).max(120),
  bio: z.string().max(2000),
  phone: z.string().min(7).max(20),
  whatsapp: z.string().min(7).max(20),
  instagram: z.string().max(60),
});

/** Guest booking: name + phone + future date/time. No account required. */
export const appointmentSchema = z.object({
  provider_id: z.string().min(1),
  customer_name: z.string().min(2).max(120),
  customer_phone: z.string().min(7).max(20),
  starts_at: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Pick a valid date and time.")
    .refine((v) => Date.parse(v) > Date.now(), "Appointment must be in the future, pretty."),
  notes: z.string().max(1000).default(""),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

/** Portfolio upload guard: jpg/png/webp, ≤5MB (also enforce in Storage policy). */
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
export function validateUpload(mime: string, bytes: number): string | null {
  if (!ALLOWED.includes(mime)) return "Only JPG, PNG or WEBP allowed.";
  if (bytes > 5 * 1024 * 1024) return "File must be 5MB or smaller.";
  return null;
}
