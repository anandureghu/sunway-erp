/**
 * Display helpers for sales order / invoice money.
 *
 * Stored semantics (unchanged):
 * - lineSubtotal = unitPrice × qty − discount
 * - subtotalAmount = Σ lineSubtotal (post-discount, pre-tax)
 * - discountAmount = Σ discount $
 * - totalAmount = Σ lineTotal (includes tax)
 *
 * Display semantics (user-facing):
 * - Line item = unitPrice × qty (exact / pre-discount)
 * - Subtotal = Σ line item amounts (pre-discount)
 * - Discount = discount $ with effective % in brackets
 * - Total = subtotal − discount (+ tax when present)
 */

export function lineItemGrossAmount(item: {
  unitPrice?: number | null;
  quantity?: number | null;
}): number {
  return Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0);
}

export function salesGrossSubtotal(args: {
  subtotalAmount?: number | null;
  discountAmount?: number | null;
  items?: Array<{ unitPrice?: number | null; quantity?: number | null }> | null;
}): number {
  const items = args.items;
  if (items && items.length > 0) {
    return items.reduce((sum, item) => sum + lineItemGrossAmount(item), 0);
  }
  return Number(args.subtotalAmount ?? 0) + Number(args.discountAmount ?? 0);
}

/** Effective discount % of gross, or shared line % when every line matches. */
export function salesDiscountPercentLabel(args: {
  discountAmount?: number | null;
  grossSubtotal?: number | null;
  items?: Array<{ discountPercent?: number | null; discount?: number | null }> | null;
}): string | null {
  const discountAmount = Number(args.discountAmount ?? 0);
  if (discountAmount <= 0) return null;

  const items = args.items || [];
  const percents = items
    .map((i) => Number(i.discountPercent ?? i.discount ?? 0))
    .filter((p) => Number.isFinite(p));
  if (percents.length > 0 && percents.every((p) => p === percents[0])) {
    const p = percents[0];
    if (p > 0) return `${formatPct(p)}%`;
  }

  const gross = Number(args.grossSubtotal ?? 0);
  if (gross > 0) {
    return `${formatPct((discountAmount / gross) * 100)}%`;
  }
  return null;
}

function formatPct(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}
