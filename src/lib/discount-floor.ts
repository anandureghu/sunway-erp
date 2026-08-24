/**
 * Keep discounted unit prices from falling below cost (shared by catalog pricing
 * and sales order line discounts).
 */

/** Max discount % so unitPrice × (1 − pct/100) ≥ costPrice. */
export function maxDiscountPercent(
  unitPrice: number,
  costPrice?: number | null,
): number {
  if (!(unitPrice > 0)) return 0;
  const cost = Number(costPrice ?? 0);
  if (!(cost > 0)) return 100;
  if (unitPrice <= cost) return 0;
  return Math.round((1 - cost / unitPrice) * 10000) / 100;
}

/** Clamp requested discount % to the cost-price floor. */
export function clampDiscountPercent(
  unitPrice: number,
  discountPercent: number,
  costPrice?: number | null,
): { percent: number; capped: boolean; maxPercent: number } {
  const raw = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const maxPercent = maxDiscountPercent(unitPrice, costPrice);
  const capped = raw > maxPercent + 1e-9;
  return {
    percent: capped ? maxPercent : raw,
    capped,
    maxPercent,
  };
}

/** Price after discount, never below cost when cost &gt; 0. */
export function priceAfterDiscount(
  unitPrice: number,
  discountPercent: number,
  costPrice?: number | null,
): { price: number; capped: boolean; appliedPercent: number } {
  const { percent, capped } = clampDiscountPercent(
    unitPrice,
    discountPercent,
    costPrice,
  );
  const raw = Math.round(unitPrice * (1 - percent / 100) * 100) / 100;
  const cost = Number(costPrice ?? 0);
  const price =
    cost > 0 ? Math.max(cost, raw) : Math.max(0, raw);
  return { price, capped, appliedPercent: percent };
}
