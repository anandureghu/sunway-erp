import { format, isValid, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Warehouse as WarehouseIcon,
  Layers,
  BarChart3,
  Loader2,
} from "lucide-react";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import { ItemBatchReportsPanel } from "@/pages/inventory/inventory-item-detail/item-batch-reports-panel";
import { KpiSummaryStrip } from "@/components/kpi-summary-strip";
import type { useInventoryReports } from "./use-inventory-reports";
import {
  EmptyState,
  MetricTile,
  QuickChip,
  PIE_COLORS,
  compactNumber,
} from "./inventory-reports-utils";

type ReportData = ReturnType<typeof useInventoryReports>;

export function ManagementReportTab({ data }: { data: ReportData }) {
  const {
    fmt,
    warehouses,
    categories,
    warehouseId,
    setWarehouseId,
    categoryId,
    setCategoryId,
    dateRange,
    setDateRange,
    setTurnoverMonth,
    summary,
    summaryLoading,
    ordersLoading,
    lastError,
    turnover,
    valuationByWarehouse,
    valuationByCategory,
    topItems,
    mgmtKpiItems,
    batchQueryParams,
    warehouseChartConfig,
    categoryChartConfig,
    cogsChartConfig,
  } = data;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-indigo-200/60 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Management report
            </h2>
            <p className="text-sm text-muted-foreground">
              Financial and strategic view — inventory value, turnover, category
              mix, and capital concentration for leadership.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Warehouse and category filter the valuation snapshot. Date range
            applies to turnover analysis.
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
              <Label htmlFor="mgmt-from">Period from</Label>
              <Input
                id="mgmt-from"
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((d) => ({ ...d, from: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mgmt-to">Period to</Label>
              <Input
                id="mgmt-to"
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

      <KpiSummaryStrip items={mgmtKpiItems} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ValuationBarChart
          loading={summaryLoading}
          data={valuationByWarehouse}
          fmt={fmt}
          config={warehouseChartConfig}
          title="Valuation by warehouse"
          description="Inventory value at cost by location"
        />
        <CategoryPieChart
          loading={summaryLoading}
          data={valuationByCategory}
          fmt={fmt}
          config={categoryChartConfig}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top stock lines by value</CardTitle>
          <CardDescription>
            Highest capital concentration — review slow movers and overstock
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
                    <th className="p-3 text-right font-medium">Unit cost</th>
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
                      <td className="p-3 text-muted-foreground">{item.sku}</td>
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

      <Card>
        <CardHeader>
          <CardTitle>Inventory turnover</CardTitle>
          <CardDescription>
            COGS from fulfilled sales vs current inventory value
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ordersLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading sales orders…
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricTile
                label="COGS (period)"
                value={<CurrencyAmount amount={turnover.totalCOGS} />}
              />
              <MetricTile
                label="Avg inventory value"
                value={<CurrencyAmount amount={turnover.avgInventoryValue} />}
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
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Turnover by category</CardTitle>
          <CardDescription>COGS relative to inventory value</CardDescription>
        </CardHeader>
        <CardContent>
          {summaryLoading || ordersLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : turnover.turnoverByCategory.length === 0 ? (
            <EmptyState message="No turnover data for current filters." />
          ) : (
            <ChartContainer config={cogsChartConfig} className="h-80 w-full">
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
                <Bar dataKey="cogs" name="COGS" fill="hsl(38 92% 56%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <ItemBatchReportsPanel
        key={`mgmt-analytics-${batchQueryParams.warehouseId ?? "all"}`}
        itemId={0}
        mode="company"
        warehouseId={batchQueryParams.warehouseId}
      />

      <ValuationBarChart
        loading={summaryLoading}
        data={valuationByWarehouse}
        fmt={fmt}
        config={warehouseChartConfig}
        title="Capital allocation by site"
        description="Horizontal view of value concentration across warehouses"
        layout="vertical"
      />

      {summary?.generatedAt && isValid(parseISO(summary.generatedAt)) ? (
        <p className="text-center text-xs text-muted-foreground">
          Valuation snapshot at {format(parseISO(summary.generatedAt), "PPpp")}
        </p>
      ) : null}
    </div>
  );
}

function ValuationBarChart({
  loading,
  data,
  fmt,
  config,
  title,
  description,
  layout = "horizontal",
}: {
  loading: boolean;
  data: { warehouse: string; value: number; quantity?: number }[];
  fmt: (v: number) => string;
  config: ChartConfig;
  title: string;
  description: string;
  layout?: "horizontal" | "vertical";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : data.length === 0 ? (
          <EmptyState message="No warehouse valuation data." />
        ) : layout === "vertical" ? (
          <ChartContainer config={config} className="h-72 w-full">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
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
                  <ChartTooltipContent formatter={(value) => fmt(Number(value))} />
                }
              />
              <Bar dataKey="value" fill="hsl(142 76% 45%)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartContainer config={config} className="h-72 w-full">
            <BarChart data={data} margin={{ left: 8, right: 8, bottom: 8 }}>
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
                  <ChartTooltipContent formatter={(value) => fmt(Number(value))} />
                }
              />
              <Bar dataKey="value" fill="hsl(142 76% 45%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryPieChart({
  loading,
  data,
  fmt,
  config,
}: {
  loading: boolean;
  data: { category: string; value: number }[];
  fmt: (v: number) => string;
  config: ChartConfig;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Valuation by category</CardTitle>
        <CardDescription>Value distribution across product categories</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : data.length === 0 ? (
          <EmptyState message="No category valuation data." />
        ) : (
          <>
            <ChartContainer config={config} className="mx-auto aspect-square max-h-64">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent formatter={(value) => fmt(Number(value))} />
                  }
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="category"
                  innerRadius="55%"
                  outerRadius="90%"
                  strokeWidth={2}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="mt-3 space-y-1.5">
              {data.map((row, idx) => (
                <li key={row.category} className="flex items-center justify-between text-xs">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}
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
  );
}
