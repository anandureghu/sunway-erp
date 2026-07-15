import type {
  PaymentResponseDTO,
  PaymentsPageVariant,
} from "@/types/payment";

/** Customer receipts awaiting confirmation before posting. */
const PENDING_CUSTOMER = "PENDING_REQUEST";

/** Vendor payables awaiting confirmation. */
const PENDING_VENDOR = "PENDING_VENDOR_PAYMENT";

/** Ad-hoc expense payments awaiting confirmation. */
const PENDING_OTHER = "PENDING_OTHER_PAYMENT";

function normalizedDirection(
  p: PaymentResponseDTO,
  variant: PaymentsPageVariant,
): string {
  const fallback =
    variant === "vendor" ? "VENDOR" : variant === "other" ? "OTHER" : "CUSTOMER";
  return String(p.paymentDirection ?? fallback).toUpperCase();
}

/** Payment still needs Confirm action (Outstanding tab). */
export function isPaymentPendingConfirmation(
  p: PaymentResponseDTO,
  variant: PaymentsPageVariant,
): boolean {
  const method = (p.paymentMethod || "").toUpperCase().trim();
  const direction = normalizedDirection(p, variant);
  if (direction === "VENDOR") return method === PENDING_VENDOR;
  if (direction === "OTHER") return method === PENDING_OTHER;
  return method === PENDING_CUSTOMER;
}

/**
 * Terminal / settled rows for the **Completed** tab (UI label; `listTab === "archived"` in code).
 * Confirmed payments and void-style methods — not awaiting Confirm.
 */
export function isPaymentArchivedTab(
  p: PaymentResponseDTO,
  variant: PaymentsPageVariant,
): boolean {
  const method = (p.paymentMethod || "").toUpperCase().trim();
  if (
    method === "CANCELLED" ||
    method === "VOID" ||
    method === "REJECTED"
  ) {
    return true;
  }
  return !isPaymentPendingConfirmation(p, variant);
}
