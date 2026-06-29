import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { listItems, listWarehouses } from "@/service/inventoryService";
import type { Warehouse } from "@/types/inventory";
import { useCallback, useEffect, useMemo, useState } from "react";

export { filterItemsByQuery } from "@/lib/filter-items";

export function useManageStocks() {
  const [items, setItems] = useState<ItemResponseDTO[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

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
      const matchesStatus =
        selectedStatus === "all" || stock.status === selectedStatus;
      return matchesWarehouse && matchesSearch && matchesStatus;
    });
  }, [items, selectedWarehouse, searchQuery, selectedStatus]);

  const stats = useMemo(
    () => ({
      totalItems: items.length,
      lowStockItems: items.filter(
        (item) => item.available <= item.reorderLevel,
      ).length,
      onOrderCount: 0, // populated from approved POs — needs PO service integration
      onReserveCount: items.reduce((sum, item) => sum + item.reserved, 0),
    }),
    [items],
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
    selectedStatus,
    setSelectedStatus,
    filteredStock,
    stats,
  };
}
