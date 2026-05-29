import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
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
  assignPurchaseOrderSupplier,
  confirmPurchaseOrder,
  cancelPurchaseOrder,
  getGoodsReceiptsByPurchaseOrder,
  getPurchaseOrderPostingPreview,
} from "@/service/purchaseFlowService";
import {
  PurchaseOrderPostingDialog,
  type PostingDialogAction,
} from "./components/purchase-order-posting-dialog";
import type { PurchaseOrderPostingPreview } from "@/types/purchase";
import SelectVendor from "@/components/select-vendor";
import { listVendors } from "@/service/vendorService";
import { enrichPurchaseOrdersWithVendors } from "@/lib/enrich-purchase-orders";
import type { PurchaseOrder } from "@/types/purchase";
import { toast } from "sonner";
import {
  RelatedPurchaseDocumentsCard,
  type RelatedGrRef,
} from "./components/related-purchase-documents";
import { PageHeader } from "@/components/PageHeader";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import { purchaseLineItemName } from "@/lib/purchase-line-item";
import { getInvoicePdfUrl } from "@/service/invoiceService";

type LocationPostingState = {
  openPostingDialog?: PostingDialogAction;
};

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [linkedReceipts, setLinkedReceipts] = useState<RelatedGrRef[]>([]);
  const [assignSupplierId, setAssignSupplierId] = useState<string>("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [postingDialog, setPostingDialog] = useState<PostingDialogAction | null>(
    null,
  );
  const [postingPreview, setPostingPreview] =
    useState<PurchaseOrderPostingPreview | null>(null);
  const [postingPreviewLoading, setPostingPreviewLoading] = useState(false);
  const [releasePreview, setReleasePreview] =
    useState<PurchaseOrderPostingPreview | null>(null);

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

  const loadReleasePreview = useCallback(async (orderId: string) => {
    try {
      const preview = await getPurchaseOrderPostingPreview(orderId, "release");
      setReleasePreview(preview);
    } catch {
      setReleasePreview(null);
    }
  }, []);

  useEffect(() => {
    if (!order?.id) {
      setReleasePreview(null);
      return;
    }
    const st = (order.status || "").toLowerCase();
    if (st === "draft" && order.supplierId) {
      void loadReleasePreview(order.id);
    } else {
      setReleasePreview(null);
    }
  }, [order?.id, order?.status, order?.supplierId, loadReleasePreview]);

  const openPostingDialog = useCallback(
    async (action: PostingDialogAction) => {
      if (!order) return;
      setPostingDialog(action);
      setPostingPreview(null);
      setPostingPreviewLoading(true);
      try {
        const preview = await getPurchaseOrderPostingPreview(order.id, action);
        setPostingPreview(preview);
      } catch (e: any) {
        toast.error(
          e?.response?.data?.message ||
            e?.message ||
            "Could not load account impact preview",
        );
        setPostingDialog(null);
      } finally {
        setPostingPreviewLoading(false);
      }
    },
    [order],
  );

  useEffect(() => {
    const state = location.state as LocationPostingState | null;
    const action = state?.openPostingDialog;
    if (!action || !order || loading) return;
    navigate(location.pathname, { replace: true, state: null });
    void openPostingDialog(action);
  }, [order?.id, loading, location.state, location.pathname, navigate, openPostingDialog, order]);

  const handleAssignSupplier = async () => {
    if (!order || !assignSupplierId) {
      toast.error("Select a supplier to assign.");
      return;
    }
    setAssignLoading(true);
    try {
      await assignPurchaseOrderSupplier(order.id, Number(assignSupplierId));
      toast.success("Supplier assigned to purchase order.");
      await load();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to assign supplier",
      );
    } finally {
      setAssignLoading(false);
    }
  };

  const handlePostingConfirm = async () => {
    if (!order || !postingDialog) return;
    setActionLoading(true);
    try {
      if (postingDialog === "release") {
        await confirmPurchaseOrder(order.id);
        toast.success("Purchase order released to supplier.");
      } else {
        await cancelPurchaseOrder(order.id);
        toast.success("Purchase order cancelled.");
      }
      setPostingDialog(null);
      setPostingPreview(null);
      await load();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.message ||
          postingDialog === "release"
            ? "Failed to release Purchase Order"
            : "Failed to cancel",
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

  const handleDownloadPurchaseInvoicePdf = async () => {
    if (!order?.purchaseInvoiceId) return;
    try {
      const url = await getInvoicePdfUrl(order.purchaseInvoiceId);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else toast.error("Invoice PDF is not available yet.");
    } catch {
      toast.error("Could not download invoice.");
    }
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
  const hasSupplier = Boolean(order.supplierId);
  const vendorPaymentConfirmed = order.vendorPaymentSettled === true;
  const canAssignSupplier = st === "draft" && !hasSupplier;
  const canRelease = st === "draft" && hasSupplier;
  const canCancel = st === "draft" && !vendorPaymentConfirmed;
  const canReceive =
    st === "confirmed" ||
    st === "ordered" ||
    st === "partially_received" ||
    st === "approved";
  const isReleased =
    st === "confirmed" ||
    st === "partially_received" ||
    st === "received";
  const hasPurchaseInvoice = order.purchaseInvoiceId != null;
  const reqId = order.requisitionId;

  return (
    <div className="mx-auto space-y-6 p-4 sm:p-6">
      <PurchaseOrderPostingDialog
        open={postingDialog != null}
        onOpenChange={(open) => {
          if (!open) {
            setPostingDialog(null);
            setPostingPreview(null);
          }
        }}
        action={postingDialog ?? "release"}
        orderNo={order.orderNo}
        preview={postingPreview}
        loading={postingPreviewLoading}
        confirming={actionLoading}
        onConfirm={handlePostingConfirm}
      />
      <PageHeader
        variant="darkGreen"
        title={order.orderNo}
        description="Release when ready, then record receipts against this Purchase Order."
        backHref="/inventory/purchase/orders"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              Refresh
            </Button>
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
          </>
        }
      />

      <Card className="border-primary/20 bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Actions</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Release commits funds from the requisition debit/credit accounts and
            sends the order to the supplier. Pay the vendor under Finance →
            Accounts payable → Vendor payments after release (or when ready).
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {canAssignSupplier && (
            <div className="rounded-md border border-dashed border-primary/40 bg-background p-4 space-y-3">
              <p className="text-sm font-medium">Register supplier</p>
              <p className="text-sm text-muted-foreground">
                Select a vendor from your supplier master and assign them to
                this draft purchase order before release.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="flex-1 min-w-0">
                  <SelectVendor
                    label="Supplier"
                    value={assignSupplierId || undefined}
                    onChange={setAssignSupplierId}
                    placeholder="Select supplier"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => void handleAssignSupplier()}
                  disabled={assignLoading || !assignSupplierId}
                  className="shrink-0"
                >
                  Assign supplier
                </Button>
              </div>
            </div>
          )}
          {isReleased && !vendorPaymentConfirmed && (
            <div className="space-y-2">
              <p className="text-sm rounded-md border border-blue-200 bg-blue-50 text-blue-950 px-3 py-2">
                This order is released to the supplier. Process payment in{" "}
                <strong>Finance → Accounts payable → Vendor payments</strong>.
                Match the supplier invoice to the system-generated purchase
                invoice under Purchase invoices before confirming payment.
              </p>
              {hasPurchaseInvoice && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleDownloadPurchaseInvoicePdf()}
                  >
                    Download invoice
                  </Button>
                  <Button type="button" variant="secondary" size="sm" asChild>
                    <Link
                      to={`/inventory/purchase/invoices/${order.purchaseInvoiceId}`}
                    >
                      Open purchase invoice
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
          {vendorPaymentConfirmed && hasPurchaseInvoice && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleDownloadPurchaseInvoicePdf()}
              >
                Download receipt
              </Button>
              <Button type="button" variant="secondary" size="sm" asChild>
                <Link
                  to={`/inventory/purchase/invoices/${order.purchaseInvoiceId}`}
                >
                  Open receipt
                </Link>
              </Button>
            </div>
          )}
          {st === "draft" && !hasSupplier && (
            <p className="text-sm rounded-md border border-amber-200 bg-amber-50 text-amber-950 px-3 py-2">
              Assign a supplier above before you can release this purchase
              order.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {canRelease && (
              <Button
                onClick={() => void openPostingDialog("release")}
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
                onClick={() => void openPostingDialog("cancel")}
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

      {releasePreview && st === "draft" && hasSupplier && (
        <Card className="border-primary/25">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Fund commitment preview</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              {releasePreview.summary}
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order total</span>
              <CurrencyAmount
                amount={releasePreview.amount}
                className="font-semibold"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border p-3 space-y-1">
                <p className="font-medium">Debit (from)</p>
                <p className="text-muted-foreground text-xs">
                  {releasePreview.debitAccountCode} —{" "}
                  {releasePreview.debitAccountName}
                </p>
                <p className="tabular-nums">
                  <CurrencyAmount amount={releasePreview.debitBalanceBefore ?? 0} />{" "}
                  →{" "}
                  <CurrencyAmount amount={releasePreview.debitBalanceAfter ?? 0} />
                </p>
              </div>
              <div className="rounded-md border p-3 space-y-1">
                <p className="font-medium">Credit (to)</p>
                <p className="text-muted-foreground text-xs">
                  {releasePreview.creditAccountCode} —{" "}
                  {releasePreview.creditAccountName}
                </p>
                <p className="tabular-nums">
                  <CurrencyAmount amount={releasePreview.creditBalanceBefore ?? 0} />{" "}
                  →{" "}
                  <CurrencyAmount amount={releasePreview.creditBalanceAfter ?? 0} />
                </p>
              </div>
            </div>
            {!releasePreview.sufficientFunds && (
              <p className="text-destructive text-sm">
                {releasePreview.insufficientFundsMessage ||
                  "Insufficient funds on the debit account."}
              </p>
            )}
          </CardContent>
        </Card>
      )}

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
          {hasSupplier && (order.supplier || order.supplierName) ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">
                  {order.supplierName ||
                    (order.supplier as { vendorName?: string })?.vendorName ||
                    order.supplier?.name ||
                    "N/A"}
                </p>
              </div>
              {order.supplier?.code && (
                <div>
                  <p className="text-sm text-muted-foreground">Code</p>
                  <p className="font-medium">{order.supplier.code}</p>
                </div>
              )}
              {order.supplier?.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{order.supplier.email}</p>
                </div>
              )}
              {order.supplier?.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.supplier.phone}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              No supplier assigned yet. Use Register supplier in Actions when
              this order is in draft status.
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
                    <p className="font-medium">{purchaseLineItemName(item)}</p>
                  </div>
                  <div className="text-right">{item.quantity}</div>
                  <div className="text-right tabular-nums">
                    <CurrencyAmount amount={item.actualItemPrice ?? 0} />
                  </div>
                  <div className="text-right tabular-nums text-muted-foreground">
                    <CurrencyAmount amount={item.otherUnitCost ?? 0} />
                  </div>
                  <div className="text-right tabular-nums font-medium">
                    <CurrencyAmount amount={item.unitPrice} />
                  </div>
                  <div className="text-right font-medium tabular-nums">
                    <CurrencyAmount amount={item.total} />
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
                <CurrencyAmount amount={order.subtotal} />
              </span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-medium">
                  <CurrencyAmount amount={order.tax} />
                </span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="font-medium">
                  <CurrencyAmount amount={order.discount} />
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>
                <CurrencyAmount amount={order.total} />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
