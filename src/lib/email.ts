/** Trim and lowercase for consistent storage and comparison. */
export function normalizeEmail(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

/** Format while typing: strip spaces and lowercase. */
export function formatEmailInput(value: string): string {
  return value.replace(/\s/g, "").toLowerCase();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmailValidation = { valid: boolean; message?: string };

export function validateEmail(
  value: string | undefined | null,
  opts: { required?: boolean } = {},
): EmailValidation {
  const raw = (value ?? "").trim();
  if (!raw) {
    return opts.required
      ? { valid: false, message: "Email is required" }
      : { valid: true };
  }

  if (/\s/.test(raw)) {
    return { valid: false, message: "Email cannot contain spaces" };
  }

  const normalized = normalizeEmail(raw);
  if (!EMAIL_PATTERN.test(normalized)) {
    return { valid: false, message: "Enter a valid email address" };
  }
  if (normalized.length > 254) {
    return { valid: false, message: "Email is too long" };
  }

  return { valid: true };
}
