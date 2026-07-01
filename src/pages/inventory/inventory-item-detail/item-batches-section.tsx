import { CurrencyAmount } from "@/components/currency/currency-amount";
import { ItemSectionCard } from "@/components/inventory/item-section-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StockBatchResponseDTO } from "@/service/erpApiTypes";
import { listItemBatches } from "@/service/inventoryService";
import { Layers, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

export function ItemBatchesSection({ itemId }: { itemId: string | number }) {
  const [batches, setBatches] = useState<StockBatchResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        const rows = await listItemBatches(itemId);
        if (!cancelled) setBatches(rows.filter((b) => b.quantityOnHand > 0));
      } catch {
        if (!cancelled) setBatches([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const totalValue = batches.reduce((sum, b) => sum + (b.lineValue ?? 0), 0);
  const totalQty = batches.reduce((sum, b) => sum + (b.quantityOnHand ?? 0), 0);

  return (
    <ItemSectionCard icon={<Layers className="h-3.5 w-3.5 text-white" />} title="Cost batches">
      <p className="mb-4 text-sm text-muted-foreground">
        Each receipt at a different unit cost is tracked as a separate batch. Sales consume stock
        using FIFO (oldest batch first).
      </p>
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading batches…
        </div>
      ) : batches.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">No batch layers on hand for this item.</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <span>
              <span className="text-muted-foreground">Layers: </span>
              <span className="font-medium">{batches.length}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Qty on hand: </span>
              <span className="font-medium">{totalQty}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Value at cost: </span>
              <CurrencyAmount amount={totalValue} className="font-medium" />
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit cost</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Expiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-mono text-xs">{batch.batchNo}</TableCell>
                    <TableCell>{batch.warehouseName ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {batch.quantityOnHand}
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyAmount amount={batch.unitCost} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyAmount amount={batch.lineValue} />
                    </TableCell>
                    <TableCell>{formatDate(batch.receivedAt)}</TableCell>
                    <TableCell>{formatDate(batch.expiryDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </ItemSectionCard>
  );
}
