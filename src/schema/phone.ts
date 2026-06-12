import { z } from "zod";
import { normalizePhone, validatePhone } from "@/lib/countries";

/** Optional phone: blank allowed, otherwise must be valid E.164-style. Normalized on parse. */
export const OPTIONAL_PHONE = z
  .string()
  .refine((val) => !val.trim() || validatePhone(val).valid, {
    message: "Enter a valid phone number",
  })
  .transform((val) => normalizePhone(val));

/** Required phone. Normalized on parse. */
export const REQUIRED_PHONE = z
  .string()
  .min(1, "Phone number is required")
  .refine((val) => validatePhone(val, { required: true }).valid, {
    message: "Enter a valid phone number",
  })
  .transform((val) => normalizePhone(val));
