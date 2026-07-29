import type { GoodsReceipt } from "@/types/purchase";

/** Accepted lines that still need inventory post (Receive). */
export function goodsReceiptLinesAwaitingStock(receipt: GoodsReceipt) {
  return (receipt.items || []).filter(
    (item) => (item.acceptedQuantity ?? 0) > 0 && !item.stockedAt,
  );
}

export function isGoodsReceiptFullyReceived(receipt: GoodsReceipt): boolean {
  if (receipt.status !== "inspected") return false;
  return goodsReceiptLinesAwaitingStock(receipt).length === 0;
}

/**
 * Stage wording:
 * Ready for inspection (PO, no GR yet) → Inspected - Ready for Confirmation (GR pending inspect)
 * → Confirmed - Ready to Receive (inspected, stock pending) → Received
 */
export function goodsReceiptDisplayLabel(receipt: GoodsReceipt): string {
  if (receipt.status === "pending_inspection") {
    return "Inspected - Ready for Confirmation";
  }
  if (isGoodsReceiptFullyReceived(receipt)) {
    return "Received";
  }
  return "Confirmed - Ready to Receive";
}

export function goodsReceiptDisplayLabelFromStatus(
  status: string,
  receipt?: GoodsReceipt | null,
): string {
  if (receipt) return goodsReceiptDisplayLabel(receipt);
  const s = (status || "").toLowerCase();
  if (s === "pending_inspection") return "Inspected - Ready for Confirmation";
  if (s === "inspected") return "Confirmed - Ready to Receive";
  return status
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** True when every linked GR is inspected and accepted qty is stocked. */
export function arePurchaseOrderGoodsFullyReceived(
  receipts: GoodsReceipt[],
): boolean {
  if (!receipts.length) return false;
  return receipts.every(isGoodsReceiptFullyReceived);
}
