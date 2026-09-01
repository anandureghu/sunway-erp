import type { ItemResponseDTO } from "@/service/erpApiTypes";

export function listPriceOf(
  item: Pick<ItemResponseDTO, "listPrice" | "sellingPrice">,
): number {
  const list = Number(item.listPrice ?? 0);
  if (list > 0) return list;
  return Number(item.sellingPrice ?? 0);
}

/** Catalog discount % when selling price is below list price. */
export function catalogDiscountPercent(
  item: Pick<ItemResponseDTO, "listPrice" | "sellingPrice">,
): number {
  const list = listPriceOf(item);
  const sell = Number(item.sellingPrice ?? 0);
  if (!(list > 0) || sell < 0 || sell >= list) return 0;
  return Math.round((1 - sell / list) * 10000) / 100;
}

export function hasCatalogDiscount(
  item: Pick<ItemResponseDTO, "listPrice" | "sellingPrice">,
): boolean {
  return catalogDiscountPercent(item) > 0;
}
