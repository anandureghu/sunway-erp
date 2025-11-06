import { useState } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PURCHASE_ORDER_COLUMNS } from "@/lib/columns/purchase-columns";
import { purchaseOrders, suppliers, addPurchaseOrder, purchaseRequisitions } from "@/lib/purchase-data";
import { items, warehouses } from "@/lib/inventory-data";
import { Plus, Search, ArrowLeft } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PURCHASE_ORDER_SCHEMA, type PurchaseOrderFormData } from "@/schema/purchase";
import { z } from "zod";
import type { PurchaseOrderItem, PurchaseOrder } from "@/types/purchase";

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState((location.state as { searchQuery?: string })?.searchQuery || "");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(location.pathname.includes("/new"));

  const filteredOrders = purchaseOrders.filter((order) => {
    const matchesSearch =
      order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.supplier?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (showCreateForm) {
    return <CreatePurchaseOrderForm onCancel={() => setShowCreateForm(false)} />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/inventory/purchase">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Purchase Orders</h1>
            <p className="text-muted-foreground">Manage and track purchase orders</p>
          </div>
        </div>
        <Button onClick={() => navigate("/inventory/purchase/orders/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Order
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Purchase Orders</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="partially_received">Partially Received</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={PURCHASE_ORDER_COLUMNS} data={filteredOrders} />
        </CardContent>
      </Card>
    </div>
  );
}

function CreatePurchaseOrderForm({ onCancel }: { onCancel: () => void }) {
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);
  const [itemDiscount, setItemDiscount] = useState<number>(0);
  const [itemWarehouse, setItemWarehouse] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Omit<PurchaseOrderFormData, "items"> & { items?: any[] }>({
    resolver: zodResolver(z.object({
      requisitionId: z.string().optional(),
      supplierId: z.string().min(1, "Supplier is required"),
      orderDate: z.string().min(1, "Order date is required"),
      expectedDate: z.string().optional(),
      shippingAddress: z.string().optional(),
      notes: z.string().optional(),
      items: z.array(z.any()).optional(),
    })),
    defaultValues: {
      orderDate: format(new Date(), "yyyy-MM-dd"),
      items: [],
    },
    mode: "onChange",
  });

  const selectedSupplierId = watch("supplierId");
  const selectedRequisitionId = watch("requisitionId");

  const addItemToOrder = () => {
    if (!selectedItem || itemQuantity <= 0 || itemUnitPrice <= 0) return;

    const item = items.find((i) => i.id === selectedItem);
    if (!item) return;

    const discountAmount = (itemUnitPrice * itemQuantity * itemDiscount) / 100;
    const subtotal = itemUnitPrice * itemQuantity - discountAmount;
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;

    const newItem: PurchaseOrderItem = {
      id: `temp-${Date.now()}`,
      orderId: "",
      itemId: item.id,
      item,
      quantity: itemQuantity,
      unitPrice: itemUnitPrice,
      discount: itemDiscount,
      tax,
      total,
      warehouseId: itemWarehouse || undefined,
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedItem("");
    setItemQuantity(1);
    setItemUnitPrice(0);
    setItemDiscount(0);
    setItemWarehouse("");
  };

  const removeItem = (itemId: string) => {
    setOrderItems(orderItems.filter((item) => item.id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.total - item.tax, 0);
    const tax = orderItems.reduce((sum, item) => sum + item.tax, 0);
    const discount = orderItems.reduce(
      (sum, item) => sum + (item.unitPrice * item.quantity * item.discount) / 100,
      0
    );
    const total = subtotal + tax;

    return { subtotal, tax, discount, total };
  };

  const onSubmit = (data: any) => {
    if (orderItems.length === 0) {
      alert("Please add at least one item to the order.");
      return;
    }

    if (!data.supplierId) {
      alert("Please select a supplier.");
      return;
    }

    const itemsData = orderItems.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      tax: item.tax,
      warehouseId: item.warehouseId,
    }));

    const completeData = {
      ...data,
      items: itemsData,
    };

    const validationResult = PURCHASE_ORDER_SCHEMA.safeParse(completeData);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
      alert(`Please check the form for errors:\n${errorMessages}`);
      return;
    }

    const totals = calculateTotals();
    const orderNumber = `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(3, "0")}`;
    
    const orderItemsData: PurchaseOrderItem[] = orderItems.map((item) => ({
      id: `poi-${Date.now()}-${Math.random()}`,
      orderId: "",
      itemId: item.itemId,
      item: item.item,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      tax: item.tax,
      total: item.total,
      warehouseId: item.warehouseId,
    }));

    const supplier = suppliers.find((s) => s.id === data.supplierId);
    const requisition = data.requisitionId ? purchaseRequisitions.find((r) => r.id === data.requisitionId) : undefined;
    
    const newOrder: PurchaseOrder = {
      id: `po-${Date.now()}`,
      orderNo: orderNumber,
      requisitionId: data.requisitionId || undefined,
      requisition: requisition,
      supplierId: data.supplierId,
      supplier: supplier,
      orderDate: data.orderDate,
      expectedDate: data.expectedDate || undefined,
      status: "draft",
      items: orderItemsData.map((item) => ({
        ...item,
        orderId: `po-${Date.now()}`,
      })),
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: totals.discount,
      total: totals.total,
      shippingAddress: data.shippingAddress || supplier?.address || "",
      notes: data.notes || undefined,
      orderedBy: "current-user",
      orderedByName: "Current User",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      addPurchaseOrder(newOrder);
    } catch (error) {
      console.error("Error adding purchase order:", error);
      purchaseOrders.push(newOrder);
    }

    alert(`Purchase order ${orderNumber} created successfully!`);
    navigate("/inventory/purchase/orders");
  };

  const totals = calculateTotals();
  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);
  const approvedRequisitions = purchaseRequisitions.filter((r) => r.status === "approved");

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Create New Purchase Order</h1>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(onSubmit, (errors) => {
          console.error("Form validation errors:", errors);
          alert("Please fix the form errors before submitting.");
        })(e);
      }} className="space-y-6">
        {/* Supplier Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierId">Supplier *</Label>
                <Select
                  value={selectedSupplierId || ""}
                  onValueChange={(value) => setValue("supplierId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers
                      .filter((s) => s.status === "active")
                      .map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name} ({supplier.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.supplierId && (
                  <p className="text-sm text-red-500">{errors.supplierId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="requisitionId">Purchase Requisition (Optional)</Label>
                <Select
                  value={selectedRequisitionId || ""}
                  onValueChange={(value) => setValue("requisitionId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select requisition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {approvedRequisitions.map((req) => (
                      <SelectItem key={req.id} value={req.id}>
                        {req.requisitionNo} - {req.requestedByName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderDate">Order Date *</Label>
                <Input
                  id="orderDate"
                  type="date"
                  {...register("orderDate")}
                />
                {errors.orderDate && (
                  <p className="text-sm text-red-500">{errors.orderDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedDate">Expected Date</Label>
                <Input
                  id="expectedDate"
                  type="date"
                  {...register("expectedDate")}
                />
              </div>
            </div>

            {selectedSupplier && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedSupplier.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedSupplier.address}, {selectedSupplier.city}, {selectedSupplier.state}
                </p>
                <p className="text-sm text-muted-foreground">
                  Phone: {selectedSupplier.phone} | Email: {selectedSupplier.email}
                </p>
                {selectedSupplier.rating && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Rating: {selectedSupplier.rating}/5 | On-time Delivery: {selectedSupplier.onTimeDeliveryRate}%
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Items */}
        <Card>
          <CardHeader>
            <CardTitle>Add Items to Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-6 gap-4">
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
                        <SelectItem key={item.id} value={item.id}>
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
                  onChange={(e) => setItemQuantity(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Unit Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemUnitPrice}
                  onChange={(e) => setItemUnitPrice(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={itemDiscount}
                  onChange={(e) => setItemDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Warehouse</Label>
                <Select value={itemWarehouse} onValueChange={setItemWarehouse}>
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
              </div>

              <div className="flex items-end">
                <Button type="button" onClick={addItemToOrder} className="w-full">
                  Add Item
                </Button>
              </div>
            </div>

            {/* Order Items List */}
            {orderItems.length > 0 && (
              <div className="mt-4">
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Item</th>
                        <th className="p-2 text-left">Quantity</th>
                        <th className="p-2 text-left">Unit Price</th>
                        <th className="p-2 text-left">Discount</th>
                        <th className="p-2 text-left">Tax</th>
                        <th className="p-2 text-left">Total</th>
                        <th className="p-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.item?.name}</td>
                          <td className="p-2">{item.quantity} {item.item?.unit}</td>
                          <td className="p-2">₹{item.unitPrice.toLocaleString()}</td>
                          <td className="p-2">{item.discount}%</td>
                          <td className="p-2">₹{item.tax.toFixed(2)}</td>
                          <td className="p-2 font-medium">₹{item.total.toLocaleString()}</td>
                          <td className="p-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {orderItems.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No items added. Add items to create the order.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Order Summary */}
        {orderItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">₹{totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span className="font-medium">-₹{totals.discount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (18%):</span>
                <span className="font-medium">₹{totals.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>₹{totals.total.toLocaleString()}</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingAddress">Shipping Address</Label>
                <Textarea
                  id="shippingAddress"
                  placeholder="Enter shipping address"
                  {...register("shippingAddress")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or instructions"
                  {...register("notes")}
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
            disabled={orderItems.length === 0 || !selectedSupplierId}
          >
            Create Purchase Order
          </Button>
        </div>
        {orderItems.length === 0 && (
          <p className="text-sm text-red-500 text-center">
            Please add at least one item to create the order
          </p>
        )}
        {!selectedSupplierId && (
          <p className="text-sm text-red-500 text-center">
            Please select a supplier
          </p>
        )}
      </form>
    </div>
  );
}

