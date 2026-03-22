import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { listItems, listWarehouses } from "@/service/inventoryService";
import type { Warehouse } from "@/types/inventory";
import { useCallback, useEffect, useMemo, useState } from "react";

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

export function useManageStocks() {
  const [items, setItems] = useState<ItemResponseDTO[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    try {
      if (!silent) {
        setLoading(true);
      }
      setLoadError(null);
      const [itemsList, warehousesList] = await Promise.all([
        listItems(),
        listWarehouses(),
      ]);
      setItems(itemsList);
      setWarehouses(warehousesList);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } } };
      const msg =
        ax.response?.data?.message ??
        (e instanceof Error ? e.message : null) ??
        "Failed to load inventory data";
      setLoadError(msg);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  /** Background refresh (no full-page loading spinner) — tab switches, after receive/adjust. */
  const refetch = useCallback(async () => {
    await loadData({ silent: true });
  }, [loadData]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredStock = useMemo(() => {
    return items.filter((stock) => {
      const matchesWarehouse =
        selectedWarehouse === "all" ||
        String(stock.warehouse_id) === selectedWarehouse;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        stock.name.toLowerCase().includes(q) ||
        stock.sku.toLowerCase().includes(q) ||
        (stock.barcode?.toLowerCase().includes(q) ?? false);
      return matchesWarehouse && matchesSearch;
    });
  }, [items, selectedWarehouse, searchQuery]);

  const stats = useMemo(
    () => ({
      totalItems: items.length,
      lowStockItems: items.filter(
        (item) => item.available <= item.reorderLevel,
      ).length,
      totalValue: items.reduce(
        (sum, item) => sum + item.available * item.costPrice,
        0,
      ),
      warehouseCount: warehouses.length,
    }),
    [items, warehouses.length],
  );

  return {
    items,
    warehouses,
    loading,
    loadError,
    refetch,
    selectedWarehouse,
    setSelectedWarehouse,
    searchQuery,
    setSearchQuery,
    filteredStock,
    stats,
  };
}
