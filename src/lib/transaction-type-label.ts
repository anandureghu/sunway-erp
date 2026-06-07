export const TRANSACTION_TYPES = [
  { key: "OPENING_BALANCE", label: "Opening Balance" },
  { key: "PAYMENT", label: "Payment" },
  { key: "MANUAL", label: "Manual Entry" },
  { key: "JOURNAL", label: "Journal" },
  { key: "RECONCILIATION", label: "Reconciliation" },
  { key: "BUDGET", label: "Budget" },
  { key: "PURCHASE_REQUISITION", label: "Purchase Requisition" },
  { key: "VENDOR_PAYMENT", label: "Vendor Payment" },
  { key: "PURCHASE_ORDER_ENCUMBRANCE", label: "Purchase Order Encumbrance" },
  {
    key: "PURCHASE_ORDER_CANCEL_REVERSAL",
    label: "PO Cancel Reversal",
  },
  {
    key: "SALES_ORDER_CANCEL_REVERSAL",
    label: "Sales Order Cancel Reversal",
  },
  { key: "STOCK_VARIANCE", label: "Stock Variance" },
] as const;

const LABEL_BY_KEY = Object.fromEntries(
  TRANSACTION_TYPES.map((t) => [t.key, t.label]),
) as Record<string, string>;

export function transactionTypeLabel(type: string | null | undefined): string {
  if (!type) return "—";
  const normalized = type.toUpperCase();
  if (LABEL_BY_KEY[normalized]) return LABEL_BY_KEY[normalized];
  return normalized
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function transactionTypeBadgeClass(
  type: string | null | undefined,
): string {
  const key = (type ?? "").toUpperCase();
  if (key === "OPENING_BALANCE") return "border-slate-200 bg-slate-50 text-slate-700";
  if (key === "PAYMENT" || key === "VENDOR_PAYMENT")
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (key === "JOURNAL" || key === "MANUAL")
    return "border-blue-200 bg-blue-50 text-blue-800";
  if (key === "RECONCILIATION")
    return "border-violet-200 bg-violet-50 text-violet-800";
  if (key === "BUDGET") return "border-amber-200 bg-amber-50 text-amber-800";
  if (key.startsWith("PURCHASE_"))
    return "border-orange-200 bg-orange-50 text-orange-800";
  if (key === "STOCK_VARIANCE")
    return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-slate-200 bg-slate-50 text-slate-600";
}
