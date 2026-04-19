import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Send,
  Package,
  Link2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import {
  getPurchaseOrder,
  confirmPurchaseOrder,
  cancelPurchaseOrder,
  getGoodsReceiptsByPurchaseOrder,
} from "@/service/purchaseFlowService";
import { listVendors } from "@/service/vendorService";
import { enrichPurchaseOrdersWithVendors } from "@/lib/enrich-purchase-orders";
import type { PurchaseOrder } from "@/types/purchase";
import { toast } from "sonner";
import { RelatedPurchaseDocumentsCard } from "./components/related-purchase-documents";
import type { RelatedGrRef } from "./components/related-purchase-documents";

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [linkedReceipts, setLinkedReceipts] = useState<RelatedGrRef[]>([]);

  const load = useCallback(async () => {
    if (!id) {
      setError("Order ID is required");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const raw = await getPurchaseOrder(id);
      const vendors = await listVendors();
      const [enriched] = enrichPurchaseOrdersWithVendors([raw], vendors);
      setOrder(enriched);
    } catch (e: any) {
      const errorMessage =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load purchase order";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!order?.id) {
      setLinkedReceipts([]);
      return;
    }
    let cancelled = false;
    getGoodsReceiptsByPurchaseOrder(order.id)
      .then((list) => {
        if (!cancelled) {
          setLinkedReceipts(
            list.map((r) => ({ id: r.id, receiptNo: r.receiptNo })),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setLinkedReceipts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [order?.id]);

  const handleRelease = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      await confirmPurchaseOrder(order.id);
      toast.success("Purchase order released to supplier.");
      await load();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to release PO",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    if (order.status !== "draft") {
      toast.error("Only draft orders can be cancelled.");
      return;
    }
    if (
      !confirm(
        `Cancel ${order.orderNo}? This cannot be undone.`,
      )
    ) {
      return;
    }
    setActionLoading(true);
    try {
      await cancelPurchaseOrder(order.id);
      toast.success("Purchase order cancelled.");
      await load();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to cancel",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceive = () => {
    if (!order) return;
    navigate("/inventory/purchase/receiving", {
      state: { openReceiveForOrderId: order.id },
    });
  };

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

  const st = (order.status || "").toLowerCase();
  const vendorPaymentOk = order.vendorPaymentSettled !== false;
  const canRelease = st === "draft" && vendorPaymentOk;
  const canCancel = st === "draft";
  const canReceive =
    st === "confirmed" ||
    st === "ordered" ||
    st === "partially_received" ||
    st === "approved";
  const reqId = order.requisitionId;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{order.orderNo}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Purchase order — release when ready, then record receipts against
              this PO
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={statusColors[order.status] || "bg-gray-100 text-gray-800"}
          >
            {order.status
              .replace("_", " ")
              .split(" ")
              .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
              .join(" ")}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border-primary/20 bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Actions</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Release sends the PO to the supplier (confirms it). Receiving posts
            goods against this order. Vendor payment must be confirmed under
            Finance → Accounts payable → Vendor payments first.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {st === "draft" && !vendorPaymentOk && (
            <p className="text-sm rounded-md border border-amber-200 bg-amber-50 text-amber-950 px-3 py-2">
              Confirm the vendor payable in{" "}
              <strong>Finance → Accounts payable → Vendor payments</strong>{" "}
              (use <em>Confirm vendor payment</em>) before you can release this
              PO to the supplier.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
          {canRelease && (
            <Button
              onClick={() => void handleRelease()}
              disabled={actionLoading}
            >
              <Send className="mr-2 h-4 w-4" />
              Release to supplier
            </Button>
          )}
          {canReceive && (
            <Button variant="secondary" onClick={handleReceive}>
              <Package className="mr-2 h-4 w-4" />
              Record receipt
            </Button>
          )}
          {reqId && (
            <Button variant="outline" asChild>
              <Link to={`/inventory/purchase/requisitions/${reqId}`}>
                <Link2 className="mr-2 h-4 w-4" />
                View requisition
              </Link>
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => void handleCancel()}
              disabled={actionLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Cancel order
            </Button>
          )}
          {!canRelease && !canReceive && !canCancel && !reqId && (
            <p className="text-sm text-muted-foreground py-1">
              No actions for this status.
            </p>
          )}
          </div>
        </CardContent>
      </Card>

      <RelatedPurchaseDocumentsCard
        context="po"
        requisitionId={order.requisitionId}
        purchaseOrderId={order.id}
        goodsReceipts={linkedReceipts}
      />

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Order number</p>
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
              <p className="text-sm text-muted-foreground">Order date</p>
              <p className="font-medium">
                {order.orderDate
                  ? format(new Date(order.orderDate), "MMM dd, yyyy")
                  : "N/A"}
              </p>
            </div>
            {order.expectedDate && (
              <div>
                <p className="text-sm text-muted-foreground">Expected date</p>
                <p className="font-medium">
                  {format(new Date(order.expectedDate), "MMM dd, yyyy")}
                </p>
              </div>
            )}
            {reqId && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Source</p>
                <Link
                  className="font-medium text-primary underline"
                  to={`/inventory/purchase/requisitions/${reqId}`}
                >
                  Requisition #{reqId}
                </Link>
              </div>
            )}
            {order.orderedByName && (
              <div>
                <p className="text-sm text-muted-foreground">Created by</p>
                <p className="font-medium">{order.orderedByName}</p>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Supplier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.supplier ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">
                  {(order.supplier as { vendorName?: string }).vendorName ||
                    order.supplier.name ||
                    "N/A"}
                </p>
              </div>
              {order.supplier.code && (
                <div>
                  <p className="text-sm text-muted-foreground">Code</p>
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
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Supplier details load from vendor master when available.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line items</CardTitle>
        </CardHeader>
        <CardContent>
          {order.items.length > 0 ? (
            <div className="space-y-3 overflow-x-auto">
              <div className="grid grid-cols-7 gap-2 sm:gap-3 font-medium text-sm border-b pb-2 min-w-[720px]">
                <div>Item</div>
                <div className="text-right">Qty</div>
                <div className="text-right">Item cost</div>
                <div className="text-right">Other</div>
                <div className="text-right">Applied</div>
                <div className="text-right">Line total</div>
                <div className="text-right">Received</div>
              </div>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-7 gap-2 sm:gap-3 text-sm border-b pb-2 min-w-[720px]"
                >
                  <div>
                    <p className="font-medium">Item #{item.itemId}</p>
                  </div>
                  <div className="text-right">{item.quantity}</div>
                  <div className="text-right tabular-nums">
                    {item.actualItemPrice != null
                      ? `₹${item.actualItemPrice.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : "—"}
                  </div>
                  <div className="text-right tabular-nums text-muted-foreground">
                    {item.otherUnitCost != null &&
                    item.otherUnitCost > 0
                      ? `₹${item.otherUnitCost.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : "—"}
                  </div>
                  <div className="text-right tabular-nums font-medium">
                    ₹{item.unitPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-right font-medium tabular-nums">
                    ₹{item.total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-right text-muted-foreground">
                    {item.receivedQuantity ?? 0} / {item.quantity}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No line items</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium">
                ₹{order.subtotal.toLocaleString()}
              </span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-medium">
                  ₹{order.tax.toLocaleString()}
                </span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="font-medium">
                  ₹{order.discount.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>₹{order.total.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
