import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  ShoppingCart,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import {
  getPurchaseRequisition,
  submitPurchaseRequisition,
  approvePurchaseRequisition,
  getGoodsReceiptsByPurchaseOrder,
} from "@/service/purchaseFlowService";
import type { PurchaseRequisition } from "@/types/purchase";
import { toast } from "sonner";
import { RelatedPurchaseDocumentsCard } from "./components/related-purchase-documents";
import type { RelatedGrRef } from "./components/related-purchase-documents";

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
    } catch (e: any) {
      const errorMessage =
        e?.response?.data?.message ||
        e?.message ||
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
    setActionLoading(true);
    try {
      await submitPurchaseRequisition(requisition.id);
      toast.success("Submitted for approval.");
      await load();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to submit",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!requisition) return;
    if (
      !confirm(
        "Approve this requisition? A draft purchase order will be created for the preferred supplier.",
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
                label: "Open PO",
                onClick: () =>
                  navigate(
                    `/inventory/purchase/orders/${updated.createdPurchaseOrderId}`,
                  ),
              }
            : undefined,
      });
      await load();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to approve",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="py-10 text-center text-muted-foreground">
          Loading purchase requisition...
        </div>
      </div>
    );
  }

  if (error || !requisition) {
    return (
      <div className="p-6">
        <div className="py-10 text-center space-y-4">
          <div className="text-red-600 font-medium">
            {error || "Purchase requisition not found"}
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
    submitted: "bg-amber-100 text-amber-900",
    approved: "bg-green-100 text-green-800",
    converted: "bg-violet-100 text-violet-900",
    rejected: "bg-red-100 text-red-800",
  };

  const canSubmit = requisition.status === "draft";
  const canApprove = requisition.status === "submitted";
  const showOpenPo =
    requisition.status === "converted" && requisition.createdPurchaseOrderId;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {requisition.requisitionNo}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Purchase requisition — workflow: draft → submit for approval →
              approve to generate a PO
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Badge
            className={
              statusColors[requisition.status] || "bg-gray-100 text-gray-800"
            }
          >
            {requisition.status.charAt(0).toUpperCase() +
              requisition.status.slice(1)}
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
            Same steps as in the requisition list: submit when ready, then an
            approver releases it to procurement by creating the purchase order.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {canSubmit && (
            <Button
              onClick={() => void handleSubmit()}
              disabled={actionLoading}
            >
              <Send className="mr-2 h-4 w-4" />
              Submit for approval
            </Button>
          )}
          {canApprove && (
            <Button
              onClick={() => void handleApprove()}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve &amp; create PO
            </Button>
          )}
          {showOpenPo && (
            <Button asChild variant="secondary">
              <Link
                to={`/inventory/purchase/orders/${requisition.createdPurchaseOrderId}`}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Open purchase order
              </Link>
            </Button>
          )}
          {!canSubmit && !canApprove && !showOpenPo && (
            <p className="text-sm text-muted-foreground py-1">
              No workflow actions available for this status.
            </p>
          )}
        </CardContent>
      </Card>

      <RelatedPurchaseDocumentsCard
        context="pr"
        requisitionId={requisition.id}
        purchaseOrderId={requisition.createdPurchaseOrderId}
        goodsReceipts={linkedReceipts}
      />

      <Separator />

      {/* Requisition Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Requisition information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Requisition number
              </p>
              <p className="font-medium">{requisition.requisitionNo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                className={
                  statusColors[requisition.status] ||
                  "bg-gray-100 text-gray-800"
                }
              >
                {requisition.status.charAt(0).toUpperCase() +
                  requisition.status.slice(1)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Requested date</p>
              <p className="font-medium">
                {requisition.requestedDate
                  ? format(new Date(requisition.requestedDate), "MMM dd, yyyy")
                  : "N/A"}
              </p>
            </div>
            {requisition.requiredDate && (
              <div>
                <p className="text-sm text-muted-foreground">Required date</p>
                <p className="font-medium">
                  {format(new Date(requisition.requiredDate), "MMM dd, yyyy")}
                </p>
              </div>
            )}
            {requisition.requestedByName && (
              <div>
                <p className="text-sm text-muted-foreground">Requested by</p>
                <p className="font-medium">{requisition.requestedByName}</p>
              </div>
            )}
            {requisition.preferredSupplierName && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Preferred supplier
                </p>
                <p className="font-medium">{requisition.preferredSupplierName}</p>
              </div>
            )}
            {requisition.debitAccountName && (
              <div>
                <p className="text-sm text-muted-foreground">Debit account</p>
                <p className="font-medium">{requisition.debitAccountName}</p>
              </div>
            )}
            {requisition.creditAccountName && (
              <div>
                <p className="text-sm text-muted-foreground">Credit account</p>
                <p className="font-medium">{requisition.creditAccountName}</p>
              </div>
            )}
            {requisition.financeTransactionId && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Finance transaction (on approve)
                </p>
                <p className="font-medium font-mono text-sm">
                  #{requisition.financeTransactionId}
                </p>
              </div>
            )}
            {(requisition.departmentName || requisition.department) && (
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">
                  {requisition.departmentName || requisition.department}
                </p>
              </div>
            )}
            {requisition.createdPurchaseOrderId && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Purchase order</p>
                <Link
                  to={`/inventory/purchase/orders/${requisition.createdPurchaseOrderId}`}
                  className="font-medium text-primary underline"
                >
                  Open PO #{requisition.createdPurchaseOrderId}
                </Link>
              </div>
            )}
            {requisition.approvedByName && (
              <div>
                <p className="text-sm text-muted-foreground">Approved by</p>
                <p className="font-medium">{requisition.approvedByName}</p>
              </div>
            )}
            {requisition.approvedDate && (
              <div>
                <p className="text-sm text-muted-foreground">Approved date</p>
                <p className="font-medium">
                  {format(new Date(requisition.approvedDate), "MMM dd, yyyy")}
                </p>
              </div>
            )}
            {requisition.rejectionReason && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">
                  Rejection reason
                </p>
                <p className="font-medium text-red-600">
                  {requisition.rejectionReason}
                </p>
              </div>
            )}
          </div>
          {requisition.notes && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="font-medium">{requisition.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line items</CardTitle>
        </CardHeader>
        <CardContent>
          {requisition.items.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-4 font-medium text-sm border-b pb-2">
                <div>Item</div>
                <div className="text-right">Qty</div>
                <div className="text-right">Unit</div>
                <div className="text-right">Est. total</div>
              </div>
              {requisition.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-4 gap-4 text-sm border-b pb-2"
                >
                  <div>
                    <p className="font-medium">{`Item #${item.itemId}`}</p>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right">{item.quantity}</div>
                  <div className="text-right">
                    {item.unitPrice != null
                      ? `₹${item.unitPrice.toLocaleString()}`
                      : "—"}
                  </div>
                  <div className="text-right font-medium">
                    {item.estimatedTotal != null
                      ? `₹${item.estimatedTotal.toLocaleString()}`
                      : "—"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No line items</p>
          )}
        </CardContent>
      </Card>

      {requisition.totalAmount != null && requisition.totalAmount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>₹{requisition.totalAmount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
