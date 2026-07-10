"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PurchaseOrder, Supplier, GoodsReceipt } from "@/types/purchase";
import { isVendorEligibleForPurchase } from "@/lib/vendor-api";
import type { FinanceInvoice } from "@/types/finance-invoice";
import { type ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileText,
  Package,
  Send,
  Link2,
  Download,
  Mail,
  Archive,
  Loader2,
  CheckSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SupplierIdNameCell } from "@/components/supplier-id-name-cell";
import { format } from "date-fns";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import { isInvoiceReceiptView } from "@/lib/invoice-status-filter";
import { StatusBadge } from "@/lib/status-badge";

export type PurchaseOrderColumnActions = {
  /** Navigate to full PO detail */
  onOpenOrder?: (id: string) => void;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onEdit?: (id: string) => void;
  /** Goods receipt flow */
  onReceiveGoods?: (orderId: string) => void;
  /** Link to originating PR */
  onViewRequisition?: (requisitionId: string) => void;
  onArchive?: (id: string) => void;
  processingOrderId?: string | null;
  processingAction?: "archive" | null;
};

// Purchase Order Columns
export function createPurchaseOrderColumns(
  actions: PurchaseOrderColumnActions = {},
): ColumnDef<PurchaseOrder>[] {
  const {
    onOpenOrder,
    onConfirm,
    onCancel,
    onEdit,
    onReceiveGoods,
    onViewRequisition,
    onArchive,
    processingOrderId,
    processingAction,
  } = actions;

  return [
    {
      accessorKey: "orderNo",
      header: "Order No",
      cell: ({ row }) => {
        return <span className="font-medium">{row.getValue("orderNo")}</span>;
      },
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }) => {
        const supplier = row.original.supplier;
        // Handle both Supplier type (with name) and Vendor type (with vendorName)
        const supplierName =
          supplier?.name || (supplier as any)?.vendorName || "N/A";
        const supplierCode = supplier?.code || (supplier as any)?.id || "";
        return (
          <div className="flex flex-col">
            <span className="font-medium">{supplierName}</span>
            {supplierCode && (
              <span className="text-xs text-gray-500">{supplierCode}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "orderDate",
      header: "Order Date",
      cell: ({ row }) => {
        const date = row.getValue("orderDate") as string;
        return (
          <span>{date ? format(new Date(date), "MMM dd, yyyy") : "—"}</span>
        );
      },
    },
    {
      id: "requiredDeliveryDate",
      header: "Required Delivery Date",
      cell: ({ row }) => {
        const date =
          row.original.requiredDeliveryDate || row.original.expectedDate;
        return (
          <span>{date ? format(new Date(date), "MMM dd, yyyy") : "—"}</span>
        );
      },
    },
    {
      accessorKey: "requestedByName",
      header: "Requested by",
      cell: ({ row }) => <span>{row.original.requestedByName || "—"}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusColors: Record<string, string> = {
          draft: "bg-gray-100 text-gray-800",
          pending: "bg-yellow-100 text-yellow-800",
          confirmed: "bg-blue-100 text-blue-800",
          approved: "bg-blue-100 text-blue-800",
          ordered: "bg-purple-100 text-purple-800",
          partially_received: "bg-orange-100 text-orange-800",
          received: "bg-green-100 text-green-800",
          cancelled: "bg-red-100 text-red-800",
        };
        return (
          <Badge
            className={statusColors[status] || "bg-gray-100 text-gray-800"}
          >
            {status
              .replace("_", " ")
              .split(" ")
              .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
              .join(" ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment Status",
      cell: ({ row }) => {
        const order = row.original;
        const status =
          order.paymentStatus ||
          (order.vendorPaymentSettled ? "PAID" : "UNPAID");
        const isPartial = status.toUpperCase() === "PARTIALLY_PAID";
        return (
          <div className="space-y-0.5">
            <StatusBadge status={status} />
            {isPartial && order.outstandingAmount != null && (
              <div className="text-xs text-muted-foreground">
                Remaining:{" "}
                <CurrencyAmount
                  amount={order.outstandingAmount}
                  className="inline"
                />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "total",
      header: "Total Amount",
      cell: ({ row }) => {
        const amount = row.getValue("total") as number;
        return <CurrencyAmount amount={amount} className="font-semibold" />;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original;
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
        const canRelease = st === "draft" && supplierEligible;
        const canCancel = st === "draft";
        const canReceive =
          st === "confirmed" ||
          st === "ordered" ||
          st === "partially_received" ||
          st === "approved";
        const canArchive =
          !order.archived && (st === "received" || st === "cancelled");
        const reqId = order.requisitionId;
        const isProcessing = processingOrderId === order.id;

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Actions</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Order</DropdownMenuLabel>
                {onOpenOrder && (
                  <DropdownMenuItem onClick={() => onOpenOrder(order.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Open detail
                  </DropdownMenuItem>
                )}
                {reqId && onViewRequisition && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Source</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewRequisition(reqId)}>
                      <Link2 className="mr-2 h-4 w-4" />
                      View requisition
                    </DropdownMenuItem>
                  </>
                )}

                {(canRelease || canReceive) && <DropdownMenuSeparator />}
                {(canRelease || canReceive) && (
                  <DropdownMenuLabel>Procurement</DropdownMenuLabel>
                )}
                {canRelease && onConfirm && (
                  <DropdownMenuItem onClick={() => onConfirm(order.id)}>
                    <Send className="mr-2 h-4 w-4" />
                    Release to supplier
                  </DropdownMenuItem>
                )}
                {st === "draft" && !order.vendorPaymentSettled && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(order.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit draft
                  </DropdownMenuItem>
                )}
                {canReceive && onReceiveGoods && (
                  <DropdownMenuItem onClick={() => onReceiveGoods(order.id)}>
                    <Package className="mr-2 h-4 w-4" />
                    Start inspection
                  </DropdownMenuItem>
                )}

                {canCancel && onCancel && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Danger</DropdownMenuLabel>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => onCancel(order.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Cancel order
                    </DropdownMenuItem>
                  </>
                )}
                {canArchive && onArchive && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={isProcessing}
                      onClick={() => onArchive(order.id)}
                    >
                      {isProcessing && processingAction === "archive" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Archive className="mr-2 h-4 w-4" />
                      )}
                      {isProcessing && processingAction === "archive"
                        ? "Archiving..."
                        : "Archive"}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}

// Backward compatibility - export default columns without handlers
export const PURCHASE_ORDER_COLUMNS: ColumnDef<PurchaseOrder>[] =
  createPurchaseOrderColumns();

// Supplier Columns
export const SUPPLIER_COLUMNS: ColumnDef<Supplier>[] = [
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "name",
    header: "Supplier Name",
  },
  {
    accessorKey: "contactPerson",
    header: "Contact Person",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => {
      const rating = row.getValue("rating") as number | undefined;
      return rating ? (
        <span className="font-medium">{rating.toFixed(1)} ⭐</span>
      ) : (
        <span>-</span>
      );
    },
  },
  {
    accessorKey: "onTimeDeliveryRate",
    header: "On-Time %",
    cell: ({ row }) => {
      const rate = row.getValue("onTimeDeliveryRate") as number | undefined;
      return rate ? <span>{rate}%</span> : <span>-</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          className={
            status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: () => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Supplier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export type PurchaseInvoiceColumnActions = {
  onViewDetails?: (inv: FinanceInvoice) => void;
  onOpenDocument?: (inv: FinanceInvoice) => void;
  onDownload?: (inv: FinanceInvoice) => void;
  onEmail?: (inv: FinanceInvoice) => void;
  onMatchVendorInvoice?: (inv: FinanceInvoice) => void;
  onViewMatchedInvoice?: (inv: FinanceInvoice) => void;
};

// Purchase Invoice Columns (API FinanceInvoice)
function purchaseInvoiceSupplierId(inv: FinanceInvoice): number | null {
  return inv.supplierId ?? inv.purchaseOrder?.supplierId ?? null;
}

function purchaseInvoiceSupplierName(inv: FinanceInvoice): string | null {
  return (
    inv.supplierName ?? inv.purchaseOrder?.supplierName ?? inv.toParty ?? null
  );
}

export function createPurchaseInvoiceColumns(
  onArchive?: (id: number) => void,
  processingInvoiceId?: number | null,
  invoiceActions: PurchaseInvoiceColumnActions = {},
): ColumnDef<FinanceInvoice>[] {
  const {
    onViewDetails,
    onOpenDocument,
    onDownload,
    onEmail,
    onMatchVendorInvoice,
    onViewMatchedInvoice,
  } = invoiceActions;
  return [
    {
      accessorKey: "invoiceId",
      header: "Inv no",
      cell: ({ row }) => {
        return <span className="font-medium">{row.getValue("invoiceId")}</span>;
      },
    },
    {
      id: "supplier",
      header: "Supplier",
      cell: ({ row }) => (
        <SupplierIdNameCell
          supplierId={purchaseInvoiceSupplierId(row.original)}
          supplierName={purchaseInvoiceSupplierName(row.original)}
        />
      ),
    },
    {
      id: "po",
      header: "Purchase Order",
      cell: ({ row }) => (
        <span>
          {row.original.orderNumber ||
            row.original.purchaseOrder?.orderNumber ||
            "—"}
        </span>
      ),
    },
    {
      accessorKey: "invoiceDate",
      header: "Invoice Date",
      cell: ({ row }) => {
        const d = row.original.invoiceDate;
        return <span>{d ? format(new Date(d), "MMM dd, yyyy") : "—"}</span>;
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        const d = row.original.dueDate;
        return <span>{d ? format(new Date(d), "MMM dd, yyyy") : "—"}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Payment Status",
      cell: ({ row }) => {
        const status = String(row.getValue("status") ?? "UNPAID");
        const remaining = row.original.outstanding ?? row.original.openAmount;
        const isPartial = status.toUpperCase() === "PARTIALLY_PAID";
        return (
          <div className="space-y-0.5">
            <span
              title={
                status.toUpperCase() === "ADJUSTED"
                  ? "Balance written off due to rejected/returned goods — not paid in cash"
                  : undefined
              }
            >
              <StatusBadge status={status} />
            </span>
            {isPartial && remaining != null && (
              <div className="text-xs text-muted-foreground">
                Remaining:{" "}
                <CurrencyAmount amount={remaining} className="inline" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Total",
      cell: ({ row }) => {
        const amount = row.original.amount ?? 0;
        return <CurrencyAmount amount={amount} className="font-semibold" />;
      },
    },
    {
      id: "vendorInvoiceCode",
      header: "Vendor Invoice Code",
      cell: ({ row }) => {
        const code = row.original.supplierInvoiceNumber;
        return code ? (
          <span className="font-mono text-xs">{code}</span>
        ) : (
          <span className="text-xs text-amber-600">Not matched</span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const inv = row.original;
        const normalizedStatus = (inv.status || "").toUpperCase();
        const isReceipt = isInvoiceReceiptView(inv.status);
        const isGenerated = inv.documentSource === "GENERATED";
        const canArchive =
          !inv.archived &&
          (normalizedStatus === "PAID" || normalizedStatus === "CANCELLED");
        const isProcessing = processingInvoiceId === inv.id;

        return (
          <div data-no-row-nav onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {onViewDetails && (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      onViewDetails(inv);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {isReceipt ? "View receipt" : "View invoice"}
                  </DropdownMenuItem>
                )}
                {isGenerated && onDownload && (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      void onDownload(inv);
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isReceipt ? "Download receipt" : "Download invoice"}
                  </DropdownMenuItem>
                )}
                {isGenerated && onEmail && (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      void onEmail(inv);
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {isReceipt ? "Email receipt" : "Email invoice"}
                  </DropdownMenuItem>
                )}
                {onOpenDocument && !isGenerated && (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      void onOpenDocument(inv);
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Open document
                  </DropdownMenuItem>
                )}
                {onMatchVendorInvoice && (
                  <>
                    <DropdownMenuSeparator />
                    {inv.vendorInvoiceDocumentUrl && onViewMatchedInvoice && (
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          onViewMatchedInvoice(inv);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View matched invoice
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        onMatchVendorInvoice(inv);
                      }}
                    >
                      <CheckSquare className="mr-2 h-4 w-4" />
                      {inv.vendorInvoiceDocumentUrl || inv.supplierInvoiceNumber
                        ? "Re-match vendor invoice"
                        : "Match Vendor Invoice"}
                    </DropdownMenuItem>
                  </>
                )}
                {canArchive && onArchive && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={isProcessing}
                      onClick={() => onArchive(inv.id)}
                    >
                      {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Archive className="mr-2 h-4 w-4" />
                      )}
                      {isProcessing ? "Archiving..." : "Archive"}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}

export const PURCHASE_INVOICE_COLUMNS: ColumnDef<FinanceInvoice>[] =
  createPurchaseInvoiceColumns();

// Goods Receipt Columns
export type GoodsReceiptColumnActions = {
  onOpenReceipt?: (id: string) => void;
  onArchive?: (id: string) => void;
  processingReceiptId?: string | null;
};

const GOODS_RECEIPT_STATUS_COLORS: Record<string, string> = {
  pending_inspection: "bg-yellow-100 text-yellow-800",
  inspected: "bg-green-100 text-green-800",
};

function goodsReceiptStatusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export function createGoodsReceiptColumns(
  actions: GoodsReceiptColumnActions = {},
): ColumnDef<GoodsReceipt>[] {
  const { onOpenReceipt, onArchive, processingReceiptId } = actions;

  return [
    {
      accessorKey: "receiptNo",
      header: "Receipt No",
      cell: ({ row }) => {
        return <span className="font-medium">{row.getValue("receiptNo")}</span>;
      },
    },
    {
      accessorKey: "order.orderNo",
      header: "Purchase Order",
      cell: ({ row }) => {
        return <span>{row.original.order?.orderNo || "N/A"}</span>;
      },
    },
    {
      accessorKey: "receiptDate",
      header: "Receipt Date",
      cell: ({ row }) => {
        const date = row.getValue("receiptDate") as string;
        return <span>{format(new Date(date), "MMM dd, yyyy")}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            className={
              GOODS_RECEIPT_STATUS_COLORS[status] || "bg-gray-100 text-gray-800"
            }
          >
            {goodsReceiptStatusLabel(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        return <span>{row.original.items.length} items</span>;
      },
    },
    {
      id: "receiptPdf",
      header: "Receipt PDF",
      cell: ({ row }) => {
        const url = row.original.documentPdfUrl;
        if (!url) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        return (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-primary text-sm underline"
            onClick={(e) => e.stopPropagation()}
          >
            Open
          </a>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const receipt = row.original;
        const canArchive = receipt.status === "inspected" && !receipt.archived;
        const isProcessing = processingReceiptId === receipt.id;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {onOpenReceipt && (
                  <DropdownMenuItem onClick={() => onOpenReceipt(receipt.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                )}
                {canArchive && onArchive && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={isProcessing}
                      onClick={() => onArchive(receipt.id)}
                    >
                      {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Archive className="mr-2 h-4 w-4" />
                      )}
                      {isProcessing ? "Archiving..." : "Archive"}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}

// Backward compatibility - export default columns without handlers
export const GOODS_RECEIPT_COLUMNS: ColumnDef<GoodsReceipt>[] =
  createGoodsReceiptColumns();
