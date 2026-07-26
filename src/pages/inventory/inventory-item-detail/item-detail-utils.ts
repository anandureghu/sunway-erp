import type { ItemResponseDTO } from "@/service/erpApiTypes";

export type StockIndicator = "in_stock" | "low_stock" | "out_of_stock" | "discontinued";

export function resolveStockIndicator(item: ItemResponseDTO): StockIndicator {
  if (item.status === "discontinued") return "discontinued";
  const available = Number(item.available ?? 0);
  const reorderLevel = Number(item.reorderLevel ?? 0);
  if (item.status === "out_of_stock" || available <= 0) return "out_of_stock";
  if (reorderLevel > 0 && available <= reorderLevel) return "low_stock";
  return "in_stock";
}

export function displaySellingPrice(item: ItemResponseDTO): number {
  const selling = Number(item.sellingPrice);
  const unitSale = Number(item.unitSale);
  if (Number.isFinite(selling) && selling > 0) return selling;
  if (Number.isFinite(unitSale) && unitSale > 0) return unitSale;
  return Number.isFinite(selling) ? selling : 0;
}

export function marginPercent(item: ItemResponseDTO): number | null {
  const cost = Number(item.costPrice);
  const selling = displaySellingPrice(item);
  if (!Number.isFinite(cost) || cost <= 0 || !Number.isFinite(selling) || selling <= 0) {
    return null;
  }
  return Math.round(((selling - cost) / cost) * 100);
}

export function warehouseLabel(item: ItemResponseDTO): string | null {
  if (item.warehouse_name && item.warehouse_id) {
    return `${item.warehouse_name}`;
  }
  return item.warehouse_name || (item.warehouse_id ? String(item.warehouse_id) : null);
}

export const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  discontinued: "Discontinued",
  out_of_stock: "Out of stock",
};
