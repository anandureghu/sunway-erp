import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { formatOptionalDate } from "@/pages/inventory/inventory-item-detail/formatters";

function matchesDateSearch(
  value: string | null | undefined,
  query: string,
): boolean {
  if (!value) return false;
  const iso = String(value).toLowerCase();
  const display = formatOptionalDate(value).toLowerCase();
  return iso.includes(query) || display.includes(query);
}

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
      (item.barcode?.toLowerCase().includes(lowerQuery) ?? false) ||
      matchesDateSearch(item.dateReceived, lowerQuery) ||
      matchesDateSearch(item.expiryDate, lowerQuery),
  );
}
