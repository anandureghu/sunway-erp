/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Package } from "lucide-react";
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
import {
  generatePicklistFromSalesOrder,
  getSalesOrderById,
} from "@/service/salesFlowService";
import type { Picklist, SalesOrder } from "@/types/sales";
import type { Warehouse } from "@/types/inventory";
import { SalesPageHeader } from "./sales-page-header";

type Props = {
  onCancel: () => void;
  salesOrders: SalesOrder[];
  picklists: Picklist[];
  initialSalesOrderId?: string;
  onCreated: () => Promise<void>;
};

export function CreatePicklistForm({
  onCancel,
  salesOrders,
  picklists,
  initialSalesOrderId,
  onCreated,
}: Props) {
  const [selectedOrderId, setSelectedOrderId] = useState(initialSalesOrderId || "");
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
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

  useEffect(() => {
    if (!selectedOrderId) {
      setSelectedOrder(null);
      return;
    }

    setLoadingOrder(true);
    getSalesOrderById(selectedOrderId)
      .then((order) => setSelectedOrder(order))
      .catch((err: any) => {
        setSelectedOrder(null);
        toast.error(
          err?.response?.data?.message || err?.message || "Failed to load sales order details.",
        );
      })
      .finally(() => setLoadingOrder(false));
  }, [selectedOrderId]);

  useEffect(() => {
    if (!initialSalesOrderId) return;
    setValue("orderId", initialSalesOrderId, { shouldValidate: true });
  }, [initialSalesOrderId, setValue]);

  useEffect(() => {
    if (selectedOrder && selectedOrder.items.length > 0) {
      const orderWarehouseIds = Array.from(
        new Set(selectedOrder.items.map((item) => item.warehouseId).filter(Boolean)),
      ) as number[];
      if (orderWarehouseIds.length > 0) {
        const currentWarehouseId = watch("warehouseId");
        if (currentWarehouseId && orderWarehouseIds.includes(currentWarehouseId)) {
          return;
        }
        setValue("warehouseId", orderWarehouseIds[0], { shouldValidate: true });
      }
    }
  }, [selectedOrder, setValue, watch]);

  const formatAmount = (value?: number) => {
    const amount = Number(value || 0);
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const orderLineWarehouseIds = selectedOrder
    ? (Array.from(
        new Set(selectedOrder.items.map((item) => item.warehouseId).filter(Boolean)),
      ) as number[])
    : [];

  const preferredWarehouses = warehouses.filter(
    (wh) => wh.status === "active" && orderLineWarehouseIds.includes(Number(wh.id)),
  );
  const otherWarehouses = warehouses.filter(
    (wh) => wh.status === "active" && !orderLineWarehouseIds.includes(Number(wh.id)),
  );

  const onSubmit = async (data: PicklistFormData) => {
    if (submitting) return;
    if (!selectedOrderId) {
      toast.error("Please select a sales order.");
      return;
    }
    if (!selectedOrder || selectedOrder.items.length === 0) {
      toast.error("Selected sales order has no line items.");
      return;
    }
    const existingActivePicklist = picklists.find(
      (pl) =>
        pl.orderId === selectedOrderId && pl.status !== "cancelled",
    );
    if (existingActivePicklist) {
      toast.error(
        `Picklist ${existingActivePicklist.picklistNo} already exists for this order.`,
      );
      return;
    }
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
    <div className="p-4 sm:p-6 space-y-6">
      <SalesPageHeader
        badge="Fulfillment"
        title="Generate Picklist"
        description="Select a paid, confirmed sales order and confirm the warehouse so pick lines can be prepared."
        onBack={onCancel}
      />
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
                      <>
                        {preferredWarehouses.map((wh) => (
                          <SelectItem key={wh.id} value={wh.id}>
                            {wh.name} (From Order)
                          </SelectItem>
                        ))}
                        {otherWarehouses.map((wh) => (
                          <SelectItem key={wh.id} value={wh.id}>
                            {wh.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedOrder && (
              <Card>
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Order Number</p>
                    <p className="font-medium">{selectedOrder.orderNo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Order Date</p>
                    <p className="font-medium">{selectedOrder.orderDate || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Invoice Due Date</p>
                    <p className="font-medium">{selectedOrder.invoiceDueDate || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium">{selectedOrder.customerName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Customer Phone</p>
                    <p className="font-medium">{selectedOrder.customerPhone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Status</p>
                    <p className="font-medium">{selectedOrder.paymentStatus || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Subtotal</p>
                    <p className="font-medium">{formatAmount(selectedOrder.subtotalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tax</p>
                    <p className="font-medium">{formatAmount(selectedOrder.taxAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-semibold">{formatAmount(selectedOrder.total)}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="p-0">
                {!selectedOrder ? (
                  <div className="py-12 text-center">
                    <Package className="h-16 w-16 mx-auto mb-4 text-amber-500" />
                    <p className="text-muted-foreground">Select a sales order to view items</p>
                  </div>
                ) : loadingOrder ? (
                  <div className="py-12 text-center text-muted-foreground">
                    Loading sales order items...
                  </div>
                ) : selectedOrder.items.length === 0 ? (
                  <div className="py-12 text-center text-amber-600">
                    Selected order has no line items.
                  </div>
                ) : (
                  <div className="overflow-x-auto p-4">
                    <div className="grid grid-cols-12 gap-2 py-2 border-b font-medium text-sm text-muted-foreground">
                      <div className="col-span-4">Item</div>
                      <div className="col-span-2 text-right">Qty</div>
                      <div className="col-span-2 text-right">Unit Price</div>
                      <div className="col-span-2">Warehouse</div>
                      <div className="col-span-2 text-right">Line Total</div>
                    </div>
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 py-2 border-b text-sm">
                        <div className="col-span-4">{item.itemName || "Unknown Item"}</div>
                        <div className="col-span-2 text-right">{item.quantity}</div>
                        <div className="col-span-2 text-right">{formatAmount(item.unitPrice)}</div>
                        <div className="col-span-2">{item.warehouseName || "-"}</div>
                        <div className="col-span-2 text-right">{formatAmount(item.total)}</div>
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
              <Button
                type="submit"
                disabled={
                  !selectedOrderId ||
                  submitting ||
                  loadingOrder ||
                  !selectedOrder ||
                  selectedOrder.items.length === 0
                }
                className="flex-1"
              >
                {submitting ? "Generating..." : "Generate Picklist"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
