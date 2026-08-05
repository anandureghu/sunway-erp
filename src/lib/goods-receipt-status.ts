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

/** Remaining orderable qty across PO lines (ordered − accepted − rejected). */
export function purchaseOrderRemainingQuantity(order: {
  items?: Array<{
    quantity?: number;
    receivedQuantity?: number;
    rejectedQuantity?: number;
  }>;
}): number {
  return (order.items || []).reduce((sum, item) => {
    const ordered = Number(item.quantity ?? 0);
    const received = Number(item.receivedQuantity ?? 0);
    const rejected = Number(item.rejectedQuantity ?? 0);
    return sum + Math.max(ordered - received - rejected, 0);
  }, 0);
}

/**
 * Fallback remaining estimate from goods receipts when PO line received/rejected
 * quantities are not available on the order payload.
 */
export function purchaseOrderRemainingFromReceipts(
  order: {
    id: string | number;
    items?: Array<{ itemId?: number; quantity?: number }>;
  },
  receipts: GoodsReceipt[],
): number {
  const fromLines = purchaseOrderRemainingQuantity(order as {
    items?: Array<{
      quantity?: number;
      receivedQuantity?: number;
      rejectedQuantity?: number;
    }>;
  });
  // Prefer authoritative PO line counters when any progress has been recorded.
  const hasProgress = (order.items || []).some(
    (i) =>
      Number((i as { receivedQuantity?: number }).receivedQuantity ?? 0) > 0 ||
      Number((i as { rejectedQuantity?: number }).rejectedQuantity ?? 0) > 0,
  );
  if (hasProgress) return fromLines;

  const resolvedByItem = new Map<number, number>();
  for (const receipt of receipts) {
    if (String(receipt.orderId) !== String(order.id) || receipt.archived) {
      continue;
    }
    for (const line of receipt.items || []) {
      const itemId = Number(line.itemId);
      if (!itemId) continue;
      const accepted = Number(line.acceptedQuantity ?? 0);
      const rejected = Number(line.rejectedQuantity ?? 0);
      // Pending inspection: count physical received as committed against remaining.
      const pendingReceived =
        receipt.status === "pending_inspection"
          ? Number(line.receivedQuantity ?? 0)
          : 0;
      const resolved =
        receipt.status === "pending_inspection"
          ? pendingReceived
          : accepted + rejected;
      resolvedByItem.set(itemId, (resolvedByItem.get(itemId) ?? 0) + resolved);
    }
  }

  return (order.items || []).reduce((sum, item) => {
    const itemId = Number(item.itemId);
    const ordered = Number(item.quantity ?? 0);
    const resolved = resolvedByItem.get(itemId) ?? 0;
    return sum + Math.max(ordered - resolved, 0);
  }, 0);
}
