import type { ItemResponseDTO, InventoryReportTotalsDTO } from "@/service/erpApiTypes";
import {
  listItems,
  listStockCatalog,
  listWarehouses,
  getInventoryReportSummary,
} from "@/service/inventoryService";
import type { Warehouse } from "@/types/inventory";
import { useServerPagedList } from "@/hooks/use-server-paged-list";
import { useCallback, useEffect, useMemo, useState } from "react";

export { filterItemsByQuery } from "@/lib/filter-items";

export function useManageStocks() {
  const [items, setItems] = useState<ItemResponseDTO[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [reportTotals, setReportTotals] = useState<InventoryReportTotalsDTO | null>(null);
  const [lowStockItemCount, setLowStockItemCount] = useState(0);
  const [metaLoading, setMetaLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [stockKpiFilter, setStockKpiFilter] = useState<
    "all" | "low_stock" | "on_reserve"
  >("all");
  const [catalogView, setCatalogView] = useState<"active" | "archived">(
    "active",
  );

  const catalogFilters = useMemo(
    () => ({
      archived: catalogView === "archived",
      status: catalogView === "archived" ? "all" : selectedStatus,
      stockFilter: stockKpiFilter,
    }),
    [catalogView, selectedStatus, stockKpiFilter],
  );

  const fetchStockCatalog = useCallback(
    (params: {
      page: number;
      size: number;
      search: string;
      archived: boolean;
      status: string;
      stockFilter: string;
    }) =>
      listStockCatalog({
        page: params.page,
        size: params.size,
        search: params.search,
        archived: params.archived,
        status: params.status,
        stockFilter: params.stockFilter,
      }),
    [],
  );

  const {
    rows: filteredStock,
    loading: catalogLoading,
    searchInput: searchQuery,
    setSearchInput: setSearchQuery,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalElements,
    pageCount,
    reload: reloadCatalog,
  } = useServerPagedList<
    ItemResponseDTO,
    { archived: boolean; status: string; stockFilter: string }
  >({
    fetcher: fetchStockCatalog,
    filters: catalogFilters,
    errorMessage: "Failed to load inventory data",
  });

  const loadMeta = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    try {
      if (!silent) {
        setMetaLoading(true);
      }
      setLoadError(null);
      const [itemsList, warehousesList, reportSummary] = await Promise.all([
        listItems(),
        listWarehouses(),
        getInventoryReportSummary(),
      ]);
      setItems(itemsList);
      setWarehouses(warehousesList);
      setReportTotals(reportSummary.totals);
      setLowStockItemCount(reportSummary.lowStockItemCount ?? 0);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } } };
      const msg =
        ax.response?.data?.message ??
        (e instanceof Error ? e.message : null) ??
        "Failed to load inventory data";
      setLoadError(msg);
    } finally {
      if (!silent) {
        setMetaLoading(false);
      }
    }
  }, []);

  /** Background refresh (no full-page loading spinner) — tab switches, after receive/adjust. */
  const refetch = useCallback(async () => {
    await Promise.all([loadMeta({ silent: true }), Promise.resolve(reloadCatalog())]);
  }, [loadMeta, reloadCatalog]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  const stats = useMemo(
    () => ({
      totalItems: reportTotals?.distinctSkuCount ?? items.length,
      lowStockItems: lowStockItemCount,
      onOrderCount: reportTotals?.totalOnOrder ?? 0,
      onReserveCount: reportTotals?.totalReserved ?? 0,
    }),
    [items.length, reportTotals, lowStockItemCount],
  );

  return {
    items,
    warehouses,
    loading: metaLoading || catalogLoading,
    loadError,
    refetch,
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    stockKpiFilter,
    setStockKpiFilter,
    catalogView,
    setCatalogView,
    filteredStock,
    stats,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalElements,
    pageCount,
  };
}
