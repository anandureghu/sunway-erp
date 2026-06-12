import { z } from "zod";
import { normalizeEmail, validateEmail } from "@/lib/email";

/** Optional email: blank allowed, otherwise must be valid. Normalized on parse. */
export const OPTIONAL_EMAIL = z
  .string()
  .refine((val) => !val.trim() || validateEmail(val).valid, {
    message: "Enter a valid email address",
  })
  .transform((val) => normalizeEmail(val));

/** Required email. Normalized on parse. */
export const REQUIRED_EMAIL = z
  .string()
  .min(1, "Email is required")
  .refine((val) => validateEmail(val, { required: true }).valid, {
    message: "Enter a valid email address",
  })
  .transform((val) => normalizeEmail(val));
