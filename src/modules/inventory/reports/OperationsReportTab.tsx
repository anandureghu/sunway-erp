import type { ReactNode } from "react";
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
import { Badge } from "@/components/ui/badge";
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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Warehouse as WarehouseIcon,
  Layers,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import { HistoryTabPanel } from "@/modules/shared/history-tab-panel";
import { KpiSummaryStrip } from "@/components/kpi-summary-strip";
import type { useInventoryReports } from "./use-inventory-reports";
import {
  EmptyState,
  batchTrendChartConfig,
} from "./inventory-reports-utils";

type ReportData = ReturnType<typeof useInventoryReports>;

export function OperationsReportTab({ data }: { data: ReportData }) {
  const {
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
    summary,
    batchReport,
    batchMovements,
    batchInsights,
    summaryLoading,
    lastError,
    opsKpiItems,
  } = data;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Operations report
            </h2>
            <p className="text-sm text-muted-foreground">
              Day-to-day stock health — availability, movements, batches, and
              expiry actions for warehouse teams.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Narrow by warehouse, category, item, or batch number.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            label="Warehouse"
            icon={<WarehouseIcon className="h-4 w-4 text-muted-foreground" />}
            value={warehouseId}
            onChange={setWarehouseId}
            options={[
              { value: "all", label: "All warehouses" },
              ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
            ]}
          />
          <FilterSelect
            label="Category"
            icon={<Layers className="h-4 w-4 text-muted-foreground" />}
            value={categoryId}
            onChange={setCategoryId}
            options={[
              { value: "all", label: "All categories" },
              ...categories.map((c) => ({
                value: String(c.id),
                label: c.name || c.code || String(c.id),
              })),
            ]}
          />
          <FilterSelect
            label="Item"
            value={itemIdFilter}
            onChange={setItemIdFilter}
            options={[
              { value: "all", label: "All items" },
              ...items.map((i) => ({
                value: String(i.id),
                label: `${i.sku ? `${i.sku} — ` : ""}${i.name}`,
              })),
            ]}
          />
          <div className="space-y-1.5">
            <Label htmlFor="ops-batch-no">Batch number</Label>
            <Input
              id="ops-batch-no"
              placeholder="Search batch…"
              value={batchNoFilter}
              onChange={(e) => setBatchNoFilter(e.target.value)}
            />
          </div>
          {lastError ? (
            <p className="text-sm text-destructive md:col-span-2 lg:col-span-4">
              {lastError}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <KpiSummaryStrip items={opsKpiItems} />

      <Card className="border-amber-200/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Low stock watchlist
          </CardTitle>
          <CardDescription>
            Items at or below reorder level — prioritize replenishment
            {summary ? ` · ${summary.lowStockItemCount} total` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {(summary?.lowStockItems ?? []).map((row) => (
                <div
                  key={row.itemId}
                  className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.sku}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 font-normal">
                    Avail {row.available ?? 0} / Reorder {row.reorderLevel ?? "—"}
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
              <ChartContainer config={batchTrendChartConfig} className="h-64 w-full">
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

        <Card>
          <CardHeader>
            <CardTitle>Expiry snapshot</CardTitle>
            <CardDescription>Units approaching expiry</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "≤ 30 days", units: batchInsights?.expiringWithin30Days, value: batchInsights?.valueExpiringWithin30Days },
                  { label: "≤ 60 days", units: batchInsights?.expiringWithin60Days, value: batchInsights?.valueExpiringWithin60Days },
                  { label: "≤ 90 days", units: batchInsights?.expiringWithin90Days, value: batchInsights?.valueExpiringWithin90Days },
                ].map((bucket) => (
                  <div
                    key={bucket.label}
                    className="rounded-lg border bg-muted/30 p-3 text-center"
                  >
                    <p className="text-xs text-muted-foreground">{bucket.label}</p>
                    <p className="mt-1 text-xl font-bold tabular-nums">
                      {bucket.units ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">units</p>
                    <p className="mt-2 text-sm font-medium">
                      <CurrencyAmount amount={bucket.value ?? 0} />
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BatchStockTable
        loading={summaryLoading}
        batchReport={batchReport}
        title="Batch stock layers"
        description="FIFO layers for picking and traceability"
      />

      <Card>
        <CardHeader>
          <CardTitle>Batch movement history</CardTitle>
          <CardDescription>
            Recent receives, issues, transfers, and adjustments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : !batchMovements?.movements?.length ? (
            <EmptyState message="No batch movements for the current filters." />
          ) : (
            <div className="max-h-[420px] overflow-auto rounded-lg border">
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
                          (m.quantity ?? 0) > 0 ? "text-emerald-600" : "text-red-600"
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

      <BatchStockTable
        loading={summaryLoading}
        batchReport={batchReport}
        title="Expiry alerts"
        description="Batch layers sorted by nearest expiry"
        sortByExpiry
      />

      <Card>
        <CardHeader>
          <CardTitle>Archived records</CardTitle>
          <CardDescription>
            Archived inventory transactions and documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HistoryTabPanel module="inventory" />
        </CardContent>
      </Card>

      {summary?.generatedAt && isValid(parseISO(summary.generatedAt)) ? (
        <p className="text-center text-xs text-muted-foreground">
          Snapshot generated at {format(parseISO(summary.generatedAt), "PPpp")}
        </p>
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  icon,
  value,
  onChange,
  options,
}: {
  label: string;
  icon?: ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-2">
        {icon}
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function BatchStockTable({
  loading,
  batchReport,
  title,
  description,
  sortByExpiry,
}: {
  loading: boolean;
  batchReport: ReportData["batchReport"];
  title: string;
  description: string;
  sortByExpiry?: boolean;
}) {
  const rows = sortByExpiry
    ? [...(batchReport?.batches ?? [])].sort((a, b) => {
        const ae = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
        const be = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
        return ae - be;
      })
    : (batchReport?.batches ?? []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : !rows.length ? (
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
                  <th className="pb-2 pr-3 text-right">Value</th>
                  <th className="pb-2 pr-3">Received</th>
                  <th className="pb-2">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${sortByExpiry ? "exp" : "bat"}-${row.id}`} className="border-b border-border/60">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{row.itemName}</div>
                      <div className="text-xs text-muted-foreground">{row.itemSku}</div>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">{row.batchNo}</td>
                    <td className="py-2 pr-3">{row.warehouseName}</td>
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
            {!sortByExpiry && batchReport ? (
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <span>
                  Total qty: <strong>{batchReport.totalQuantity}</strong>
                </span>
                <span>
                  Total value:{" "}
                  <CurrencyAmount
                    amount={batchReport.totalValueAtCost}
                    className="font-semibold"
                  />
                </span>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
