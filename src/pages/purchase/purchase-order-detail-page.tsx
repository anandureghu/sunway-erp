import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Send,
  Package,
  Link2,
  Trash2,
  RefreshCw,
  Calendar,
  FileText,
  ShoppingCart,
  Building2,
  User,
  LayoutGrid,
  ListOrdered,
  Truck,
} from "lucide-react";
import { format } from "date-fns";
import {
  getPurchaseOrder,
  getPurchaseRequisition,
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
import { isVendorEligibleForPurchase } from "@/lib/vendor-api";
import { enrichPurchaseOrdersWithVendors } from "@/lib/enrich-purchase-orders";
import type { PurchaseOrder } from "@/types/purchase";
import { toast } from "sonner";
import type { RelatedGrRef } from "./components/related-purchase-documents";
import { PageHeader } from "@/components/PageHeader";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import { purchaseLineItemName } from "@/lib/purchase-line-item";
import { getInvoicePdfUrl } from "@/service/invoiceService";
import { cn } from "@/lib/utils";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";

const BASE = "/inventory/purchase";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  ordered: "bg-purple-100 text-purple-800",
  confirmed: "bg-green-100 text-green-800",
  partially_received: "bg-orange-100 text-orange-800",
  received: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function formatStatus(status: string) {
  return status
    .replace("_", " ")
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  if (value == null || value === "" || value === "—") return null;
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <div className="text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

function KpiTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            accent,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

type LocationPostingState = {
  openPostingDialog?: PostingDialogAction;
};

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmCancel } = useConfirmDialog();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [linkedReceipts, setLinkedReceipts] = useState<RelatedGrRef[]>([]);
  const [linkedRequisitionNo, setLinkedRequisitionNo] = useState<string | null>(
    null,
  );
  const [assignSupplierId, setAssignSupplierId] = useState<string>("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [postingDialog, setPostingDialog] =
    useState<PostingDialogAction | null>(null);
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
      setLinkedRequisitionNo(null);
      return;
    }

    if (order.requisitionNo) {
      setLinkedRequisitionNo(order.requisitionNo);
    }

    let cancelled = false;
    const receiptsPromise = getGoodsReceiptsByPurchaseOrder(order.id);
    const requisitionPromise =
      order.requisitionId && !order.requisitionNo
        ? getPurchaseRequisition(order.requisitionId).catch(() => null)
        : Promise.resolve(null);

    Promise.all([receiptsPromise, requisitionPromise])
      .then(([list, requisition]) => {
        if (cancelled) return;
        setLinkedReceipts(
          list.map((r) => ({ id: r.id, receiptNo: r.receiptNo })),
        );
        if (!order.requisitionNo && requisition) {
          setLinkedRequisitionNo(requisition.requisitionNo);
        }
      })
      .catch(() => {
        if (!cancelled) setLinkedReceipts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [order?.id, order?.requisitionId, order?.requisitionNo]);

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
      if (action === "cancel") {
        const hasLinkedPr = Boolean(order.requisitionId);
        if (
          !(await confirmCancel(`order ${order.orderNo}`, {
            title: "Cancel purchase order?",
            description: hasLinkedPr
              ? "Are you sure you want to cancel this PO? The corresponding PR will also be cancelled."
              : `Are you sure you want to cancel order ${order.orderNo}? This cannot be undone.`,
          }))
        ) {
          return;
        }
      }
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
    [order, confirmCancel],
  );

  useEffect(() => {
    const state = location.state as LocationPostingState | null;
    const action = state?.openPostingDialog;
    if (!action || !order || loading) return;
    navigate(location.pathname, { replace: true, state: null });
    if (action === "release" && !order.supplierId) {
      toast.error("Assign a supplier before releasing this purchase order.");
      return;
    }
    if (
      action === "release" &&
      (!order.supplier ||
        !isVendorEligibleForPurchase({
          approved: order.supplier.approved === true,
          rejected: order.supplier.rejected === true,
          active: order.supplier.status === "active",
        }))
    ) {
      toast.error(
        "Only approved and active suppliers can be released on a purchase order.",
      );
      return;
    }
    void openPostingDialog(action);
  }, [
    order?.id,
    order?.supplierId,
    loading,
    location.state,
    location.pathname,
    navigate,
    openPostingDialog,
    order,
  ]);

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
        e?.response?.data?.message || e?.message || "Failed to assign supplier",
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
        toast.success(
          order.requisitionId
            ? "Purchase order cancelled. The linked PR was also cancelled."
            : "Purchase order cancelled.",
        );
      }
      setPostingDialog(null);
      setPostingPreview(null);
      await load();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || postingDialog === "release"
          ? "Failed to release Purchase Order"
          : "Failed to cancel",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceive = () => {
    if (!order) return;
    navigate("/inventory/purchase/inspection", {
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
          <Button
            variant="outline"
            onClick={() => navigate("/inventory/purchase/orders")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const st = (order.status || "").toLowerCase();
  const hasSupplier = Boolean(order.supplierId);
  const supplierEligible =
    hasSupplier &&
    Boolean(order.supplier) &&
    isVendorEligibleForPurchase({
      approved: order.supplier?.approved === true,
      rejected: order.supplier?.rejected === true,
      active: order.supplier?.status === "active",
    });
  const vendorPaymentConfirmed = order.vendorPaymentSettled === true;
  const canAssignSupplier =
    st === "draft" && (!hasSupplier || !supplierEligible);
  const canRelease = st === "draft" && supplierEligible;
  const canCancel = st === "draft" && !vendorPaymentConfirmed;
  const canReceive =
    st === "confirmed" ||
    st === "ordered" ||
    st === "partially_received" ||
    st === "approved";
  const isReleased =
    st === "confirmed" || st === "partially_received" || st === "received";
  const hasPurchaseInvoice = order.purchaseInvoiceId != null;
  const reqId = order.requisitionId;
  const linkedRequisitionLabel =
    order.requisitionNo || linkedRequisitionNo || (reqId ? `PR-${reqId}` : "");
  const supplierDisplayName =
    order.supplierName ||
    (order.supplier as { vendorName?: string })?.vendorName ||
    order.supplier?.name;
  const hasRelated = Boolean(reqId) || linkedReceipts.length > 0;
  const hasWorkflowActions =
    canAssignSupplier ||
    canRelease ||
    canReceive ||
    canCancel ||
    Boolean(reqId) ||
    isReleased;

  return (
    <div className="mx-auto space-y-6 p-6">
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
                STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"
              }
            >
              {formatStatus(order.status)}
            </Badge>
          </>
        }
      />

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiTile
            icon={<Calendar className="h-4 w-4 text-emerald-600" />}
            label="Order date"
            value={
              order.orderDate
                ? format(new Date(order.orderDate), "MMM d, yyyy")
                : "—"
            }
            accent="bg-emerald-50"
          />
          <KpiTile
            icon={<Truck className="h-4 w-4 text-blue-600" />}
            label="Supplier"
            value={supplierDisplayName || "Not assigned"}
            accent="bg-blue-50"
          />
          <KpiTile
            icon={<Package className="h-4 w-4 text-amber-600" />}
            label="Line items"
            value={order.items.length}
            accent="bg-amber-50"
          />
          <KpiTile
            icon={<ShoppingCart className="h-4 w-4 text-violet-600" />}
            label="Order total"
            value={<CurrencyAmount amount={order.total} />}
            accent="bg-violet-50"
          />
        </div>

        {hasWorkflowActions && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-900">Actions</h2>
              <p className="mt-1 text-sm text-slate-500">
                Release sends the order to the supplier and creates accounts
                payable records.
              </p>
            </div>

            {canAssignSupplier && (
              <div className="mb-4 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4">
                <p className="text-sm font-medium text-slate-900">
                  Register supplier
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Only approved and active suppliers from your vendor master can
                  be assigned before release.
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
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
                    className="shrink-0 rounded-lg"
                  >
                    Assign supplier
                  </Button>
                </div>
              </div>
            )}

            {isReleased && !vendorPaymentConfirmed && (
              <div className="mb-4 space-y-2">
                <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-950">
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
                      className="rounded-lg"
                      onClick={() => void handleDownloadPurchaseInvoicePdf()}
                    >
                      Download invoice
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="rounded-lg"
                      asChild
                    >
                      <Link
                        to={`/inventory/purchase/invoices/${order.purchaseInvoiceId}`}
                        state={{
                          backTo: `/inventory/purchase/orders/${order.id}`,
                        }}
                      >
                        Open purchase invoice
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {vendorPaymentConfirmed && hasPurchaseInvoice && (
              <div className="mb-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => void handleDownloadPurchaseInvoicePdf()}
                >
                  Download receipt
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-lg"
                  asChild
                >
                  <Link
                    to={`/inventory/purchase/invoices/${order.purchaseInvoiceId}`}
                    state={{
                      backTo: `/inventory/purchase/orders/${order.id}`,
                    }}
                  >
                    Open receipt
                  </Link>
                </Button>
              </div>
            )}

            {st === "draft" && hasSupplier && !supplierEligible && (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                The assigned supplier must be approved and active before this
                purchase order can be released. Choose an eligible supplier
                below or update the supplier in the vendor master.
              </p>
            )}

            {st === "draft" && !hasSupplier && (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                Assign a supplier above before you can release this purchase
                order.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {canRelease && (
                <Button
                  onClick={() => void openPostingDialog("release")}
                  disabled={actionLoading}
                  className="rounded-lg"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Release to supplier
                </Button>
              )}
              {canReceive && (
                <Button
                  variant="secondary"
                  onClick={handleReceive}
                  className="rounded-lg"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Start inspection
                </Button>
              )}

              {canCancel && (
                <Button
                  variant="destructive"
                  onClick={() => void openPostingDialog("cancel")}
                  disabled={actionLoading}
                  className="rounded-lg"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cancel order
                </Button>
              )}
            </div>
          </div>
        )}

        {releasePreview && st === "draft" && supplierEligible && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Release preview
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {releasePreview.summary}
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Order total</span>
                <CurrencyAmount
                  amount={releasePreview.amount}
                  className="font-semibold"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 rounded-xl border border-white/80 bg-white p-3">
                  <p className="font-medium">Debit (from)</p>
                  <p className="text-xs text-slate-500">
                    {releasePreview.debitAccountCode} —{" "}
                    {releasePreview.debitAccountName}
                  </p>
                  <p className="tabular-nums">
                    <CurrencyAmount
                      amount={releasePreview.debitBalanceBefore ?? 0}
                    />{" "}
                    →{" "}
                    <CurrencyAmount
                      amount={releasePreview.debitBalanceAfter ?? 0}
                    />
                  </p>
                </div>
                <div className="space-y-1 rounded-xl border border-white/80 bg-white p-3">
                  <p className="font-medium">Credit (to)</p>
                  <p className="text-xs text-slate-500">
                    {releasePreview.creditAccountCode} —{" "}
                    {releasePreview.creditAccountName}
                  </p>
                  <p className="tabular-nums">
                    <CurrencyAmount
                      amount={releasePreview.creditBalanceBefore ?? 0}
                    />{" "}
                    →{" "}
                    <CurrencyAmount
                      amount={releasePreview.creditBalanceAfter ?? 0}
                    />
                  </p>
                </div>
              </div>
              {!releasePreview.sufficientFunds && (
                <p className="text-sm text-destructive">
                  {releasePreview.insufficientFundsMessage ||
                    "Insufficient funds on the debit account."}
                </p>
              )}
            </div>
          </div>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4 h-auto w-full justify-start gap-1 rounded-xl bg-slate-100/80 p-1">
            <TabsTrigger
              value="overview"
              className="gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <LayoutGrid className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="items"
              className="gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <ListOrdered className="h-4 w-4" />
              Line items
              {order.items.length > 0 ? ` (${order.items.length})` : ""}
            </TabsTrigger>
            {hasRelated && (
              <TabsTrigger
                value="related"
                className="gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Link2 className="h-4 w-4" />
                Related
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-0 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                Order information
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label="Order number" value={order.orderNo} />
                <DetailField
                  label="Status"
                  value={
                    <Badge
                      className={
                        STATUS_COLORS[order.status] ||
                        "bg-gray-100 text-gray-800"
                      }
                    >
                      {formatStatus(order.status)}
                    </Badge>
                  }
                />
                <DetailField
                  label="Order date"
                  value={
                    order.orderDate
                      ? format(new Date(order.orderDate), "MMM d, yyyy")
                      : null
                  }
                />
                <DetailField
                  label="Required Delivery Date"
                  value={
                    order.requiredDeliveryDate || order.expectedDate
                      ? format(
                          new Date(
                            order.requiredDeliveryDate || order.expectedDate!,
                          ),
                          "MMM d, yyyy",
                        )
                      : null
                  }
                />
                <DetailField
                  label="Requested by"
                  value={order.requestedByName || null}
                />
                <DetailField
                  label="Source requisition"
                  value={
                    reqId ? (
                      <Link
                        className="inline-flex items-center gap-1.5 text-emerald-700 hover:underline"
                        to={`${BASE}/requisitions/${reqId}`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {linkedRequisitionLabel}
                      </Link>
                    ) : null
                  }
                />
                <DetailField
                  label="Created by"
                  value={
                    order.orderedByName ? (
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {order.orderedByName}
                      </span>
                    ) : null
                  }
                />
                <DetailField
                  label="Notes"
                  value={order.notes}
                  className="sm:col-span-2"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                Supplier
              </h2>
              {hasSupplier && supplierDisplayName ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailField
                    label="Supplier Code"
                    value={order.supplier?.code}
                  />
                  <DetailField
                    label="Name"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        {supplierDisplayName}
                      </span>
                    }
                  />
                  <DetailField label="Phone" value={order.supplier?.phone} />
                  <DetailField label="Email" value={order.supplier?.email} />
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No supplier assigned yet. Use Register supplier in Actions
                  when this order is in draft status.
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-slate-900">
                  Totals
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <CurrencyAmount
                      amount={order.subtotal}
                      className="font-medium"
                    />
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tax</span>
                      <CurrencyAmount
                        amount={order.tax}
                        className="font-medium"
                      />
                    </div>
                  )}
                  {order.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Discount</span>
                      <CurrencyAmount
                        amount={order.discount}
                        className="font-medium"
                      />
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                    <span>Total Due</span>
                    <CurrencyAmount amount={order.total} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="items" className="mt-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                Line items
              </h2>
              {order.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <th className="pb-3 pr-4 w-12">Sl No</th>
                        <th className="pb-3 pr-4">Item</th>
                        <th className="pb-3 pr-4 text-right">Qty</th>
                        <th className="pb-3 pr-4 text-right">Item cost</th>
                        <th className="pb-3 pr-4 text-right">Other</th>
                        <th className="pb-3 pr-4 text-right">Applied</th>
                        <th className="pb-3 pr-4 text-right">Line total</th>
                        <th className="pb-3 text-right">Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="py-3 pr-4 tabular-nums text-slate-500">
                            {index + 1}
                          </td>
                          <td className="py-3 pr-4 font-medium text-slate-900">
                            {purchaseLineItemName(item)}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {item.quantity}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            <CurrencyAmount
                              amount={item.actualItemPrice ?? 0}
                            />
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums text-slate-500">
                            <CurrencyAmount amount={item.otherUnitCost ?? 0} />
                          </td>
                          <td className="py-3 pr-4 text-right font-medium tabular-nums">
                            <CurrencyAmount amount={item.unitPrice} />
                          </td>
                          <td className="py-3 pr-4 text-right font-medium tabular-nums">
                            <CurrencyAmount amount={item.total} />
                          </td>
                          <td className="py-3 text-right text-slate-500 tabular-nums">
                            {item.receivedQuantity ?? 0} / {item.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No line items</p>
              )}
            </div>
          </TabsContent>

          {hasRelated && (
            <TabsContent value="related" className="mt-0">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-1 text-sm font-semibold text-slate-900">
                  Linked procurement documents
                </h2>
                <p className="mb-5 text-sm text-slate-500">
                  Source requisition and goods receipts posted against this
                  order.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {reqId && (
                    <Link
                      to={`${BASE}/requisitions/${reqId}`}
                      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50/50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                        <FileText className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Requisition
                        </p>
                        <p className="truncate font-semibold text-slate-900">
                          {linkedRequisitionLabel}
                        </p>
                      </div>
                    </Link>
                  )}

                  <Link
                    to={`${BASE}/orders/${order.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-violet-200 hover:bg-violet-50/50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                      <ShoppingCart className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Purchase order
                      </p>
                      <p className="truncate font-semibold text-slate-900">
                        {order.orderNo}
                      </p>
                    </div>
                  </Link>

                  {linkedReceipts.map((gr) => (
                    <Link
                      key={gr.id}
                      to={`${BASE}/receiving/${gr.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Goods receipt
                        </p>
                        <p className="truncate font-semibold text-slate-900">
                          {gr.receiptNo || `GR-${gr.id}`}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
