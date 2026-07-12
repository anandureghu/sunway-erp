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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatOptionalDate } from "@/pages/inventory/inventory-item-detail/formatters";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import {
  approveStockVariance,
  canApproveStockVariances,
  listPendingStockVariances,
  rejectStockVariance,
  sendBackStockVariance,
  type StockVariance,
} from "@/service/stockVarianceService";
import { Check, Clock, Loader2, Undo2, X } from "lucide-react";
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
  const { confirm } = useConfirmDialog();
  const [rows, setRows] = useState<StockVariance[]>([]);
  const [loading, setLoading] = useState(true);
  const [canApprove, setCanApprove] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [sendBackTarget, setSendBackTarget] = useState<StockVariance | null>(
    null,
  );
  const [sendBackReason, setSendBackReason] = useState("");
  const [sendingBack, setSendingBack] = useState(false);

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

  const handleReject = async (row: StockVariance) => {
    const label = row.itemName ?? row.itemSku ?? `variance #${row.id}`;
    if (!(await confirm(`Reject the variance for ${label}? This cannot be undone.`))) {
      return;
    }
    setActingId(row.id);
    try {
      await rejectStockVariance(row.id);
      toast.success("Variance rejected");
      await onUpdated();
      await load();
    } catch (e: unknown) {
      toast.error(getRequestErrorMessage(e));
    } finally {
      setActingId(null);
    }
  };

  const openSendBack = (row: StockVariance) => {
    setSendBackTarget(row);
    setSendBackReason("");
  };

  const submitSendBack = async () => {
    if (!sendBackTarget) return;
    if (!sendBackReason.trim()) {
      toast.error("A reason is required to send this variance back.");
      return;
    }
    setSendingBack(true);
    try {
      await sendBackStockVariance(sendBackTarget.id, sendBackReason.trim());
      toast.success("Variance sent back to the requester");
      setSendBackTarget(null);
      setSendBackReason("");
      await onUpdated();
      await load();
    } catch (e: unknown) {
      toast.error(getRequestErrorMessage(e));
    } finally {
      setSendingBack(false);
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
                      {row.sentBackReason ? (
                        <Badge
                          variant="outline"
                          className="mt-1 border-amber-300 text-amber-700"
                        >
                          Resubmitted after send-back
                        </Badge>
                      ) : null}
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
                            onClick={() => openSendBack(row)}
                          >
                            <Undo2 className="mr-1 h-3.5 w-3.5" />
                            Send back
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actingId === row.id}
                            onClick={() => void handleReject(row)}
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

      <Dialog
        open={sendBackTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setSendBackTarget(null);
            setSendBackReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send variance back</DialogTitle>
            <DialogDescription>
              Return this variance to{" "}
              {sendBackTarget?.createdByName ?? "the requester"} with a reason.
              They can revise and resubmit it for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="send-back-reason">Reason</Label>
            <Textarea
              id="send-back-reason"
              value={sendBackReason}
              onChange={(e) => setSendBackReason(e.target.value)}
              placeholder="e.g. Please attach the damage report before resubmitting"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSendBackTarget(null);
                setSendBackReason("");
              }}
              disabled={sendingBack}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void submitSendBack()}
              disabled={sendingBack || !sendBackReason.trim()}
            >
              {sendingBack ? "Sending…" : "Send back"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
