/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { listItems } from "@/service/inventoryService";
import { createPurchaseRequisition } from "@/service/purchaseFlowService";
import type { PurchaseRequisitionItem } from "@/types/purchase";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { toast } from "sonner";
import SelectUser from "@/components/select-user";
import SelectDepartment from "@/components/select-department";
import SelectVendor from "@/components/select-vendor";
import SelectAccount from "@/components/select-account";
import { useAuth } from "@/context/AuthContext";

type Props = {
  onCancel: () => void;
  onCreated?: () => void;
};

export function CreatePurchaseRequisitionForm({
  onCancel,
  onCreated,
}: Props) {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const companyId =
    user?.companyId != null && user.companyId !== ""
      ? Number(user.companyId)
      : company?.id != null
        ? Number(company.id)
        : 0;

  const [requisitionItems, setRequisitionItems] = useState<
    PurchaseRequisitionItem[]
  >([]);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);
  const [items, setItems] = useState<ItemResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadSeq, setReloadSeq] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [requestedByUserId, setRequestedByUserId] = useState<string | undefined>(
    user?.userId != null ? String(user.userId) : undefined,
  );
  const [departmentId, setDepartmentId] = useState<string>("");
  const [preferredSupplierId, setPreferredSupplierId] = useState<string>("");
  const [debitAccountId, setDebitAccountId] = useState<string>("");
  const [creditAccountId, setCreditAccountId] = useState<string>("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const it = await listItems();
        if (cancelled) return;
        setItems(it);
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(
            e?.response?.data?.message || e?.message || "Failed to load items",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadSeq]);

  const addItemToRequisition = () => {
    if (!selectedItem || itemQuantity <= 0) return;

    const inv = items.find((i) => String(i.id) === selectedItem);
    if (!inv) return;

    const unitPrice =
      itemUnitPrice > 0 ? itemUnitPrice : Number(inv.costPrice ?? 0);
    const estimatedTotal = unitPrice * itemQuantity;

    const newItem: PurchaseRequisitionItem = {
      id: `temp-${Date.now()}`,
      requisitionId: "",
      itemId: Number(inv.id),
      item: inv as any,
      quantity: itemQuantity,
      unitPrice,
      estimatedUnitCost: unitPrice,
      estimatedTotal,
    };

    setRequisitionItems([...requisitionItems, newItem]);
    setSelectedItem("");
    setItemQuantity(1);
    setItemUnitPrice(0);
  };

  const removeItem = (itemId: string) => {
    setRequisitionItems(requisitionItems.filter((item) => item.id !== itemId));
  };

  const updateRequisitionLine = (
    lineId: string,
    updates: {
      quantity?: number;
      unitPrice?: number;
      lineNotes?: string;
    },
  ) => {
    setRequisitionItems((prev) =>
      prev.map((row) => {
        if (row.id !== lineId) return row;
        const quantity =
          updates.quantity !== undefined ? updates.quantity : row.quantity;
        const unitPrice =
          updates.unitPrice !== undefined
            ? updates.unitPrice
            : (row.unitPrice ?? row.estimatedUnitCost ?? 0);
        const q = quantity > 0 ? quantity : row.quantity;
        const estimatedUnitCost = unitPrice;
        const estimatedTotal = q * estimatedUnitCost;
        return {
          ...row,
          quantity: q,
          unitPrice,
          estimatedUnitCost,
          estimatedTotal,
          ...(updates.lineNotes !== undefined
            ? { notes: updates.lineNotes }
            : {}),
        };
      }),
    );
  };

  const calculateTotal = () =>
    requisitionItems.reduce(
      (sum, item) => sum + (item.estimatedTotal || 0),
      0,
    );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferredSupplierId) {
      toast.error("Please select a preferred supplier.");
      return;
    }
    if (!debitAccountId || !creditAccountId) {
      toast.error("Select debit and credit accounts for this commitment.");
      return;
    }
    if (debitAccountId === creditAccountId) {
      toast.error("Debit and credit accounts must be different.");
      return;
    }
    if (requisitionItems.length === 0) {
      toast.error("Please add at least one item.");
      return;
    }

    setSubmitLoading(true);

    const payload = {
      debitAccountId: Number(debitAccountId),
      creditAccountId: Number(creditAccountId),
      preferredSupplierId: Number(preferredSupplierId),
      departmentId: departmentId ? Number(departmentId) : undefined,
      requestedByUserId: requestedByUserId
        ? Number(requestedByUserId)
        : undefined,
      items: requisitionItems.map((item) => ({
        itemId: Number(item.itemId),
        requestedQty: Math.round(item.quantity),
        remarks: (item.notes || notes || "").trim(),
        estimatedUnitCost:
          item.estimatedUnitCost ?? item.unitPrice ?? undefined,
      })),
    };

    createPurchaseRequisition(payload)
      .then((created) => {
        toast.success(
          `Purchase requisition ${created.requisitionNo} created successfully.`,
        );
        onCreated?.();
        navigate("/inventory/purchase/requisitions", { replace: true });
      })
      .catch((error: any) => {
        console.error("Error creating purchase requisition:", error);
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to create purchase requisition.",
        );
      })
      .finally(() => setSubmitLoading(false));
  };

  const total = calculateTotal();

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Create Purchase Requisition
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              When approved, a draft purchase order is created and a matching
              finance transaction is posted to the accounts you choose.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Loading…</div>
      ) : loadError ? (
        <div className="py-10 text-center">
          <div className="text-red-600 mb-3">{loadError}</div>
          <Button variant="outline" onClick={() => setReloadSeq((n) => n + 1)}>
            Retry
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <SelectUser
                    label="Requested by"
                    value={requestedByUserId}
                    onChange={setRequestedByUserId}
                    placeholder="Select user"
                  />
                </div>
                {companyId > 0 && (
                  <div className="space-y-2">
                    <SelectDepartment
                      value={departmentId || undefined}
                      onChange={(v) => setDepartmentId(v)}
                      companyId={companyId}
                    />
                  </div>
                )}
                <div className="space-y-2 sm:col-span-2">
                  <SelectVendor
                    label="Preferred supplier *"
                    value={preferredSupplierId || undefined}
                    onChange={(v) => setPreferredSupplierId(v)}
                    placeholder="Select supplier for the PO"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accounting</CardTitle>
              <p className="text-sm text-muted-foreground font-normal">
                Debit is typically expense or inventory; credit is often
                accounts payable or a clearing account. Balances are checked
                when you save, submit, and approve.
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectAccount
                useId
                label="Debit account *"
                value={debitAccountId}
                onChange={setDebitAccountId}
                placeholder="Select debit account"
              />
              <SelectAccount
                useId
                label="Credit account *"
                value={creditAccountId}
                onChange={setCreditAccountId}
                placeholder="Select credit account"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Item</Label>
                  <Select value={selectedItem} onValueChange={setSelectedItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items
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
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={itemQuantity}
                    onChange={(e) =>
                      setItemQuantity(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Est. unit cost</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemUnitPrice}
                    onChange={(e) =>
                      setItemUnitPrice(parseFloat(e.target.value) || 0)
                    }
                    placeholder="Uses item cost if empty"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={addItemToRequisition}
                    className="w-full"
                  >
                    Add item
                  </Button>
                </div>
              </div>

              {requisitionItems.length > 0 && (
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Item</th>
                        <th className="p-2 text-right w-28">Qty</th>
                        <th className="p-2 text-right w-32">Est. unit</th>
                        <th className="p-2 text-right">Est. total</th>
                        <th className="p-2 text-left min-w-[140px]">Line notes</th>
                        <th className="p-2 text-left w-24" />
                      </tr>
                    </thead>
                    <tbody>
                      {requisitionItems.map((row) => (
                        <tr key={row.id} className="border-t">
                          <td className="p-2 align-middle">
                            {items.find((i) => String(i.id) === String(row.itemId))
                              ?.name ?? `Item #${row.itemId}`}
                          </td>
                          <td className="p-2 align-middle">
                            <Input
                              type="number"
                              min={0.01}
                              step={0.01}
                              className="text-right h-9 tabular-nums"
                              value={row.quantity}
                              onChange={(e) =>
                                updateRequisitionLine(row.id, {
                                  quantity: parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                          </td>
                          <td className="p-2 align-middle">
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              className="text-right h-9 tabular-nums"
                              value={row.unitPrice ?? row.estimatedUnitCost ?? 0}
                              onChange={(e) =>
                                updateRequisitionLine(row.id, {
                                  unitPrice: parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                          </td>
                          <td className="p-2 text-right font-medium align-middle tabular-nums">
                            ₹{(row.estimatedTotal ?? 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-2 align-middle">
                            <Input
                              type="text"
                              className="h-9 text-sm"
                              placeholder="Optional"
                              value={row.notes ?? ""}
                              onChange={(e) =>
                                updateRequisitionLine(row.id, {
                                  lineNotes: e.target.value,
                                })
                              }
                            />
                          </td>
                          <td className="p-2 align-middle">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(row.id)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {requisitionItems.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Add at least one item.
                </p>
              )}
            </CardContent>
          </Card>

          {requisitionItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total estimated</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Instructions for approver"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={requisitionItems.length === 0 || submitLoading}
            >
              {submitLoading ? "Creating…" : "Create requisition"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
