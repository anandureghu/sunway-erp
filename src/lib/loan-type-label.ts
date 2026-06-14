/**
 * "CAR_LOAN" → "Car Loan". The raw enum/value is the machine identifier (the
 * loan code carries it too); this is only for display so we never surface the
 * underscored, upper-cased form to users.
 */
export function humanizeLoanType(type: string | null | undefined): string {
  if (!type) return "—";
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
