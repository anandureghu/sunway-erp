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
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/service/apiClient";
import type { Company } from "@/types/company";
import { hasPurchaseAccountingDefaults } from "@/lib/accounting-defaults";
import { Link } from "react-router-dom";
import { Info } from "lucide-react";

type Props = {
  onCancel: () => void;
  onCreated?: () => void;
};

function parseOptionalOtherCost(s: string): number | undefined {
  const t = s.trim();
  if (t === "") return undefined;
  const n = parseFloat(t);
  if (Number.isNaN(n) || n <= 0) return undefined;
  return n;
}

function appliedFromActualAndOther(
  actualItemCost: number,
  otherUnitCost?: number,
): number {
  if (otherUnitCost != null && otherUnitCost > 0) return otherUnitCost;
  return actualItemCost;
}

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
  /** Optional override; empty means use item cost price. */
  const [itemOtherCostInput, setItemOtherCostInput] = useState<string>("");
  const [items, setItems] = useState<ItemResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadSeq, setReloadSeq] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [purchaseDefaultsMissing, setPurchaseDefaultsMissing] =
    useState(false);

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
        if (companyId) {
          const companyRes = await apiClient.get<Company>(
            `/companies/${companyId}`,
          );
          if (cancelled) return;
          const co = companyRes.data;
          if (!co || !hasPurchaseAccountingDefaults(co)) {
            setPurchaseDefaultsMissing(true);
          } else {
            setPurchaseDefaultsMissing(false);
            if (co.defaultPurchaseDebitAccountId != null) {
              setDebitAccountId(String(co.defaultPurchaseDebitAccountId));
            }
            if (co.defaultPurchaseCreditAccountId != null) {
              setCreditAccountId(String(co.defaultPurchaseCreditAccountId));
            }
          }
        }
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
  }, [reloadSeq, companyId]);

  useEffect(() => {
    setItemOtherCostInput("");
  }, [selectedItem]);

  const addItemToRequisition = () => {
    if (!selectedItem || itemQuantity <= 0) return;

    const inv = items.find((i) => String(i.id) === selectedItem);
    if (!inv) return;

    const actualItemPrice = Number(inv.costPrice ?? 0);
    const other = parseOptionalOtherCost(itemOtherCostInput);
    const applied = appliedFromActualAndOther(actualItemPrice, other);
    const estimatedTotal = applied * itemQuantity;

    const newItem: PurchaseRequisitionItem = {
      id: `temp-${Date.now()}`,
      requisitionId: "",
      itemId: Number(inv.id),
      item: inv as any,
      quantity: itemQuantity,
      actualItemPrice,
      otherUnitCost: other,
      unitPrice: applied,
      estimatedUnitCost: applied,
      estimatedTotal,
    };

    setRequisitionItems([...requisitionItems, newItem]);
    setSelectedItem("");
    setItemQuantity(1);
    setItemOtherCostInput("");
  };

  const removeItem = (itemId: string) => {
    setRequisitionItems(requisitionItems.filter((item) => item.id !== itemId));
  };

  const updateRequisitionLine = (
    lineId: string,
    updates: {
      quantity?: number;
      otherUnitCost?: number;
      lineNotes?: string;
    },
  ) => {
    setRequisitionItems((prev) =>
      prev.map((row) => {
        if (row.id !== lineId) return row;
        const quantity =
          updates.quantity !== undefined ? updates.quantity : row.quantity;
        const q = quantity > 0 ? quantity : row.quantity;
        const actual = row.actualItemPrice ?? 0;
        let other = row.otherUnitCost;
        if (updates.otherUnitCost !== undefined) {
          other =
            updates.otherUnitCost != null && updates.otherUnitCost > 0
              ? updates.otherUnitCost
              : undefined;
        }
        const applied = appliedFromActualAndOther(actual, other);
        const estimatedTotal = q * applied;
        return {
          ...row,
          quantity: q,
          otherUnitCost: other,
          unitPrice: applied,
          estimatedUnitCost: applied,
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
      toast.error(
        "Purchase default accounts are not loaded. Configure them under Global Settings → Default Accounts.",
      );
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
      items: requisitionItems.map((item) => {
        const applied = item.estimatedUnitCost ?? item.unitPrice ?? undefined;
        const payload: {
          itemId: number;
          requestedQty: number;
          remarks: string;
          estimatedUnitCost?: number;
          otherUnitCost?: number;
        } = {
          itemId: Number(item.itemId),
          requestedQty: Math.round(item.quantity),
          remarks: (item.notes || notes || "").trim(),
          estimatedUnitCost: applied,
        };
        if (
          item.otherUnitCost != null &&
          item.otherUnitCost !== undefined &&
          item.otherUnitCost > 0
        ) {
          payload.otherUnitCost = item.otherUnitCost;
        }
        return payload;
      }),
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
              When approved, a draft purchase order is created and finance
              posts to your company default purchase accounts (Global Settings
              → Default Accounts).
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
      ) : purchaseDefaultsMissing ? (
        <Card className="border-amber-200 bg-amber-50/90 dark:bg-amber-950/20 max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100 text-base">
              <Info className="h-5 w-5 shrink-0" />
              Set default accounts first
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900/90 dark:text-amber-100/90 space-y-3">
            <p>
              Configure purchase debit and purchase credit in Global Settings
              before creating purchase requisitions.
            </p>
            <Button asChild variant="secondary">
              <Link to="/admin/default-accounts">
                Open Default Accounts (Global Settings)
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                GL accounts for this requisition use your company purchase
                defaults (Global Settings → Default Accounts).
              </p>
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
              <CardTitle>Line items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <Label>Item cost (from master)</Label>
                  <div className="h-10 px-3 flex items-center rounded-md border bg-muted/50 text-sm tabular-nums">
                    {selectedItem
                      ? `₹${Number(
                          items.find((i) => String(i.id) === selectedItem)
                            ?.costPrice ?? 0,
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : "—"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Other cost price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemOtherCostInput}
                    onChange={(e) => setItemOtherCostInput(e.target.value)}
                    placeholder="Optional override"
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
                        <th className="p-2 text-right w-24">Qty</th>
                        <th className="p-2 text-right w-28">Item cost</th>
                        <th className="p-2 text-right w-32">Other cost</th>
                        <th className="p-2 text-right w-28">Applied</th>
                        <th className="p-2 text-right min-w-[7rem]">Est. total</th>
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
                          <td className="p-2 text-right align-middle tabular-nums text-muted-foreground">
                            ₹
                            {(row.actualItemPrice ?? 0).toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </td>
                          <td className="p-2 align-middle">
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              className="text-right h-9 tabular-nums"
                              placeholder="—"
                              value={
                                row.otherUnitCost != null &&
                                row.otherUnitCost > 0
                                  ? row.otherUnitCost
                                  : ""
                              }
                              onChange={(e) => {
                                const v = e.target.value;
                                const num =
                                  v === ""
                                    ? undefined
                                    : parseFloat(v);
                                updateRequisitionLine(row.id, {
                                  otherUnitCost:
                                    num === undefined ||
                                    Number.isNaN(num) ||
                                    num <= 0
                                      ? undefined
                                      : num,
                                });
                              }}
                            />
                          </td>
                          <td className="p-2 text-right align-middle tabular-nums font-medium">
                            ₹
                            {(
                              row.estimatedUnitCost ??
                              row.unitPrice ??
                              0
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
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
