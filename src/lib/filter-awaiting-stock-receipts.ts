import type { GoodsReceipt } from "@/types/purchase";
import { purchaseLineItemName } from "@/lib/purchase-line-item";

/** Strip common PO/GR prefixes so "1023" matches "PO-1023" / "GR-1023". */
export function normalizeReceiptSearchToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^(po|gr)[\s#:_-]*/i, "");
}

function haystackIncludes(haystack: string | null | undefined, q: string, qNorm: string): boolean {
  if (!haystack) return false;
  const h = haystack.toLowerCase();
  if (h.includes(q)) return true;
  const hNorm = normalizeReceiptSearchToken(haystack);
  return Boolean(qNorm) && hNorm.includes(qNorm);
}

/**
 * Filter inspected receipts awaiting stock posting by GR no., PO no.,
 * supplier, order id, or line item name/SKU.
 */
export function filterAwaitingStockReceipts(
  receipts: GoodsReceipt[],
  query: string,
): GoodsReceipt[] {
  const q = query.trim().toLowerCase();
  if (!q) return receipts;
  const qNorm = normalizeReceiptSearchToken(q);

  return receipts.filter((receipt) => {
    const poNo =
      receipt.purchaseOrderNumber ??
      receipt.order?.orderNo ??
      receipt.order?.orderNumber ??
      "";
    const supplier =
      receipt.supplierName ??
      receipt.order?.supplierName ??
      receipt.order?.supplier?.name ??
      "";

    const matchesLineItem = receipt.items.some((line) => {
      const label = purchaseLineItemName({
        itemId: line.itemId,
        itemName: line.item?.name,
        item: line.orderItem,
      });
      const sku = line.item?.sku ?? "";
      return haystackIncludes(label, q, qNorm) || haystackIncludes(sku, q, qNorm);
    });

    return (
      haystackIncludes(receipt.receiptNo, q, qNorm) ||
      haystackIncludes(poNo, q, qNorm) ||
      haystackIncludes(supplier, q, qNorm) ||
      String(receipt.orderId).includes(q) ||
      matchesLineItem
    );
  });
}

export function formatAwaitingStockReceiptLabel(receipt: GoodsReceipt): string {
  const poNo =
    receipt.purchaseOrderNumber ??
    receipt.order?.orderNo ??
    receipt.orderId;
  const supplier =
    receipt.supplierName ??
    receipt.order?.supplierName ??
    receipt.order?.supplier?.name ??
    "";
  return supplier
    ? `${receipt.receiptNo} — ${poNo} — ${supplier}`
    : `${receipt.receiptNo} — ${poNo}`;
}
