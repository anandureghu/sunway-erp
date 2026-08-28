/** Display name for PR/PO line rows from API mapping. */
export function purchaseLineItemName(line: {
  itemId: number;
  itemName?: string | null;
  item?: { itemName?: string | null; name?: string | null } | null;
}): string {
  const fromField = line.itemName?.trim();
  if (fromField) return fromField;
  const fromNested =
    line.item?.itemName?.trim() || (line.item as { name?: string })?.name?.trim();
  if (fromNested) return fromNested;
  return `Item #${line.itemId}`;
}

/** Qty shown on purchase invoices when line total was adjusted (e.g. after inspection). */
export function purchaseInvoiceLineQuantity(line: {
  quantity: number;
  unitPrice?: number;
  unitCost?: number;
  lineTotal?: number;
  total?: number;
  receivedQuantity?: number;
}): number {
  const orderedQty = Number(line.quantity || 0);
  const unit = Number(line.unitCost ?? line.unitPrice ?? 0);
  const lineTotal = Number(line.lineTotal ?? line.total ?? 0);

  if (unit > 0 && lineTotal > 0) {
    const implied = lineTotal / unit;
    const orderedTotal = orderedQty * unit;
    if (Math.abs(lineTotal - orderedTotal) > 0.01 && Number.isFinite(implied)) {
      const rounded = Math.round(implied * 1000) / 1000;
      return Math.abs(rounded - Math.round(rounded)) < 0.001
        ? Math.round(rounded)
        : rounded;
    }
  }

  const received = line.receivedQuantity;
  if (received != null && received > 0 && received !== orderedQty) {
    return received;
  }

  return orderedQty;
}
