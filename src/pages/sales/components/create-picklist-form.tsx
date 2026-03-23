/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { ArrowLeft, Package } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PICKLIST_SCHEMA, type PicklistFormData } from "@/schema/sales";
import { listWarehouses } from "@/service/inventoryService";
import { generatePicklistFromSalesOrder } from "@/service/salesFlowService";
import type { SalesOrder } from "@/types/sales";
import type { Warehouse } from "@/types/inventory";

type Props = {
  onCancel: () => void;
  salesOrders: SalesOrder[];
  onCreated: () => Promise<void>;
};

export function CreatePicklistForm({ onCancel, salesOrders, onCreated }: Props) {
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PicklistFormData>({
    resolver: zodResolver(PICKLIST_SCHEMA),
  });

  useEffect(() => {
    setLoadingWarehouses(true);
    listWarehouses()
      .then((whs) => setWarehouses(whs))
      .catch(() => toast.error("Failed to load warehouses."))
      .finally(() => setLoadingWarehouses(false));
  }, []);

  const selectedOrder = salesOrders.find((o) => o.id === selectedOrderId);

  useEffect(() => {
    if (selectedOrder && selectedOrder.items.length > 0) {
      const itemWithWarehouse = selectedOrder.items.find((item) => item.warehouseId);
      if (itemWithWarehouse?.warehouseId) {
        setValue("warehouseId", itemWithWarehouse.warehouseId);
      }
    }
  }, [selectedOrder, setValue]);

  const onSubmit = async (data: PicklistFormData) => {
    if (submitting) return;
    try {
      setSubmitting(true);
      await generatePicklistFromSalesOrder(selectedOrderId, {
        warehouseId: data.warehouseId || undefined,
      });
      toast.success("Picklist generated successfully!");
      await onCreated();
      onCancel();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to generate picklist.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Generate Picklist</h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderId">Sales Order *</Label>
                <Select
                  value={selectedOrderId}
                  onValueChange={(value) => {
                    setSelectedOrderId(value);
                    setValue("orderId", value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Sales Order" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesOrders
                      .filter((o) => o.status === "confirmed")
                      .map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.orderNo} - {order.customerName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.orderId && (
                  <p className="text-sm text-red-500">{errors.orderId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouseId">Warehouse (Optional)</Label>
                <Select
                  value={watch("warehouseId")?.toString()}
                  onValueChange={(value) =>
                    setValue("warehouseId", Number(value), { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-select from items" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingWarehouses ? (
                      <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                    ) : (
                      warehouses
                        .filter((wh) => wh.status === "active")
                        .map((wh) => (
                          <SelectItem key={wh.id} value={wh.id}>
                            {wh.name}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Card>
              <CardContent className="p-0">
                {!selectedOrder ? (
                  <div className="py-12 text-center">
                    <Package className="h-16 w-16 mx-auto mb-4 text-amber-500" />
                    <p className="text-muted-foreground">Select a sales order to view items</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto p-4">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between py-2 border-b">
                        <span>{item.itemName || "Unknown Item"}</span>
                        <span>{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <input type="hidden" {...register("assignedTo")} />
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedOrderId || submitting} className="flex-1">
                {submitting ? "Generating..." : "Generate Picklist"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
