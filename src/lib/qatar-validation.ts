import { z } from "zod";

/** Qatar IBAN: QA + 2 check digits + 25 alphanumeric = 29 chars (spaces ignored). */
export const QATAR_IBAN_REGEX = /^QA[0-9]{2}[A-Z0-9]{25}$/;

export function normalizeIban(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function isValidQatarIban(value: string | undefined | null): boolean {
  if (value == null || !String(value).trim()) return true; // optional when blank
  return QATAR_IBAN_REGEX.test(normalizeIban(String(value)));
}

/** Optional Qatar IBAN for zod schemas (no transform — keeps field optional). */
export const OPTIONAL_QATAR_IBAN = z
  .string()
  .optional()
  .refine((val) => isValidQatarIban(val), {
    message: "IBAN must be a 29-character Qatar IBAN starting with QA",
  });

/** QID / national ID: digits only, at least 12 when provided. */
export function isValidQid(value: string | undefined | null): boolean {
  if (value == null || !String(value).trim()) return true;
  return /^\d{12,}$/.test(String(value).trim());
}

/**
 * Must be at least 18 years old on `asOf` (default today).
 * `dob` is yyyy-mm-dd from native date inputs.
 */
export function isAtLeast18(
  dob: string | undefined | null,
  asOf: Date = new Date(),
): boolean {
  if (dob == null || !String(dob).trim()) return true; // optional when blank
  const m = String(dob).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const birth = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(birth.getTime())) return false;
  const cutoff = new Date(asOf.getFullYear() - 18, asOf.getMonth(), asOf.getDate());
  return birth <= cutoff;
}
