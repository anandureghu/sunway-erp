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
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import {
  listSentBackStockVariances,
  type StockVariance,
} from "@/service/stockVarianceService";
import type { Warehouse } from "@/types/inventory";
import { Loader2, Pencil, Undo2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { VarianceFormPanel } from "./variance-form-panel";

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

type VarianceSentBackPanelProps = {
  items: ItemResponseDTO[];
  warehouses: Warehouse[];
  refreshKey: number;
  onResubmitted: () => Promise<void>;
};

export function VarianceSentBackPanel({
  items,
  warehouses,
  refreshKey,
  onResubmitted,
}: VarianceSentBackPanelProps) {
  const [rows, setRows] = useState<StockVariance[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVariance, setEditingVariance] = useState<StockVariance | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listSentBackStockVariances());
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

  if (editingVariance) {
    return (
      <VarianceFormPanel
        items={items}
        warehouses={warehouses}
        editing={editingVariance}
        onCancelEdit={() => setEditingVariance(null)}
        onSubmitted={async () => {
          setEditingVariance(null);
          await onResubmitted();
          await load();
        }}
      />
    );
  }

  return (
    <Card className="overflow-hidden border-border/80 shadow-md">
      <CardHeader className="border-b border-border/60 bg-muted/30 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border/60">
            <Undo2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Sent back to you
            </CardTitle>
            <CardDescription>
              Revise and resubmit these for approval
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-muted-foreground">
            Nothing has been sent back to you.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">SL No.</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Sent back by</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="tabular-nums">
                      {describeChange(row)}
                    </TableCell>
                    <TableCell className="max-w-xs text-sm text-muted-foreground">
                      {row.sentBackReason}
                    </TableCell>
                    <TableCell>{row.sentBackByName ?? "—"}</TableCell>
                    <TableCell>
                      {formatOptionalDate(row.sentBackAt?.slice(0, 10))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => setEditingVariance(row)}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Revise &amp; resubmit
                      </Button>
                    </TableCell>
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
