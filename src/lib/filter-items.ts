import type { ItemResponseDTO } from "@/service/erpApiTypes";

export function filterItemsByQuery(
  items: ItemResponseDTO[],
  query: string,
): ItemResponseDTO[] {
  if (query.length === 0) return [];
  const lowerQuery = query.toLowerCase();
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.sku.toLowerCase().includes(lowerQuery) ||
      (item.barcode?.toLowerCase().includes(lowerQuery) ?? false),
  );
}
