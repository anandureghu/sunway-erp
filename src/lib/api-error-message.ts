/** Extract user-facing message from API error responses (Spring message / error / field errors). */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const e = error as {
    response?: {
      data?: {
        message?: string;
        error?: string;
        errors?: Record<string, string> | string[] | string;
      };
    };
    message?: string;
  };
  const data = e?.response?.data;
  const message = data?.message?.trim();
  if (message) return message;

  const topError = data?.error?.trim();
  if (topError) return topError;

  const fieldErrors = data?.errors;
  if (fieldErrors) {
    if (typeof fieldErrors === "string" && fieldErrors.trim()) {
      return fieldErrors.trim();
    }
    if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
      return fieldErrors.filter(Boolean).join("; ");
    }
    if (typeof fieldErrors === "object") {
      const parts = Object.entries(fieldErrors)
        .map(([k, v]) => (v ? `${k}: ${v}` : k))
        .filter(Boolean);
      if (parts.length) return parts.join("; ");
    }
  }

  return e?.message?.trim() || fallback;
}
