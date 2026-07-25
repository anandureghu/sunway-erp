import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Printer,
  Package,
  FileText,
  ShoppingCart,
  Calendar,
  User,
  ClipboardCheck,
  LayoutGrid,
  ListOrdered,
} from "lucide-react";
import { format } from "date-fns";
import {
  getGoodsReceiptById,
  getGoodsReceiptPdfUrl,
  getPurchaseOrder,
  getPurchaseRequisition,
} from "@/service/purchaseFlowService";
import type { GoodsReceipt } from "@/types/purchase";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { purchaseLineItemName } from "@/lib/purchase-line-item";
import { cn } from "@/lib/utils";
import { goodsReceiptDisplayLabel } from "@/lib/goods-receipt-status";

const BASE = "/inventory/purchase";

const STATUS_COLORS: Record<string, string> = {
  pending_inspection: "bg-yellow-100 text-yellow-800",
  inspected: "bg-blue-100 text-blue-800",
  received: "bg-green-100 text-green-800",
};

const QUALITY_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800",
  passed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  partial: "bg-orange-100 text-orange-800",
};

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function receiptStatusColor(label: string) {
  if (label === "Received") return STATUS_COLORS.received;
  if (label === "Awaiting inspection") return STATUS_COLORS.pending_inspection;
  return STATUS_COLORS.inspected;
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

function receiptItemName(item: GoodsReceipt["items"][number]): string {
  return purchaseLineItemName(
    item.orderItem ?? {
      itemId: item.itemId,
      itemName: item.item?.name,
      item: item.item,
    },
  );
}

export default function GoodsReceiptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<GoodsReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkedRequisitionId, setLinkedRequisitionId] = useState<
    string | undefined
  >(undefined);
  const [linkedRequisitionNo, setLinkedRequisitionNo] = useState<string | null>(
    null,
  );
  const [linkedPurchaseOrderNo, setLinkedPurchaseOrderNo] = useState<
    string | null
  >(null);
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
        setLinkedRequisitionId(undefined);
        setLinkedRequisitionNo(null);
        setLinkedPurchaseOrderNo(null);

        const foundReceipt = await getGoodsReceiptById(id);
        if (cancelled) return;

        if (!foundReceipt) {
          setError(
            "Goods receipt not found. The receipt may not exist or may have been deleted.",
          );
          toast.error("Goods receipt not found");
          return;
        }

        setReceipt(foundReceipt);

        const poFromReceipt = foundReceipt.order;
        if (poFromReceipt?.orderNo) {
          setLinkedPurchaseOrderNo(poFromReceipt.orderNo);
        }

        let reqId =
          poFromReceipt?.requisitionId ?? foundReceipt.order?.requisitionId;
        let reqNo = poFromReceipt?.requisitionNo ?? null;

        if (foundReceipt.orderId) {
          try {
            const po =
              poFromReceipt ?? (await getPurchaseOrder(foundReceipt.orderId));
            if (!cancelled) {
              setLinkedPurchaseOrderNo(po.orderNo);
              reqId = reqId ?? po.requisitionId;
              reqNo = reqNo ?? po.requisitionNo ?? null;
              setReceipt((prev) => (prev ? { ...prev, order: po } : prev));
            }
          } catch {
            /* ignore */
          }
        }

        if (reqId && !cancelled) {
          setLinkedRequisitionId(reqId);
          if (reqNo) {
            setLinkedRequisitionNo(reqNo);
          } else {
            try {
              const pr = await getPurchaseRequisition(reqId);
              if (!cancelled) setLinkedRequisitionNo(pr.requisitionNo);
            } catch {
              /* ignore */
            }
          }
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const err = e as {
            response?: { data?: { message?: string } };
            message?: string;
          };
          const errorMessage =
            err?.response?.data?.message ||
            err?.message ||
            "Failed to load goods receipt. Please try again.";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

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
        <div className="space-y-4 py-10 text-center">
          <div className="font-medium text-red-600">
            {error || "Goods receipt not found"}
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(`${BASE}/inspection`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const linkedRequisitionLabel =
    linkedRequisitionNo ||
    (linkedRequisitionId ? `PR-${linkedRequisitionId}` : "");
  const linkedPurchaseOrderLabel =
    linkedPurchaseOrderNo ||
    receipt.order?.orderNo ||
    (receipt.orderId ? `PO-${receipt.orderId}` : "");
  const totalReceived = receipt.items.reduce(
    (sum, item) => sum + item.receivedQuantity,
    0,
  );
  const totalAccepted = receipt.items.reduce(
    (sum, item) => sum + (item.acceptedQuantity ?? 0),
    0,
  );
  const totalRejected = receipt.items.reduce(
    (sum, item) => sum + (item.rejectedQuantity ?? 0),
    0,
  );
  const handlePrint = async () => {
    setPdfLoading(true);
    try {
      const url = await getGoodsReceiptPdfUrl(receipt.id);
      setReceiptPdfUrl(url);
      setReceipt((prev) => (prev ? { ...prev, documentPdfUrl: url } : prev));
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (e as { message?: string })?.message ||
        "Failed to generate goods receipt PDF";
      toast.error(msg);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-5 p-6">
        <div>
          <PageHeader
            variant="darkGreen"
            title={receipt.receiptNo}
            description="Inspection and stock posting details for this goods receipt."
            backHref={`${BASE}/inspection`}
            actions={
              <>
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-white/90"
                  onClick={() => void handlePrint()}
                  disabled={pdfLoading}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {pdfLoading ? "Generating…" : "Print certificate"}
                </Button>
                <Badge
                  className={
                    receiptStatusColor(goodsReceiptDisplayLabel(receipt)) ||
                    "bg-gray-100 text-gray-800"
                  }
                >
                  {goodsReceiptDisplayLabel(receipt)}
                </Badge>
                {receipt.archived && (
                  <Badge className="bg-slate-200 text-slate-700">
                    Archived
                  </Badge>
                )}
              </>
            }
          />
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiTile
              icon={<Calendar className="h-4 w-4 text-emerald-600" />}
              label="Receipt date"
              value={
                receipt.receiptDate
                  ? format(new Date(receipt.receiptDate), "MMM d, yyyy")
                  : "—"
              }
              accent="bg-emerald-50"
            />
            <KpiTile
              icon={<Package className="h-4 w-4 text-blue-600" />}
              label="Line items"
              value={receipt.items.length}
              accent="bg-blue-50"
            />
            <KpiTile
              icon={<ClipboardCheck className="h-4 w-4 text-green-600" />}
              label="Accepted qty"
              value={totalAccepted}
              accent="bg-green-50"
            />
            <KpiTile
              icon={<Package className="h-4 w-4 text-red-600" />}
              label="Rejected qty"
              value={totalRejected}
              accent="bg-red-50"
            />
          </div>

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
                Inspection items
                {receipt.items.length > 0 ? ` (${receipt.items.length})` : ""}
              </TabsTrigger>
              <TabsTrigger
                value="document"
                className="gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <FileText className="h-4 w-4" />
                PDF
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-slate-900">
                  Receipt information
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailField
                    label="Receipt number"
                    value={receipt.receiptNo}
                  />
                  <DetailField
                    label="Status"
                    value={
                      <Badge
                        className={
                          receiptStatusColor(
                            goodsReceiptDisplayLabel(receipt),
                          ) || "bg-gray-100 text-gray-800"
                        }
                      >
                        {goodsReceiptDisplayLabel(receipt)}
                      </Badge>
                    }
                  />
                  <DetailField
                    label="Receipt date"
                    value={
                      receipt.receiptDate
                        ? format(new Date(receipt.receiptDate), "MMM d, yyyy")
                        : null
                    }
                  />
                  <DetailField
                    label="Purchase order"
                    value={
                      receipt.orderId ? (
                        <Link
                          className="inline-flex items-center gap-1.5 text-violet-700 hover:underline"
                          to={`${BASE}/orders/${receipt.orderId}`}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          {linkedPurchaseOrderLabel}
                        </Link>
                      ) : null
                    }
                  />
                  <DetailField
                    label="Source requisition"
                    value={
                      linkedRequisitionId ? (
                        <Link
                          className="inline-flex items-center gap-1.5 text-emerald-700 hover:underline"
                          to={`${BASE}/requisitions/${linkedRequisitionId}`}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {linkedRequisitionLabel}
                        </Link>
                      ) : null
                    }
                  />
                  <DetailField
                    label="Received by"
                    value={
                      receipt.receivedByName ? (
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {receipt.receivedByName}
                        </span>
                      ) : null
                    }
                  />
                  <DetailField
                    label="Inspected by"
                    value={
                      receipt.inspectedByName ? (
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {receipt.inspectedByName}
                        </span>
                      ) : null
                    }
                  />
                  <DetailField
                    label="Inspection date"
                    value={
                      receipt.inspectionDate
                        ? format(
                            new Date(receipt.inspectionDate),
                            "MMM d, yyyy",
                          )
                        : null
                    }
                  />
                  <DetailField
                    label="Authorized by"
                    value={
                      receipt.authorizedByName ? (
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {receipt.authorizedByName}
                        </span>
                      ) : null
                    }
                  />
                  <DetailField
                    label="Notes"
                    value={receipt.notes}
                    className="sm:col-span-2"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-slate-900">
                  Receipt summary
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs text-slate-500">Total items</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {receipt.items.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs text-slate-500">Received quantity</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {totalReceived}
                    </p>
                  </div>
                  <div className="rounded-xl border border-green-100 bg-green-50/60 p-4">
                    <p className="text-xs text-green-700">Accepted</p>
                    <p className="mt-1 text-lg font-semibold text-green-800">
                      {totalAccepted}
                    </p>
                  </div>
                  <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
                    <p className="text-xs text-red-700">Rejected</p>
                    <p className="mt-1 text-lg font-semibold text-red-800">
                      {totalRejected}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="items" className="mt-0">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-slate-900">
                  Quality inspection items
                </h2>
                {receipt.items.length > 0 ? (
                  <div className="overflow-x-auto">
                      <table className="w-full min-w-[880px] text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            <th className="pb-3 pr-4 w-12">Sl No</th>
                            <th className="pb-3 pr-4">Item</th>
                            <th className="pb-3 pr-4 text-right">Ordered</th>
                            <th className="pb-3 pr-4 text-right">Received</th>
                            <th className="pb-3 pr-4 text-right">Accepted</th>
                            <th className="pb-3 pr-4 text-right">Rejected</th>
                            <th className="pb-3 pr-4 text-center">Quality</th>
                            <th className="pb-3">Warehouse</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receipt.items.map((item, index) => (
                            <tr
                              key={item.id}
                              className="border-b border-slate-100 last:border-0"
                            >
                              <td className="py-3 pr-4 tabular-nums text-slate-500">
                                {index + 1}
                              </td>
                              <td className="py-3 pr-4">
                                <p className="font-medium text-slate-900">
                                  {receiptItemName(item)}
                                </p>
                                {item.item?.sku ? (
                                  <p className="text-xs text-slate-500">
                                    SKU: {item.item.sku}
                                  </p>
                                ) : null}
                                {item.batchNo ? (
                                  <p className="text-xs text-slate-500">
                                    Batch: {item.batchNo}
                                  </p>
                                ) : null}
                                {item.lotNo ? (
                                  <p className="text-xs text-slate-500">
                                    Lot: {item.lotNo}
                                  </p>
                                ) : null}
                                {item.expiryDate ? (
                                  <p className="text-xs text-slate-500">
                                    Sale by:{" "}
                                    {format(
                                      new Date(item.expiryDate),
                                      "MMM d, yyyy",
                                    )}
                                  </p>
                                ) : null}
                              </td>
                              <td className="py-3 pr-4 text-right tabular-nums">
                                {item.orderedQuantity}
                              </td>
                              <td className="py-3 pr-4 text-right tabular-nums">
                                {item.receivedQuantity}
                              </td>
                              <td className="py-3 pr-4 text-right font-medium tabular-nums text-green-700">
                                {item.acceptedQuantity ?? "—"}
                              </td>
                              <td className="py-3 pr-4 text-right font-medium tabular-nums text-red-700">
                                {item.rejectedQuantity ?? "—"}
                              </td>
                              <td className="py-3 pr-4 text-center">
                                <Badge
                                  className={
                                    QUALITY_COLORS[item.qualityStatus] ||
                                    "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {formatLabel(item.qualityStatus)}
                                </Badge>
                              </td>
                              <td className="py-3 text-slate-700">
                                {item.warehouse?.name ||
                                  (item.warehouseId
                                    ? `Warehouse ${item.warehouseId}`
                                    : "—")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No items in this receipt
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="document" className="mt-0">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-slate-900">
                  Goods receipt PDF
                </h2>
                {receiptPdfUrl ? (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      asChild
                    >
                      <a href={receiptPdfUrl} target="_blank" rel="noreferrer">
                        Open in new tab
                      </a>
                    </Button>
                    <div className="h-[min(520px,70vh)] w-full overflow-hidden rounded-xl border border-slate-200">
                      <iframe
                        title="Goods receipt PDF"
                        src={receiptPdfUrl}
                        className="h-full min-h-[400px] w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-lg"
                    onClick={() => void ensureReceiptPdf()}
                    disabled={pdfLoading}
                  >
                    {pdfLoading ? "Loading…" : "Load or generate receipt PDF"}
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
