import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { formatOptionalDate } from "@/pages/inventory/inventory-item-detail/formatters";
import {
  bulkArchiveHistoryRecords,
  summarizeBulkActionResult,
} from "@/service/historyService";
import {
  archiveStockVariance,
  listStockVarianceHistory,
  type StockVariance,
} from "@/service/stockVarianceService";
import { Archive, History, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function getRequestErrorMessage(e: unknown): string {
  if (
    e &&
    typeof e === "object" &&
    "response" in e &&
    (e as { response?: { data?: { message?: string } } }).response?.data
      ?.message
  ) {
    return String(
      (e as { response: { data: { message: string } } }).response.data.message,
    );
  }
  if (e instanceof Error) return e.message;
  return "Request failed";
}

function formatVarianceType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function describeChange(row: StockVariance): string {
  if (row.varianceType === "transfer") {
    return `${row.transferQuantity ?? 0} → ${row.toWarehouseName ?? "warehouse"}`;
  }
  if (row.adjustmentMode === "set") {
    return `${row.quantityBefore} → ${row.quantityAfter ?? "?"}`;
  }
  const delta = row.adjustmentQuantity ?? 0;
  return delta >= 0 ? `+${delta}` : `${delta}`;
}

function statusBadge(status: StockVariance["status"]) {
  if (status === "approved") {
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600">Approved</Badge>
    );
  }
  if (status === "rejected") {
    return <Badge variant="destructive">Rejected</Badge>;
  }
  return <Badge variant="secondary">Pending</Badge>;
}

type VarianceHistoryPanelProps = {
  refreshKey: number;
};

export function VarianceHistoryPanel({
  refreshKey,
}: VarianceHistoryPanelProps) {
  const { confirm } = useConfirmDialog();
  const [rows, setRows] = useState<StockVariance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);
  const [archivingId, setArchivingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkArchiving, setBulkArchiving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listStockVarianceHistory(showArchivedOnly));
    } catch (e: unknown) {
      toast.error(getRequestErrorMessage(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [showArchivedOnly]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [showArchivedOnly, refreshKey]);

  const selectableRows = useMemo(
    () => rows.filter((row) => !row.archived),
    [rows],
  );

  const toggleRow = useCallback((id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(
        checked ? new Set(selectableRows.map((r) => r.id)) : new Set(),
      );
    },
    [selectableRows],
  );

  const handleBulkArchive = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (
      !(await confirm(
        `Archive ${ids.length} selected variance(s)? They will move to Operations and management Reports → History.`,
      ))
    ) {
      return;
    }
    setBulkArchiving(true);
    try {
      const result = await bulkArchiveHistoryRecords("STOCK_VARIANCE", ids);
      toast.success(summarizeBulkActionResult(result));
      setSelectedIds(new Set());
      await load();
    } catch (e: unknown) {
      toast.error(getRequestErrorMessage(e));
    } finally {
      setBulkArchiving(false);
    }
  }, [confirm, load, selectedIds]);

  const handleArchive = useCallback(
    async (row: StockVariance) => {
      if (row.archived) {
        toast.error("Variance is already archived.");
        return;
      }
      const label = row.itemName ?? row.itemSku ?? `variance #${row.id}`;
      if (
        !(await confirm(
          `Archive ${label}? It will be hidden from the active history list.`,
        ))
      ) {
        return;
      }
      setArchivingId(row.id);
      try {
        await archiveStockVariance(row.id);
        toast.success("Variance archived");
        await load();
      } catch (e: unknown) {
        toast.error(getRequestErrorMessage(e));
      } finally {
        setArchivingId(null);
      }
    },
    [confirm, load],
  );

  return (
    <Card className="overflow-hidden border-border/80 shadow-md">
      <CardHeader className="border-b border-border/60 bg-muted/30 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border/60">
              <History className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Variance history
              </CardTitle>
              <CardDescription>
                {showArchivedOnly
                  ? "Archived approved and rejected adjustments"
                  : "Previously approved and rejected adjustments"}
              </CardDescription>
            </div>
          </div>
          <div className="items-center gap-2 hidden">
            <Switch
              id="show-archived-variances"
              checked={showArchivedOnly}
              onCheckedChange={setShowArchivedOnly}
            />
            <Label
              htmlFor="show-archived-variances"
              className="cursor-pointer text-sm"
            >
              Archived only
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading history…
          </div>
        ) : rows.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">
            {showArchivedOnly
              ? "No archived variance history."
              : "No variance history yet."}
          </p>
        ) : (
          <div className="space-y-4">
            {!showArchivedOnly ? (
              <div className="px-6 pt-4">
                <BulkActionBar
                  selectedCount={selectedIds.size}
                  onArchive={() => void handleBulkArchive()}
                  onClear={() => setSelectedIds(new Set())}
                  archiving={bulkArchiving}
                />
              </div>
            ) : null}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {!showArchivedOnly ? (
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            selectableRows.length > 0 &&
                            selectedIds.size === selectableRows.length
                          }
                          onCheckedChange={(checked) =>
                            toggleAll(checked === true)
                          }
                          aria-label="Select all"
                        />
                      </TableHead>
                    ) : null}
                    <TableHead className="w-12">SL No.</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Reviewed by</TableHead>
                    {!showArchivedOnly ? (
                      <TableHead className="w-[100px]">Actions</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={row.id}>
                      {!showArchivedOnly ? (
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(row.id)}
                            onCheckedChange={(checked) =>
                              toggleRow(row.id, checked === true)
                            }
                            disabled={row.archived}
                            aria-label={`Select variance ${row.id}`}
                          />
                        </TableCell>
                      ) : null}
                      <TableCell className="tabular-nums text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{row.itemName}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.itemSku}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatVarianceType(row.varianceType)}
                      </TableCell>
                      <TableCell>{row.fromWarehouseName}</TableCell>
                      <TableCell className="tabular-nums">
                        {describeChange(row)}
                      </TableCell>
                      <TableCell>{statusBadge(row.status)}</TableCell>
                      <TableCell>
                        {formatOptionalDate(row.varianceDate)}
                      </TableCell>
                      <TableCell>
                        {row.status === "approved"
                          ? (row.approvedByName ?? "—")
                          : (row.rejectedByName ?? "—")}
                      </TableCell>
                      {!showArchivedOnly ? (
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1"
                            disabled={archivingId === row.id || row.archived}
                            onClick={() => void handleArchive(row)}
                          >
                            {archivingId === row.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Archive className="h-3.5 w-3.5" />
                            )}
                            Archive
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
