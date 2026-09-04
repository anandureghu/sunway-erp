"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/service/apiClient";
import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import { RotateCcw, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  so: SalesOrderResponseDTO;
  onReturned: () => void;
};

type QtyState = Record<string, number>;

export function CreateSalesReturnDialog({ so, onReturned }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [restock, setRestock] = useState(true);
  const [qtys, setQtys] = useState<QtyState>({});

  const returnableLines = useMemo(() => {
    return (so.items ?? [])
      .map((line, idx) => {
        const ordered = line.quantity ?? 0;
        const returned = line.returnedQty ?? 0;
        const remaining = Math.max(ordered - returned, 0);
        const key = String(line.id ?? `${line.itemId}-${idx}`);
        return { line, remaining, key };
      })
      .filter((r) => r.remaining > 0);
  }, [so.items]);

  const openDialog = () => {
    const initial: QtyState = {};
    for (const r of returnableLines) {
      initial[r.key] = 0;
    }
    setQtys(initial);
    setReason("");
    setRestock(true);
    setOpen(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const items = returnableLines
        .map(({ line, remaining, key }) => {
          const qty = Number(qtys[key] ?? 0);
          if (qty <= 0) return null;
          if (qty > remaining) {
            throw new Error(
              `Return qty for ${line.itemName ?? "item"} exceeds remaining (${remaining})`,
            );
          }
          return {
            salesOrderItemId: line.id != null ? Number(line.id) : undefined,
            itemId: line.itemId != null ? Number(line.itemId) : undefined,
            quantity: qty,
          };
        })
        .filter(Boolean);

      if (items.length === 0) {
        toast.error("Enter a return quantity for at least one item");
        return;
      }

      const res = await apiClient.post("/sales/returns", {
        salesOrderId: Number(so.id),
        reason: reason || undefined,
        restock,
        items,
      });
      const cn = res.data?.creditNoteNumber;
      toast.success(
        cn
          ? `Return recorded. Credit note ${cn} is available to apply or cash out anytime.`
          : "Return recorded. Customer invoice/order amounts were adjusted.",
      );
      setOpen(false);
      onReturned();
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to process return",
      );
    } finally {
      setLoading(false);
    }
  };

  if (returnableLines.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        size="lg"
        variant="outline"
        className="h-10 gap-2 rounded-xl border-amber-200 text-amber-800 hover:bg-amber-50"
        onClick={openDialog}
      >
        <RotateCcw className="h-4 w-4" />
        Return items
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl [&>button]:hidden"
          style={{ maxWidth: 560, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
            <div>
              <DialogTitle className="text-[15px] font-semibold text-white">
                Customer return
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                Adjust prices and issue credit for returned goods
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
            <div className="space-y-3">
              {returnableLines.map(({ line, remaining, key }) => (
                <div
                  key={key}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-slate-50 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {line.itemName ?? `Item ${line.itemId}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Returnable: {remaining} · Unit{" "}
                      {line.unitPrice != null ? Number(line.unitPrice).toFixed(2) : "—"}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={remaining}
                    step="0.01"
                    className="h-9 w-24"
                    value={qtys[key] ?? 0}
                    onChange={(e) =>
                      setQtys((prev) => ({
                        ...prev,
                        [key]: Math.min(
                          remaining,
                          Math.max(0, Number(e.target.value) || 0),
                        ),
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="return-reason">Reason</Label>
              <Textarea
                id="return-reason"
                placeholder="Damaged, wrong item, customer change of mind…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="restock"
                checked={restock}
                onCheckedChange={(v) => setRestock(v === true)}
              />
              <Label htmlFor="restock" className="font-normal">
                Restock returned items into inventory
              </Label>
            </div>

            <p className="text-xs text-muted-foreground">
              If the invoice is unpaid, amounts are reduced. If paid, a standing credit note
              is created that the customer can apply to future purchases or cash out anytime.
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={() => void handleSubmit()} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  "Confirm return"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
