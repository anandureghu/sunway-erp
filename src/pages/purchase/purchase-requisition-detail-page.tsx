import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { listPurchaseRequisitions } from "@/service/purchaseFlowService";
import type { PurchaseRequisition } from "@/types/purchase";
import { toast } from "sonner";

export default function PurchaseRequisitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [requisition, setRequisition] = useState<PurchaseRequisition | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Requisition ID is required");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const requisitions = await listPurchaseRequisitions();
        if (!cancelled) {
          const foundRequisition = requisitions.find((r) => r.id === id);
          if (foundRequisition) {
            setRequisition(foundRequisition);
          } else {
            setError("Purchase requisition not found");
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          const errorMessage =
            e?.response?.data?.message ||
            e?.message ||
            "Failed to load purchase requisition";
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
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
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
              Purchase Requisition - {requisition.requisitionNo}
            </h1>
            <p className="text-muted-foreground">
              Complete information about this purchase requisition
            </p>
          </div>
        </div>
        <Badge
          className={
            statusColors[requisition.status] || "bg-gray-100 text-gray-800"
          }
        >
          {requisition.status.charAt(0).toUpperCase() +
            requisition.status.slice(1)}
        </Badge>
      </div>

      {/* Requisition Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Requisition Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Requisition Number
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
              <p className="text-sm text-muted-foreground">Requested Date</p>
              <p className="font-medium">
                {requisition.requestedDate
                  ? format(new Date(requisition.requestedDate), "MMM dd, yyyy")
                  : "N/A"}
              </p>
            </div>
            {requisition.requiredDate && (
              <div>
                <p className="text-sm text-muted-foreground">Required Date</p>
                <p className="font-medium">
                  {format(new Date(requisition.requiredDate), "MMM dd, yyyy")}
                </p>
              </div>
            )}
            {requisition.requestedByName && (
              <div>
                <p className="text-sm text-muted-foreground">Requested By</p>
                <p className="font-medium">{requisition.requestedByName}</p>
              </div>
            )}
            {requisition.department && (
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{requisition.department}</p>
              </div>
            )}
            {requisition.approvedByName && (
              <div>
                <p className="text-sm text-muted-foreground">Approved By</p>
                <p className="font-medium">{requisition.approvedByName}</p>
              </div>
            )}
            {requisition.approvedDate && (
              <div>
                <p className="text-sm text-muted-foreground">Approved Date</p>
                <p className="font-medium">
                  {format(new Date(requisition.approvedDate), "MMM dd, yyyy")}
                </p>
              </div>
            )}
            {requisition.rejectionReason && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">
                  Rejection Reason
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

      {/* Requisition Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Requisition Items</CardTitle>
        </CardHeader>
        <CardContent>
          {requisition.items.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-4 font-medium text-sm border-b pb-2">
                <div>Item</div>
                <div className="text-right">Quantity</div>
                <div className="text-right">Unit Price</div>
                <div className="text-right">Estimated Total</div>
              </div>
              {requisition.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-4 gap-4 text-sm border-b pb-2"
                >
                  <div>
                    <p className="font-medium">{`Item ${item.itemId}`}</p>
                    {item.item?.itemId && (
                      <p className="text-xs text-muted-foreground">
                        SKU: {item.item.itemId}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-muted-foreground">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right">{item.quantity}</div>
                  <div className="text-right">
                    {item.unitPrice
                      ? `₹${item.unitPrice.toLocaleString()}`
                      : "N/A"}
                  </div>
                  <div className="text-right font-medium">
                    {item.estimatedTotal
                      ? `₹${item.estimatedTotal.toLocaleString()}`
                      : "N/A"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No items in this requisition
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {requisition.totalAmount && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Requisition Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount:</span>
              <span>₹{requisition.totalAmount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
