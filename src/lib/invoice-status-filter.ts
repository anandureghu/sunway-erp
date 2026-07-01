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

/** Invoice is fully paid — use receipt labels and post-payment actions. */
export function isInvoiceFullyPaid(
  rawStatus: string | null | undefined,
): boolean {
  return normalizeInvoiceStatusKey(rawStatus) === "PAID";
}

/** Invoice is settled enough to show receipt instead of invoice. */
export function isInvoicePaymentSettled(
  rawStatus: string | null | undefined,
): boolean {
  const k = normalizeInvoiceStatusKey(rawStatus);
  return k === "PAID" || k === "PARTIALLY_PAID";
}

/** UI should use receipt wording/actions only after full payment. */
export function isInvoiceReceiptView(
  rawStatus: string | null | undefined,
): boolean {
  return isInvoiceFullyPaid(rawStatus);
}

/** Paid and cancelled invoices belong in the Archived tab. */
export function isInvoiceArchivedStatus(
  rawStatus: string | null | undefined,
): boolean {
  const k = normalizeInvoiceStatusKey(rawStatus);
  return k === "PAID" || k === "CANCELLED";
}
