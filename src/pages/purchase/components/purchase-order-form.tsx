/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listItems } from "@/service/inventoryService";
import {
  createPurchaseOrder,
  updatePurchaseOrder,
} from "@/service/purchaseFlowService";
import { listVendors } from "@/service/vendorService";
import type { PurchaseOrder } from "@/types/purchase";
import type { ItemResponseDTO } from "@/service/erpApiTypes";

type EditableLine = {
  id: string;
  itemId: number;
  itemName: string;
  quantity: number;
  unitCost: number;
  otherUnitCost: number;
};

type Props = {
  mode?: "create" | "edit";
  initialOrder?: PurchaseOrder | null;
  onCancel: () => void;
  onSaved: (order: PurchaseOrder) => void;
};

export function PurchaseOrderForm({
  mode = "edit",
  initialOrder = null,
  onCancel,
  onSaved,
}: Props) {
  const navigate = useNavigate();
  const [itemsMaster, setItemsMaster] = useState<ItemResponseDTO[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [lines, setLines] = useState<EditableLine[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [orderDate, setOrderDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedItemId, setSelectedItemId] = useState("");
  const [lineQty, setLineQty] = useState(1);
  const [lineUnitCost, setLineUnitCost] = useState(0);
  const [lineOtherUnitCost, setLineOtherUnitCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const isEditMode = mode === "edit" && Boolean(initialOrder?.id);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [itemsData, vendorsData] = await Promise.all([
          listItems(),
          listVendors(),
        ]);
        if (cancelled) return;
        setItemsMaster(itemsData);
        setVendors(vendorsData);
      } catch (error: any) {
        if (!cancelled) {
          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              "Failed to load purchase order form data.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!initialOrder) return;
    setSelectedSupplierId(String(initialOrder.supplierId || ""));
    setOrderDate(
      initialOrder.orderDate
        ? format(new Date(initialOrder.orderDate), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
    );
    setLines(
      (initialOrder.items || []).map((line, idx) => {
        const matchedItem = itemsMaster.find(
          (it) => Number(it.id) === Number(line.itemId),
        );
        return {
          id: line.id || `poi-edit-${idx}`,
          itemId: Number(line.itemId),
          itemName: matchedItem?.name || `Item #${line.itemId}`,
          quantity: Number(line.quantity || 0),
          unitCost: Number(line.unitPrice || 0),
          otherUnitCost: Number(line.otherUnitCost || 0),
        };
      }),
    );
  }, [initialOrder, itemsMaster]);

  const supplierName = useMemo(() => {
    if (!selectedSupplierId) return "";
    const matched = vendors.find((v) => String(v.id) === String(selectedSupplierId));
    return matched?.vendorName || matched?.name || "";
  }, [selectedSupplierId, vendors]);

  const totalAmount = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const applied = line.otherUnitCost > 0 ? line.otherUnitCost : line.unitCost;
        return sum + applied * line.quantity;
      }, 0),
    [lines],
  );

  const addLine = () => {
    const item = itemsMaster.find((i) => String(i.id) === selectedItemId);
    if (!item) {
      toast.error("Select an item.");
      return;
    }
    if (lineQty <= 0) {
      toast.error("Quantity must be greater than zero.");
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        itemId: Number(item.id),
        itemName: item.name,
        quantity: lineQty,
        unitCost: lineUnitCost,
        otherUnitCost: lineOtherUnitCost,
      },
    ]);
    setSelectedItemId("");
    setLineQty(1);
    setLineUnitCost(0);
    setLineOtherUnitCost(0);
  };

  const updateLine = (lineId: string, patch: Partial<EditableLine>) => {
    setLines((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, ...patch } : line)),
    );
  };

  const removeLine = (lineId: string) => {
    setLines((prev) => prev.filter((line) => line.id !== lineId));
  };

  const onSubmit = async () => {
    if (!selectedSupplierId && !isEditMode) {
      toast.error("Supplier is required.");
      return;
    }
    if (!orderDate) {
      toast.error("Order date is required.");
      return;
    }
    if (lines.length === 0) {
      toast.error("Add at least one line item.");
      return;
    }

    try {
      setSubmitLoading(true);
      const payload = {
        orderDate,
        items: lines.map((line) => ({
          itemId: Number(line.itemId),
          quantity: Number(line.quantity),
          unitCost: Number(line.unitCost || 0),
          otherUnitCost:
            line.otherUnitCost > 0 ? Number(line.otherUnitCost) : undefined,
          lineTotal:
            (line.otherUnitCost > 0 ? line.otherUnitCost : line.unitCost) *
            line.quantity,
        })),
      };

      const saved = isEditMode && initialOrder?.id
        ? await updatePurchaseOrder(initialOrder.id, payload)
        : await createPurchaseOrder({
            supplierId: Number(selectedSupplierId),
            ...payload,
          });

      toast.success(
        isEditMode
          ? `Purchase order ${saved.orderNo} updated successfully.`
          : `Purchase order ${saved.orderNo} created successfully.`,
      );
      onSaved(saved);
      navigate("/inventory/purchase/orders", { replace: true });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to ${isEditMode ? "update" : "create"} purchase order.`,
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Loading order form...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Card className="border-0 shadow-md bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-800 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">
                  Purchase
                </p>
                <h1 className="text-2xl font-bold">
                  {isEditMode ? "Edit Purchase Order" : "Create Purchase Order"}
                </h1>
              </div>
            </div>
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Supplier *</Label>
            <Select
              value={selectedSupplierId}
              onValueChange={setSelectedSupplierId}
              disabled={isEditMode}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={String(vendor.id)}>
                    {vendor.vendorName || vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Order Date *</Label>
            <Input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
            />
          </div>
          {supplierName && (
            <p className="text-sm text-muted-foreground md:col-span-2">
              Supplier: {supplierName}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Line Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2 space-y-2">
              <Label>Item</Label>
              <Select
                value={selectedItemId}
                onValueChange={(value) => {
                  setSelectedItemId(value);
                  const selected = itemsMaster.find((i) => String(i.id) === value);
                  setLineUnitCost(
                    Number((selected as any)?.costPrice ?? (selected as any)?.purchasePrice ?? 0),
                  );
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {itemsMaster
                    .filter((i) => i.status === "active")
                    .map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Qty</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={lineQty}
                onChange={(e) => setLineQty(parseInt(e.target.value || "0", 10))}
              />
            </div>
            <div className="space-y-2">
              <Label>Unit Cost</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={lineUnitCost}
                onChange={(e) => setLineUnitCost(Number(e.target.value || "0"))}
              />
            </div>
            <div className="space-y-2">
              <Label>Other Cost</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={lineOtherUnitCost}
                onChange={(e) => setLineOtherUnitCost(Number(e.target.value || "0"))}
              />
            </div>
          </div>
          <Button type="button" onClick={addLine}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>

          {lines.length > 0 ? (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="text-left p-3">Item</th>
                    <th className="text-right p-3 w-24">Qty</th>
                    <th className="text-right p-3 w-32">Unit Cost</th>
                    <th className="text-right p-3 w-32">Other Cost</th>
                    <th className="text-right p-3 w-32">Line Total</th>
                    <th className="text-left p-3 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => {
                    const applied =
                      line.otherUnitCost > 0 ? line.otherUnitCost : line.unitCost;
                    return (
                      <tr key={line.id} className="border-t">
                        <td className="p-3 align-middle">{line.itemName}</td>
                        <td className="p-3 align-middle">
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            className="text-right h-9 tabular-nums"
                            value={line.quantity}
                            onChange={(e) =>
                              updateLine(line.id, {
                                quantity: parseInt(e.target.value || "0", 10),
                              })
                            }
                          />
                        </td>
                        <td className="p-3 align-middle">
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            className="text-right h-9 tabular-nums"
                            value={line.unitCost}
                            onChange={(e) =>
                              updateLine(line.id, {
                                unitCost: Number(e.target.value || "0"),
                              })
                            }
                          />
                        </td>
                        <td className="p-3 align-middle">
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            className="text-right h-9 tabular-nums"
                            value={line.otherUnitCost}
                            onChange={(e) =>
                              updateLine(line.id, {
                                otherUnitCost: Number(e.target.value || "0"),
                              })
                            }
                          />
                        </td>
                        <td className="p-3 text-right font-medium align-middle tabular-nums">
                          ₹{(applied * line.quantity).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="p-3 align-middle">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLine(line.id)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground rounded-lg border border-dashed">
              No items added yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>₹{totalAmount.toLocaleString()}</span>
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => void onSubmit()}
            disabled={submitLoading || lines.length === 0}
          >
            {submitLoading
              ? isEditMode
                ? "Saving..."
                : "Creating..."
              : isEditMode
                ? "Save Changes"
                : "Create Purchase Order"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
