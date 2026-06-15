/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
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
import { listItems, listWarehouses } from "@/service/inventoryService";
import {
  createPurchaseRequisition,
  getPurchaseRequisition,
  updatePurchaseRequisition,
  uploadPurchaseRequisitionDocument,
  type PurchaseRequisitionCreateDTO,
} from "@/service/purchaseFlowService";
import type { PurchaseRequisitionItem } from "@/types/purchase";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { toast } from "sonner";
import type { SelectUserOption } from "@/components/select-user";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/service/apiClient";
import type { Company } from "@/types/company";
import { hasPurchaseAccountingDefaults } from "@/lib/accounting-defaults";
import { Link } from "react-router-dom";
import { Info, Paperclip, Search, X } from "lucide-react";
import { ItemSearchCombobox } from "@/pages/inventory/manage-stocks/components/item-search-combobox";
import { filterItemsByQuery } from "@/lib/filter-items";
import { purchaseLineItemName } from "@/lib/purchase-line-item";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import { PageHeader } from "@/components/PageHeader";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { format } from "date-fns";
import type { Warehouse } from "@/types/inventory";
import type { PurchaseRequisitionUrgency } from "@/types/purchase";

type Props = {
  onCancel: () => void;
  onCreated?: () => void;
  onSaved?: () => void;
  requisitionId?: string;
};

function toDateInputValue(value?: string) {
  if (!value) return "";
  return value.length >= 10 ? value.slice(0, 10) : value;
}

function mapUrgencyFromApi(urgency?: string): PurchaseRequisitionUrgency {
  const u = (urgency || "NORMAL").toLowerCase();
  if (u === "urgent") return "urgent";
  if (u === "critical") return "critical";
  return "normal";
}

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

function extractDepartmentId(payload: any): string {
  const direct = payload?.departmentId;
  const nested = payload?.data?.departmentId;
  const employeeNested = payload?.employee?.departmentId;
  const departmentEntityId = payload?.department?.id;
  const value = direct ?? nested ?? employeeNested;
  const normalized = value ?? departmentEntityId;
  return normalized != null && normalized !== "" ? String(normalized) : "";
}

async function resolveRequesterDepartmentId(userId: string): Promise<string> {
  try {
    const userRes = await apiClient.get(`/users/${userId}`);
    const fromUserDetails = extractDepartmentId(userRes?.data);
    if (fromUserDetails) return fromUserDetails;
  } catch {
    // Try additional sources below.
  }

  try {
    const employeesRes = await apiClient.get("/employees");
    const employees = Array.isArray(employeesRes?.data)
      ? employeesRes.data
      : [];
    const employee = employees.find(
      (e: any) => String(e?.userId) === String(userId),
    );
    const fromEmployees = extractDepartmentId(employee);
    if (fromEmployees) return fromEmployees;
  } catch {
    // Final fallback below.
  }

  try {
    const profileRes = await apiClient.get(`/users/${userId}/profile`);
    return extractDepartmentId(profileRes?.data);
  } catch {
    return "";
  }
}

export function CreatePurchaseRequisitionForm({
  onCancel,
  onCreated,
  onSaved,
  requisitionId,
}: Props) {
  const isEditMode = Boolean(requisitionId);
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
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  /** Optional override; empty means use item cost price. */
  const [itemOtherCostInput, setItemOtherCostInput] = useState<string>("");
  const [items, setItems] = useState<ItemResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadSeq, setReloadSeq] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [purchaseDefaultsMissing, setPurchaseDefaultsMissing] = useState(false);

  const requestedByUserId =
    user?.userId != null ? String(user.userId) : undefined;
  const [departmentId, setDepartmentId] = useState<string>("");
  const [debitAccountId, setDebitAccountId] = useState<string>("");
  const [creditAccountId, setCreditAccountId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [requestedDate, setRequestedDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );
  const [requiredDeliveryDate, setRequiredDeliveryDate] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [requisitionDescription, setRequisitionDescription] = useState("");
  const [urgency, setUrgency] = useState<PurchaseRequisitionUrgency>("normal");
  const [deliveryWarehouseId, setDeliveryWarehouseId] = useState("");
  const [justification, setJustification] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [reviewerFeedback, setReviewerFeedback] = useState<string | null>(null);
  const pendingFilesInputRef = useRef<HTMLInputElement>(null);
  const requesterSyncSeqRef = useRef(0);
  const didInitRequesterSyncRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const [it, wh] = await Promise.all([listItems(), listWarehouses()]);
        if (cancelled) return;
        setItems(it);
        setWarehouses(wh.filter((w) => w.status === "active" || !w.status));

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
            if (!isEditMode) {
              if (co.defaultPurchaseDebitAccountId != null) {
                setDebitAccountId(String(co.defaultPurchaseDebitAccountId));
              }
              if (co.defaultPurchaseCreditAccountId != null) {
                setCreditAccountId(String(co.defaultPurchaseCreditAccountId));
              }
            }
          }
        }

        if (isEditMode && requisitionId) {
          const pr = await getPurchaseRequisition(requisitionId);
          if (cancelled) return;
          if (pr.status !== "draft") {
            setLoadError("Only draft requisitions can be edited.");
            return;
          }
          setReviewerFeedback(pr.rejectionReason ?? null);
          setDepartmentId(pr.departmentId ?? "");
          setDebitAccountId(pr.debitAccountId ?? "");
          setCreditAccountId(pr.creditAccountId ?? "");
          setRequestedDate(toDateInputValue(pr.requestedDate));
          setRequiredDeliveryDate(
            toDateInputValue(
              pr.requiredDeliveryDate || pr.requiredDate,
            ),
          );
          setProjectCode(pr.projectCode ?? "");
          setRequisitionDescription(pr.requisitionDescription ?? "");
          setUrgency(mapUrgencyFromApi(pr.urgency));
          setDeliveryWarehouseId(pr.deliveryWarehouseId ?? "");
          setJustification(pr.justification ?? "");
          setRequisitionItems(
            pr.items.map((line, idx) => ({
              ...line,
              id: line.id || `edit-${idx}`,
              requisitionId: pr.id,
              quantity: line.quantity,
              unitPrice: line.estimatedUnitCost ?? line.unitPrice,
            })),
          );
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
  }, [reloadSeq, companyId, isEditMode, requisitionId]);

  useEffect(() => {
    setItemOtherCostInput("");
  }, [selectedItem]);

  const syncDepartmentForRequester = async (
    userId: string,
    selectedUser?: SelectUserOption | null,
  ) => {
    const seq = ++requesterSyncSeqRef.current;
    const selectedUserDepartmentId = extractDepartmentId(selectedUser);
    if (selectedUserDepartmentId) {
      setDepartmentId(selectedUserDepartmentId);
      return;
    }

    const requesterDepartmentId = await resolveRequesterDepartmentId(userId);
    if (seq !== requesterSyncSeqRef.current) return;
    setDepartmentId(requesterDepartmentId);
  };

  useEffect(() => {
    if (didInitRequesterSyncRef.current) return;
    didInitRequesterSyncRef.current = true;
    if (!requestedByUserId) {
      return;
    }
    void syncDepartmentForRequester(requestedByUserId);
  }, [requestedByUserId]);

  const activeItems = useMemo(
    () => items.filter((i) => i.status === "active"),
    [items],
  );

  const itemSearchResults = useMemo(
    () => filterItemsByQuery(activeItems, itemSearchQuery),
    [activeItems, itemSearchQuery],
  );

  const selectedItemRecord = useMemo(
    () =>
      selectedItem
        ? items.find((i) => String(i.id) === selectedItem)
        : undefined,
    [items, selectedItem],
  );

  const handleItemSelectFromSearch = (item: ItemResponseDTO) => {
    if (item.status && item.status !== "active") {
      toast.error("Only active items can be added to a requisition.");
      return;
    }
    setSelectedItem(String(item.id));
    setItemSearchQuery("");
  };

  const addItemToRequisition = () => {
    if (!selectedItem || itemQuantity <= 0) {
      if (!selectedItem) {
        toast.error("Search and select an item before adding a line.");
      }
      return;
    }

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
      itemName: inv.name,
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
    requisitionItems.reduce((sum, item) => sum + (item.estimatedTotal || 0), 0);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    if (!requisitionDescription.trim()) {
      toast.error("Requisition description is required.");
      return;
    }
    if (!requiredDeliveryDate) {
      toast.error("Required delivery date is required.");
      return;
    }
    if (!deliveryWarehouseId) {
      toast.error("Delivery warehouse is required.");
      return;
    }
    if (!justification.trim()) {
      toast.error("Justification is required.");
      return;
    }

    setSubmitLoading(true);

    const urgencyApi: PurchaseRequisitionCreateDTO["urgency"] =
      urgency === "urgent"
        ? "URGENT"
        : urgency === "critical"
          ? "CRITICAL"
          : "NORMAL";

    const payload: PurchaseRequisitionCreateDTO = {
      debitAccountId: Number(debitAccountId),
      creditAccountId: Number(creditAccountId),
      departmentId: departmentId ? Number(departmentId) : undefined,
      requestedByUserId: requestedByUserId
        ? Number(requestedByUserId)
        : undefined,
      requestedDate: requestedDate || undefined,
      requiredDeliveryDate,
      projectCode: projectCode.trim() || undefined,
      requisitionDescription: requisitionDescription.trim(),
      urgency: urgencyApi,
      deliveryWarehouseId: Number(deliveryWarehouseId),
      justification: justification.trim(),
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

    setSubmitError(null);

    const savePromise = isEditMode && requisitionId
      ? updatePurchaseRequisition(requisitionId, payload)
      : createPurchaseRequisition(payload);

    savePromise
      .then(async (saved) => {
        if (pendingFiles.length > 0) {
          try {
            await Promise.all(
              pendingFiles.map((file) =>
                uploadPurchaseRequisitionDocument(saved.id, file),
              ),
            );
          } catch (uploadErr: unknown) {
            const u = uploadErr as {
              response?: { data?: { message?: string } };
              message?: string;
            };
            toast.warning(
              u?.response?.data?.message ||
                u?.message ||
                "Requisition saved but some documents failed to upload.",
            );
          }
        }
        toast.success(
          isEditMode
            ? `Purchase requisition ${saved.requisitionNo} updated.`
            : `Purchase requisition ${saved.requisitionNo} created successfully.`,
        );
        if (isEditMode) {
          onSaved?.();
        } else {
          onCreated?.();
          navigate(`/inventory/purchase/requisitions/${saved.id}`, {
            replace: true,
          });
        }
      })
      .catch((error: unknown) => {
        console.error("Error creating purchase requisition:", error);
        const msg = getApiErrorMessage(
          error,
          isEditMode
            ? "Failed to update purchase requisition."
            : "Failed to create purchase requisition.",
        );
        setSubmitError(msg);
        toast.error(msg);
      })
      .finally(() => setSubmitLoading(false));
  };

  const total = calculateTotal();

  useEffect(() => {
    setSubmitError(null);
  }, [deliveryWarehouseId, requisitionItems]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        variant="darkGreen"
        title={
          isEditMode ? "Edit purchase requisition" : "Create purchase requisition"
        }
        description={
          isEditMode
            ? "Update the requisition and submit again when ready."
            : "Identify the required items and create a purchase requestion."
        }
        backHref={
          isEditMode && requisitionId
            ? `/inventory/purchase/requisitions/${requisitionId}`
            : "/inventory/purchase"
        }
        actions={
          <Button
            type="button"
            size="lg"
            variant="secondary"
            className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
            onClick={onCancel}
          >
            Cancel
          </Button>
        }
      />

      {submitError && !loading && !loadError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {submitError}
        </div>
      )}

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
          {reviewerFeedback && (
            <Card className="border-amber-200 bg-amber-50/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-amber-900">
                  Reviewer feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{reviewerFeedback}</p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Requisition details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Supplier is assigned on the purchase order after this requisition
                is approved. GL accounts use company purchase defaults (Global
                Settings → Default Accounts).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requestedDate">Requested date</Label>
                  <Input
                    id="requestedDate"
                    type="date"
                    value={requestedDate}
                    onChange={(e) => setRequestedDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requiredDeliveryDate">
                    Required delivery date
                  </Label>
                  <Input
                    id="requiredDeliveryDate"
                    type="date"
                    value={requiredDeliveryDate}
                    onChange={(e) => setRequiredDeliveryDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectCode">Project code (optional)</Label>
                  <Input
                    id="projectCode"
                    placeholder="e.g. PRJ-2026-001"
                    value={projectCode}
                    onChange={(e) => setProjectCode(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency</Label>
                  <Select
                    value={urgency}
                    onValueChange={(v) =>
                      setUrgency(v as PurchaseRequisitionUrgency)
                    }
                  >
                    <SelectTrigger id="urgency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryWarehouse">Delivery location</Label>
                  <Select
                    value={deliveryWarehouseId}
                    onValueChange={setDeliveryWarehouseId}
                  >
                    <SelectTrigger id="deliveryWarehouse">
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((wh) => (
                        <SelectItem key={wh.id} value={String(wh.id)}>
                          {wh.name}
                          {wh.code ? ` (${wh.code})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="requisitionDescription">
                    Requisition description
                  </Label>
                  <Textarea
                    id="requisitionDescription"
                    placeholder="Brief summary of what is being requested"
                    value={requisitionDescription}
                    onChange={(e) => setRequisitionDescription(e.target.value)}
                    required
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="justification">Justification</Label>
                  <Textarea
                    id="justification"
                    placeholder="Business reason for this purchase"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    required
                    className="min-h-[80px]"
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
              <div className="rounded-lg border border-dashed bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  Search items
                </div>
                <p className="text-xs text-muted-foreground -mt-1">
                  Find by name, SKU, or barcode, then set quantity and add the
                  line.
                </p>
                <ItemSearchCombobox
                  label=""
                  query={itemSearchQuery}
                  onQueryChange={setItemSearchQuery}
                  results={
                    itemSearchQuery.trim().length > 0 ? itemSearchResults : []
                  }
                  onSelect={handleItemSelectFromSearch}
                />
                {itemSearchQuery.trim().length > 0 &&
                  itemSearchResults.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No active items match your search.
                    </p>
                  )}
                {selectedItemRecord && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                    <span>
                      Selected:{" "}
                      <span className="font-medium">
                        {selectedItemRecord.name}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        · SKU {selectedItemRecord.sku}
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-muted-foreground"
                      onClick={() => setSelectedItem("")}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <CurrencyAmount
                    amount={Number(selectedItemRecord?.costPrice ?? 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estimated cost</Label>
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
                        <th className="p-2 text-right min-w-[7rem]">
                          Est. total
                        </th>
                        <th className="p-2 text-left min-w-[140px]">
                          Line notes
                        </th>
                        <th className="p-2 text-left w-24" />
                      </tr>
                    </thead>
                    <tbody>
                      {requisitionItems.map((row) => (
                        <tr key={row.id} className="border-t">
                          <td className="p-2 align-middle">
                            {purchaseLineItemName(row)}
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
                            <CurrencyAmount amount={row.actualItemPrice ?? 0} />
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
                                  v === "" ? undefined : parseFloat(v);
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
                            <CurrencyAmount
                              amount={
                                row.estimatedUnitCost ?? row.unitPrice ?? 0
                              }
                            />
                          </td>
                          <td className="p-2 text-right font-medium align-middle tabular-nums">
                            <CurrencyAmount amount={row.estimatedTotal ?? 0} />
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

          <Card>
            <CardHeader>
              <CardTitle>Supporting documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Optional quotes, specifications, or approvals (PDF, Word, or
                images, max 15 MB each).
              </p>
              <input
                ref={pendingFilesInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const picked = e.target.files
                    ? Array.from(e.target.files)
                    : [];
                  if (picked.length) {
                    setPendingFiles((prev) => [...prev, ...picked]);
                  }
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => pendingFilesInputRef.current?.click()}
              >
                <Paperclip className="mr-2 h-4 w-4" />
                Add files
              </Button>
              {pendingFiles.length > 0 && (
                <ul className="space-y-2">
                  {pendingFiles.map((file, idx) => (
                    <li
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setPendingFiles((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
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
                  <span>
                    <CurrencyAmount amount={total} />
                  </span>
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
              {submitLoading
                ? isEditMode
                  ? "Saving…"
                  : "Creating…"
                : isEditMode
                  ? "Save changes"
                  : "Create requisition"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
