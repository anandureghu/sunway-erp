import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { formatOptionalDate } from "@/pages/inventory/inventory-item-detail/formatters";
import {
  archiveStockVariance,
  listStockVarianceHistory,
  type StockVariance,
} from "@/service/stockVarianceService";
import { Archive, History, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Approved</Badge>;
  }
  if (status === "rejected") {
    return <Badge variant="destructive">Rejected</Badge>;
  }
  return <Badge variant="secondary">Pending</Badge>;
}

type VarianceHistoryPanelProps = {
  refreshKey: number;
};

export function VarianceHistoryPanel({ refreshKey }: VarianceHistoryPanelProps) {
  const { confirm } = useConfirmDialog();
  const [rows, setRows] = useState<StockVariance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);
  const [archivingId, setArchivingId] = useState<number | null>(null);

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
          <div className="flex items-center gap-2">
            <Switch
              id="show-archived-variances"
              checked={showArchivedOnly}
              onCheckedChange={setShowArchivedOnly}
            />
            <Label htmlFor="show-archived-variances" className="cursor-pointer text-sm">
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reviewed by</TableHead>
                  {!showArchivedOnly ? <TableHead className="w-[100px]">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.itemName}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.itemSku}
                      </div>
                    </TableCell>
                    <TableCell>{formatVarianceType(row.varianceType)}</TableCell>
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
                        ? row.approvedByName ?? "—"
                        : row.rejectedByName ?? "—"}
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
        )}
      </CardContent>
    </Card>
  );
}
