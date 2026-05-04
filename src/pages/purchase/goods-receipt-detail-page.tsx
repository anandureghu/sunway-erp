import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer } from "lucide-react";
import { format } from "date-fns";
import {
  getGoodsReceiptById,
  getGoodsReceiptPdfUrl,
  getGoodsReceiptsByPurchaseOrder,
  getPurchaseOrder,
} from "@/service/purchaseFlowService";
import type { GoodsReceipt } from "@/types/purchase";
import { toast } from "sonner";
import { RelatedPurchaseDocumentsCard } from "./components/related-purchase-documents";
import { PurchasePageHeader } from "./components/purchase-page-header";
import type { RelatedGrRef } from "./components/related-purchase-documents";

export default function GoodsReceiptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<GoodsReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkedReceipts, setLinkedReceipts] = useState<RelatedGrRef[]>([]);
  const [requisitionIdForLink, setRequisitionIdForLink] = useState<
    string | undefined
  >(undefined);
  const [receiptPdfUrl, setReceiptPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("Receipt ID is required");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setRequisitionIdForLink(undefined);
        setLinkedReceipts([]);

        // Try to get receipt directly by ID
        const foundReceipt = await getGoodsReceiptById(id);

        if (cancelled) return;

        if (foundReceipt) {
          setReceipt(foundReceipt);
          const reqFromOrder = foundReceipt.order?.requisitionId;
          if (reqFromOrder) {
            setRequisitionIdForLink(reqFromOrder);
          } else if (foundReceipt.orderId) {
            try {
              const po = await getPurchaseOrder(foundReceipt.orderId);
              if (po.requisitionId) setRequisitionIdForLink(po.requisitionId);
            } catch {
              /* ignore */
            }
          }
        } else {
          setError(
            "Goods receipt not found. The receipt may not exist or may have been deleted.",
          );
          toast.error("Goods receipt not found");
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error("Error loading goods receipt:", e);
          const errorMessage =
            e?.response?.data?.message ||
            e?.message ||
            "Failed to load goods receipt. Please try again.";
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

  useEffect(() => {
    if (!receipt?.orderId) {
      setLinkedReceipts([]);
      return;
    }
    let cancelled = false;
    getGoodsReceiptsByPurchaseOrder(receipt.orderId)
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
  }, [receipt?.orderId]);

  useEffect(() => {
    setReceiptPdfUrl(receipt?.documentPdfUrl ?? null);
  }, [receipt?.documentPdfUrl, receipt?.id]);

  const ensureReceiptPdf = async () => {
    if (!receipt) return;
    setPdfLoading(true);
    try {
      const url = await getGoodsReceiptPdfUrl(receipt.id);
      setReceiptPdfUrl(url);
      setReceipt((prev) => (prev ? { ...prev, documentPdfUrl: url } : prev));
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : "Could not load receipt PDF";
      toast.error(msg);
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="py-10 text-center text-muted-foreground">
          Loading goods receipt...
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="p-6">
        <div className="py-10 text-center space-y-4">
          <div className="text-red-600 font-medium">
            {error || "Goods receipt not found"}
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
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const qualityColors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-800",
    passed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    partial: "bg-orange-100 text-orange-800",
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          .print-section {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .print-table th,
          .print-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          .print-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .print-signature {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
          }
          .print-signature div {
            width: 200px;
            border-top: 1px solid #000;
            padding-top: 5px;
            text-align: center;
          }
        }
      `}</style>

      <div className="space-y-6 p-4 sm:p-6 print-content">
        <div className="no-print">
          <PurchasePageHeader
            title={`Receipt ${receipt.receiptNo}`}
            description="Receiving and quality inspection details for this GRN."
            backHref="/inventory/purchase/receiving"
            actions={
              <>
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-white/90"
                  onClick={handlePrint}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print certificate
                </Button>
                <Badge
                  className={
                    statusColors[receipt.status] || "bg-gray-100 text-gray-800"
                  }
                >
                  {receipt.status
                    .replace("_", " ")
                    .split(" ")
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(" ")}
                </Badge>
              </>
            }
          />
        </div>

        <div className="no-print mb-4">
          <RelatedPurchaseDocumentsCard
            context="gr"
            requisitionId={requisitionIdForLink}
            purchaseOrderId={receipt.orderId}
            goodsReceipts={linkedReceipts}
          />
        </div>

        <Card className="no-print mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Goods receipt PDF</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {receiptPdfUrl ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <a href={receiptPdfUrl} target="_blank" rel="noreferrer">
                    Open in new tab
                  </a>
                </Button>
                <div className="h-[min(520px,70vh)] w-full overflow-hidden rounded-md border">
                  <iframe
                    title="Goods receipt PDF"
                    src={receiptPdfUrl}
                    className="h-full min-h-[400px] w-full"
                  />
                </div>
              </>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void ensureReceiptPdf()}
                disabled={pdfLoading}
              >
                {pdfLoading ? "Loading…" : "Load or generate receipt PDF"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Print Header */}
        <div className="print-header hidden print:block">
          <h1 className="text-3xl font-bold mb-2">GOODS RECEIPT CERTIFICATE</h1>
          <h2 className="text-xl font-semibold">
            Receipt No: {receipt.receiptNo}
          </h2>
          <p className="text-sm mt-2">
            Date:{" "}
            {receipt.receiptDate
              ? format(new Date(receipt.receiptDate), "MMMM dd, yyyy")
              : "N/A"}
          </p>
        </div>

        {/* Receipt Info */}
        <Card className="print-section">
          <CardHeader>
            <CardTitle className="text-lg">Receipt Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Receipt Number</p>
                <p className="font-medium">{receipt.receiptNo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  className={
                    statusColors[receipt.status] || "bg-gray-100 text-gray-800"
                  }
                >
                  {receipt.status
                    .replace("_", " ")
                    .split(" ")
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(" ")}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receipt Date</p>
                <p className="font-medium">
                  {receipt.receiptDate
                    ? format(new Date(receipt.receiptDate), "MMM dd, yyyy")
                    : "N/A"}
                </p>
              </div>
              {receipt.orderId && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Purchase order
                  </p>
                  <Link
                    className="font-medium text-primary hover:underline"
                    to={`/inventory/purchase/orders/${receipt.orderId}`}
                  >
                    {receipt.order?.orderNo || `PO #${receipt.orderId}`}
                  </Link>
                </div>
              )}
              {requisitionIdForLink && (
                <div>
                  <p className="text-sm text-muted-foreground">Requisition</p>
                  <Link
                    className="font-medium text-primary hover:underline"
                    to={`/inventory/purchase/requisitions/${requisitionIdForLink}`}
                  >
                    PR #{requisitionIdForLink}
                  </Link>
                </div>
              )}
              {receipt.receivedByName && (
                <div>
                  <p className="text-sm text-muted-foreground">Received By</p>
                  <p className="font-medium">{receipt.receivedByName}</p>
                </div>
              )}
              {receipt.inspectedByName && (
                <div>
                  <p className="text-sm text-muted-foreground">Inspected By</p>
                  <p className="font-medium">{receipt.inspectedByName}</p>
                </div>
              )}
              {receipt.inspectionDate && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Inspection Date
                  </p>
                  <p className="font-medium">
                    {format(new Date(receipt.inspectionDate), "MMM dd, yyyy")}
                  </p>
                </div>
              )}
            </div>
            {receipt.notes && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="font-medium">{receipt.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quality Inspection Items */}
        <Card className="print-section">
          <CardHeader>
            <CardTitle className="text-lg">Quality Inspection Items</CardTitle>
          </CardHeader>
          <CardContent>
            {receipt.items.length > 0 ? (
              <>
                {/* Screen View */}
                <div className="space-y-3 no-print">
                  <div className="grid grid-cols-7 gap-4 font-medium text-sm border-b pb-2">
                    <div>Item</div>
                    <div className="text-right">Ordered</div>
                    <div className="text-right">Received</div>
                    <div className="text-right">Accepted</div>
                    <div className="text-right">Rejected</div>
                    <div className="text-center">Quality Status</div>
                    <div>Warehouse</div>
                  </div>
                  {receipt.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-7 gap-4 text-sm border-b pb-2"
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
                        {item.batchNo && (
                          <p className="text-xs text-muted-foreground">
                            Batch: {item.batchNo}
                          </p>
                        )}
                        {item.lotNo && (
                          <p className="text-xs text-muted-foreground">
                            Lot: {item.lotNo}
                          </p>
                        )}
                        {item.expiryDate && (
                          <p className="text-xs text-muted-foreground">
                            Expiry:{" "}
                            {format(new Date(item.expiryDate), "MMM dd, yyyy")}
                          </p>
                        )}
                      </div>
                      <div className="text-right">{item.orderedQuantity}</div>
                      <div className="text-right">{item.receivedQuantity}</div>
                      <div className="text-right text-green-600 font-medium">
                        {item.acceptedQuantity}
                      </div>
                      <div className="text-right text-red-600 font-medium">
                        {item.rejectedQuantity}
                      </div>
                      <div className="text-center">
                        <Badge
                          className={
                            qualityColors[item.qualityStatus] ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {item.qualityStatus.charAt(0).toUpperCase() +
                            item.qualityStatus.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        {item.warehouse?.name || item.warehouseId || "N/A"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Print View */}
                <table className="print-table hidden print:table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>SKU</th>
                      <th>Ordered</th>
                      <th>Received</th>
                      <th>Accepted</th>
                      <th>Rejected</th>
                      <th>Quality Status</th>
                      <th>Warehouse</th>
                      <th>Batch/Lot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.item?.name || `Item ${item.itemId}`}</td>
                        <td>{item.item?.sku || "-"}</td>
                        <td className="text-center">{item.orderedQuantity}</td>
                        <td className="text-center">{item.receivedQuantity}</td>
                        <td className="text-center">{item.acceptedQuantity}</td>
                        <td className="text-center">{item.rejectedQuantity}</td>
                        <td className="text-center">
                          {item.qualityStatus.charAt(0).toUpperCase() +
                            item.qualityStatus.slice(1)}
                        </td>
                        <td>
                          {item.warehouse?.name || item.warehouseId || "N/A"}
                        </td>
                        <td>
                          {item.batchNo || item.lotNo
                            ? `${item.batchNo || ""}${item.batchNo && item.lotNo ? "/" : ""}${item.lotNo || ""}`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p className="text-muted-foreground">No items in this receipt</p>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="print-section">
          <CardHeader>
            <CardTitle className="text-lg">Receipt Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Items:</span>
                <span className="font-medium">{receipt.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Received Quantity:</span>
                <span className="font-medium">
                  {receipt.items.reduce(
                    (sum, item) => sum + item.receivedQuantity,
                    0,
                  )}
                </span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Total Accepted:</span>
                <span className="font-medium">
                  {receipt.items.reduce(
                    (sum, item) => sum + item.acceptedQuantity,
                    0,
                  )}
                </span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Total Rejected:</span>
                <span className="font-medium">
                  {receipt.items.reduce(
                    (sum, item) => sum + item.rejectedQuantity,
                    0,
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Print Signatures */}
        <div className="print-signature hidden print:flex print-section">
          <div>
            <p className="font-semibold">Received By:</p>
            <p className="mt-8">
              {receipt.receivedByName || "________________"}
            </p>
            <p className="text-sm mt-2">
              Date:{" "}
              {receipt.receiptDate
                ? format(new Date(receipt.receiptDate), "MMM dd, yyyy")
                : "________________"}
            </p>
          </div>
          <div>
            <p className="font-semibold">Inspected By:</p>
            <p className="mt-8">
              {receipt.inspectedByName || "________________"}
            </p>
            <p className="text-sm mt-2">
              Date:{" "}
              {receipt.inspectionDate
                ? format(new Date(receipt.inspectionDate), "MMM dd, yyyy")
                : "________________"}
            </p>
          </div>
          <div>
            <p className="font-semibold">Authorized By:</p>
            <p className="mt-8">________________</p>
            <p className="text-sm mt-2">Date: ________________</p>
          </div>
        </div>
      </div>
    </>
  );
}
