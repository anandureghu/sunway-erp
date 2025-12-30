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
import { type PurchaseOrderFormData } from "@/schema/purchase";
import { z } from "zod";
import type { PurchaseOrderItem, PurchaseOrder } from "@/types/purchase";
import { listVendors } from "@/service/vendorService";
import { listItems, listWarehouses } from "@/service/inventoryService";
import {
  createPurchaseOrder,
  listPurchaseOrders,
  confirmPurchaseOrder,
  cancelPurchaseOrder,
} from "@/service/purchaseFlowService";
import type { Vendor } from "@/types/vendor";
import { createPurchaseOrderColumns } from "@/lib/columns/purchase-columns";
import { toast } from "sonner";

export default function PurchaseOrdersPage() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState(
    (location.state as { searchQuery?: string })?.searchQuery || ""
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(
    location.pathname.includes("/new")
  );
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Sync showCreateForm with location
  useEffect(() => {
    setShowCreateForm(location.pathname.includes("/new"));
  }, [location.pathname]);

  // Load orders when pathname changes or when form is closed
  useEffect(() => {
    // Only load if we're showing the list (not the form)
    if (showCreateForm) return;

    // Reload trigger dependency to allow manual retry
    void reloadTrigger;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const [ordersData, vendorsData] = await Promise.all([
          listPurchaseOrders(),
          listVendors(),
        ]);
        if (!cancelled) {
          setVendors(vendorsData);
          // Enrich orders with vendor data (convert Vendor to Supplier format)
          const enrichedOrders = ordersData.map((order) => {
            const vendor = vendorsData.find(
              (v) => String(v.id) === order.supplierId
            );
            return {
              ...order,
              supplier: vendor
                ? {
                    id: String(vendor.id),
                    code: String(vendor.id),
                    name: vendor.vendorName || "Unknown Supplier",
                    contactPerson: vendor.contactPersonName,
                    email: vendor.email,
                    phone: vendor.phoneNo,
                    status: vendor.active
                      ? ("active" as const)
                      : ("inactive" as const),
                    createdAt: "",
                  }
                : undefined,
            };
          });
          setOrders(enrichedOrders);
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error("Error loading purchase orders:", e);
          console.error("Error response:", e?.response?.data);

          // Check for specific backend routing error
          const errorData = e?.response?.data;
          let errorMessage = "Failed to load purchase orders";

          if (
            errorData?.message?.includes("No static resource") ||
            errorData?.error?.includes("No static resource")
          ) {
            errorMessage =
              "Purchase Orders API endpoint is not configured on the server. Please contact your administrator.";
          } else {
            errorMessage =
              errorData?.message ||
              errorData?.error ||
              e?.message ||
              "Failed to load purchase orders. Please try again.";
          }

          setLoadError(errorMessage);
          toast.error(errorMessage, {
            duration: 8000,
            description: "This appears to be a backend configuration issue.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, showCreateForm, reloadTrigger]); // Reload when pathname changes, form is closed, or retry is triggered

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const handleConfirmOrder = useCallback(async (id: string) => {
    try {
      await confirmPurchaseOrder(id);
      toast.success("Order confirmed successfully");
      // Reload orders and vendors
      const [ordersData, vendorsData] = await Promise.all([
        listPurchaseOrders(),
        listVendors(),
      ]);
      const enrichedOrders = ordersData.map((order) => {
        const vendor = vendorsData.find(
          (v) => String(v.id) === order.supplierId
        );
        return {
          ...order,
          supplier: vendor
            ? {
                id: String(vendor.id),
                code: String(vendor.id),
                name: vendor.vendorName || "Unknown Supplier",
                contactPerson: vendor.contactPersonName,
                email: vendor.email,
                phone: vendor.phoneNo,
                status: vendor.active
                  ? ("active" as const)
                  : ("inactive" as const),
                createdAt: "",
              }
            : undefined,
        };
      });
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
      if (order.status !== "draft" && order.status !== "pending") {
        toast.error(
          `Cannot cancel order with status "${order.status}". Only draft or pending orders can be cancelled.`
        );
        return;
      }

      if (
        !confirm(
          `Are you sure you want to cancel order ${order.orderNo}? This action cannot be undone.`
        )
      )
        return;

      try {
        await cancelPurchaseOrder(id);
        toast.success("Order cancelled successfully");
        // Reload orders and vendors
        const [ordersData, vendorsData] = await Promise.all([
          listPurchaseOrders(),
          listVendors(),
        ]);
        const enrichedOrders = ordersData.map((order) => {
          const vendor = vendorsData.find(
            (v) => String(v.id) === order.supplierId
          );
          return {
            ...order,
            supplier: vendor
              ? {
                  id: String(vendor.id),
                  code: String(vendor.id),
                  name: vendor.vendorName || "Unknown Supplier",
                  contactPerson: vendor.contactPersonName,
                  email: vendor.email,
                  phone: vendor.phoneNo,
                  status: vendor.active
                    ? ("active" as const)
                    : ("inactive" as const),
                  createdAt: "",
                }
              : undefined,
          };
        });
        setOrders(enrichedOrders);
      } catch (error: any) {
        console.error("Cancel order error:", error);
        const errorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to cancel order";
        toast.error(errorMessage);
      }
    },
    [orders]
  );

  const [selectedOrderForDetails, setSelectedOrderForDetails] =
    useState<PurchaseOrder | null>(null);
  const [showOrderDetailsDialog, setShowOrderDetailsDialog] = useState(false);

  const handleViewDetails = useCallback(
    (id: string) => {
      const order = orders.find((o) => o.id === id);
      if (order) {
        setSelectedOrderForDetails(order);
        setShowOrderDetailsDialog(true);
      }
    },
    [orders]
  );

  const handleEdit = useCallback(() => {
    // Navigate to edit page or open edit dialog
    toast.info("Edit functionality coming soon");
  }, []);

  const columns = useMemo(
    () =>
      createPurchaseOrderColumns(
        handleConfirmOrder,
        handleCancelOrder,
        handleViewDetails,
        handleEdit
      ),
    [handleConfirmOrder, handleCancelOrder, handleViewDetails, handleEdit]
  );

  if (showCreateForm) {
    return (
      <CreatePurchaseOrderForm onCancel={() => setShowCreateForm(false)} />
    );
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
            <p className="text-muted-foreground">
              Manage and track purchase orders
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
                  <SelectItem value="partially_received">
                    Partially Received
                  </SelectItem>
                  <SelectItem value="received">Received</SelectItem>
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
            <div className="py-10 text-center space-y-4">
              <div className="text-red-600 font-medium">{loadError}</div>
              <div className="text-sm text-muted-foreground">
                {loadError.includes("not configured") && (
                  <p className="mb-2">
                    The backend endpoint for Purchase Orders needs to be
                    configured.
                    <br />
                    Expected endpoint:{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      GET /api/purchase/orders
                    </code>
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setLoadError(null);
                  setReloadTrigger((prev) => prev + 1);
                }}
              >
                Retry
              </Button>
            </div>
          ) : (
            <DataTable columns={columns} data={filteredOrders} />
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
              Complete information about this purchase order
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
                          selectedOrderForDetails.status === "approved"
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
                              "MMM dd, yyyy"
                            )
                          : "N/A"}
                      </p>
                    </div>
                    {selectedOrderForDetails.expectedDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Expected Date
                        </p>
                        <p className="font-medium">
                          {format(
                            new Date(selectedOrderForDetails.expectedDate),
                            "MMM dd, yyyy"
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Supplier Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedOrderForDetails.supplier ? (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Supplier Name
                        </p>
                        <p className="font-medium">
                          {(selectedOrderForDetails.supplier as any)
                            ?.vendorName ||
                            (selectedOrderForDetails.supplier as any)?.name ||
                            "N/A"}
                        </p>
                      </div>
                      {selectedOrderForDetails.supplier.email && (
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">
                            {selectedOrderForDetails.supplier.email}
                          </p>
                        </div>
                      )}
                      {selectedOrderForDetails.supplier.phone && (
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">
                            {selectedOrderForDetails.supplier.phone}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      Supplier information not available
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
                        <div className="text-right">Total</div>
                      </div>
                      {selectedOrderForDetails.items.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-5 gap-4 text-sm border-b pb-2"
                        >
                          <div>
                            <p className="font-medium">
                              {item.item?.name || `Item ${item.itemId}`}
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
            </div>
          )}
        </DialogContent>
      </Dialog>
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
  const [vendors, setVendors] = useState<Vendor[]>([]);
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
  } = useForm<Omit<PurchaseOrderFormData, "items"> & { items?: any[] }>({
    resolver: zodResolver(
      z.object({
        requisitionId: z.string().optional(),
        supplierId: z.string().min(1, "Supplier is required"),
        orderDate: z.string().min(1, "Order date is required"),
        expectedDate: z.string().optional(),
        shippingAddress: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(z.any()).optional(),
      })
    ),
    defaultValues: {
      orderDate: format(new Date(), "yyyy-MM-dd"),
      items: [],
    },
    mode: "onChange",
  });

  const selectedSupplierId = watch("supplierId");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const [v, it, wh] = await Promise.all([
          listVendors(),
          listItems(),
          listWarehouses(),
        ]);
        if (cancelled) return;
        setVendors(v);
        setItems(it);
        setWarehouses(wh);
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(
            e?.response?.data?.message ||
              e?.message ||
              "Failed to load vendors/items/warehouses"
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
    if (!selectedItem || itemQuantity <= 0 || itemUnitPrice <= 0) return;

    const item = items.find((i) => i.id === selectedItem);
    if (!item) return;

    const discountAmount = (itemUnitPrice * itemQuantity * itemDiscount) / 100;
    const subtotal = itemUnitPrice * itemQuantity - discountAmount;
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;
    const lineTotal = itemUnitPrice * itemQuantity;

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
      lineTotal,
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
      toast.error("Please add at least one item to the order.");
      return;
    }

    // Validate supplier is selected
    if (!data.supplierId) {
      toast.error("Please select a supplier.");
      return;
    }

    // Update form data with items for validation
    // Ensure all values are properly formatted for backend
    // Note: lineTotal might be calculated on backend, so we'll try without it first
    let itemsData;
    try {
      itemsData = orderItems.map((item) => {
        const itemId = Number(item.itemId);
        const quantity = Math.round(item.quantity);
        const unitCost = Number(item.unitPrice);

        // Validate each value is a valid number
        if (isNaN(itemId) || itemId <= 0) {
          throw new Error(`Invalid item ID: ${item.itemId}`);
        }
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(`Invalid quantity: ${item.quantity}`);
        }
        if (isNaN(unitCost) || unitCost <= 0) {
          throw new Error(`Invalid unit cost: ${item.unitPrice}`);
        }

        // Ensure all values are proper numbers (not strings, not NaN, not Infinity)
        // Use parseFloat to ensure proper numeric conversion
        const lineTotal = parseFloat((unitCost * quantity).toFixed(2));
        const unitCostFormatted = parseFloat(unitCost.toFixed(2));

        // Return item in the exact format expected by backend
        // Based on API spec: itemId, quantity, unitCost, lineTotal
        return {
          itemId: itemId,
          quantity: quantity,
          unitCost: unitCostFormatted,
          lineTotal: lineTotal,
        };
      });
    } catch (mappingError: any) {
      toast.error(mappingError.message || "Error processing items");
      setSubmitLoading(false);
      return;
    }

    console.log("Items data:", itemsData);
    console.log("Items data JSON:", JSON.stringify(itemsData, null, 2));

    setSubmitLoading(true);

    // Ensure supplierId is a valid number
    const supplierId = Number(data.supplierId);
    if (isNaN(supplierId) || supplierId <= 0) {
      toast.error("Please select a valid supplier");
      setSubmitLoading(false);
      return;
    }

    // Validate orderDate format
    if (!data.orderDate || typeof data.orderDate !== "string") {
      toast.error("Please provide a valid order date");
      setSubmitLoading(false);
      return;
    }

    // Ensure payload matches API spec exactly
    const payload: {
      supplierId: number;
      orderDate: string;
      items: Array<{
        itemId: number;
        quantity: number;
        unitCost: number;
        lineTotal: number;
      }>;
    } = {
      supplierId: supplierId,
      orderDate: data.orderDate,
      items: itemsData,
    };

    // Validate payload before sending
    if (!payload.supplierId || payload.supplierId <= 0) {
      toast.error("Please select a valid supplier");
      setSubmitLoading(false);
      return;
    }

    if (!payload.items || payload.items.length === 0) {
      toast.error("Please add at least one item to the order");
      setSubmitLoading(false);
      return;
    }

    // Validate each item
    for (const item of payload.items) {
      if (!item.itemId || item.itemId <= 0) {
        toast.error("All items must have a valid item ID");
        setSubmitLoading(false);
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        toast.error("All items must have a quantity greater than 0");
        setSubmitLoading(false);
        return;
      }
      if (!item.unitCost || item.unitCost <= 0) {
        toast.error("All items must have a unit cost greater than 0");
        setSubmitLoading(false);
        return;
      }
      // lineTotal validation removed - backend might calculate it
    }

    // Final validation - ensure no invalid values
    const validatedPayload = {
      supplierId: payload.supplierId,
      orderDate: payload.orderDate,
      items: payload.items.map((item) => ({
        itemId: Number(item.itemId),
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        lineTotal: Number(item.lineTotal),
      })),
    };

    // Verify all numbers are valid
    if (
      isNaN(validatedPayload.supplierId) ||
      !isFinite(validatedPayload.supplierId)
    ) {
      toast.error("Invalid supplier ID");
      setSubmitLoading(false);
      return;
    }

    for (const item of validatedPayload.items) {
      if (isNaN(item.itemId) || !isFinite(item.itemId) || item.itemId <= 0) {
        toast.error(`Invalid item ID: ${item.itemId}`);
        setSubmitLoading(false);
        return;
      }
      if (
        isNaN(item.quantity) ||
        !isFinite(item.quantity) ||
        item.quantity <= 0
      ) {
        toast.error(`Invalid quantity: ${item.quantity}`);
        setSubmitLoading(false);
        return;
      }
      if (
        isNaN(item.unitCost) ||
        !isFinite(item.unitCost) ||
        item.unitCost <= 0
      ) {
        toast.error(`Invalid unit cost: ${item.unitCost}`);
        setSubmitLoading(false);
        return;
      }
      if (
        isNaN(item.lineTotal) ||
        !isFinite(item.lineTotal) ||
        item.lineTotal <= 0
      ) {
        toast.error(`Invalid line total: ${item.lineTotal}`);
        setSubmitLoading(false);
        return;
      }
    }

    console.log(
      "Sending purchase order payload:",
      JSON.stringify(validatedPayload, null, 2)
    );
    console.log(
      "Payload supplierId type:",
      typeof validatedPayload.supplierId,
      validatedPayload.supplierId
    );
    console.log("Payload items count:", validatedPayload.items.length);
    console.log(
      "First item structure:",
      validatedPayload.items[0]
        ? {
            itemId: validatedPayload.items[0].itemId,
            quantity: validatedPayload.items[0].quantity,
            unitCost: validatedPayload.items[0].unitCost,
            lineTotal: validatedPayload.items[0].lineTotal,
            types: {
              itemId: typeof validatedPayload.items[0].itemId,
              quantity: typeof validatedPayload.items[0].quantity,
              unitCost: typeof validatedPayload.items[0].unitCost,
              lineTotal: typeof validatedPayload.items[0].lineTotal,
            },
          }
        : "no items"
    );

    createPurchaseOrder(validatedPayload)
      .then((created) => {
        toast.success(
          `Purchase order ${created.orderNo} created successfully!`
        );
        // Navigate and trigger refresh by changing pathname
        navigate("/inventory/purchase/orders", { replace: true });
      })
      .catch((error: any) => {
        console.error("Error creating purchase order:", error);
        console.error("Error response data:", error?.response?.data);
        console.error("Error response status:", error?.response?.status);
        console.error(
          "Payload that was sent:",
          JSON.stringify(payload, null, 2)
        );

        // Extract detailed error message
        let errorMessage = "Failed to create purchase order. Please try again.";
        if (error?.response?.data) {
          const errorData = error.response.data;

          // Check for Jackson deserialization errors
          if (
            errorData.message?.includes("Type definition error") ||
            errorData.message?.includes("PurchaseOrderItemDTO")
          ) {
            errorMessage =
              `Backend DTO Mismatch Error: The PurchaseOrderItemDTO cannot be deserialized. ` +
              `\n\nThis is a BACKEND configuration issue. Check:\n` +
              `1. DTO field names match exactly (itemId, quantity, unitCost, lineTotal)\n` +
              `2. DTO has a default constructor\n` +
              `3. Data types are correct (Long, Integer, BigDecimal)\n` +
              `4. @JsonProperty annotations match field names\n\n` +
              `Payload sent: ${JSON.stringify(
                validatedPayload.items[0] || {},
                null,
                2
              )}\n\n` +
              `See BACKEND_FIX_GUIDE.md for detailed instructions.`;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (typeof errorData === "string") {
            errorMessage = errorData;
          } else if (errorData.errors) {
            // Handle validation errors
            const validationErrors = Object.values(errorData.errors)
              .flat()
              .join(", ");
            errorMessage = `Validation errors: ${validationErrors}`;
          }
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast.error(errorMessage, {
          duration: 5000,
        });
      })
      .finally(() => setSubmitLoading(false));
  };

  const totals = calculateTotals();
  const selectedSupplier = vendors.find(
    (v) => String(v.id) === selectedSupplierId
  );

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
            handleSubmit(onSubmit, (errors) => {
              console.error("Form validation errors:", errors);
              const errorCount = Object.keys(errors).length;
              toast.error(
                `Please fix ${errorCount} form error${
                  errorCount > 1 ? "s" : ""
                } before submitting.`
              );
            })(e);
          }}
          className="space-y-6"
        >
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
                      {vendors.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No vendors available
                        </div>
                      ) : vendors.filter((v) => v.active !== false).length ===
                        0 ? (
                        <>
                          <div className="p-2 text-sm text-muted-foreground">
                            No active vendors ({vendors.length} total)
                          </div>
                          {vendors.map((vendor) => (
                            <SelectItem
                              key={vendor.id}
                              value={String(vendor.id)}
                            >
                              {vendor.vendorName} -{" "}
                              {vendor.active ? "Active" : "Inactive"}
                            </SelectItem>
                          ))}
                        </>
                      ) : (
                        vendors
                          .filter((v) => v.active !== false)
                          .map((vendor) => (
                            <SelectItem
                              key={vendor.id}
                              value={String(vendor.id)}
                            >
                              {vendor.vendorName}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.supplierId && (
                    <p className="text-sm text-red-500">
                      {errors.supplierId.message}
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
                  <p className="font-medium">{selectedSupplier.vendorName}</p>
                  {selectedSupplier.street && (
                    <p className="text-sm text-muted-foreground">
                      {selectedSupplier.street}, {selectedSupplier.city},{" "}
                      {selectedSupplier.country}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Phone: {selectedSupplier.phoneNo} | Email:{" "}
                    {selectedSupplier.email}
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
                    onChange={(e) =>
                      setItemQuantity(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemUnitPrice}
                    onChange={(e) =>
                      setItemUnitPrice(parseFloat(e.target.value) || 0)
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
              disabled={
                orderItems.length === 0 || !selectedSupplierId || submitLoading
              }
            >
              {submitLoading ? "Creating..." : "Create Purchase Order"}
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
      )}
    </div>
  );
}
