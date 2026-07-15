export const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "UPI", label: "UPI" },
  { value: "OTHER", label: "Other" },
] as const;

export function formatPaymentMethodLabel(method?: string | null): string {
  if (!method) return "—";
  const code = method.trim().toUpperCase();
  const found = PAYMENT_METHODS.find((m) => m.value === code);
  if (found) return found.label;
  switch (code) {
    case "PENDING_VENDOR_PAYMENT":
      return "Pending vendor payment";
    case "PENDING_REQUEST":
      return "Pending request";
    case "CANCELLED":
      return "Cancelled";
    default:
      return method.replace(/_/g, " ");
  }
}

export function isDummyDocumentUrl(url?: string | null): boolean {
  return Boolean(url && url.includes("dummy.url"));
}
