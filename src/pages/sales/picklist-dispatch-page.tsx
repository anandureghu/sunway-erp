import { useState } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import { StyledTabsTrigger } from "@/components/styled-tabs-trigger";
import { PICKLIST_COLUMNS, DISPATCH_COLUMNS } from "@/lib/columns/sales-columns";
import { picklists, dispatches, salesOrders } from "@/lib/sales-data";
import { warehouses } from "@/lib/inventory-data";
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
import { PICKLIST_SCHEMA, DISPATCH_SCHEMA, type PicklistFormData, type DispatchFormData } from "@/schema/sales";
import { Link } from "react-router-dom";

export default function PicklistDispatchPage() {
  const [activeTab, setActiveTab] = useState("picklists");
  const [showCreatePicklist, setShowCreatePicklist] = useState(false);
  const [showCreateDispatch, setShowCreateDispatch] = useState(false);

  if (showCreatePicklist) {
    return <CreatePicklistForm onCancel={() => setShowCreatePicklist(false)} />;
  }

  if (showCreateDispatch) {
    return <CreateDispatchForm onCancel={() => setShowCreateDispatch(false)} />;
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
            <p className="text-muted-foreground">Generate picklists and plan dispatches</p>
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
              <DataTable columns={PICKLIST_COLUMNS} data={picklists} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispatches">
          <Card>
            <CardHeader>
              <CardTitle>All Dispatches</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={DISPATCH_COLUMNS} data={dispatches} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreatePicklistForm({ onCancel }: { onCancel: () => void }) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PicklistFormData>({
    resolver: zodResolver(PICKLIST_SCHEMA),
  });

  const selectedOrder = salesOrders.find((o) => o.id === selectedOrderId);

  const onSubmit = (data: PicklistFormData) => {
    console.log("Creating picklist:", data);
    // TODO: Make API call to create picklist
    alert("Picklist generated successfully!");
    onCancel();
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
                      .filter((o) => o.status === "confirmed" || o.status === "draft")
                      .map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.orderNo} - {order.customer?.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.orderId && (
                  <p className="text-sm text-red-500">{errors.orderId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouseId">Warehouse *</Label>
                <Select
                  value={watch("warehouseId") || ""}
                  onValueChange={(value) => setValue("warehouseId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.warehouseId && (
                  <p className="text-sm text-red-500">{errors.warehouseId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  placeholder="Enter picker name or ID"
                  {...register("assignedTo")}
                />
              </div>
            </div>

            {selectedOrder && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Order Items:</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.item?.name} - Qty: {item.quantity}</span>
                      <span>Warehouse: {item.warehouseId ? warehouses.find(w => w.id === item.warehouseId)?.name : "Not assigned"}</span>
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

function CreateDispatchForm({ onCancel }: { onCancel: () => void }) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [selectedPicklistId, setSelectedPicklistId] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DispatchFormData>({
    resolver: zodResolver(DISPATCH_SCHEMA),
  });

  const selectedOrder = salesOrders.find((o) => o.id === selectedOrderId);
  const availablePicklists = picklists.filter((pl) => 
    pl.orderId === selectedOrderId && pl.status === "completed"
  );

  const onSubmit = (data: DispatchFormData) => {
    console.log("Creating dispatch:", data);
    // TODO: Make API call to create dispatch
    alert("Dispatch created successfully!");
    onCancel();
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
                <Label htmlFor="orderId">Sales Order *</Label>
                <Select
                  value={selectedOrderId}
                  onValueChange={(value) => {
                    setSelectedOrderId(value);
                    setValue("orderId", value);
                    setSelectedPicklistId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sales order" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesOrders
                      .filter((o) => o.status === "picked" || o.status === "confirmed")
                      .map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.orderNo} - {order.customer?.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.orderId && (
                  <p className="text-sm text-red-500">{errors.orderId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="picklistId">Picklist *</Label>
                <Select
                  value={selectedPicklistId}
                  onValueChange={(value) => {
                    setSelectedPicklistId(value);
                    setValue("picklistId", value);
                  }}
                  disabled={!selectedOrderId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select picklist" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePicklists.map((pl) => (
                      <SelectItem key={pl.id} value={pl.id}>
                        {pl.picklistNo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.picklistId && (
                  <p className="text-sm text-red-500">{errors.picklistId.message}</p>
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
                <Label htmlFor="estimatedDeliveryDate">Estimated Delivery Date</Label>
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
                  <p className="text-sm text-red-500">{errors.deliveryAddress.message}</p>
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
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Additional notes"
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
          <Button type="submit" disabled={!selectedOrderId || !selectedPicklistId}>
            Create Dispatch
          </Button>
        </div>
      </form>
    </div>
  );
}

