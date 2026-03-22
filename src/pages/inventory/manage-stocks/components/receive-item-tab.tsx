import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { purchaseOrders } from "@/lib/purchase-data";
import {
  RECEIVE_ITEM_SCHEMA,
  type ReceiveItemFormData,
} from "@/schema/inventory";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { receiveItemStock } from "@/service/inventoryService";
import type { Warehouse } from "@/types/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import CreateItemForm from "../../item-form";
import { filterItemsByQuery } from "../use-manage-stocks";
import { ItemSearchCombobox } from "./item-search-combobox";

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

  const [selectedItem, setSelectedItem] = useState<ItemResponseDTO | null>(
    null,
  );
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [showCreateItemDialog, setShowCreateItemDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const selectedWarehouseId = watch("warehouseId");

  const searchResults = useMemo(
    () => filterItemsByQuery(items, itemSearchQuery),
    [items, itemSearchQuery],
  );

  const stockRowForSelection = useMemo(() => {
    if (!selectedItem || !selectedWarehouseId) return null;
    return items.find(
      (i) =>
        i.id === selectedItem.id &&
        String(i.warehouse_id) === selectedWarehouseId,
    );
  }, [items, selectedItem, selectedWarehouseId]);

  const quantityOnHand = stockRowForSelection?.quantity ?? null;

  const handleItemSelect = (item: ItemResponseDTO) => {
    setSelectedItem(item);
    setValue("itemId", item.id.toString());
    setValue("warehouseId", String(item.warehouse_id), {
      shouldValidate: true,
    });
    setItemSearchQuery(item.name);
  };

  const onReceiveItem = async (data: ReceiveItemFormData) => {
    setSubmitting(true);
    try {
      await receiveItemStock(data.itemId, {
        quantityReceived: data.quantityReceived,
        receivedDate: data.receivedDate,
        batchNo: data.batchNo,
        serialNo: data.serialNo,
        referenceNo: data.referenceNo,
        warehouseId: Number(data.warehouseId),
        costPrice: data.costPrice,
        unitPrice: data.unitPrice,
      });
      toast.success("Stock received");
      await onStockUpdated();
      reset({
        receivedDate: format(new Date(), "yyyy-MM-dd"),
        quantityReceived: 0,
        itemId: "",
        warehouseId: "",
      });
      setSelectedItem(null);
      setItemSearchQuery("");
    } catch (e: unknown) {
      toast.error(getRequestErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 mt-6">
      <form onSubmit={handleSubmit(onReceiveItem)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-500" />
              Receive Item
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                results={
                  itemSearchQuery.length > 0 ? searchResults : []
                }
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

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Batch No.
                  </label>
                  <Input placeholder="Batch number" {...register("batchNo")} />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Serial No.
                  </label>
                  <Input
                    placeholder="Serial number"
                    {...register("serialNo")}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Reference No.
                  </label>
                  <Select
                    value={watch("referenceNo") || ""}
                    onValueChange={(value) => setValue("referenceNo", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select PO number" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchaseOrders
                        .filter(
                          (po) =>
                            po.status === "approved" || po.status === "ordered",
                        )
                        .map((po) => (
                          <SelectItem key={po.id} value={po.orderNo}>
                            {po.orderNo}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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
                    Unit: {selectedItem.unitMeasure}
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
                </div>

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
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setSelectedItem(null);
                  setItemSearchQuery("");
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={submitting}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Item</DialogTitle>
            <DialogDescription>
              Add a new inventory item with all required details.
            </DialogDescription>
          </DialogHeader>
          <CreateItemForm
            onSuccess={(newItem) => {
              handleItemSelect(newItem);
              setShowCreateItemDialog(false);
              setItemSearchQuery("");
            }}
            onCancel={() => setShowCreateItemDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
