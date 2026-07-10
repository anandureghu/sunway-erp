import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatOptionalDate } from "@/pages/inventory/inventory-item-detail/formatters";
import {
  approveStockVariance,
  canApproveStockVariances,
  listPendingStockVariances,
  rejectStockVariance,
  type StockVariance,
} from "@/service/stockVarianceService";
import { Check, Clock, Loader2, X } from "lucide-react";
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

type VariancePendingPanelProps = {
  refreshKey: number;
  onUpdated: () => Promise<void>;
};

export function VariancePendingPanel({
  refreshKey,
  onUpdated,
}: VariancePendingPanelProps) {
  const [rows, setRows] = useState<StockVariance[]>([]);
  const [loading, setLoading] = useState(true);
  const [canApprove, setCanApprove] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pending, approveFlag] = await Promise.all([
        listPendingStockVariances(),
        canApproveStockVariances(),
      ]);
      setRows(pending);
      setCanApprove(approveFlag);
    } catch (e: unknown) {
      toast.error(getRequestErrorMessage(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const handleApprove = async (id: number) => {
    setActingId(id);
    try {
      await approveStockVariance(id);
      toast.success("Variance approved");
      await onUpdated();
      await load();
    } catch (e: unknown) {
      toast.error(getRequestErrorMessage(e));
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: number) => {
    setActingId(id);
    try {
      await rejectStockVariance(id);
      toast.success("Variance rejected");
      await load();
    } catch (e: unknown) {
      toast.error(getRequestErrorMessage(e));
    } finally {
      setActingId(null);
    }
  };

  return (
    <Card className="overflow-hidden border-border/80 shadow-md">
      <CardHeader className="border-b border-border/60 bg-muted/30 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border/60">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Pending approval
            </CardTitle>
            <CardDescription>
              Warehouse manager, finance manager, or CEO can approve
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading pending variances…
          </div>
        ) : rows.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">
            No variances waiting for approval.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">SL No.</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Requested by</TableHead>
                  {canApprove ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={row.id}>
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
                      <Badge variant="outline">
                        {formatVarianceType(row.varianceType)}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.fromWarehouseName}</TableCell>
                    <TableCell className="tabular-nums">
                      {describeChange(row)}
                    </TableCell>
                    <TableCell>
                      {formatOptionalDate(row.varianceDate)}
                    </TableCell>
                    <TableCell>{row.createdByName ?? "—"}</TableCell>
                    {canApprove ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actingId === row.id}
                            onClick={() => void handleReject(row.id)}
                          >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            disabled={actingId === row.id}
                            onClick={() => void handleApprove(row.id)}
                          >
                            <Check className="mr-1 h-3.5 w-3.5" />
                            Approve
                          </Button>
                        </div>
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
