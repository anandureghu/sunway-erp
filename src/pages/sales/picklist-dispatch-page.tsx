import { useState } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import { StyledTabsTrigger } from "@/components/styled-tabs-trigger";
import {
  PICKLIST_COLUMNS,
  DISPATCH_COLUMNS,
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
import { useEffect } from "react";
import type { Dispatch, Picklist, SalesOrder } from "@/types/sales";
import { listItems, listWarehouses } from "@/service/inventoryService";
import {
  attachOrderAndItems,
  createShipmentFromPicklist,
  generatePicklistFromSalesOrder,
  listPicklists,
  listSalesOrders,
  listShipmentsAsDispatches,
} from "@/service/salesFlowService";
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const [orders, pls, shps, items] = await Promise.all([
          listSalesOrders(),
          listPicklists(),
          listShipmentsAsDispatches(),
          listItems(),
        ]);
        if (cancelled) return;
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
        if (!cancelled) setLoadError(e?.message || "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (showCreatePicklist) {
    return (
      <CreatePicklistForm
        salesOrders={salesOrders}
        onCancel={() => setShowCreatePicklist(false)}
        onCreated={(pl) => setPicklists((prev) => [pl, ...prev])}
      />
    );
  }

  if (showCreateDispatch) {
    return (
      <CreateDispatchForm
        picklists={picklists}
        onCancel={() => setShowCreateDispatch(false)}
        onCreated={(d) => setDispatches((prev) => [d, ...prev])}
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
                  Loading...
                </div>
              ) : loadError ? (
                <div className="py-10 text-center text-red-600">{loadError}</div>
              ) : (
                <DataTable columns={PICKLIST_COLUMNS} data={picklists} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispatches">
          <Card>
            <CardHeader>
              <CardTitle>All Dispatches</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-muted-foreground">
                  Loading...
                </div>
              ) : loadError ? (
                <div className="py-10 text-center text-red-600">{loadError}</div>
              ) : (
                <DataTable columns={DISPATCH_COLUMNS} data={dispatches} />
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
  onCreated: (pl: Picklist) => void;
}) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PicklistFormData>({
    resolver: zodResolver(PICKLIST_SCHEMA),
  });

  useEffect(() => {
    listWarehouses()
      .then(setWarehouses)
      .catch((err) => console.error("Failed to load warehouses:", err));
  }, []);

  const selectedOrder = salesOrders.find((o) => o.id === selectedOrderId);

  const onSubmit = (data: PicklistFormData) => {
    console.log("Creating picklist:", data);
    generatePicklistFromSalesOrder(selectedOrderId)
      .then((pl) => {
        onCreated(pl);
        alert("Picklist generated successfully!");
        onCancel();
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to generate picklist.");
      });
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
              {/* Backend picklist generation API does not take warehouse/assignee fields */}
              <input type="hidden" {...register("warehouseId")} />
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
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!selectedOrderId}>
            Generate Picklist
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
  onCreated: (d: Dispatch) => void;
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

  const onSubmit = (data: DispatchFormData) => {
    console.log("Creating dispatch:", data);
    createShipmentFromPicklist(selectedPicklistId, {
      carrierName: data.notes || data.driverName || "",
      trackingNumber: data.trackingNumber || "",
    })
      .then((d) => {
        onCreated(d);
        alert("Dispatch (Shipment) created successfully!");
        onCancel();
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to create dispatch (shipment).");
      });
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
                    {picklists
                      .filter((pl) => pl.status === "completed")
                      .map((pl) => (
                      <SelectItem key={pl.id} value={pl.id}>
                        {pl.picklistNo}
                      </SelectItem>
                    ))}
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
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!selectedPicklistId}
          >
            Create Dispatch
          </Button>
        </div>
      </form>
    </div>
  );
}
