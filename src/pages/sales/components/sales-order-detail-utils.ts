import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";

export function orderStatusKey(so: SalesOrderResponseDTO): string {
  return (so.status || "quotation").toUpperCase();
}

export function paymentStatusKey(so: SalesOrderResponseDTO): string {
  return (so.paymentStatus || "UNPAID").toUpperCase();
}

export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function totalLineQty(so: SalesOrderResponseDTO): number {
  return (so.items || []).reduce((acc, item) => acc + (item.quantity || 0), 0);
}

export function paidAmount(so: SalesOrderResponseDTO): number {
  return (so.totalAmount ?? 0) - (so.outstandingAmount ?? 0);
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
