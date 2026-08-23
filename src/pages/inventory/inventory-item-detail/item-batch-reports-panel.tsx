import { CurrencyAmount } from "@/components/currency/currency-amount";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { TablePagination } from "@/components/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { getApiErrorMessage } from "@/lib/api-error-message";
import type {
  StockBatchInsightsDTO,
  StockBatchMovementReportDTO,
  StockBatchReportDTO,
} from "@/service/erpApiTypes";
import {
  archiveBatchMovement,
  archiveBatchMovements,
  getInventoryBatchInsights,
  getInventoryBatchMovements,
  getInventoryBatchReport,
  getItemBatchMovements,
  listItemBatches,
} from "@/service/inventoryService";
import { Archive, BarChart3, History, Layers, Loader2, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

const LAYER_COLORS = [
  "hsl(220 83% 56%)",
  "hsl(142 76% 45%)",
  "hsl(38 92% 56%)",
  "hsl(280 70% 60%)",
  "hsl(0 78% 60%)",
];

const trendChartConfig = {
  receiveQty: { label: "Received", color: "hsl(142 76% 45%)" },
  issueQty: { label: "Issued", color: "hsl(0 78% 60%)" },
} satisfies ChartConfig;

function movementLabel(type: string) {
  return type.replace(/_/g, " ");
}

function BatchLayersTable({
  batches,
}: {
  batches: StockBatchReportDTO["batches"];
}) {
  if (!batches.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No batch layers on hand.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="p-3">Batch</th>
            <th className="p-3">Warehouse</th>
            <th className="p-3 text-right">Qty</th>
            <th className="p-3 text-right">Unit cost</th>
            <th className="p-3 text-right">Value</th>
            <th className="p-3">Received</th>
            <th className="p-3">Expiry</th>
          </tr>
        </thead>
        <tbody className="[&_tr:nth-child(even)]:bg-slate-50/50">
          {batches.map((row) => (
            <tr key={row.id} className="border-t">
              <td className="p-3 font-mono text-xs">{row.batchNo}</td>
              <td className="p-3">{row.warehouseName}</td>
              <td className="p-3 text-right tabular-nums">{row.quantityOnHand}</td>
              <td className="p-3 text-right">
                <CurrencyAmount amount={row.unitCost} />
              </td>
              <td className="p-3 text-right">
                <CurrencyAmount amount={row.lineValue} />
              </td>
              <td className="p-3">{row.receivedAt ?? "—"}</td>
              <td className="p-3">{row.expiryDate ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type MovementLogPanelProps = {
  mode: "item" | "company";
  itemId: string | number;
  warehouseId?: number;
  filterItemId?: number;
};

function MovementLogPanel({
  mode,
  itemId,
  warehouseId,
  filterItemId,
}: MovementLogPanelProps) {
  const { confirm } = useConfirmDialog();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<StockBatchMovementReportDTO | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [archivingId, setArchivingId] = useState<number | null>(null);
  const [bulkArchiving, setBulkArchiving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        warehouseId,
        page: pageIndex,
        size: pageSize,
        archived: showArchivedOnly,
        ...(mode === "company" && filterItemId != null
          ? { itemId: filterItemId }
          : {}),
      };
      const data =
        mode === "item"
          ? await getItemBatchMovements(itemId, params)
          : await getInventoryBatchMovements(params);
      setReport(data);
      setSelectedIds(new Set());
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, "Failed to load movements"));
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [
    filterItemId,
    itemId,
    mode,
    pageIndex,
    pageSize,
    showArchivedOnly,
    warehouseId,
    refreshKey,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const movements = report?.movements ?? [];
  const total = report?.totalMovements ?? 0;
  const pageCount = Math.max(1, report?.totalPages ?? 1);

  const toggleRow = useCallback((id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(checked ? new Set(movements.map((m) => m.id)) : new Set());
    },
    [movements],
  );

  const handleArchive = useCallback(
    async (id: number) => {
      if (
        !(await confirm(
          "Archive this movement? It will be hidden from the active list.",
        ))
      ) {
        return;
      }
      setArchivingId(id);
      try {
        await archiveBatchMovement(id);
        toast.success("Movement archived");
        setRefreshKey((k) => k + 1);
      } catch (e: unknown) {
        toast.error(getApiErrorMessage(e, "Failed to archive movement"));
      } finally {
        setArchivingId(null);
      }
    },
    [confirm],
  );

  const handleBulkArchive = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (
      !(await confirm(
        `Archive ${ids.length} selected movement(s)? They will be hidden from the active list.`,
      ))
    ) {
      return;
    }
    setBulkArchiving(true);
    try {
      const result = await archiveBatchMovements(ids);
      toast.success(
        result.archived === 1
          ? "1 movement archived"
          : `${result.archived} movements archived`,
      );
      setSelectedIds(new Set());
      setRefreshKey((k) => k + 1);
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, "Failed to archive movements"));
    } finally {
      setBulkArchiving(false);
    }
  }, [confirm, selectedIds]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {total} {showArchivedOnly ? "archived" : "active"} movement
          {total === 1 ? "" : "s"}
          {total > 0
            ? ` · page ${pageIndex + 1} of ${Math.max(1, report?.totalPages ?? 1)}`
            : ""}
        </p>
        <div className="flex items-center gap-2">
          <Switch
            id="show-archived-movements"
            checked={showArchivedOnly}
            onCheckedChange={(checked) => {
              setShowArchivedOnly(checked);
              setPageIndex(0);
              setSelectedIds(new Set());
            }}
          />
          <Label
            htmlFor="show-archived-movements"
            className="cursor-pointer text-sm"
          >
            Archived only
          </Label>
        </div>
      </div>

      {!showArchivedOnly ? (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onArchive={() => void handleBulkArchive()}
          onClear={() => setSelectedIds(new Set())}
          archiving={bulkArchiving}
        />
      ) : null}

      {loading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : movements.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {showArchivedOnly
            ? "No archived movements."
            : "No movements recorded yet."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border max-h-[420px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 text-left text-xs uppercase text-muted-foreground backdrop-blur">
              <tr>
                {!showArchivedOnly ? (
                  <th className="w-10 p-3">
                    <Checkbox
                      checked={
                        movements.length > 0 &&
                        selectedIds.size === movements.length
                      }
                      onCheckedChange={(checked) =>
                        toggleAll(checked === true)
                      }
                      aria-label="Select all"
                    />
                  </th>
                ) : null}
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Batch</th>
                <th className="p-3">Warehouse</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Value</th>
                {!showArchivedOnly ? (
                  <th className="w-[100px] p-3">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="[&_tr:nth-child(even)]:bg-slate-50/50">
              {movements.map((m) => (
                <tr key={m.id} className="border-t">
                  {!showArchivedOnly ? (
                    <td className="p-3">
                      <Checkbox
                        checked={selectedIds.has(m.id)}
                        onCheckedChange={(checked) =>
                          toggleRow(m.id, checked === true)
                        }
                        aria-label={`Select movement ${m.id}`}
                      />
                    </td>
                  ) : null}
                  <td className="p-3 text-xs text-muted-foreground">
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {movementLabel(m.movementType)}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono text-xs">{m.batchNo}</td>
                  <td className="p-3">{m.warehouseName}</td>
                  <td
                    className={`p-3 text-right tabular-nums font-medium ${
                      m.quantity > 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {m.quantity > 0 ? "+" : ""}
                    {m.quantity}
                  </td>
                  <td className="p-3 text-right">
                    <CurrencyAmount amount={Math.abs(m.lineValue)} />
                  </td>
                  {!showArchivedOnly ? (
                    <td className="p-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1"
                        disabled={archivingId === m.id}
                        onClick={() => void handleArchive(m.id)}
                      >
                        {archivingId === m.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Archive className="h-3.5 w-3.5" />
                        )}
                        Archive
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && total > 0 ? (
        <TablePagination
          total={total}
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={pageCount}
          onPageChange={setPageIndex}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageIndex(0);
          }}
        />
      ) : null}
    </div>
  );
}

type ItemBatchReportsPanelProps = {
  itemId: string | number;
  mode?: "item" | "company";
  warehouseId?: number;
  filterItemId?: number;
  batchNo?: string;
};

export function ItemBatchReportsPanel({
  itemId,
  mode = "item",
  warehouseId,
  filterItemId,
  batchNo,
}: ItemBatchReportsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [batchReport, setBatchReport] = useState<StockBatchReportDTO | null>(null);
  const [movements, setMovements] = useState<StockBatchMovementReportDTO | null>(null);
  const [insights, setInsights] = useState<StockBatchInsightsDTO | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const batchParams = {
          warehouseId,
          itemId: mode === "item" ? Number(itemId) : filterItemId,
          batchNo: batchNo?.trim() || undefined,
        };
        const [batches, mov, ins] = await Promise.all([
          mode === "item"
            ? listItemBatches(itemId, warehouseId).then((rows) => ({
                batches: rows.filter((r) => r.quantityOnHand > 0),
                totalValueAtCost: rows.reduce((s, r) => s + (r.lineValue ?? 0), 0),
                totalQuantity: rows.reduce((s, r) => s + (r.quantityOnHand ?? 0), 0),
              }))
            : getInventoryBatchReport(batchParams),
          mode === "item"
            ? getItemBatchMovements(itemId, {
                warehouseId,
                page: 0,
                size: 150,
                archived: false,
              })
            : getInventoryBatchMovements({
                ...batchParams,
                page: 0,
                size: 150,
                archived: false,
              }),
          getInventoryBatchInsights(batchParams),
        ]);
        if (!cancelled) {
          setBatchReport(batches);
          setMovements(mov);
          setInsights(ins);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId, mode, warehouseId, filterItemId, batchNo]);

  const layerChartData = useMemo(
    () =>
      (insights?.valueByCostLayer ?? []).map((l) => ({
        name: l.label,
        value: l.value,
        qty: l.quantity,
      })),
    [insights],
  );

  const trendData = movements?.receiveTrend ?? [];

  if (loading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="flex h-auto flex-wrap gap-1">
        <TabsTrigger value="overview" className="gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" /> Overview
        </TabsTrigger>
        <TabsTrigger value="layers" className="gap-1.5">
          <Layers className="h-3.5 w-3.5" /> Layers
        </TabsTrigger>
        <TabsTrigger value="history" className="gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" /> History
        </TabsTrigger>
        <TabsTrigger value="movements" className="gap-1.5">
          <History className="h-3.5 w-3.5" /> Movements
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Layers on hand</CardDescription>
              <CardTitle className="text-2xl">{batchReport?.batches.length ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total quantity</CardDescription>
              <CardTitle className="text-2xl">{batchReport?.totalQuantity ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Value at cost</CardDescription>
              <CardTitle className="text-2xl">
                <CurrencyAmount amount={batchReport?.totalValueAtCost ?? 0} />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Expiring ≤ 30 days</CardDescription>
              <CardTitle className="text-2xl text-amber-600">
                {insights?.expiringWithin30Days ?? 0} units
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Value by cost layer</CardTitle>
              <CardDescription>How inventory value splits across unit costs</CardDescription>
            </CardHeader>
            <CardContent>
              {layerChartData.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
              ) : (
                <ChartContainer config={{}} className="mx-auto aspect-square max-h-64">
                  <PieChart>
                    <Pie
                      data={layerChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="50%"
                      outerRadius="85%"
                    >
                      {layerChartData.map((_, i) => (
                        <Cell key={i} fill={LAYER_COLORS[i % LAYER_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Receive vs issue trend</CardTitle>
              <CardDescription>Monthly batch movement volume</CardDescription>
            </CardHeader>
            <CardContent>
              {trendData.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No history yet</p>
              ) : (
                <ChartContainer config={trendChartConfig} className="h-64 w-full">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={36} />
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
        </div>
      </TabsContent>

      <TabsContent value="layers">
        <BatchLayersTable batches={batchReport?.batches ?? []} />
      </TabsContent>

      <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Movement volume by month</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No history</p>
            ) : (
              <ChartContainer config={trendChartConfig} className="h-72 w-full">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" />
                  <YAxis width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="receiveQty" fill="hsl(142 76% 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="issueQty" fill="hsl(0 78% 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="movements">
        <MovementLogPanel
          mode={mode}
          itemId={itemId}
          warehouseId={warehouseId}
          filterItemId={filterItemId}
        />
      </TabsContent>
    </Tabs>
  );
}
