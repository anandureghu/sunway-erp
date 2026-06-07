import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  ShoppingCart,
  RefreshCw,
  Undo2,
  XCircle,
  Pencil,
  FileText,
  Package,
  Paperclip,
  Calendar,
  User,
  Building2,
  AlertTriangle,
  ListOrdered,
  Link2,
  LayoutGrid,
} from "lucide-react";
import { format } from "date-fns";
import {
  getPurchaseRequisition,
  submitPurchaseRequisition,
  approvePurchaseRequisition,
  rejectPurchaseRequisition,
  sendBackPurchaseRequisition,
  revisePurchaseRequisition,
  getGoodsReceiptsByPurchaseOrder,
} from "@/service/purchaseFlowService";
import {
  PurchaseRequisitionReviewDialog,
  type ReviewActionType,
} from "./components/purchase-requisition-review-dialog";
import type { PurchaseRequisition } from "@/types/purchase";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { purchaseLineItemName } from "@/lib/purchase-line-item";
import { PurchaseRequisitionDocuments } from "./components/purchase-requisition-documents";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import type { RelatedGrRef } from "./components/related-purchase-documents";
import type { PurchaseRequisitionDocument } from "@/types/purchase";
import { cn } from "@/lib/utils";

const BASE = "/inventory/purchase";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-amber-100 text-amber-900",
  converted: "bg-violet-100 text-violet-900",
  rejected: "bg-red-100 text-red-800",
};

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

export default function PurchaseRequisitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [requisition, setRequisition] = useState<PurchaseRequisition | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [linkedReceipts, setLinkedReceipts] = useState<RelatedGrRef[]>([]);
  const [reviewDialog, setReviewDialog] = useState<ReviewActionType | null>(
    null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [documentsRevealed, setDocumentsRevealed] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setError("Requisition ID is required");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const found = await getPurchaseRequisition(id);
      setRequisition(found);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load purchase requisition";
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
    const poId = requisition?.createdPurchaseOrderId;
    if (!poId) {
      setLinkedReceipts([]);
      return;
    }
    let cancelled = false;
    getGoodsReceiptsByPurchaseOrder(poId)
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
  }, [requisition?.createdPurchaseOrderId]);

  const handleSubmit = async () => {
    if (!requisition) return;
    setSubmitError(null);
    setActionLoading(true);
    try {
      await submitPurchaseRequisition(requisition.id);
      toast.success("Submitted for approval.");
      await load();
    } catch (e: unknown) {
      const msg = getApiErrorMessage(e, "Failed to submit");
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewConfirm = async (comments: string) => {
    if (!requisition || !reviewDialog) return;
    setActionLoading(true);
    try {
      if (reviewDialog === "reject") {
        await rejectPurchaseRequisition(requisition.id, comments);
        toast.success("Requisition rejected. The requester can revise and resubmit.");
      } else {
        await sendBackPurchaseRequisition(requisition.id, comments);
        toast.success("Sent back to requester for revision.");
      }
      setReviewDialog(null);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(
        err?.response?.data?.message || err?.message || "Action failed",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevise = async () => {
    if (!requisition) return;
    setActionLoading(true);
    try {
      await revisePurchaseRequisition(requisition.id);
      toast.success("Requisition reopened for editing.");
      navigate(`${BASE}/requisitions/${requisition.id}/edit`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to start revision",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!requisition) return;
    if (
      !confirm(
        "Approve this requisition? A draft purchase order will be created. Assign the supplier on the PO before release.",
      )
    ) {
      return;
    }
    setActionLoading(true);
    try {
      const updated = await approvePurchaseRequisition(requisition.id);
      toast.success("Approved — draft purchase order created.", {
        action:
          updated.createdPurchaseOrderId != null
            ? {
                label: "Open Purchase Order",
                onClick: () =>
                  navigate(`${BASE}/orders/${updated.createdPurchaseOrderId}`),
              }
            : undefined,
      });
      await load();
      setActiveTab("related");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to approve",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openDocumentsTab = () => {
    setDocumentsRevealed(true);
    setActiveTab("documents");
  };

  const handleDocumentsChange = (documents: PurchaseRequisitionDocument[]) => {
    setRequisition((prev) => (prev ? { ...prev, documents } : prev));
    setDocumentsRevealed(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-slate-50/60 p-6">
        <p className="text-sm text-muted-foreground">
          Loading purchase requisition…
        </p>
      </div>
    );
  }

  if (error || !requisition) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-slate-50/60 p-6">
        <p className="font-medium text-red-600">
          {error || "Purchase requisition not found"}
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
      </div>
    );
  }

  const canSubmit = requisition.status === "draft";
  const canApprove = requisition.status === "submitted";
  const canRejectOrSendBack = requisition.status === "submitted";
  const canRevise = requisition.status === "rejected";
  const canEdit = requisition.status === "draft";
  const showOpenPo =
    requisition.status === "converted" && requisition.createdPurchaseOrderId;
  const documentsReadOnly =
    Boolean(requisition.archived) || requisition.status !== "draft";
  const reviewFeedbackLabel =
    requisition.reviewAction === "send_back"
      ? "Sent back for revision"
      : "Reviewer feedback";
  const documentCount = requisition.documents?.length ?? 0;
  const hasRelated =
    Boolean(requisition.createdPurchaseOrderId) || linkedReceipts.length > 0;
  const showDocumentsTab = documentsRevealed || documentCount > 0;

  const hasWorkflowActions =
    canSubmit ||
    canApprove ||
    canRejectOrSendBack ||
    canRevise ||
    canEdit ||
    Boolean(showOpenPo);

  const deliveryDate =
    requisition.requiredDeliveryDate || requisition.requiredDate;

  const statusLabel =
    requisition.status.charAt(0).toUpperCase() + requisition.status.slice(1);

  return (
    <div className="mx-auto space-y-6 p-6">
      <PurchaseRequisitionReviewDialog
        open={reviewDialog != null}
        onOpenChange={(open) => {
          if (!open) setReviewDialog(null);
        }}
        action={reviewDialog ?? "send_back"}
        requisitionNo={requisition.requisitionNo}
        loading={actionLoading}
        onConfirm={handleReviewConfirm}
      />

      <SecondaryPageHeader
        title={requisition.requisitionNo}
        description="Draft → submit for approval → approve to generate a Purchase Order."
        backHref={`${BASE}/requisitions`}
        variant="emerald"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              className="border border-green-600 bg-green-600 text-white hover:bg-green-700"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              Refresh
            </Button>
            <Badge
              className={
                STATUS_COLORS[requisition.status] || "bg-gray-100 text-gray-800"
              }
            >
              {statusLabel}
            </Badge>
          </>
        }
      />

      <div className="space-y-5">
        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiTile
            icon={<Calendar className="h-4 w-4 text-emerald-600" />}
            label="Requested"
            value={
              requisition.requestedDate
                ? format(new Date(requisition.requestedDate), "MMM d, yyyy")
                : "—"
            }
            accent="bg-emerald-50"
          />
          <KpiTile
            icon={<Package className="h-4 w-4 text-blue-600" />}
            label="Line items"
            value={requisition.items.length}
            accent="bg-blue-50"
          />
          <KpiTile
            icon={<Calendar className="h-4 w-4 text-amber-600" />}
            label="Required delivery"
            value={
              deliveryDate
                ? format(new Date(deliveryDate), "MMM d, yyyy")
                : "—"
            }
            accent="bg-amber-50"
          />
          <KpiTile
            icon={<FileText className="h-4 w-4 text-violet-600" />}
            label="Est. total"
            value={
              requisition.totalAmount != null && requisition.totalAmount > 0
                ? requisition.totalAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "—"
            }
            accent="bg-violet-50"
          />
        </div>

        {/* Workflow actions */}
        {hasWorkflowActions && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {submitError && (
              <div
                role="alert"
                className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {submitError}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {canSubmit && (
                <Button
                  onClick={() => void handleSubmit()}
                  disabled={actionLoading}
                  className="rounded-lg"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit for approval
                </Button>
              )}
              {canApprove && (
                <Button
                  onClick={() => void handleApprove()}
                  disabled={actionLoading}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve & create PO
                </Button>
              )}
              {canRejectOrSendBack && (
                <>
                  <Button
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => setReviewDialog("send_back")}
                    disabled={actionLoading}
                  >
                    <Undo2 className="mr-2 h-4 w-4" />
                    Send back
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-lg"
                    onClick={() => setReviewDialog("reject")}
                    disabled={actionLoading}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}
              {canRevise && (
                <Button
                  onClick={() => void handleRevise()}
                  disabled={actionLoading}
                  className="rounded-lg"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Revise & edit
                </Button>
              )}
              {canEdit && (
                <Button asChild variant="outline" className="rounded-lg" disabled={actionLoading}>
                  <Link to={`${BASE}/requisitions/${requisition.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit draft
                  </Link>
                </Button>
              )}
              {showOpenPo && (
                <Button asChild variant="secondary" className="rounded-lg">
                  <Link to={`${BASE}/orders/${requisition.createdPurchaseOrderId}`}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Open purchase order
                  </Link>
                </Button>
              )}
              {(canEdit || documentCount > 0) && (
                <Button
                  variant="outline"
                  className="rounded-lg"
                  onClick={openDocumentsTab}
                >
                  <Paperclip className="mr-2 h-4 w-4" />
                  Attachments
                  {documentCount > 0 ? ` (${documentCount})` : ""}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Reviewer feedback */}
        {requisition.status === "rejected" && requisition.rejectionReason && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-amber-900">
                  {reviewFeedbackLabel}
                </p>
                <p className="whitespace-pre-wrap text-amber-950/90">
                  {requisition.rejectionReason}
                </p>
                {(requisition.rejectedByName || requisition.rejectedAt) && (
                  <p className="text-xs text-amber-800/70">
                    {[
                      requisition.rejectedByName,
                      requisition.rejectedAt
                        ? format(
                            new Date(requisition.rejectedAt),
                            "MMM d, yyyy · HH:mm",
                          )
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabbed content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-white p-1 shadow-sm border border-slate-200">
            <TabsTrigger value="overview" className="gap-2 rounded-lg">
              <LayoutGrid className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-2 rounded-lg">
              <ListOrdered className="h-3.5 w-3.5" />
              Line items
              <span className="text-xs text-muted-foreground">
                ({requisition.items.length})
              </span>
            </TabsTrigger>
            {hasRelated && (
              <TabsTrigger value="related" className="gap-2 rounded-lg">
                <Link2 className="h-3.5 w-3.5" />
                Related
              </TabsTrigger>
            )}
            {showDocumentsTab && (
              <TabsTrigger value="documents" className="gap-2 rounded-lg">
                <Paperclip className="h-3.5 w-3.5" />
                Documents
                {documentCount > 0 && (
                  <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                    {documentCount}
                  </span>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Requisition details
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label="Requisition number" value={requisition.requisitionNo} />
                <DetailField label="Status" value={statusLabel} />
                <DetailField
                  label="Requested by"
                  value={
                    requisition.requestedByName ? (
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {requisition.requestedByName}
                      </span>
                    ) : null
                  }
                />
                <DetailField
                  label="Department"
                  value={
                    requisition.departmentName || requisition.department ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        {requisition.departmentName || requisition.department}
                      </span>
                    ) : null
                  }
                />
                <DetailField label="Project code" value={requisition.projectCode} />
                <DetailField
                  label="Delivery location"
                  value={requisition.deliveryWarehouseName}
                />
                <DetailField
                  label="Required-by date"
                  value={
                    requisition.requiredByDate
                      ? format(new Date(requisition.requiredByDate), "MMM d, yyyy")
                      : null
                  }
                />
                <DetailField
                  label="Converted"
                  value={
                    requisition.convertedAt
                      ? format(new Date(requisition.convertedAt), "MMM d, yyyy")
                      : null
                  }
                />
                <DetailField label="Approved by" value={requisition.approvedByName} />
                <DetailField
                  label="Approved date"
                  value={
                    requisition.approvedDate
                      ? format(new Date(requisition.approvedDate), "MMM d, yyyy")
                      : null
                  }
                />
                {requisition.financeTransactionId && (
                  <DetailField
                    label="Finance transaction"
                    value={
                      <span className="font-mono">
                        #{requisition.financeTransactionId}
                      </span>
                    }
                  />
                )}
                {requisition.rejectionReason &&
                  requisition.status !== "rejected" && (
                    <DetailField
                      label="Reviewer comments"
                      value={requisition.rejectionReason}
                      className="sm:col-span-2 lg:col-span-3"
                    />
                  )}
              </div>

              {(requisition.requisitionDescription ||
                requisition.justification ||
                requisition.notes) && (
                <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
                  <DetailField
                    label="Description"
                    value={requisition.requisitionDescription}
                    className="sm:col-span-2"
                  />
                  <DetailField
                    label="Justification"
                    value={requisition.justification}
                    className="sm:col-span-2"
                  />
                  <DetailField
                    label="Notes"
                    value={requisition.notes}
                    className="sm:col-span-2"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="items" className="mt-0">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {requisition.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Item cost</th>
                        <th className="px-4 py-3 text-right">Other</th>
                        <th className="px-4 py-3 text-right">Applied</th>
                        <th className="px-4 py-3 text-right">Est. total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requisition.items.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={cn(
                            "border-b border-slate-50 transition-colors hover:bg-slate-50/50",
                            idx % 2 === 1 && "bg-slate-50/30",
                          )}
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">
                              {purchaseLineItemName(item)}
                            </p>
                            {item.notes && (
                              <p className="mt-0.5 text-xs text-slate-500">
                                {item.notes}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                            {item.actualItemPrice != null
                              ? item.actualItemPrice.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-400">
                            {item.otherUnitCost != null && item.otherUnitCost > 0
                              ? item.otherUnitCost.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium">
                            {item.unitPrice != null
                              ? item.unitPrice.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                            {item.estimatedTotal != null
                              ? item.estimatedTotal.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {requisition.totalAmount != null &&
                      requisition.totalAmount > 0 && (
                        <tfoot>
                          <tr className="bg-slate-50">
                            <td
                              colSpan={5}
                              className="px-4 py-3 text-right text-sm font-semibold text-slate-600"
                            >
                              Total
                            </td>
                            <td className="px-4 py-3 text-right text-base font-bold tabular-nums text-slate-900">
                              {requisition.totalAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                  </table>
                </div>
              ) : (
                <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No line items on this requisition.
                </p>
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
                  Navigate to the purchase order and goods receipts created from
                  this requisition.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    to={`${BASE}/requisitions/${requisition.id}`}
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
                        {requisition.requisitionNo}
                      </p>
                    </div>
                  </Link>

                  {requisition.createdPurchaseOrderId && (
                    <Link
                      to={`${BASE}/orders/${requisition.createdPurchaseOrderId}`}
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
                          PO #{requisition.createdPurchaseOrderId}
                        </p>
                      </div>
                    </Link>
                  )}

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
                          {gr.receiptNo || `GR #${gr.id}`}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}

          {showDocumentsTab && (
            <TabsContent value="documents" className="mt-0">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <PurchaseRequisitionDocuments
                  requisitionId={requisition.id}
                  documents={requisition.documents ?? []}
                  onDocumentsChange={handleDocumentsChange}
                  readOnly={documentsReadOnly}
                  embedded
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
