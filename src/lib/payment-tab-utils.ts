import type {
  PaymentResponseDTO,
  PaymentsPageVariant,
} from "@/types/payment";

/** Customer receipts awaiting confirmation before posting. */
const PENDING_CUSTOMER = "PENDING_REQUEST";

/** Vendor payables awaiting confirmation. */
const PENDING_VENDOR = "PENDING_VENDOR_PAYMENT";

function normalizedDirection(
  p: PaymentResponseDTO,
  variant: PaymentsPageVariant,
): string {
  return String(
    p.paymentDirection ??
      (variant === "vendor" ? "VENDOR" : "CUSTOMER"),
  ).toUpperCase();
}

/** Payment still needs Confirm action (Outstanding tab). */
export function isPaymentPendingConfirmation(
  p: PaymentResponseDTO,
  variant: PaymentsPageVariant,
): boolean {
  const method = (p.paymentMethod || "").toUpperCase().trim();
  return normalizedDirection(p, variant) === "VENDOR"
    ? method === PENDING_VENDOR
    : method === PENDING_CUSTOMER;
}

/** Terminal / settled rows for Archived tab (confirmed payments + void-style methods). */
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
