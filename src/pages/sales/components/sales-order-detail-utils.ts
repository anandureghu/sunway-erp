import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";

export function orderStatusKey(so: SalesOrderResponseDTO): string {
  return (so.status || "quotation").toUpperCase();
}

export function paymentStatusKey(so: SalesOrderResponseDTO): string {
  return (so.paymentStatus || "UNPAID").trim().toUpperCase().replace(/\s+/g, "_");
}

export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function totalLineQty(so: SalesOrderResponseDTO): number {
  return (so.items || []).reduce((acc, item) => acc + (item.quantity || 0), 0);
}

/** Remaining balance due — null outstanding (no invoice yet) means the full total. */
export function outstandingBalance(so: SalesOrderResponseDTO): number {
  const total = so.totalAmount ?? 0;
  if (paymentStatusKey(so) === "PAID") return 0;
  return so.outstandingAmount ?? total;
}

/**
 * Amount already settled. Treat missing outstanding as unpaid (paid = 0), matching
 * the sales-orders list columns — do not coalesce null outstanding to 0.
 */
export function paidAmount(so: SalesOrderResponseDTO): number {
  const total = so.totalAmount ?? 0;
  const payment = paymentStatusKey(so);
  if (payment === "PAID") return total;
  if (so.outstandingAmount == null) return 0;
  return Math.max(0, total - Number(so.outstandingAmount));
}

export function nextStepMessage(so: SalesOrderResponseDTO): string {
  const payment = paymentStatusKey(so);
  if (payment === "PAID") return "Payment complete. Fulfillment can proceed.";
  if (payment === "PARTIALLY_PAID") {
    return "Partially paid. Full payment is required before picklist generation.";
  }
  return "Awaiting payment before fulfillment.";
}

export const ORDER_STATUS_STYLES: Record<string, string> = {
  QUOTATION: "bg-slate-100 text-slate-700",
  CONFIRMED: "bg-indigo-50 text-indigo-700",
  PICKED: "bg-sky-50 text-sky-700",
  DISPATCHED: "bg-blue-50 text-blue-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700",
  ARCHIVED: "bg-slate-100 text-slate-500",
};

export const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700",
  UNPAID: "bg-slate-100 text-slate-600",
};
