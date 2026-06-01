/** Extract user-facing message from API error responses (Spring {@code message} field). */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const e = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return e?.response?.data?.message?.trim() || e?.message?.trim() || fallback;
}
