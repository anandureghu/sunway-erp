import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import { StyledTabsTrigger } from "@/components/styled-tabs-trigger";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  BarChart3,
  Clock,
  ArrowLeft,
  RefreshCw,
  Loader2,
  Warehouse as WarehouseIcon,
  Layers,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, endOfMonth, parseISO, startOfMonth } from "date-fns";
import { ChartContainer } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  getInventoryReportSummary,
  listCategories,
  listItems,
  listWarehouses,
  type InventoryReportSummaryQuery,
} from "@/service/inventoryService";
import type { InventoryReportSummaryDTO } from "@/service/erpApiTypes";
import type { ItemCategory, Warehouse } from "@/types/inventory";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { listSalesOrders } from "@/service/salesFlowService";
import type { SalesOrder } from "@/types/sales";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function formatMoney(n: number | undefined | null) {
  const v = Number(n ?? 0);
  return v.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

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

/** Orders that typically represent fulfilled demand for turnover / COGS. */
function orderCountsForTurnover(o: SalesOrder): boolean {
  const s = (o.status || "").toLowerCase();
  if (s === "cancelled" || s === "draft") return false;
  if (o.archived) return false;
  return true;
}

export default function InventoryReportsPage() {
  const { company } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [items, setItems] = useState<ItemResponseDTO[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [warehouseId, setWarehouseId] = useState<string>("all");
  const [categoryId, setCategoryId] = useState<string>("all");

  const [summary, setSummary] = useState<InventoryReportSummaryDTO | null>(
    null,
  );
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

  const loadBaseline = useCallback(async () => {
    try {
      const [wh, cat, it, ord] = await Promise.all([
        listWarehouses(),
        listCategories(),
        listItems(),
        listSalesOrders(),
      ]);
      setWarehouses(wh);
      setCategories(cat);
      setItems(it);
      setOrders(ord);
    } catch (e: unknown) {
      console.error(e);
      toast.error("Could not load warehouses, categories, or sales data.");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setLastError(null);
    try {
      const data = await getInventoryReportSummary(summaryParams);
      setSummary(data);
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
  }, [summaryParams]);

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
      for (const line of order.items) {
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

    const turnoverRatio =
      avgInventory > 0 ? totalCOGS / avgInventory : 0;
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

  const valuationByWarehouse = useMemo(() => {
    return (summary?.byWarehouse ?? []).map((w) => ({
      warehouse: w.warehouseName,
      value: Number(w.valueAtCost ?? 0),
      quantity: w.onHand,
    }));
  }, [summary]);

  const valuationByCategory = useMemo(() => {
    return (summary?.byCategory ?? []).map((c) => ({
      category: c.category,
      value: Number(c.valueAtCost ?? 0),
    }));
  }, [summary]);

  const topItems = useMemo(() => {
    return (summary?.topStockLinesByValue ?? []).map((row) => {
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
    });
  }, [summary]);

  const kpis = useMemo(() => {
    const t = summary?.totals;
    return {
      stockValue: t?.stockValueAtCost ?? 0,
      totalSkus: t?.distinctSkuCount ?? 0,
      lowStock: summary?.lowStockItemCount ?? 0,
      onHand: t?.totalQuantityOnHand ?? 0,
    };
  }, [summary]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/90 to-background pb-10">
      {/* Header */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 px-6 py-7 shadow-lg">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="secondary" size="icon" className="shrink-0" asChild>
              <Link to="/inventory/stocks" aria-label="Back to stock">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Inventory reports
              </h1>
              <p className="text-sm text-emerald-50/90">
                {company?.companyName ?? "Company"} · live stock snapshot and
                analytics
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="gap-2 bg-white/15 text-white hover:bg-white/25 border border-white/30"
            disabled={summaryLoading}
            onClick={() => void loadSummary()}
          >
            {summaryLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card
        className={cn(
          "mb-6 border-border/60 shadow-sm transition-shadow duration-300 hover:shadow-md",
          "animate-in fade-in slide-in-from-bottom-2 duration-500",
        )}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Warehouse and category apply to the{" "}
            <span className="font-medium text-foreground">current stock</span>{" "}
            summary. Date range applies to the{" "}
            <span className="font-medium text-foreground">Turnover</span> tab
            only (sales-based COGS).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <WarehouseIcon className="h-4 w-4" />
                Warehouse
              </label>
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
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Layers className="h-4 w-4" />
                Category
              </label>
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Period from (turnover)
              </label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((d) => ({ ...d, from: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Period to (turnover)
              </label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((d) => ({ ...d, to: e.target.value }))
                }
              />
            </div>
          </div>
          {lastError && (
            <p className="mt-3 text-sm text-destructive">{lastError}</p>
          )}
        </CardContent>
      </Card>

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Stock value (cost)",
            value: formatMoney(kpis.stockValue),
            icon: DollarSign,
            accent: "text-emerald-600",
            delay: "0ms",
          },
          {
            label: "Distinct SKUs",
            value: kpis.totalSkus.toLocaleString(),
            icon: Package,
            accent: "text-blue-600",
            delay: "75ms",
          },
          {
            label: "Low stock items",
            value: kpis.lowStock.toLocaleString(),
            icon: AlertTriangle,
            accent: "text-amber-600",
            delay: "150ms",
          },
          {
            label: "Units on hand",
            value: kpis.onHand.toLocaleString(),
            icon: TrendingUp,
            accent: "text-violet-600",
            delay: "225ms",
          },
        ].map((k) => (
          <Card
            key={k.label}
            className={cn(
              "overflow-hidden border-border/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
              "animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both",
            )}
            style={{ animationDelay: k.delay }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">{k.label}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">
                    {summaryLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      k.value
                    )}
                  </p>
                </div>
                <k.icon className={cn("h-8 w-8 shrink-0 opacity-90", k.accent)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="valuation" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 md:grid-cols-4">
          <StyledTabsTrigger value="valuation">
            <DollarSign className="mr-2 h-4 w-4" />
            Stock valuation
          </StyledTabsTrigger>
          <StyledTabsTrigger value="turnover">
            <TrendingUp className="mr-2 h-4 w-4" />
            Turnover
          </StyledTabsTrigger>
          <StyledTabsTrigger value="ageing">
            <Clock className="mr-2 h-4 w-4" />
            Ageing &amp; expiry
          </StyledTabsTrigger>
          <StyledTabsTrigger value="dashboard">
            <BarChart3 className="mr-2 h-4 w-4" />
            Dashboard
          </StyledTabsTrigger>
        </TabsList>

        <TabsContent value="valuation" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-border/60 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Valuation by warehouse</CardTitle>
                <CardDescription>
                  Inventory value at cost by location
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                ) : (
                  <ChartContainer
                    config={{
                      value: { label: "Value", color: "hsl(var(--chart-1))" },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={valuationByWarehouse}
                        margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="warehouse" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const p = payload[0].payload as {
                              warehouse: string;
                              value: number;
                              quantity: number;
                            };
                            return (
                              <div className="rounded-lg border bg-background/95 p-3 text-sm shadow-md backdrop-blur-sm">
                                <p className="font-medium">{p.warehouse}</p>
                                <p className="text-muted-foreground">
                                  Value: {formatMoney(p.value)}
                                </p>
                                <p className="text-muted-foreground">
                                  Qty: {p.quantity.toLocaleString()}
                                </p>
                              </div>
                            );
                          }}
                        />
                        <Bar
                          dataKey="value"
                          fill="hsl(var(--chart-1))"
                          radius={[6, 6, 0, 0]}
                          isAnimationActive
                          animationDuration={900}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>Valuation by category</CardTitle>
                <CardDescription>Value distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                ) : (
                  <ChartContainer
                    config={{
                      value: { label: "Value", color: "hsl(var(--chart-2))" },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={valuationByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, percent }) =>
                            `${category}: ${((percent as number) * 100).toFixed(0)}%`
                          }
                          outerRadius={100}
                          dataKey="value"
                          isAnimationActive
                          animationDuration={900}
                        >
                          {valuationByCategory.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const row = payload[0].payload as {
                              category: string;
                              value: number;
                            };
                            return (
                              <div className="rounded-lg border bg-background/95 p-2 text-sm shadow-md">
                                <p className="font-medium">{row.category}</p>
                                <p className="text-muted-foreground">
                                  {formatMoney(row.value)}
                                </p>
                              </div>
                            );
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Top stock lines by value</CardTitle>
              <CardDescription>
                Highest value positions (per warehouse row)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="p-2 font-medium">Item</th>
                        <th className="p-2 font-medium">SKU</th>
                        <th className="p-2 text-right font-medium">Qty</th>
                        <th className="p-2 text-right font-medium">Unit cost</th>
                        <th className="p-2 text-right font-medium">Value</th>
                        <th className="p-2 font-medium">Warehouse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topItems.map((item) => (
                        <tr
                          key={`${item.sku}-${item.warehouse}`}
                          className="border-b transition-colors hover:bg-muted/40"
                        >
                          <td className="p-2 font-medium">{item.name}</td>
                          <td className="p-2 text-muted-foreground">{item.sku}</td>
                          <td className="p-2 text-right tabular-nums">
                            {item.quantity.toLocaleString()}
                          </td>
                          <td className="p-2 text-right tabular-nums">
                            {formatMoney(item.unitCost)}
                          </td>
                          <td className="p-2 text-right font-semibold tabular-nums">
                            {formatMoney(item.totalValue)}
                          </td>
                          <td className="p-2 text-muted-foreground">
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

        <TabsContent value="turnover" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory turnover</CardTitle>
              <CardDescription>
                COGS from sales order lines (excluding draft/cancelled) × item
                cost, compared to current inventory value from the summary above.
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border bg-muted/40 p-4">
                      <span className="text-sm font-medium">COGS (period)</span>
                      <p className="text-2xl font-bold tabular-nums">
                        {formatMoney(turnover.totalCOGS)}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-muted/40 p-4">
                      <span className="text-sm font-medium">
                        Avg inventory value (snapshot)
                      </span>
                      <p className="text-2xl font-bold tabular-nums">
                        {formatMoney(turnover.avgInventoryValue)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                      <span className="text-sm font-medium">Turnover ratio</span>
                      <p className="text-3xl font-bold text-primary tabular-nums">
                        {turnover.turnoverRatio.toFixed(2)}×
                      </p>
                    </div>
                    <div className="rounded-xl border bg-muted/40 p-4">
                      <span className="text-sm font-medium">Days to sell</span>
                      <p className="text-2xl font-bold tabular-nums">
                        {turnover.turnoverRatio > 0
                          ? `${turnover.daysToSell.toFixed(0)} days`
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border bg-muted/40 p-4">
                    <span className="text-sm font-medium">
                      Sales orders in period
                    </span>
                    <p className="text-2xl font-bold">
                      {turnover.salesCount.toLocaleString()}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Turnover by category</CardTitle>
              <CardDescription>
                COGS / inventory value per category (same filters as summary)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading || ordersLoading ? (
                <Skeleton className="h-[280px] w-full rounded-lg" />
              ) : (
                <ChartContainer
                  config={{
                    cogs: { label: "COGS", color: "hsl(var(--chart-3))" },
                  }}
                  className="h-[320px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={turnover.turnoverByCategory}
                      margin={{ top: 8, right: 8, left: 8, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="category"
                        interval={0}
                        tick={{ fontSize: 10 }}
                        angle={-25}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const row = payload[0].payload as (typeof turnover.turnoverByCategory)[0];
                          return (
                            <div className="max-w-xs rounded-lg border bg-background/95 p-3 text-xs shadow-md">
                              <p className="font-semibold">{row.category}</p>
                              <p>COGS: {formatMoney(row.cogs)}</p>
                              <p>Inv value: {formatMoney(row.inventoryValue)}</p>
                              <p>Turnover: {row.turnoverRatio.toFixed(2)}×</p>
                            </div>
                          );
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="cogs"
                        name="COGS"
                        fill="hsl(var(--chart-3))"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive
                        animationDuration={800}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ageing" className="mt-6 space-y-6">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Ageing &amp; expiry</CardTitle>
              <CardDescription>
                Batch-level received dates and expiry are not stored on stock
                rows yet, so ageing buckets cannot be calculated from live data.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Package className="h-14 w-14 text-muted-foreground/40" />
              <p className="max-w-md text-sm text-muted-foreground">
                When lot/batch metadata and expiry are captured per warehouse
                stock line, this section can show value by age and expiry status.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Warehouse mix (value)</CardTitle>
                <CardDescription>Share of inventory value by site</CardDescription>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <Skeleton className="h-[280px] w-full" />
                ) : (
                  <ChartContainer
                    config={{
                      value: { label: "Value", color: "hsl(var(--chart-1))" },
                    }}
                    className="h-[280px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={valuationByWarehouse}
                        layout="vertical"
                        margin={{ left: 24, right: 16 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis
                          type="category"
                          dataKey="warehouse"
                          width={100}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(v: number) => formatMoney(v)}
                          contentStyle={{ borderRadius: 8 }}
                        />
                        <Bar
                          dataKey="value"
                          fill="hsl(var(--chart-1))"
                          radius={[0, 6, 6, 0]}
                          isAnimationActive
                          animationDuration={850}
                        />
                      </BarChart>
                    </ResponsiveContainer>
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
                  <Skeleton className="h-[280px] w-full" />
                ) : (
                  <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                    {(summary?.lowStockItems ?? []).map((row) => (
                      <div
                        key={row.itemId}
                        className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm transition-colors hover:bg-amber-500/10"
                      >
                        <div>
                          <p className="font-medium leading-tight">{row.name}</p>
                          <p className="text-xs text-muted-foreground">{row.sku}</p>
                        </div>
                        <div className="text-right tabular-nums">
                          <Badge variant="outline" className="font-normal">
                            Avail {row.available ?? 0} / Reorder{" "}
                            {row.reorderLevel ?? "—"}
                          </Badge>
                        </div>
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

          {summary?.generatedAt && (
            <p className="text-center text-xs text-muted-foreground">
              Snapshot generated at{" "}
              {format(parseISO(summary.generatedAt), "PPpp")}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
