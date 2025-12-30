import { useState, useCallback, useEffect } from "react";
import { useState, useCallback, useEffect } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import { StyledTabsTrigger } from "@/components/styled-tabs-trigger";
import {
  createPicklistColumns,
  createDispatchColumns,
  createPicklistColumns,
  createDispatchColumns,
} from "@/lib/columns/sales-columns";
import { Package, Truck, Plus, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PICKLIST_SCHEMA,
  DISPATCH_SCHEMA,
  type PicklistFormData,
  type DispatchFormData,
} from "@/schema/sales";
import { Link } from "react-router-dom";
import type { Dispatch, Picklist, SalesOrder } from "@/types/sales";
import { listItems, listWarehouses } from "@/service/inventoryService";
import {
  attachOrderAndItems,
  createShipmentFromPicklist,
  generatePicklistFromSalesOrder,
  listPicklists,
  listSalesOrders,
  listShipmentsAsDispatches,
  markPicklistPicked,
  cancelPicklist,
  dispatchShipment,
  markShipmentInTransit,
  markShipmentDelivered,
  cancelShipment,
} from "@/service/salesFlowService";
import { toast } from "sonner";
import { useMemo } from "react";
import type { Warehouse } from "@/types/inventory";

export default function PicklistDispatchPage() {
  const [activeTab, setActiveTab] = useState("picklists");
  const [showCreatePicklist, setShowCreatePicklist] = useState(false);
  const [showCreateDispatch, setShowCreateDispatch] = useState(false);
  const [picklists, setPicklists] = useState<Picklist[]>([]);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [orders, pls, shps, items] = await Promise.all([
        listSalesOrders(),
        listPicklists(),
        listShipmentsAsDispatches(),
        listItems(),
      ]);
      const { picklistsEnriched, dispatchesEnriched } = attachOrderAndItems(
        orders,
        pls,
        shps,
        items
      );
      setSalesOrders(orders);
      setPicklists(picklistsEnriched);
      setDispatches(dispatchesEnriched);
    } catch (e: any) {
      const errorMessage =
        e?.response?.data?.message || e?.message || "Failed to load data";
      setLoadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Picklist handlers
  const handleMarkPicklistPicked = useCallback(async (id: string) => {
    try {
      await markPicklistPicked(id);
      toast.success("Picklist marked as picked");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to mark picklist as picked");
    }
  }, []);

  const handleCancelPicklist = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to cancel this picklist?")) return;
    try {
      await cancelPicklist(id);
      toast.success("Picklist cancelled");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to cancel picklist");
    }
  }, []);

  const handleCreateDispatchFromPicklist = useCallback((picklistId: string) => {
    setShowCreateDispatch(true);
    // Store picklistId in state or pass it somehow
    // For now, the form will allow selection
  }, []);

  // Dispatch/Shipment handlers
  const handleDispatchShipment = useCallback(async (id: string) => {
    try {
      await dispatchShipment(id);
      toast.success("Shipment dispatched");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to dispatch shipment");
    }
  }, []);

  const handleMarkShipmentInTransit = useCallback(async (id: string) => {
    try {
      await markShipmentInTransit(id);
      toast.success("Shipment marked as in transit");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update shipment status");
    }
  }, []);

  const handleMarkShipmentDelivered = useCallback(async (id: string) => {
    try {
      await markShipmentDelivered(id);
      toast.success("Shipment marked as delivered");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to mark shipment as delivered");
    }
  }, []);

  const handleCancelShipment = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to cancel this shipment?")) return;
    try {
      await cancelShipment(id);
      toast.success("Shipment cancelled");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to cancel shipment");
    }
  }, []);

  const picklistColumns = useMemo(
    () =>
      createPicklistColumns(
        handleMarkPicklistPicked,
        handleCancelPicklist,
        handleCreateDispatchFromPicklist
      ),
    [
      handleMarkPicklistPicked,
      handleCancelPicklist,
      handleCreateDispatchFromPicklist,
    ]
  );

  const dispatchColumns = useMemo(
    () =>
      createDispatchColumns(
        handleDispatchShipment,
        handleMarkShipmentInTransit,
        handleMarkShipmentDelivered,
        handleCancelShipment
      ),
    [
      handleDispatchShipment,
      handleMarkShipmentInTransit,
      handleMarkShipmentDelivered,
      handleCancelShipment,
    ]
  );

  if (showCreatePicklist) {
    return (
      <CreatePicklistForm
        salesOrders={salesOrders}
        onCancel={() => setShowCreatePicklist(false)}
        onCreated={async () => {
          // Refresh all data after creating picklist
          await loadData();
        }}
      />
    );
  }

  if (showCreateDispatch) {
    return (
      <CreateDispatchForm
        picklists={picklists}
        onCancel={() => setShowCreateDispatch(false)}
        onCreated={async () => {
          // Refresh all data after creating dispatch
          await loadData();
        }}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/inventory/sales">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Picklist & Dispatch</h1>
            <p className="text-muted-foreground">
              Generate picklists and plan dispatches
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeTab === "picklists" && (
            <Button onClick={() => setShowCreatePicklist(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Generate Picklist
            </Button>
          )}
          {activeTab === "dispatches" && (
            <Button onClick={() => setShowCreateDispatch(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Dispatch
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <StyledTabsTrigger value="picklists">
            <Package className="mr-2 h-4 w-4" />
            Picklists
          </StyledTabsTrigger>
          <StyledTabsTrigger value="dispatches">
            <Truck className="mr-2 h-4 w-4" />
            Dispatches
          </StyledTabsTrigger>
        </TabsList>

        <TabsContent value="picklists">
          <Card>
            <CardHeader>
              <CardTitle>All Picklists</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-muted-foreground">
                  Loading picklists...
                </div>
              ) : loadError ? (
                <div className="py-10 text-center">
                  <div className="text-red-600 mb-3">{loadError}</div>
                  <Button variant="outline" onClick={loadData}>
                    Retry
                  </Button>
                </div>
              ) : picklists.length === 0 ? (
                <div className="py-10 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">No picklists found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate a picklist from a confirmed sales order to get
                    started.
                  </p>
                  <Button onClick={() => setShowCreatePicklist(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Picklist
                  </Button>
                </div>
              ) : (
                <DataTable columns={picklistColumns} data={picklists} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispatches">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Shipments</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track shipments from warehouse to customer. Create shipments
                    from picked picklists.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-muted-foreground">
                  Loading shipments...
                </div>
              ) : loadError ? (
                <div className="py-10 text-center">
                  <div className="text-red-600 mb-3">{loadError}</div>
                  <Button variant="outline" onClick={loadData}>
                    Retry
                  </Button>
                </div>
              ) : dispatches.length === 0 ? (
                <div className="py-10 text-center">
                  <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">No shipments found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a shipment from a picked picklist to get started.
                  </p>
                  <Button onClick={() => setShowCreateDispatch(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Shipment
                  </Button>
                </div>
              ) : (
                <DataTable columns={dispatchColumns} data={dispatches} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreatePicklistForm({
  onCancel,
  salesOrders,
  onCreated,
}: {
  onCancel: () => void;
  salesOrders: SalesOrder[];
  onCreated: () => Promise<void>;
}) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PicklistFormData>({
    resolver: zodResolver(PICKLIST_SCHEMA),
  });

  const [loadingWarehouses, setLoadingWarehouses] = useState(true);

  useEffect(() => {
    setLoadingWarehouses(true);
    listWarehouses()
      .then((whs) => {
        setWarehouses(whs);
        setLoadingWarehouses(false);
      })
      .catch((err) => {
        console.error("Failed to load warehouses:", err);
        toast.error("Failed to load warehouses. Please refresh the page.");
        setLoadingWarehouses(false);
      });
  }, []);

  const selectedOrder = salesOrders.find((o) => o.id === selectedOrderId);

  // Auto-populate warehouseId from selected order items
  useEffect(() => {
    if (selectedOrder && selectedOrder.items.length > 0) {
      // Get warehouseId from order items
      // Try to find warehouse from items - take first non-empty warehouseId
      const itemWithWarehouse = selectedOrder.items.find(
        (item) => item.warehouseId
      );
      if (itemWithWarehouse?.warehouseId) {
        setValue("warehouseId", itemWithWarehouse.warehouseId);
      } else {
        // If no warehouse in items, try to use first warehouse from list
        // This handles cases where backend will determine warehouse
        if (warehouses.length > 0) {
          setValue("warehouseId", warehouses[0].id);
        }
      }
    } else if (!selectedOrderId) {
      // Clear warehouse when no order is selected
      setValue("warehouseId", "");
    }
  }, [selectedOrder, selectedOrderId, warehouses, setValue]);

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data: PicklistFormData) => {
    if (submitting) return;
    try {
      setSubmitting(true);
      console.log("Creating picklist:", data);
      await generatePicklistFromSalesOrder(selectedOrderId, {
        warehouseId: data.warehouseId || undefined,
      });
      toast.success("Picklist generated successfully!");
      await onCreated(); // Refresh data
      onCancel();
    } catch (err: any) {
      console.error("Failed to generate picklist:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to generate picklist. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Generate Picklist</h1>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Picklist Information</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Select a confirmed sales order to generate a picklist. The
              warehouse will be auto-selected from the order items if available.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
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
                    <SelectValue placeholder="Select sales order" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesOrders
                      .filter(
                        (o) => o.status === "confirmed" || o.status === "draft"
                      )
                      .map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.orderNo} - {order.customer?.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.orderId && (
                  <p className="text-sm text-red-500">
                    {errors.orderId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouseId">Warehouse (Optional)</Label>
                <Select
                  value={watch("warehouseId") || ""}
                  onValueChange={(value) => {
                    setValue("warehouseId", value, { shouldValidate: true });
                  }}
                  disabled={!selectedOrderId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingWarehouses ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        Loading warehouses...
                      </div>
                    ) : warehouses.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No warehouses available
                      </div>
                    ) : warehouses.filter((wh) => wh.status === "active")
                        .length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No active warehouses available
                      </div>
                    ) : (
                      warehouses
                        .filter((wh) => wh.status === "active")
                        .map((wh) => (
                          <SelectItem key={wh.id} value={wh.id}>
                            {wh.name} {wh.location ? `- ${wh.location}` : ""}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
                {errors.warehouseId && (
                  <p className="text-sm text-red-500">
                    {errors.warehouseId.message}
                  </p>
                )}
                {selectedOrder && selectedOrder.items.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const itemWarehouses = selectedOrder.items
                        .filter((item) => item.warehouseId)
                        .map((item) => {
                          const wh = warehouses.find(
                            (w) => w.id === item.warehouseId
                          );
                          return wh?.name || item.warehouseId;
                        })
                        .filter((v, i, arr) => arr.indexOf(v) === i); // unique

                      if (itemWarehouses.length === 0) {
                        return "No warehouse specified in order items. Please select a warehouse.";
                      } else if (itemWarehouses.length === 1) {
                        return `Warehouse auto-selected from order: ${itemWarehouses[0]}`;
                      } else {
                        return `Order items span multiple warehouses: ${itemWarehouses.join(
                          ", "
                        )}`;
                      }
                    })()}
                  </p>
                )}
              </div>
              {/* Backend picklist generation API does not take assignee field */}
              <input type="hidden" {...register("assignedTo")} />
            </div>

            {selectedOrder && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Order Items:</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.item?.name} - Qty: {item.quantity}
                      </span>
                      <span>
                        Warehouse:{" "}
                        {item.warehouseId
                          ? warehouses.find((w) => w.id === item.warehouseId)
                              ?.name
                          : "Not assigned"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!selectedOrderId || submitting}>
            {submitting ? "Generating..." : "Generate Picklist"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function CreateDispatchForm({
  onCancel,
  picklists,
  onCreated,
}: {
  onCancel: () => void;
  picklists: Picklist[];
  onCreated: () => Promise<void>;
}) {
  const [selectedPicklistId, setSelectedPicklistId] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<DispatchFormData>({
    resolver: zodResolver(DISPATCH_SCHEMA),
  });

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data: DispatchFormData) => {
    if (submitting) return;
    try {
      setSubmitting(true);
      console.log("Creating dispatch:", data);
      await createShipmentFromPicklist(selectedPicklistId, {
        carrierName: data.notes || data.driverName || "",
        trackingNumber: data.trackingNumber || "",
        vehicleNumber: data.vehicleNumber || undefined,
        driverName: data.driverName || undefined,
        driverPhone: data.driverPhone || undefined,
        estimatedDeliveryDate: data.estimatedDeliveryDate || undefined,
        deliveryAddress: data.deliveryAddress || undefined,
        notes: data.notes || undefined,
      });
      toast.success("Shipment created successfully!");
      await onCreated(); // Refresh data
      onCancel();
    } catch (err: any) {
      console.error("Failed to create shipment:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create shipment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Create Dispatch</h1>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dispatch Information</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Create a shipment from a picked picklist. Fill in delivery details
              and tracking information.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="picklistId">Picklist *</Label>
                <Select
                  value={selectedPicklistId}
                  onValueChange={(value) => {
                    setSelectedPicklistId(value);
                    setValue("picklistId", value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select picklist" />
                  </SelectTrigger>
                  <SelectContent>
                    {picklists.filter((pl) => pl.status === "picked").length ===
                    0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No picked picklists available. Please mark a picklist as
                        "picked" first.
                      </div>
                    ) : (
                      picklists
                        .filter((pl) => pl.status === "picked")
                        .map((pl) => (
                          <SelectItem key={pl.id} value={pl.id}>
                            {pl.picklistNo}{" "}
                            {pl.order?.orderNo ? `- ${pl.order.orderNo}` : ""}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
                {errors.picklistId && (
                  <p className="text-sm text-red-500">
                    {errors.picklistId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                <Input
                  id="vehicleNumber"
                  placeholder="TN-01-AB-1234"
                  {...register("vehicleNumber")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverName">Driver Name</Label>
                <Input
                  id="driverName"
                  placeholder="Enter driver name"
                  {...register("driverName")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverPhone">Driver Phone</Label>
                <Input
                  id="driverPhone"
                  placeholder="+91 98765 43210"
                  {...register("driverPhone")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedDeliveryDate">
                  Estimated Delivery Date
                </Label>
                <Input
                  id="estimatedDeliveryDate"
                  type="date"
                  {...register("estimatedDeliveryDate")}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                <Input
                  id="deliveryAddress"
                  placeholder="Enter delivery address"
                  {...register("deliveryAddress")}
                />
                {errors.deliveryAddress && (
                  <p className="text-sm text-red-500">
                    {errors.deliveryAddress.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input
                  id="trackingNumber"
                  placeholder="Enter tracking number"
                  {...register("trackingNumber")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Carrier Name</Label>
                <Input
                  id="notes"
                  placeholder="Carrier name (e.g., DHL)"
                  {...register("notes")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!selectedPicklistId || submitting}>
            {submitting ? "Creating..." : "Create Dispatch"}
          </Button>
        </div>
      </form>
    </div>
  );
}
