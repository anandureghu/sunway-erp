/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SALES_ORDER_COLUMNS } from "@/lib/columns/sales-columns";
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
import { SALES_ORDER_SCHEMA, type SalesOrderFormData } from "@/schema/sales";
import { z } from "zod";
import type { SalesOrderItem, SalesOrder } from "@/types/sales";
import { listCustomers } from "@/service/customerService";
import { listItems, listWarehouses } from "@/service/inventoryService";
import { createSalesOrder, listSalesOrders } from "@/service/salesFlowService";

export default function SalesOrdersPage() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState(
    (location.state as { searchQuery?: string })?.searchQuery || ""
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(
    location.pathname.includes("/new")
  );
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await listSalesOrders();
        if (!cancelled) setOrders(data);
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message || "Failed to load sales orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
    const matchesSearch =
      order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  }, [orders, searchQuery, statusFilter]);

  if (showCreateForm) {
    return <CreateSalesOrderForm onCancel={() => setShowCreateForm(false)} />;
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
            <h1 className="text-3xl font-bold mb-2">Sales Orders</h1>
            <p className="text-muted-foreground">
              Manage and track sales orders
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Order
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Sales Orders</CardTitle>
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
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="picked">Picked</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Loading...</div>
          ) : loadError ? (
            <div className="py-10 text-center text-red-600">{loadError}</div>
          ) : (
            <DataTable columns={SALES_ORDER_COLUMNS} data={filteredOrders} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateSalesOrderForm({ onCancel }: { onCancel: () => void }) {
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemDiscount, setItemDiscount] = useState<number>(0);
  const [itemWarehouse, setItemWarehouse] = useState<string>("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadSeq, setReloadSeq] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Omit<SalesOrderFormData, "items"> & { items?: unknown[] }>({
    resolver: zodResolver(
      z.object({
        customerId: z.string().min(1, "Customer is required"),
        orderDate: z.string().min(1, "Order date is required"),
        requiredDate: z.string().optional(),
        shippingAddress: z.string().optional(),
        notes: z.string().optional(),
        salesPerson: z.string().optional(),
        items: z.array(z.any()).optional(), // Items validated separately
      })
    ),
    defaultValues: {
      orderDate: format(new Date(), "yyyy-MM-dd"),
      items: [],
    },
    mode: "onChange",
  });

  const selectedCustomerId = watch("customerId");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const [c, it, wh] = await Promise.all([
          listCustomers(),
          listItems(),
          listWarehouses(),
        ]);
        if (cancelled) return;
        setCustomers(c);
        setItems(it);
        setWarehouses(wh);
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(
            e?.response?.data?.message ||
              e?.message ||
              "Failed to load customers/items/warehouses"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadSeq]);

  const addItemToOrder = () => {
    if (!selectedItem || itemQuantity <= 0) return;

    const item = items.find((i) => i.id === selectedItem);
    if (!item) return;

    const unitPrice = item.sellingPrice;
    const discountAmount = (unitPrice * itemQuantity * itemDiscount) / 100;
    const subtotal = unitPrice * itemQuantity - discountAmount;
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;

    const newItem: SalesOrderItem = {
      id: `temp-${Date.now()}`,
      orderId: "",
      itemId: item.id,
      item,
      quantity: itemQuantity,
      unitPrice,
      discount: itemDiscount,
      tax,
      total,
      warehouseId: itemWarehouse || undefined,
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedItem("");
    setItemQuantity(1);
    setItemDiscount(0);
    setItemWarehouse("");
  };

  const removeItem = (itemId: string) => {
    setOrderItems(orderItems.filter((item) => item.id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.total - item.tax,
      0
    );
    const tax = orderItems.reduce((sum, item) => sum + item.tax, 0);
    const discount = orderItems.reduce(
      (sum, item) =>
        sum + (item.unitPrice * item.quantity * item.discount) / 100,
      0
    );
    const total = subtotal + tax;

    return { subtotal, tax, discount, total };
  };

  const onSubmit = (data: any) => {
    console.log("Form submitted with data:", data);

    // Validate that items are added
    if (orderItems.length === 0) {
      alert("Please add at least one item to the order.");
      return;
    }

    // Validate customer is selected
    if (!data.customerId) {
      alert("Please select a customer.");
      return;
    }

    // Update form data with items for validation
    const itemsData = orderItems.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      tax: item.tax,
      warehouseId: item.warehouseId,
    }));

    console.log("Items data:", itemsData);

    // Validate the complete form data
    const completeData = {
      ...data,
      items: itemsData,
    };

    // Additional validation can be done here if needed
    const validationResult = SALES_ORDER_SCHEMA.safeParse(completeData);
    if (!validationResult.success) {
      console.error("Validation errors:", validationResult.error);
      const errorMessages = validationResult.error;
      alert(`Please check the form for errors:\n${errorMessages}`);
      return;
    }

    console.log("Validation passed, creating order via API...");
    setSubmitLoading(true);

    const payload = {
      customerId: Number(data.customerId),
      orderDate: data.orderDate,
      items: orderItems.map((it) => ({
        itemId: Number(it.itemId),
        quantity: Math.round(it.quantity),
        unitPrice: it.unitPrice,
      })),
    };

    createSalesOrder(payload)
      .then((created) => {
        alert(`Sales order ${created.orderNo} created successfully!`);
        navigate("/inventory/sales/orders");
      })
      .catch((error) => {
        console.error("Error creating sales order:", error);
        alert("Failed to create sales order. Please check console logs.");
      })
      .finally(() => setSubmitLoading(false));
  };

  const totals = calculateTotals();
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Create New Sales Order</h1>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Loading...</div>
      ) : loadError ? (
        <div className="py-10 text-center">
          <div className="text-red-600 mb-3">{loadError}</div>
          <Button variant="outline" onClick={() => setReloadSeq((n) => n + 1)}>
            Retry
          </Button>
        </div>
      ) : (
        <form
        onSubmit={(e) => {
          e.preventDefault();
          console.log("Form submit event triggered");
          handleSubmit(onSubmit, (errors) => {
            console.error("Form validation errors:", errors);
            alert("Please fix the form errors before submitting.");
          })(e);
        }}
        className="space-y-6"
      >
        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">Customer *</Label>
                <Select
                  value={selectedCustomerId || ""}
                  onValueChange={(value) => setValue("customerId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers
                      .filter((c) => c.status === "active")
                      .map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.customerId && (
                  <p className="text-sm text-red-500">
                    {errors.customerId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderDate">Order Date *</Label>
                <Input id="orderDate" type="date" {...register("orderDate")} />
                {errors.orderDate && (
                  <p className="text-sm text-red-500">
                    {errors.orderDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="requiredDate">Required Date</Label>
                <Input
                  id="requiredDate"
                  type="date"
                  {...register("requiredDate")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salesPerson">Sales Person</Label>
                <Input
                  id="salesPerson"
                  placeholder="Enter sales person name"
                  {...register("salesPerson")}
                />
              </div>
            </div>

            {selectedCustomer && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedCustomer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCustomer.address}, {selectedCustomer.city},{" "}
                  {selectedCustomer.state}
                </p>
                <p className="text-sm text-muted-foreground">
                  Phone: {selectedCustomer.phone} | Email:{" "}
                  {selectedCustomer.email}
                </p>
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
            <div className="grid grid-cols-5 gap-4">
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
                          {item.name} - ₹{item.sellingPrice}
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
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={itemDiscount}
                  onChange={(e) =>
                    setItemDiscount(parseFloat(e.target.value) || 0)
                  }
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
                <Button
                  type="button"
                  onClick={addItemToOrder}
                  className="w-full"
                >
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
                          <td className="p-2">
                            {item.quantity} {item.item?.unit}
                          </td>
                          <td className="p-2">
                            ₹{item.unitPrice.toLocaleString()}
                          </td>
                          <td className="p-2">{item.discount}%</td>
                          <td className="p-2">₹{item.tax.toFixed(2)}</td>
                          <td className="p-2 font-medium">
                            ₹{item.total.toLocaleString()}
                          </td>
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
                <span className="font-medium">
                  ₹{totals.subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span className="font-medium">
                  -₹{totals.discount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax (18%):</span>
                <span className="font-medium">
                  ₹{totals.tax.toLocaleString()}
                </span>
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
            disabled={orderItems.length === 0 || !selectedCustomerId}
            onClick={() => {
              console.log("Submit button clicked");
              console.log("Order items:", orderItems);
              console.log("Selected customer:", selectedCustomerId);
            }}
          >
            {submitLoading ? "Creating..." : "Create Sales Order"}
          </Button>
        </div>
        {orderItems.length === 0 && (
          <p className="text-sm text-red-500 text-center">
            Please add at least one item to create the order
          </p>
        )}
        {!selectedCustomerId && (
          <p className="text-sm text-red-500 text-center">
            Please select a customer
          </p>
        )}
        </form>
      )}
    </div>
  );
}
