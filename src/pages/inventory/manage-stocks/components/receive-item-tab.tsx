import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RECEIVE_ITEM_SCHEMA,
  type ReceiveItemFormData,
} from "@/schema/inventory";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { receiveItemStock } from "@/service/inventoryService";
import {
  listInspectedReceiptsAwaitingStock,
  postGoodsReceiptItemsToStock,
} from "@/service/purchaseFlowService";
import type { GoodsReceipt, GoodsReceiptItem } from "@/types/purchase";
import type { Warehouse } from "@/types/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { PackageCheck, Plus, X, PackageSearch, Boxes } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CreateItemForm from "../../item-form";
import { filterItemsByQuery } from "../use-manage-stocks";
import { ItemSearchCombobox } from "./item-search-combobox";

function findInventoryItemForItemId(
  items: ItemResponseDTO[],
  itemId: number,
  preferredWarehouseId?: string,
): ItemResponseDTO | null {
  const matches = items.filter((i) => i.id === itemId);
  if (matches.length === 0) return null;
  if (preferredWarehouseId) {
    const warehouseMatch = matches.find(
      (i) => String(i.warehouse_id) === preferredWarehouseId,
    );
    if (warehouseMatch) return warehouseMatch;
  }
  return matches[0];
}

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
  return "Failed to receive stock";
}

/** Lines on an awaiting-stock receipt that still need a warehouse/batch posting. */
function awaitingStockLines(receipt: GoodsReceipt): GoodsReceiptItem[] {
  return receipt.items.filter(
    (line) => (line.acceptedQuantity ?? 0) > 0 && !line.stockedAt,
  );
}

type ReceiveMode = "po" | "freeform";

type ReceiveItemTabProps = {
  items: ItemResponseDTO[];
  warehouses: Warehouse[];
  onStockUpdated: () => Promise<void>;
};

export function ReceiveItemTab({
  items,
  warehouses,
  onStockUpdated,
}: ReceiveItemTabProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ReceiveItemFormData>({
    resolver: zodResolver(RECEIVE_ITEM_SCHEMA),
    defaultValues: {
      receivedDate: format(new Date(), "yyyy-MM-dd"),
      quantityReceived: 0,
    },
  });

  const [mode, setMode] = useState<ReceiveMode>("po");
  const [selectedItem, setSelectedItem] = useState<ItemResponseDTO | null>(
    null,
  );
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [showCreateItemDialog, setShowCreateItemDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [awaitingStockReceipts, setAwaitingStockReceipts] = useState<
    GoodsReceipt[]
  >([]);
  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(
    null,
  );
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const selectedWarehouseId = watch("warehouseId");

  const refreshAwaitingStock = () => {
    setLoadingReceipts(true);
    listInspectedReceiptsAwaitingStock()
      .then((data) => setAwaitingStockReceipts(data))
      .catch(() => setAwaitingStockReceipts([]))
      .finally(() => setLoadingReceipts(false));
  };

  useEffect(() => {
    refreshAwaitingStock();
  }, []);

  const searchResults = useMemo(() => {
    const query = itemSearchQuery.trim();
    if (!query) return [];
    const filtered = filterItemsByQuery(items, itemSearchQuery);
    if (
      selectedItem &&
      selectedItem.name.trim().toLowerCase() === query.toLowerCase()
    ) {
      return [];
    }
    return filtered;
  }, [items, itemSearchQuery, selectedItem]);

  const stockRowForSelection = useMemo(() => {
    if (!selectedItem || !selectedWarehouseId) return null;
    return items.find(
      (i) =>
        i.id === selectedItem.id &&
        String(i.warehouse_id) === selectedWarehouseId,
    );
  }, [items, selectedItem, selectedWarehouseId]);

  const quantityOnHand = stockRowForSelection?.quantity ?? null;

  const selectedReceiptLines = useMemo(
    () => (selectedReceipt ? awaitingStockLines(selectedReceipt) : []),
    [selectedReceipt],
  );

  const applyGrLineToForm = (line: GoodsReceiptItem) => {
    const inventoryItem = findInventoryItemForItemId(
      items,
      line.itemId,
      selectedWarehouseId,
    );
    if (!inventoryItem) {
      toast.error(
        `Item "${line.item?.name ?? line.itemId}" was not found in inventory`,
      );
      return;
    }

    setSelectedItem(inventoryItem);
    setValue("itemId", inventoryItem.id.toString(), { shouldValidate: true });
    setValue(
      "warehouseId",
      inventoryItem.warehouse_id != null ? String(inventoryItem.warehouse_id) : "",
      { shouldValidate: true },
    );
    setValue("quantityReceived", line.acceptedQuantity ?? 0, {
      shouldValidate: true,
    });

    const costPrice =
      line.unitCost ?? line.orderItem?.unitCost ?? inventoryItem.costPrice;
    if (costPrice != null) {
      setValue("costPrice", Number(costPrice), { shouldValidate: true });
    }
    setValue("batchNo", line.batchNo ?? "");
    setValue("serialNo", line.lotNo ?? "");

    setItemSearchQuery(inventoryItem.name);
  };

  const handleReceiptChange = (receiptId: string) => {
    const receipt = awaitingStockReceipts.find((r) => r.id === receiptId) ?? null;
    setSelectedReceipt(receipt);
    setSelectedLineId("");
    setSelectedItem(null);
    setItemSearchQuery("");
    if (!receipt) return;
    const lines = awaitingStockLines(receipt);
    if (lines.length > 0) {
      setSelectedLineId(lines[0].id);
      applyGrLineToForm(lines[0]);
    }
  };

  const handleLineChange = (lineId: string) => {
    setSelectedLineId(lineId);
    const line = selectedReceiptLines.find((l) => l.id === lineId);
    if (line) applyGrLineToForm(line);
  };

  const handleItemSelect = (item: ItemResponseDTO) => {
    setSelectedItem(item);
    setValue("itemId", item.id.toString());
    setValue("warehouseId", String(item.warehouse_id), {
      shouldValidate: true,
    });
    setItemSearchQuery("");
  };

  const resetForm = () => {
    reset({
      receivedDate: format(new Date(), "yyyy-MM-dd"),
      quantityReceived: 0,
      itemId: "",
      warehouseId: "",
      referenceNo: "",
    });
    setSelectedItem(null);
    setSelectedReceipt(null);
    setSelectedLineId("");
    setItemSearchQuery("");
  };

  const onReceiveItem = async (data: ReceiveItemFormData) => {
    setSubmitting(true);
    try {
      if (mode === "po") {
        if (!selectedReceipt || !selectedLineId) {
          toast.error("Select a confirmed-inspection receipt and line first.");
          return;
        }
        await postGoodsReceiptItemsToStock(selectedReceipt.id, {
          items: [
            {
              goodsReceiptItemId: Number(selectedLineId),
              warehouseId: Number(data.warehouseId),
              batchNo: data.batchNo,
              lotNo: data.serialNo,
              unitCost: data.costPrice,
              expiryDate: data.expiryDate || undefined,
            },
          ],
        });
        toast.success("Stock received");
        refreshAwaitingStock();
      } else {
        await receiveItemStock(data.itemId, {
          quantityReceived: data.quantityReceived,
          receivedDate: data.receivedDate,
          expiryDate: data.expiryDate || undefined,
          batchNo: data.batchNo,
          serialNo: data.serialNo,
          referenceNo: data.referenceNo,
          warehouseId: Number(data.warehouseId),
          costPrice: data.costPrice,
          unitPrice: data.unitPrice,
        });
        toast.success("Stock received");
      }
      await onStockUpdated();
      resetForm();
    } catch (e: unknown) {
      toast.error(getRequestErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="inline-flex rounded-lg border bg-muted p-1">
        <button
          type="button"
          onClick={() => {
            setMode("po");
            resetForm();
          }}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "po"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <PackageSearch className="h-4 w-4" />
          Receive against Purchase Order
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("freeform");
            resetForm();
          }}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "freeform"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Boxes className="h-4 w-4" />
          Receive without reference
        </button>
      </div>

      <form onSubmit={handleSubmit(onReceiveItem)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-500" />
              Receive Item
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "po" ? (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Reference No. (Goods Receipt)
                  </label>
                  <Select
                    value={selectedReceipt?.id || ""}
                    onValueChange={handleReceiptChange}
                    disabled={loadingReceipts}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingReceipts
                            ? "Loading confirmed receipts…"
                            : awaitingStockReceipts.length === 0
                              ? "No confirmed-inspection receipts awaiting stock"
                              : "Select goods receipt"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {awaitingStockReceipts.map((receipt) => (
                        <SelectItem key={receipt.id} value={receipt.id}>
                          {receipt.receiptNo} — {receipt.order?.orderNo ?? receipt.orderId}
                          {receipt.order
                            ? ` — ${receipt.order.supplierName ?? receipt.order.supplier?.name ?? ""}`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Only receipts with confirmed inspection outcomes are listed
                    here, capped at their accepted quantity.
                  </p>
                </div>

                {selectedReceipt && selectedReceiptLines.length > 1 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Receipt Line Item
                    </label>
                    <Select value={selectedLineId} onValueChange={handleLineChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select line item" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedReceiptLines.map((line) => (
                          <SelectItem key={line.id} value={line.id}>
                            {line.item?.name ?? `Item #${line.itemId}`} — Accepted{" "}
                            {line.acceptedQuantity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            ) : (
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Item Code / SKU / Barcode
                  </span>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => setShowCreateItemDialog(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Item
                  </Button>
                </div>
                <ItemSearchCombobox
                  label=""
                  query={itemSearchQuery}
                  onQueryChange={setItemSearchQuery}
                  results={searchResults}
                  onSelect={handleItemSelect}
                  hiddenInputProps={register("itemId")}
                  errorText={errors.itemId?.message}
                />
                {itemSearchQuery.length > 0 && searchResults.length === 0 && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      No items found.{" "}
                      <button
                        type="button"
                        onClick={() => setShowCreateItemDialog(true)}
                        className="font-semibold underline hover:text-blue-900"
                      >
                        Click here to create a new item
                      </button>
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedItem && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Item Description
                  </label>
                  <Input
                    value={selectedItem.description || selectedItem.name}
                    disabled
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Location/ warehouse
                  </label>
                  <Select
                    onValueChange={(value) => {
                      setValue("warehouseId", value, {
                        shouldValidate: true,
                      });
                    }}
                    value={selectedWarehouseId || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((wh) => (
                        <SelectItem key={wh.id} value={wh.id}>
                          {wh.name} - {wh.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.warehouseId && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.warehouseId.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Quantity on Hand
                  </label>
                  <Input
                    value={
                      selectedWarehouseId && selectedItem
                        ? quantityOnHand !== null
                          ? `${quantityOnHand} ${selectedItem.unitMeasure}`
                          : "-"
                        : "-"
                    }
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Product Status
                  </label>
                  <Input
                    value={selectedItem.status}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                {selectedItem.dateReceived && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Last Date Received
                    </label>
                    <Input
                      value={selectedItem.dateReceived}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                )}

                {selectedItem.expiryDate && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Current Sale by Date
                    </label>
                    <Input
                      value={selectedItem.expiryDate}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                )}

                {mode === "freeform" && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Received Date
                    </label>
                    <Input type="date" {...register("receivedDate")} />
                    {errors.receivedDate && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.receivedDate.message}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Sale by Date
                  </label>
                  <Input type="date" {...register("expiryDate")} />
                  <p className="text-sm text-muted-foreground mt-1">
                    Optional — leave blank if there is no sale-by date
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Batch No.
                  </label>
                  <Input placeholder="Batch number" {...register("batchNo")} />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {mode === "po" ? "Lot No." : "Serial No."}
                  </label>
                  <Input
                    placeholder={mode === "po" ? "Lot number" : "Serial number"}
                    {...register("serialNo")}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Quantity Received
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter quantity"
                    disabled={mode === "po"}
                    {...register("quantityReceived", {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.quantityReceived && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.quantityReceived.message}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-2">
                    {mode === "po"
                      ? "Fixed to the accepted quantity from inspection."
                      : `Unit: ${selectedItem.unitMeasure}`}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Cost price
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter cost price"
                    {...register("costPrice", { valueAsNumber: true })}
                  />
                  {errors.costPrice && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.costPrice.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    A different cost creates a new batch layer; same batch and cost add to the existing layer.
                  </p>
                </div>

                {mode === "freeform" && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Unit Price
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter unit price"
                      {...register("unitPrice", { valueAsNumber: true })}
                    />
                    {errors.unitPrice && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.unitPrice.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={
                  submitting || (mode === "po" && !selectedLineId) || !selectedItem
                }
              >
                {submitting ? "Saving…" : "Receive Item"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Dialog
        open={showCreateItemDialog}
        onOpenChange={setShowCreateItemDialog}
      >
        <DialogContent
          className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 sm:max-w-5xl [&>button]:hidden"
          style={{ maxHeight: "92vh", width: "calc(100vw - 32px)" }}
        >
          {/* ── Top bar ── */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20 bg-blue-100 text-blue-600">
                <PackageCheck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                  Create New Item
                </DialogTitle>
                <p className="mt-0.5 text-[12px] text-slate-300">
                  Add a new inventory item with all required details
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateItemDialog(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── Body ── */}
          <div
            className="overflow-y-auto bg-white px-6 py-5"
            style={{ maxHeight: "calc(92vh - 132px)" }}
          >
            <CreateItemForm
              onSuccess={(newItem) => {
                handleItemSelect(newItem);
                setShowCreateItemDialog(false);
                setItemSearchQuery("");
              }}
              onCancel={() => setShowCreateItemDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
