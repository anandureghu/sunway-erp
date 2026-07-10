import { useCallback, useEffect, useMemo, useState } from "react";
import { format, endOfMonth, startOfMonth } from "date-fns";
import type { ChartConfig } from "@/components/ui/chart";
import {
  getInventoryReportSummary,
  getInventoryBatchReport,
  getInventoryBatchInsights,
  getInventoryBatchMovements,
  listCategories,
  listItems,
  listWarehouses,
  type InventoryReportSummaryQuery,
} from "@/service/inventoryService";
import type {
  InventoryReportSummaryDTO,
  StockBatchInsightsDTO,
  StockBatchMovementReportDTO,
  StockBatchReportDTO,
  ItemResponseDTO,
} from "@/service/erpApiTypes";
import type { ItemCategory, Warehouse } from "@/types/inventory";
import { listSalesOrders } from "@/service/salesFlowService";
import type { SalesOrder } from "@/types/sales";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";
import { createCurrencySymbolIcon } from "@/components/currency/currency-symbol-icon";
import { useCompanyCurrency } from "@/hooks/use-company-currency";
import type { KpiSummaryStat } from "@/components/kpi-summary-strip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  AlertTriangle,
  Boxes,
  TrendingUp,
  Truck,
  Lock,
} from "lucide-react";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import {
  COGS_COLOR,
  PIE_COLORS,
  VALUATION_COLOR,
  inDateRange,
  orderCountsForTurnover,
} from "./inventory-reports-utils";

export type InventoryReportView = "operations" | "management";

export function useInventoryReports() {
  const { company } = useAuth();
  const { currencyCode, currencySymbol } = useCompanyCurrency();
  const fmt = (v: number) => formatMoney(v, currencyCode);
  const stockValueIcon = useMemo(
    () => createCurrencySymbolIcon(currencySymbol),
    [currencySymbol],
  );

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [items, setItems] = useState<ItemResponseDTO[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [warehouseId, setWarehouseId] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [itemIdFilter, setItemIdFilter] = useState("all");
  const [batchNoFilter, setBatchNoFilter] = useState("");

  const [summary, setSummary] = useState<InventoryReportSummaryDTO | null>(null);
  const [batchReport, setBatchReport] = useState<StockBatchReportDTO | null>(null);
  const [batchInsights, setBatchInsights] = useState<StockBatchInsightsDTO | null>(null);
  const [batchMovements, setBatchMovements] =
    useState<StockBatchMovementReportDTO | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    to: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });

  const summaryParams: InventoryReportSummaryQuery = useMemo(() => {
    const wid =
      warehouseId === "all" ? undefined : Number.parseInt(warehouseId, 10);
    const cat =
      categoryId === "all"
        ? undefined
        : categories.find((c) => String(c.id) === categoryId)?.name;
    return {
      warehouseId: Number.isFinite(wid as number) ? wid : undefined,
      category: cat,
    };
  }, [warehouseId, categoryId, categories]);

  const batchQueryParams = useMemo(() => {
    const wid =
      warehouseId === "all" ? undefined : Number.parseInt(warehouseId, 10);
    const iid =
      itemIdFilter === "all" ? undefined : Number.parseInt(itemIdFilter, 10);
    return {
      warehouseId: Number.isFinite(wid as number) ? wid : undefined,
      itemId: Number.isFinite(iid as number) ? iid : undefined,
      batchNo: batchNoFilter.trim() || undefined,
    };
  }, [warehouseId, itemIdFilter, batchNoFilter]);

  const loadBaseline = useCallback(async () => {
    const [whR, catR, itR, ordR] = await Promise.allSettled([
      listWarehouses(),
      listCategories(),
      listItems(),
      listSalesOrders(),
    ]);

    if (whR.status === "fulfilled") setWarehouses(whR.value);
    if (catR.status === "fulfilled") setCategories(catR.value);
    if (itR.status === "fulfilled") setItems(itR.value);
    if (ordR.status === "fulfilled") setOrders(ordR.value);

    const failures = [whR, catR, itR, ordR].filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    if (failures.length === 4) {
      toast.error("Could not load inventory data. Check your permissions.");
    } else {
      failures.forEach((r) =>
        console.warn("Inventory report source unavailable:", r.reason),
      );
    }
    setOrdersLoading(false);
  }, []);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setLastError(null);
    try {
      const [data, batches, insights, movements] = await Promise.all([
        getInventoryReportSummary(summaryParams),
        getInventoryBatchReport(batchQueryParams),
        getInventoryBatchInsights(batchQueryParams),
        getInventoryBatchMovements({ ...batchQueryParams, limit: 150 }),
      ]);
      setSummary(data);
      setBatchReport(batches);
      setBatchInsights(insights);
      setBatchMovements(movements);
    } catch (e: unknown) {
      console.error(e);
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as Error).message)
          : "Failed to load inventory summary.";
      setLastError(msg);
      toast.error("Inventory summary could not be loaded.");
    } finally {
      setSummaryLoading(false);
    }
  }, [summaryParams, batchQueryParams]);

  useEffect(() => {
    void loadBaseline();
  }, [loadBaseline]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const itemById = useMemo(() => {
    const m = new Map<number, ItemResponseDTO>();
    items.forEach((i) => m.set(i.id, i));
    return m;
  }, [items]);

  const turnover = useMemo(() => {
    const avgInventory = summary?.totals.stockValueAtCost ?? 0;
    const rangeOrders = orders.filter(
      (o) =>
        orderCountsForTurnover(o) &&
        inDateRange(o.orderDate, dateRange.from, dateRange.to),
    );

    let totalCOGS = 0;
    const cogsByCategory = new Map<string, number>();

    const wid =
      warehouseId === "all" ? undefined : Number.parseInt(warehouseId, 10);
    const catName =
      categoryId === "all"
        ? undefined
        : categories.find((c) => String(c.id) === categoryId)?.name;

    for (const order of rangeOrders) {
      for (const line of order.items ?? []) {
        const item = itemById.get(line.itemId);
        if (!item) continue;
        if (catName && item.category !== catName) continue;
        if (
          wid !== undefined &&
          Number.isFinite(wid) &&
          line.warehouseId !== undefined &&
          line.warehouseId !== wid
        ) {
          continue;
        }
        const cost = Number(item.costPrice ?? 0);
        const lineCogs = line.quantity * cost;
        totalCOGS += lineCogs;
        const key = item.category?.trim() || "Uncategorized";
        cogsByCategory.set(key, (cogsByCategory.get(key) ?? 0) + lineCogs);
      }
    }

    const turnoverRatio = avgInventory > 0 ? totalCOGS / avgInventory : 0;
    const daysToSell = turnoverRatio > 0 ? 365 / turnoverRatio : 0;

    const turnoverByCategory = (summary?.byCategory ?? []).map((row) => {
      const cogs = cogsByCategory.get(row.category) ?? 0;
      const inv = Number(row.valueAtCost ?? 0);
      const ratio = inv > 0 ? cogs / inv : 0;
      return {
        category: row.category,
        inventoryValue: inv,
        cogs,
        turnoverRatio: ratio,
        daysToSell: ratio > 0 ? 365 / ratio : 0,
      };
    });

    return {
      totalCOGS,
      avgInventoryValue: avgInventory,
      turnoverRatio,
      daysToSell,
      salesCount: rangeOrders.length,
      turnoverByCategory,
    };
  }, [summary, orders, dateRange, itemById, warehouseId, categoryId, categories]);

  const valuationByWarehouse = useMemo(
    () =>
      (summary?.byWarehouse ?? []).map((w) => ({
        warehouse: w.warehouseName,
        value: Number(w.valueAtCost ?? 0),
        quantity: w.onHand,
        reserved: w.reserved,
        available: w.available,
      })),
    [summary],
  );

  const valuationByCategory = useMemo(
    () =>
      (summary?.byCategory ?? []).map((c) => ({
        category: c.category,
        value: Number(c.valueAtCost ?? 0),
        skuCount: c.skuCount,
        onHand: c.onHand,
      })),
    [summary],
  );

  const topItems = useMemo(
    () =>
      (summary?.topStockLinesByValue ?? []).map((row) => {
        const unitCost =
          row.quantityOnHand > 0
            ? Number(row.valueAtCost ?? 0) / row.quantityOnHand
            : 0;
        return {
          name: row.name,
          sku: row.sku,
          quantity: row.quantityOnHand,
          unitCost,
          totalValue: Number(row.valueAtCost ?? 0),
          warehouse: row.warehouseName,
        };
      }),
    [summary],
  );

  const totals = summary?.totals;

  const opsKpiItems: KpiSummaryStat[] = useMemo(
    () => [
      {
        label: "Units on hand",
        value: summaryLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          (totals?.totalQuantityOnHand ?? 0).toLocaleString()
        ),
        hint: "Total physical stock",
        accent: "violet",
        icon: Boxes,
      },
      {
        label: "Available",
        value: summaryLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          (totals?.totalAvailable ?? 0).toLocaleString()
        ),
        hint: "Ready to pick or ship",
        accent: "emerald",
        icon: Package,
      },
      {
        label: "Reserved",
        value: summaryLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          (totals?.totalReserved ?? 0).toLocaleString()
        ),
        hint: "Allocated to orders",
        accent: "sky",
        icon: Lock,
      },
      {
        label: "On order",
        value: summaryLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          (totals?.totalOnOrder ?? 0).toLocaleString()
        ),
        hint: "Incoming from purchase",
        accent: "blue",
        icon: Truck,
      },
      {
        label: "Low stock alerts",
        value: summaryLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          (summary?.lowStockItemCount ?? 0).toLocaleString()
        ),
        hint: "At or below reorder level",
        accent: "amber",
        icon: AlertTriangle,
      },
    ],
    [summaryLoading, totals, summary?.lowStockItemCount],
  );

  const mgmtKpiItems: KpiSummaryStat[] = useMemo(
    () => [
      {
        label: "Stock value (cost)",
        value: summaryLoading ? (
          <Skeleton className="h-8 w-36" />
        ) : (
          <CurrencyAmount amount={totals?.stockValueAtCost ?? 0} />
        ),
        hint: "Inventory asset at cost",
        accent: "emerald",
        icon: stockValueIcon,
      },
      {
        label: "Stock value (selling)",
        value: summaryLoading ? (
          <Skeleton className="h-8 w-36" />
        ) : (
          <CurrencyAmount amount={totals?.stockValueAtSelling ?? 0} />
        ),
        hint: "Potential revenue at list price",
        accent: "sky",
        icon: TrendingUp,
      },
      {
        label: "Distinct SKUs",
        value: summaryLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          (totals?.distinctSkuCount ?? 0).toLocaleString()
        ),
        hint: "Unique items in stock",
        accent: "violet",
        icon: Package,
      },
      {
        label: "Turnover ratio",
        value: summaryLoading || ordersLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          `${turnover.turnoverRatio.toFixed(2)}×`
        ),
        hint: `COGS / inventory · ${turnover.daysToSell > 0 ? `${turnover.daysToSell.toFixed(0)} days to sell` : "no sales in period"}`,
        accent: "amber",
        icon: TrendingUp,
      },
    ],
    [summaryLoading, ordersLoading, totals, turnover, stockValueIcon],
  );

  const warehouseChartConfig: ChartConfig = {
    value: { label: "Value", color: VALUATION_COLOR },
  };

  const categoryChartConfig = useMemo(
    () =>
      Object.fromEntries(
        valuationByCategory.map((row, i) => [
          row.category,
          { label: row.category, color: PIE_COLORS[i % PIE_COLORS.length] },
        ]),
      ) as ChartConfig,
    [valuationByCategory],
  );

  const cogsChartConfig: ChartConfig = {
    cogs: { label: "COGS", color: COGS_COLOR },
  };

  const setTurnoverMonth = () => {
    setDateRange({
      from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      to: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    });
  };

  const exportOperationsCsv = () => {
    if (!summary) return;
    const rows: string[][] = [
      ["Operations inventory report"],
      ["Company", company?.companyName ?? ""],
      [],
      ["Metric", "Value"],
      ["Units on hand", String(totals?.totalQuantityOnHand ?? 0)],
      ["Available", String(totals?.totalAvailable ?? 0)],
      ["Reserved", String(totals?.totalReserved ?? 0)],
      ["On order", String(totals?.totalOnOrder ?? 0)],
      ["Low stock items", String(summary.lowStockItemCount ?? 0)],
      [],
      ["Low stock — Item", "SKU", "Available", "Reorder level"],
      ...(summary.lowStockItems ?? []).map((r) => [
        r.name,
        r.sku,
        String(r.available ?? 0),
        String(r.reorderLevel ?? ""),
      ]),
      [],
      ["Batch", "Item", "Warehouse", "Qty", "Expiry"],
      ...(batchReport?.batches ?? []).map((b) => [
        b.batchNo,
        b.itemName ?? "",
        b.warehouseName ?? "",
        String(b.quantityOnHand),
        b.expiryDate ?? "",
      ]),
    ];
    downloadCsv(rows, "inventory-operations-report");
  };

  const exportManagementCsv = () => {
    if (!summary) return;
    const rows: string[][] = [
      ["Management inventory report"],
      ["Company", company?.companyName ?? ""],
      ["Period", `${dateRange.from} to ${dateRange.to}`],
      [],
      ["Metric", "Value"],
      ["Stock value at cost", String(totals?.stockValueAtCost ?? 0)],
      ["Stock value at selling", String(totals?.stockValueAtSelling ?? 0)],
      ["Turnover ratio", turnover.turnoverRatio.toFixed(2)],
      ["COGS (period)", String(turnover.totalCOGS)],
      [],
      ["Warehouse", "Value at cost", "Quantity"],
      ...valuationByWarehouse.map((w) => [
        w.warehouse,
        String(w.value),
        String(w.quantity),
      ]),
      [],
      ["Category", "Value at cost", "SKUs"],
      ...valuationByCategory.map((c) => [
        c.category,
        String(c.value),
        String(c.skuCount),
      ]),
    ];
    downloadCsv(rows, "inventory-management-report");
  };

  return {
    company,
    fmt,
    warehouses,
    categories,
    items,
    warehouseId,
    setWarehouseId,
    categoryId,
    setCategoryId,
    itemIdFilter,
    setItemIdFilter,
    batchNoFilter,
    setBatchNoFilter,
    dateRange,
    setDateRange,
    setTurnoverMonth,
    summary,
    batchReport,
    batchInsights,
    batchMovements,
    summaryLoading,
    ordersLoading,
    lastError,
    loadSummary,
    turnover,
    valuationByWarehouse,
    valuationByCategory,
    topItems,
    opsKpiItems,
    mgmtKpiItems,
    batchQueryParams,
    warehouseChartConfig,
    categoryChartConfig,
    cogsChartConfig,
    exportOperationsCsv,
    exportManagementCsv,
  };
}

function downloadCsv(rows: string[][], prefix: string) {
  const csv = rows
    .map((r) => r.map((v) => `"${(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${prefix}-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
