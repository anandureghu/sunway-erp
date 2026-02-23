/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
import {
  createSalesOrder,
  listSalesOrders,
  confirmSalesOrder,
  cancelSalesOrder,
} from "@/service/salesFlowService";
import { createSalesOrderColumns } from "@/lib/columns/sales-columns";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import type { ItemResponseDTO } from "@/service/erpApiTypes";

export default function SalesOrdersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(
    (location.state as { searchQuery?: string })?.searchQuery || "",
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(
    location.pathname.includes("/new"),
  );
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Sync showCreateForm with location
  useEffect(() => {
    setShowCreateForm(location.pathname.includes("/new"));
  }, [location.pathname]);

  // Load orders when pathname changes or when form is closed
  useEffect(() => {
    // Only load if we're showing the list (not the form)
    if (showCreateForm) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const [ordersData] = await Promise.all([listSalesOrders()]);
        if (!cancelled) {
          setOrders(ordersData);
        }
      } catch (e: any) {
        if (!cancelled)
          setLoadError(e?.message || "Failed to load sales orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, showCreateForm]); // Reload when pathname changes or form is closed

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const handleConfirmOrder = useCallback(async (id: string) => {
    try {
      await confirmSalesOrder(id);
      toast.success("Order confirmed successfully");
      // Reload orders and customers
      const [ordersData, customersData] = await Promise.all([
        listSalesOrders(),
        listCustomers(),
      ]);
      const enrichedOrders = ordersData.map((order) => ({
        ...order,
        customer: customersData.find((c) => c.id === order.customerId),
      }));
      setOrders(enrichedOrders);
    } catch (error: any) {
      console.error("Confirm order error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to confirm order. Please check the order status.";
      toast.error(errorMessage);
    }
  }, []);

  const handleCancelOrder = useCallback(
    async (id: string) => {
      const order = orders.find((o) => o.id === id);
      if (!order) {
        toast.error("Order not found");
        return;
      }

      // Check if order can be cancelled according to spec
      if (order.status !== "draft" && order.status !== "confirmed") {
        toast.error(
          `Cannot cancel order with status "${order.status}". Only draft or confirmed orders can be cancelled.`,
        );
        return;
      }

      if (
        !confirm(
          `Are you sure you want to cancel order ${order.orderNo}? This action cannot be undone.`,
        )
      )
        return;

      try {
        await cancelSalesOrder(id);
        toast.success("Order cancelled successfully");
        // Reload orders and customers
        const [ordersData, customersData] = await Promise.all([
          listSalesOrders(),
          listCustomers(),
        ]);
        const enrichedOrders = ordersData.map((order) => ({
          ...order,
          customer: customersData.find((c) => c.id === order.customerId),
        }));
        setOrders(enrichedOrders);
      } catch (error: any) {
        console.error("Cancel order error:", error);
        console.error("Full error response:", error?.response?.data);

        let errorMessage = "Failed to cancel order";

        // Extract error message from various possible response formats
        const responseData = error?.response?.data;
        if (responseData) {
          // Try different possible error message fields
          const backendMsg =
            responseData.message ||
            responseData.error ||
            responseData.errorMessage ||
            (typeof responseData === "string" ? responseData : null);

          if (backendMsg) {
            // Show backend message, but if it's a technical Spring Boot error, provide user-friendly context
            if (
              backendMsg.includes("parameter name information not available") ||
              backendMsg.includes("-parameters flag")
            ) {
              errorMessage =
                "Backend configuration error: Cannot cancel order. Please contact system administrator.";
            } else {
              errorMessage = backendMsg;
            }
          }

          // For 500 errors without a specific message, provide generic context
          if (
            error?.response?.status === 500 &&
            (!backendMsg || errorMessage === "Failed to cancel order")
          ) {
            errorMessage =
              "Cannot cancel this order. The order may have associated picklists or shipments, or the backend encountered an error. Please check the order status or contact support.";
          }
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);

        // Also log the full error for debugging
        if (import.meta.env.NODE_ENV === "development") {
          console.error("Error details:", {
            status: error?.response?.status,
            statusText: error?.response?.statusText,
            data: error?.response?.data,
            url: error?.config?.url,
          });
        }
      }
    },
    [orders],
  );

  const handleGeneratePicklist = useCallback(
    (id: string) => {
      navigate(`/inventory/sales/picklist`, {
        state: { salesOrderId: id },
      });
    },
    [navigate],
  );

  const [selectedOrderForDetails, setSelectedOrderForDetails] =
    useState<SalesOrder | null>(null);
  const [showOrderDetailsDialog, setShowOrderDetailsDialog] = useState(false);

  const handleViewDetails = useCallback(
    (id: string) => {
      const order = orders.find((o) => o.id === id);
      if (order) {
        setSelectedOrderForDetails(order);
        setShowOrderDetailsDialog(true);
      }
    },
    [orders],
  );

  const handleEdit = useCallback(() => {
    // Navigate to edit page or open edit dialog
    toast.info("Edit functionality coming soon");
  }, []);

  const columns = useMemo(
    () =>
      createSalesOrderColumns(
        handleConfirmOrder,
        handleCancelOrder,
        handleGeneratePicklist,
        handleViewDetails,
        handleEdit,
      ),
    [
      handleConfirmOrder,
      handleCancelOrder,
      handleGeneratePicklist,
      handleViewDetails,
      handleEdit,
    ],
  );

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
            <div className="py-10 text-center text-muted-foreground">
              Loading...
            </div>
          ) : loadError ? (
            <div className="py-10 text-center text-red-600">{loadError}</div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredOrders}
              onRowClick={(row) =>
                navigate(`/inventory/sales/orders/${row.original.id}`)
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog
        open={showOrderDetailsDialog}
        onOpenChange={setShowOrderDetailsDialog}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Order Details - {selectedOrderForDetails?.orderNo}
            </DialogTitle>
            <DialogDescription>
              Complete information about this sales order
            </DialogDescription>
          </DialogHeader>
          {selectedOrderForDetails && (
            <div className="space-y-6 mt-4">
              {/* Order Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Order Number
                      </p>
                      <p className="font-medium">
                        {selectedOrderForDetails.orderNo}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        className={
                          selectedOrderForDetails.status === "confirmed"
                            ? "bg-blue-100 text-blue-800"
                            : selectedOrderForDetails.status === "draft"
                              ? "bg-gray-100 text-gray-800"
                              : selectedOrderForDetails.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }
                      >
                        {selectedOrderForDetails.status
                          .charAt(0)
                          .toUpperCase() +
                          selectedOrderForDetails.status.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Order Date
                      </p>
                      <p className="font-medium">
                        {selectedOrderForDetails.orderDate
                          ? format(
                              new Date(selectedOrderForDetails.orderDate),
                              "MMM dd, yyyy",
                            )
                          : "N/A"}
                      </p>
                    </div>
                    {selectedOrderForDetails.requiredDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Required Date
                        </p>
                        <p className="font-medium">
                          {format(
                            new Date(selectedOrderForDetails.requiredDate),
                            "MMM dd, yyyy",
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedOrderForDetails.customerName ? (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Customer Name
                        </p>
                        <p className="font-medium">
                          {selectedOrderForDetails.customerName}
                        </p>
                      </div>
                      {selectedOrderForDetails.customerId && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Customer ID
                          </p>
                          <p className="font-medium">
                            {selectedOrderForDetails.customerId}
                          </p>
                        </div>
                      )}
                      {selectedOrderForDetails.customerEmail && (
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">
                            {selectedOrderForDetails.customerEmail}
                          </p>
                        </div>
                      )}
                      {selectedOrderForDetails.customerPhone && (
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">
                            {selectedOrderForDetails.customerPhone}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      Customer information not available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedOrderForDetails.items.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-5 gap-4 font-medium text-sm border-b pb-2">
                        <div>Item</div>
                        <div className="text-right">Quantity</div>
                        <div className="text-right">Unit Price</div>
                        <div className="text-right">Discount</div>
                        <div className="text-right">Total</div>
                      </div>
                      {selectedOrderForDetails.items.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-5 gap-4 text-sm border-b pb-2"
                        >
                          <div>
                            <p className="font-medium">
                              {item.itemName || `Item ${item.itemId}`}
                            </p>
                            {item.item?.sku && (
                              <p className="text-xs text-muted-foreground">
                                SKU: {item.item.sku}
                              </p>
                            )}
                          </div>
                          <div className="text-right">{item.quantity}</div>
                          <div className="text-right">
                            ₹{item.unitPrice.toLocaleString()}
                          </div>
                          <div className="text-right">{item.discount}%</div>
                          <div className="text-right font-medium">
                            ₹{item.total.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No items in this order
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Order Totals */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">
                        ₹{selectedOrderForDetails.subtotal.toLocaleString()}
                      </span>
                    </div>
                    {selectedOrderForDetails.discount > 0 && (
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span className="font-medium">
                          -₹{selectedOrderForDetails.discount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedOrderForDetails.tax > 0 && (
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span className="font-medium">
                          ₹{selectedOrderForDetails.tax.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>
                        ₹{selectedOrderForDetails.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Info */}
              {(selectedOrderForDetails.shippingAddress ||
                selectedOrderForDetails.notes ||
                selectedOrderForDetails.salesPerson) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Additional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedOrderForDetails.salesPerson && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Sales Person
                        </p>
                        <p className="font-medium">
                          {selectedOrderForDetails.salesPerson}
                        </p>
                      </div>
                    )}
                    {selectedOrderForDetails.shippingAddress && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Shipping Address
                        </p>
                        <p className="font-medium">
                          {selectedOrderForDetails.shippingAddress}
                        </p>
                      </div>
                    )}
                    {selectedOrderForDetails.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="font-medium">
                          {selectedOrderForDetails.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
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
  const [items, setItems] = useState<ItemResponseDTO[]>([]);
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
      }),
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
        console.log("Items loaded:", it.length);
        console.log(
          "Active items:",
          it.filter((item) => item.status === "active").length,
        );
        if (it.length > 0) {
          console.log("First item:", it[0]);
        }
        setWarehouses(wh);
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(
            e?.response?.data?.message ||
              e?.message ||
              "Failed to load customers/items/warehouses",
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

    const item = items.find((i) => String(i.id) === String(selectedItem));
    if (!item) {
      console.error("Item not found for id:", selectedItem);
      return;
    }

    const unitPrice = item.sellingPrice;
    const discountAmount = (unitPrice * itemQuantity * itemDiscount) / 100;
    const subtotal = unitPrice * itemQuantity - discountAmount;
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;

    const newItem: SalesOrderItem = {
      id: `temp-${Date.now()}`,
      orderId: "",
      itemId: item.id,
      itemName: item.name,
      quantity: itemQuantity,
      unitPrice,
      discount: itemDiscount,
      tax,
      total,
      warehouseId: Number(itemWarehouse),
      item,
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
      0,
    );
    const tax = orderItems.reduce((sum, item) => sum + item.tax, 0);
    const discount = orderItems.reduce(
      (sum, item) =>
        sum + (item.unitPrice * item.quantity * item.discount) / 100,
      0,
    );
    const total = subtotal + tax;

    return { subtotal, tax, discount, total };
  };

  const onSubmit = (data: any) => {
    console.log("Form submitted with data:", data);

    // Validate that items are added
    if (orderItems.length === 0) {
      toast.error("Please add at least one item to the order.");
      return;
    }

    // Validate customer is selected
    if (!data.customerId) {
      toast.error("Please select a customer.");
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
      toast.error(`Please check the form for errors`);
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
        toast.success(`Sales order ${created.orderNo} created successfully!`);
        // Navigate and trigger refresh by changing pathname
        navigate("/inventory/sales/orders", { replace: true });
      })
      .catch((error: any) => {
        console.error("Error creating sales order:", error);
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to create sales order. Please try again.",
        );
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
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">
          Loading...
        </div>
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
              const errorCount = Object.keys(errors).length;
              toast.error(
                `Please fix ${errorCount} form error${
                  errorCount > 1 ? "s" : ""
                } before submitting.`,
              );
            })(e);
          }}
          className="space-y-6"
        >
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle>
                <h1 className="text-3xl font-bold font-serif">
                  Create New Sales Order
                </h1>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="my-3">
                <div className="rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 px-8 py-8 shadow-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 text-center text-white">
                    {/* ITEMS */}
                    <div>
                      <p className="text-xs uppercase tracking-widest opacity-80">
                        Items
                      </p>
                      <p className="mt-2 text-4xl font-bold">
                        {orderItems.length}
                      </p>
                    </div>

                    {/* SUBTOTAL */}
                    <div>
                      <p className="text-xs uppercase tracking-widest opacity-80">
                        Subtotal
                      </p>
                      <p className="mt-2 text-3xl font-semibold">
                        ₹{totals.subtotal.toLocaleString()}
                      </p>
                    </div>

                    {/* DISCOUNT */}
                    <div>
                      <p className="text-xs uppercase tracking-widest opacity-80">
                        Discount
                      </p>
                      <p className="mt-2 text-3xl font-semibold">
                        ₹{totals.discount.toLocaleString()}
                      </p>
                    </div>

                    {/* TOTAL */}
                    <div>
                      <p className="text-xs uppercase tracking-widest opacity-80">
                        Total
                      </p>
                      <p className="mt-2 text-4xl font-bold">
                        ₹{totals.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <h2 className="mt-5 text-2xl font-serif">Customer Information</h2>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerId">Customer *</Label>
                  <Select
                    value={selectedCustomerId || ""}
                    onValueChange={(value) => {
                      console.log("Customer selected:", value);
                      setValue("customerId", value, { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer">
                        {selectedCustomerId
                          ? customers.find((c) => c.id === selectedCustomerId)
                              ?.name || "Select customer"
                          : "Select customer"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No customers available
                        </div>
                      ) : customers.filter((c) => c.status === "active")
                          .length === 0 ? (
                        <>
                          <div className="p-2 text-sm text-muted-foreground">
                            No active customers ({customers.length} total)
                          </div>
                          {customers.map((customer) => (
                            <SelectItem
                              key={customer.id}
                              value={String(customer.id)}
                            >
                              {customer.name} ({customer.code}) -{" "}
                              {customer.status}
                            </SelectItem>
                          ))}
                        </>
                      ) : (
                        customers
                          .filter((c) => c.status === "active")
                          .map((customer) => (
                            <SelectItem
                              key={customer.id}
                              value={String(customer.id)}
                            >
                              {customer.name} ({customer.code})
                            </SelectItem>
                          ))
                      )}
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
                  <Input
                    id="orderDate"
                    type="date"
                    {...register("orderDate")}
                  />
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

              <h4 className="mt-5 text-2xl font-serif">Add items to order</h4>
              <Separator />
              <div className="grid grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Item</Label>
                  <Select
                    value={selectedItem || ""}
                    onValueChange={(value) => {
                      console.log("Item selected:", value);
                      setSelectedItem(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select item">
                        {selectedItem && items.length > 0
                          ? (() => {
                              const selected = items.find(
                                (i) => String(i.id) === String(selectedItem),
                              );
                              return selected
                                ? `${selected.name} - ₹${
                                    selected.sellingPrice || 0
                                  }`
                                : "Select item";
                            })()
                          : "Select item"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {items.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No items available
                        </div>
                      ) : items.filter((i) => i.status === "active").length ===
                        0 ? (
                        <>
                          <div className="p-2 text-sm text-muted-foreground">
                            No active items ({items.length} total)
                          </div>
                          {items.map((item) => (
                            <SelectItem key={item.id} value={String(item.id)}>
                              {item.name} - ₹{item.sellingPrice || 0} -{" "}
                              {item.status}
                            </SelectItem>
                          ))}
                        </>
                      ) : (
                        items
                          .filter((i) => i.status === "active")
                          .map((item) => (
                            <SelectItem key={item.id} value={String(item.id)}>
                              {item.name} - ₹{item.sellingPrice || 0}
                            </SelectItem>
                          ))
                      )}
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
                  <Select
                    value={itemWarehouse}
                    onValueChange={setItemWarehouse}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No warehouses available. Please create a warehouse
                          first.
                        </div>
                      ) : warehouses.filter((wh) => wh.status === "active")
                          .length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No active warehouses. Please activate or create a
                          warehouse.
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
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={addItemToOrder}
                    className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-sm lg:text-base"
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
                              {item.quantity} {item.item?.unitMeasure}
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
