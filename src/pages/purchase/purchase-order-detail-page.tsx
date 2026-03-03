import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { getPurchaseOrder } from "@/service/purchaseFlowService";
import type { PurchaseOrder } from "@/types/purchase";
import { toast } from "sonner";

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Order ID is required");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const orderData = await getPurchaseOrder(id);
        if (!cancelled) {
          setOrder(orderData);
        }
      } catch (e: any) {
        if (!cancelled) {
          const errorMessage =
            e?.response?.data?.message ||
            e?.message ||
            "Failed to load purchase order";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="py-10 text-center text-muted-foreground">
          Loading purchase order...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="py-10 text-center space-y-4">
          <div className="text-red-600 font-medium">
            {error || "Purchase order not found"}
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    ordered: "bg-purple-100 text-purple-800",
    confirmed: "bg-green-100 text-green-800",
    partially_received: "bg-orange-100 text-orange-800",
    received: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Purchase Order - {order.orderNo}
            </h1>
            <p className="text-muted-foreground">
              Complete information about this purchase order
            </p>
          </div>
        </div>
        <Badge
          className={statusColors[order.status] || "bg-gray-100 text-gray-800"}
        >
          {order.status
            .replace("_", " ")
            .split(" ")
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(" ")}
        </Badge>
      </div>

      {/* Order Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-medium">{order.orderNo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                className={
                  statusColors[order.status] || "bg-gray-100 text-gray-800"
                }
              >
                {order.status
                  .replace("_", " ")
                  .split(" ")
                  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                  .join(" ")}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="font-medium">
                {order.orderDate
                  ? format(new Date(order.orderDate), "MMM dd, yyyy")
                  : "N/A"}
              </p>
            </div>
            {order.expectedDate && (
              <div>
                <p className="text-sm text-muted-foreground">Expected Date</p>
                <p className="font-medium">
                  {format(new Date(order.expectedDate), "MMM dd, yyyy")}
                </p>
              </div>
            )}
            {order.orderedByName && (
              <div>
                <p className="text-sm text-muted-foreground">Ordered By</p>
                <p className="font-medium">{order.orderedByName}</p>
              </div>
            )}
            {order.approvedByName && (
              <div>
                <p className="text-sm text-muted-foreground">Approved By</p>
                <p className="font-medium">{order.approvedByName}</p>
              </div>
            )}
          </div>
          {order.notes && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="font-medium">{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplier Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Supplier Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.supplier ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Supplier Name</p>
                <p className="font-medium">
                  {(order.supplier as any)?.vendorName ||
                    (order.supplier as any)?.name ||
                    "N/A"}
                </p>
              </div>
              {order.supplier.code && (
                <div>
                  <p className="text-sm text-muted-foreground">Supplier Code</p>
                  <p className="font-medium">{order.supplier.code}</p>
                </div>
              )}
              {order.supplier.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{order.supplier.email}</p>
                </div>
              )}
              {order.supplier.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.supplier.phone}</p>
                </div>
              )}
              {order.shippingAddress && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Shipping Address
                  </p>
                  <p className="font-medium">{order.shippingAddress}</p>
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
          {order.items.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-4 font-medium text-sm border-b pb-2">
                <div>Item</div>
                <div className="text-right">Quantity</div>
                <div className="text-right">Unit Price</div>
                <div className="text-right">Total</div>
                <div className="text-right">Received</div>
              </div>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-5 gap-4 text-sm border-b pb-2"
                >
                  <div>
                    <p className="font-medium">
                      {item.item?.itemId || `Item ${item.itemId}`}
                    </p>
                    {item.item?.itemId && (
                      <p className="text-xs text-muted-foreground">
                        SKU: {item.item.itemId}
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
                  <div className="text-right text-muted-foreground">
                    {item.receivedQuantity || 0} / {item.quantity}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No items in this order</p>
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
                ₹{order.subtotal.toLocaleString()}
              </span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between">
                <span>Tax:</span>
                <span className="font-medium">
                  ₹{order.tax.toLocaleString()}
                </span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span className="font-medium">
                  ₹{order.discount.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>₹{order.total.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
