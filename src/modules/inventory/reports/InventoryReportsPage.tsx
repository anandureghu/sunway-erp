import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Loader2,
  Warehouse as WarehouseIcon,
  Layers,
  Download,
  Boxes,
} from "lucide-react";
import { format, endOfMonth, isValid, parseISO, startOfMonth } from "date-fns";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
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
} from "@/service/erpApiTypes";
import type { ItemCategory, Warehouse } from "@/types/inventory";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { listSalesOrders } from "@/service/salesFlowService";
import type { SalesOrder } from "@/types/sales";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { ItemBatchReportsPanel } from "@/pages/inventory/inventory-item-detail/item-batch-reports-panel";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import { createCurrencySymbolIcon } from "@/components/currency/currency-symbol-icon";
import { useCompanyCurrency } from "@/hooks/use-company-currency";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";

const PIE_COLORS = [
  "hsl(220 83% 56%)",
  "hsl(142 76% 45%)",
  "hsl(38 92% 56%)",
  "hsl(280 70% 60%)",
  "hsl(0 78% 60%)",
  "hsl(190 80% 50%)",
];

const VALUATION_COLOR = "hsl(142 76% 45%)";
const COGS_COLOR = "hsl(38 92% 56%)";

const batchTrendChartConfig = {
  receiveQty: { label: "Received", color: "hsl(142 76% 45%)" },
  issueQty: { label: "Issued", color: "hsl(0 78% 60%)" },
} satisfies ChartConfig;

const compactNumber = (n: number) => {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toString();
};

function inDateRange(isoDate: string, from: string, to: string): boolean {
  try {
    const d = parseISO(isoDate);
    const a = parseISO(from);
    const b = parseISO(to);
    return d >= a && d <= b;
  } catch {
    return false;
  }
}

function orderCountsForTurnover(o: SalesOrder): boolean {
  const s = (o.status || "").toLowerCase();
  if (s === "cancelled" || s === "draft") return false;
  if (o.archived) return false;
  return true;
}

function QuickChip({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
    >
      {children}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export default function InventoryReportsPage() {
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

  const [warehouseId, setWarehouseId] = useState<string>("all");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [itemIdFilter, setItemIdFilter] = useState<string>("all");
  const [batchNoFilter, setBatchNoFilter] = useState("");

  const [summary, setSummary] = useState<InventoryReportSummaryDTO | null>(
    null,
  );
  const [batchReport, setBatchReport] = useState<StockBatchReportDTO | null>(
    null,
  );
  const [batchInsights, setBatchInsights] = useState<StockBatchInsightsDTO | null>(
    null,
  );
  const [batchMovements, setBatchMovements] =
    useState<StockBatchMovementReportDTO | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
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
    // Load each source independently so a permission a user lacks (e.g. only
    // INVENTORY_SALES granted, not WAREHOUSE/CATEGORY) doesn't blank the whole
    // report — the accessible parts still populate.
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
      // Nothing loaded — likely no inventory access at all.
      toast.error("Could not load inventory data. Check your permissions.");
    } else {
      // Partial failures usually mean the user wasn't granted that sub-module;
      // log them but don't block the report.
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
  }, [
    summary,
    orders,
    dateRange,
    itemById,
    warehouseId,
    categoryId,
    categories,
  ]);

  const valuationByWarehouse = useMemo(
    () =>
      (summary?.byWarehouse ?? []).map((w) => ({
        warehouse: w.warehouseName,
        value: Number(w.valueAtCost ?? 0),
        quantity: w.onHand,
      })),
    [summary],
  );

  const valuationByCategory = useMemo(
    () =>
      (summary?.byCategory ?? []).map((c) => ({
        category: c.category,
        value: Number(c.valueAtCost ?? 0),
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

  const kpis = useMemo(() => {
    const t = summary?.totals;
    return {
      stockValue: t?.stockValueAtCost ?? 0,
      totalSkus: t?.distinctSkuCount ?? 0,
      lowStock: summary?.lowStockItemCount ?? 0,
      onHand: t?.totalQuantityOnHand ?? 0,
    };
  }, [summary]);

  const kpiItems: KpiSummaryStat[] = useMemo(
    () => [
      {
        label: "Stock value (cost)",
        value: summaryLoading ? (
          <Skeleton className="h-8 w-36" />
        ) : (
          <CurrencyAmount amount={kpis.stockValue} />
        ),
        hint: "Inventory at cost for current filters",
        accent: "emerald",
        icon: stockValueIcon,
      },
      {
        label: "Distinct SKUs",
        value: summaryLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          kpis.totalSkus.toLocaleString()
        ),
        hint: "Unique items in stock",
        accent: "sky",
        icon: Package,
      },
      {
        label: "Low stock items",
        value: summaryLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          kpis.lowStock.toLocaleString()
        ),
        hint: "At or below reorder level",
        accent: "amber",
        icon: AlertTriangle,
      },
      {
        label: "Units on hand",
        value: summaryLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          kpis.onHand.toLocaleString()
        ),
        hint: "Total quantity across locations",
        accent: "violet",
        icon: Boxes,
      },
    ],
    [summaryLoading, kpis, stockValueIcon],
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

  const exportCsv = () => {
    if (!summary) return;
    const rows: string[][] = [];
    rows.push(["Inventory report"]);
    rows.push(["Company", company?.companyName ?? ""]);
    rows.push(["Warehouse filter", warehouseId === "all" ? "All" : warehouseId]);
    rows.push(["Category filter", categoryId === "all" ? "All" : categoryId]);
    rows.push([]);
    rows.push(["Metric", "Value"]);
    rows.push(["Stock value at cost", String(kpis.stockValue)]);
    rows.push(["Distinct SKUs", String(kpis.totalSkus)]);
    rows.push(["Low stock items", String(kpis.lowStock)]);
    rows.push(["Units on hand", String(kpis.onHand)]);
    rows.push([]);
    rows.push(["Warehouse", "Value at cost", "Quantity"]);
    valuationByWarehouse.forEach((w) =>
      rows.push([w.warehouse, String(w.value), String(w.quantity)]),
    );
    rows.push([]);
    rows.push(["Category", "Value at cost"]);
    valuationByCategory.forEach((c) =>
      rows.push([c.category, String(c.value)]),
    );

    const csv = rows
      .map((r) => r.map((v) => `"${(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const setTurnoverMonth = () => {
    setDateRange({
      from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      to: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    });
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Inventory Reports"
        description={`${company?.companyName ?? "Company"} · stock valuation, turnover, and warehouse analytics`}
        variant="darkGreen"
        icon={<BarChart3 className="w-6 h-6" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={summaryLoading}
              onClick={() => void loadSummary()}
              className="border border-white/25 bg-white/15 text-white hover:bg-white/25 hover:text-white"
            >
              {summaryLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={exportCsv}
              disabled={!summary || summaryLoading}
              className="bg-white text-emerald-800 hover:bg-emerald-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Warehouse and category filter the stock snapshot. Item and batch
            number filter batch reports. Date range applies to turnover only.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
                Warehouse
              </Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All warehouses</SelectItem>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                Category
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name || c.code || String(c.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Item (batch reports)</Label>
              <Select value={itemIdFilter} onValueChange={setItemIdFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All items</SelectItem>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.sku ? `${i.sku} — ` : ""}
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="batch-no-filter">Batch number</Label>
              <Input
                id="batch-no-filter"
                placeholder="Search batch…"
                value={batchNoFilter}
                onChange={(e) => setBatchNoFilter(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-turnover-from">Period from</Label>
              <Input
                id="inv-turnover-from"
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((d) => ({ ...d, from: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-turnover-to">Period to</Label>
              <Input
                id="inv-turnover-to"
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((d) => ({ ...d, to: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickChip onClick={setTurnoverMonth}>This month</QuickChip>
          </div>
          {lastError ? (
            <p className="text-sm text-destructive">{lastError}</p>
          ) : null}
        </CardContent>
      </Card>

      <KpiSummaryStrip items={kpiItems} />

      <Tabs defaultValue="valuation" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="valuation">Stock valuation</TabsTrigger>
          <TabsTrigger value="batches">Batch stock</TabsTrigger>
          <TabsTrigger value="analytics">Batch analytics</TabsTrigger>
          <TabsTrigger value="movements">Movement history</TabsTrigger>
          <TabsTrigger value="turnover">Turnover</TabsTrigger>
          <TabsTrigger value="ageing">Expiry alerts</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="valuation" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Valuation by warehouse</CardTitle>
                <CardDescription>
                  Inventory value at cost by location
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-72 w-full" />
                ) : valuationByWarehouse.length === 0 ? (
                  <EmptyState message="No warehouse valuation data for current filters." />
                ) : (
                  <ChartContainer
                    config={warehouseChartConfig}
                    className="h-72 w-full"
                  >
                    <BarChart
                      data={valuationByWarehouse}
                      margin={{ left: 8, right: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="warehouse"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        tickFormatter={(v) => compactNumber(Number(v))}
                        tickLine={false}
                        axisLine={false}
                        width={56}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) => fmt(Number(value))}
                          />
                        }
                      />
                      <Bar
                        dataKey="value"
                        fill={VALUATION_COLOR}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Valuation by category</CardTitle>
                <CardDescription>Value distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-72 w-full" />
                ) : valuationByCategory.length === 0 ? (
                  <EmptyState message="No category valuation data for current filters." />
                ) : (
                  <>
                    <ChartContainer
                      config={categoryChartConfig}
                      className="mx-auto aspect-square max-h-64"
                    >
                      <PieChart>
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) => fmt(Number(value))}
                            />
                          }
                        />
                        <Pie
                          data={valuationByCategory}
                          dataKey="value"
                          nameKey="category"
                          innerRadius="55%"
                          outerRadius="90%"
                          strokeWidth={2}
                        >
                          {valuationByCategory.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                    <ul className="mt-3 space-y-1.5">
                      {valuationByCategory.map((row, idx) => (
                        <li
                          key={row.category}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{
                                background: PIE_COLORS[idx % PIE_COLORS.length],
                              }}
                            />
                            <span className="truncate">{row.category}</span>
                          </span>
                          <span className="ml-2 shrink-0 font-medium tabular-nums">
                            {fmt(row.value)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top stock lines by value</CardTitle>
              <CardDescription>
                Highest value positions per warehouse row
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : topItems.length === 0 ? (
                <EmptyState message="No stock lines for current filters." />
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                        <th className="p-3 font-medium">Item</th>
                        <th className="p-3 font-medium">SKU</th>
                        <th className="p-3 text-right font-medium">Qty</th>
                        <th className="p-3 text-right font-medium">
                          Unit cost
                        </th>
                        <th className="p-3 text-right font-medium">Value</th>
                        <th className="p-3 font-medium">Warehouse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topItems.map((item) => (
                        <tr
                          key={`${item.sku}-${item.warehouse}`}
                          className="border-b transition-colors hover:bg-muted/30"
                        >
                          <td className="p-3 font-medium">{item.name}</td>
                          <td className="p-3 text-muted-foreground">
                            {item.sku}
                          </td>
                          <td className="p-3 text-right tabular-nums">
                            {item.quantity.toLocaleString()}
                          </td>
                          <td className="p-3 text-right tabular-nums">
                            <CurrencyAmount amount={item.unitCost} />
                          </td>
                          <td className="p-3 text-right font-semibold tabular-nums">
                            <CurrencyAmount amount={item.totalValue} />
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {item.warehouse}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch stock layers</CardTitle>
              <CardDescription>
                On-hand quantity and value at each batch unit cost (FIFO layers).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : !batchReport?.batches?.length ? (
                <EmptyState message="No batch stock for the current filters." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                        <th className="pb-2 pr-3">Item</th>
                        <th className="pb-2 pr-3">Batch</th>
                        <th className="pb-2 pr-3">Warehouse</th>
                        <th className="pb-2 pr-3 text-right">Qty</th>
                        <th className="pb-2 pr-3 text-right">Unit cost</th>
                        <th className="pb-2 pr-3 text-right">Value</th>
                        <th className="pb-2 pr-3">Received</th>
                        <th className="pb-2">Expiry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchReport.batches.map((row) => (
                        <tr key={row.id} className="border-b border-border/60">
                          <td className="py-2 pr-3">
                            <div className="font-medium">{row.itemName}</div>
                            <div className="text-xs text-muted-foreground">{row.itemSku}</div>
                          </td>
                          <td className="py-2 pr-3 font-mono text-xs">{row.batchNo}</td>
                          <td className="py-2 pr-3">{row.warehouseName}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{row.quantityOnHand}</td>
                          <td className="py-2 pr-3 text-right">
                            <CurrencyAmount amount={row.unitCost} />
                          </td>
                          <td className="py-2 pr-3 text-right">
                            <CurrencyAmount amount={row.lineValue} />
                          </td>
                          <td className="py-2 pr-3">{row.receivedAt ?? "—"}</td>
                          <td className="py-2">{row.expiryDate ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <span>
                      Total qty:{" "}
                      <strong>{batchReport.totalQuantity}</strong>
                    </span>
                    <span>
                      Total value:{" "}
                      <CurrencyAmount
                        amount={batchReport.totalValueAtCost}
                        className="font-semibold"
                      />
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ItemBatchReportsPanel
            key={`analytics-${batchQueryParams.warehouseId ?? "all"}-${batchQueryParams.itemId ?? "all"}-${batchQueryParams.batchNo ?? ""}`}
            itemId={batchQueryParams.itemId ?? 0}
            mode="company"
            warehouseId={batchQueryParams.warehouseId}
            filterItemId={batchQueryParams.itemId}
            batchNo={batchQueryParams.batchNo}
          />
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch movement history</CardTitle>
              <CardDescription>
                Recent receives, issues, transfers, and adjustments across FIFO
                layers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : !batchMovements?.movements?.length ? (
                <EmptyState message="No batch movements for the current filters." />
              ) : (
                <div className="overflow-x-auto rounded-lg border max-h-[420px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80 text-left text-xs uppercase text-muted-foreground backdrop-blur">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Item</th>
                        <th className="p-3">Batch</th>
                        <th className="p-3">Warehouse</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchMovements.movements.map((m) => (
                        <tr key={m.id} className="border-t">
                          <td className="p-3 text-xs text-muted-foreground">
                            {m.createdAt
                              ? new Date(m.createdAt).toLocaleString()
                              : "—"}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {m.movementType.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="p-3">{m.itemName ?? "—"}</td>
                          <td className="p-3 font-mono text-xs">{m.batchNo}</td>
                          <td className="p-3">{m.warehouseName}</td>
                          <td
                            className={`p-3 text-right tabular-nums font-medium ${
                              (m.quantity ?? 0) > 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {(m.quantity ?? 0) > 0 ? "+" : ""}
                            {m.quantity}
                          </td>
                          <td className="p-3 text-right">
                            <CurrencyAmount amount={Math.abs(m.lineValue ?? 0)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receive vs issue trend</CardTitle>
              <CardDescription>Monthly batch movement volume</CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : !batchMovements?.receiveTrend?.length ? (
                <EmptyState message="No movement trend data yet." />
              ) : (
                <ChartContainer
                  config={batchTrendChartConfig}
                  className="h-64 w-full"
                >
                  <AreaChart data={batchMovements.receiveTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={40} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="receiveQty"
                      stackId="1"
                      stroke="var(--color-receiveQty)"
                      fill="var(--color-receiveQty)"
                      fillOpacity={0.35}
                    />
                    <Area
                      type="monotone"
                      dataKey="issueQty"
                      stackId="2"
                      stroke="var(--color-issueQty)"
                      fill="var(--color-issueQty)"
                      fillOpacity={0.35}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turnover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory turnover</CardTitle>
              <CardDescription>
                COGS from sales order lines (excluding draft/cancelled) compared
                to current inventory value.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ordersLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading sales orders…
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricTile
                      label="COGS (period)"
                      value={<CurrencyAmount amount={turnover.totalCOGS} />}
                    />
                    <MetricTile
                      label="Avg inventory value"
                      value={
                        <CurrencyAmount amount={turnover.avgInventoryValue} />
                      }
                    />
                    <MetricTile
                      label="Turnover ratio"
                      value={`${turnover.turnoverRatio.toFixed(2)}×`}
                      highlight
                    />
                    <MetricTile
                      label="Days to sell"
                      value={
                        turnover.turnoverRatio > 0
                          ? `${turnover.daysToSell.toFixed(0)} days`
                          : "—"
                      }
                    />
                  </div>
                  <MetricTile
                    label="Sales orders in period"
                    value={turnover.salesCount.toLocaleString()}
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Turnover by category</CardTitle>
              <CardDescription>
                COGS / inventory value per category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading || ordersLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : turnover.turnoverByCategory.length === 0 ? (
                <EmptyState message="No turnover data for current filters." />
              ) : (
                <ChartContainer
                  config={cogsChartConfig}
                  className="h-80 w-full"
                >
                  <BarChart
                    data={turnover.turnoverByCategory}
                    margin={{ left: 8, right: 8, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="category"
                      interval={0}
                      tick={{ fontSize: 10 }}
                      angle={-25}
                      textAnchor="end"
                      height={70}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => compactNumber(Number(v))}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0]
                          .payload as (typeof turnover.turnoverByCategory)[0];
                        return (
                          <div className="rounded-lg border bg-background p-3 text-xs shadow-md">
                            <p className="font-semibold">{row.category}</p>
                            <p>COGS: {fmt(row.cogs)}</p>
                            <p>Inv value: {fmt(row.inventoryValue)}</p>
                            <p>Turnover: {row.turnoverRatio.toFixed(2)}×</p>
                          </div>
                        );
                      }}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="cogs"
                      name="COGS"
                      fill={COGS_COLOR}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ageing" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricTile
              label="Expiring ≤ 30 days"
              value={`${batchInsights?.expiringWithin30Days ?? 0} units`}
              highlight
            />
            <MetricTile
              label="Expiring ≤ 60 days"
              value={`${batchInsights?.expiringWithin60Days ?? 0} units`}
            />
            <MetricTile
              label="Expiring ≤ 90 days"
              value={`${batchInsights?.expiringWithin90Days ?? 0} units`}
            />
            <MetricTile
              label="Value expiring ≤ 30 days"
              value={
                <CurrencyAmount
                  amount={batchInsights?.valueExpiringWithin30Days ?? 0}
                />
              }
            />
            <MetricTile
              label="Value expiring ≤ 60 days"
              value={
                <CurrencyAmount
                  amount={batchInsights?.valueExpiringWithin60Days ?? 0}
                />
              }
            />
            <MetricTile
              label="Value expiring ≤ 90 days"
              value={
                <CurrencyAmount
                  amount={batchInsights?.valueExpiringWithin90Days ?? 0}
                />
              }
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Expiry alerts</CardTitle>
              <CardDescription>
                Batch layers sorted by nearest expiry date.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : !batchReport?.batches?.length ? (
                <EmptyState message="No batch data for ageing analysis." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                        <th className="pb-2 pr-3">Item</th>
                        <th className="pb-2 pr-3">Batch</th>
                        <th className="pb-2 pr-3 text-right">Qty</th>
                        <th className="pb-2 pr-3 text-right">Value</th>
                        <th className="pb-2 pr-3">Received</th>
                        <th className="pb-2">Expiry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchReport.batches
                        .slice()
                        .sort((a, b) => {
                          const ae = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
                          const be = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
                          return ae - be;
                        })
                        .map((row) => (
                          <tr key={`age-${row.id}`} className="border-b border-border/60">
                            <td className="py-2 pr-3">{row.itemName}</td>
                            <td className="py-2 pr-3 font-mono text-xs">{row.batchNo}</td>
                            <td className="py-2 pr-3 text-right tabular-nums">{row.quantityOnHand}</td>
                            <td className="py-2 pr-3 text-right">
                              <CurrencyAmount amount={row.lineValue} />
                            </td>
                            <td className="py-2 pr-3">{row.receivedAt ?? "—"}</td>
                            <td className="py-2">
                              {row.expiryDate ? (
                                <Badge variant="outline">{row.expiryDate}</Badge>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Warehouse mix (value)</CardTitle>
                <CardDescription>
                  Share of inventory value by site
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-72 w-full" />
                ) : valuationByWarehouse.length === 0 ? (
                  <EmptyState message="No warehouse data." />
                ) : (
                  <ChartContainer
                    config={warehouseChartConfig}
                    className="h-72 w-full"
                  >
                    <BarChart
                      data={valuationByWarehouse}
                      layout="vertical"
                      margin={{ left: 8, right: 16 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => compactNumber(Number(v))}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="warehouse"
                        width={100}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) => fmt(Number(value))}
                          />
                        }
                      />
                      <Bar
                        dataKey="value"
                        fill={VALUATION_COLOR}
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Low stock watchlist</CardTitle>
                <CardDescription>
                  Items at or below reorder level
                  {summary ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {summary.lowStockItemCount} total
                    </span>
                  ) : null}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-72 w-full" />
                ) : (
                  <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                    {(summary?.lowStockItems ?? []).map((row) => (
                      <div
                        key={row.itemId}
                        className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm transition-colors hover:bg-amber-500/10"
                      >
                        <div>
                          <p className="font-medium leading-tight">
                            {row.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {row.sku}
                          </p>
                        </div>
                        <Badge variant="outline" className="font-normal">
                          Avail {row.available ?? 0} / Reorder{" "}
                          {row.reorderLevel ?? "—"}
                        </Badge>
                      </div>
                    ))}
                    {!summary?.lowStockItems?.length && (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No low-stock items for current filters.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {summary?.generatedAt &&
          isValid(parseISO(summary.generatedAt)) ? (
            <p className="text-center text-xs text-muted-foreground">
              Snapshot generated at{" "}
              {format(parseISO(summary.generatedAt), "PPpp")}
            </p>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4"
          : "rounded-xl border bg-muted/40 p-4"
      }
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
