import { formatCurrencyAmount } from "@/lib/currency";
import { isInvoiceReceiptView } from "@/lib/invoice-status-filter";

export const INVOICE_DOC_MISSING = "—";

export const safeInvoiceValue = (v: unknown) =>
  v === null || v === undefined || v === "" ? INVOICE_DOC_MISSING : String(v);

export const formatInvoiceDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : INVOICE_DOC_MISSING;

export function formatInvoiceTemplate(
  template: string | undefined,
  replacements: Record<string, string>,
) {
  if (!template) return "";
  return Object.entries(replacements).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
    template,
  );
}

export function invoiceStatusColor(status?: string): string {
  const s = (status || "UNPAID").toUpperCase().replace(/\s+/g, "_");
  switch (s) {
    case "PAID":
      return "#16a34a";
    case "PARTIALLY_PAID":
      return "#d97706";
    case "OVERDUE":
      return "#ea580c";
    case "CANCELLED":
    case "DRAFT":
      return "#64748b";
    default:
      return "#dc2626";
  }
}

export function invoiceDocTitle(invoice: {
  status?: string;
  type?: string;
}): string {
  const status = (invoice.status || "").toUpperCase();
  const isPurchase =
    invoice.type != null && invoice.type.toUpperCase() === "PURCHASE";
  if (status === "PAID") {
    return "Payment Receipt";
  }
  return isPurchase ? "Purchase Invoice" : "Sales Invoice";
}

export function invoiceMoney(
  amount: number | undefined,
  currencyCode?: string,
): string {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return INVOICE_DOC_MISSING;
  }
  return formatCurrencyAmount({ amount, currencyCode });
}

export function isPaidInvoiceView(status?: string): boolean {
  return isInvoiceReceiptView(status);
}
