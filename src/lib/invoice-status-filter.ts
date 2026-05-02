/** Normalize invoice status strings from API/UI for comparisons (UNPAID ↔ Unpaid ↔ unpaid). */
export function normalizeInvoiceStatusKey(
  status: string | null | undefined,
): string {
  return String(status ?? "")
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();
}

/** Match row status to Radix Select value ("all", "Paid", "Partially Paid", …). */
export function invoiceMatchesStatusFilter(
  rawStatus: string | null | undefined,
  filterValue: string,
): boolean {
  if (filterValue === "all") return true;
  return (
    normalizeInvoiceStatusKey(rawStatus) ===
    normalizeInvoiceStatusKey(filterValue)
  );
}

/** Paid and cancelled invoices belong in the Archived tab. */
export function isInvoiceArchivedStatus(
  rawStatus: string | null | undefined,
): boolean {
  const k = normalizeInvoiceStatusKey(rawStatus);
  return k === "PAID" || k === "CANCELLED";
}
