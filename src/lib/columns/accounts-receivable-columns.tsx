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
import type { Invoice } from "@/types/sales";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Archive,
  Download,
  Eye,
  Loader2,
  Mail,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/lib/status-badge";
import { TotalAmount, PaidAmount, RemainingAmount, CreditNoteAppliedAmount } from "@/components/accounting-amount";
import { isInvoiceReceiptView } from "@/lib/invoice-status-filter";

export type SalesInvoiceColumnActions = {
  onViewDetails?: (invoice: Invoice) => void;
  onDownload?: (invoice: Invoice) => void;
  onEmail?: (invoice: Invoice) => void;
};

export function createSalesInvoiceColumns(
  onArchive?: (id: number) => void,
  processingInvoiceId?: number | null,
  invoiceActions: SalesInvoiceColumnActions = {},
): ColumnDef<Invoice>[] {
  const { onViewDetails, onDownload, onEmail } = invoiceActions;
  return [
    {
      accessorKey: "invoiceId",
      header: "Invoice No",
    },
    {
      accessorKey: "customerName",
      header: "Customer Name",
      cell: ({ row }) => {
        const type = row.original.type;
        const customerName =
          type === "SALES"
            ? row.original.salesOrder?.customerName
            : row.original.purchaseOrder?.supplier?.name || "N/A";
        return <span>{customerName}</span>;
      },
    },
    {
      accessorKey: "invoiceDate",
      header: "Invoice Date",
      cell: ({ row }) => {
        const date = row.getValue("invoiceDate") as string;
        return <span>{date}</span>;
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        const date = row.getValue("dueDate") as string;
        return <span>{format(new Date(date), "MMM dd, yyyy")}</span>;
      },
    },
    {
      accessorKey: "orderNumber",
      header: "Order No",
      cell: ({ row }) => {
        const orderNo =
          row.original.orderNumber ||
          row.original.salesOrder?.orderNumber ||
          (row.original.orderId != null ? `SO #${row.original.orderId}` : null);
        return orderNo ? (
          <span className="font-mono text-sm">{orderNo}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Payment Status",
      cell: ({ row }) => {
        const status = String(row.getValue("status") ?? "");
        return <StatusBadge status={status} />;
      },
    },
    {
      accessorKey: "total",
      header: "Amount",
      cell: ({ row }) => {
        const type = row.original.type;
        const total =
          type === "SALES"
            ? row.original.salesOrder?.totalAmount
            : row.original.purchaseOrder?.total;
        if (total == null) {
          return <span className="text-muted-foreground">—</span>;
        }
        return <TotalAmount amount={total} />;
      },
    },
    {
      id: "paidAmount",
      header: "Paid Amount",
      cell: ({ row }) => {
        const invoice = row.original;
        const paid = invoice.paidAmount ?? 0;
        const creditApplied = invoice.creditAppliedAmount ?? 0;
        return (
          <div className="space-y-0.5">
            <PaidAmount amount={paid} />
            {creditApplied > 0 && (
              <div className="text-xs text-muted-foreground">
                incl. <CreditNoteAppliedAmount amount={creditApplied} className="inline" /> credit
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "remainderDue",
      header: "Remainder Due",
      cell: ({ row }) => {
        const invoice = row.original;
        const remaining = invoice.outstanding ?? invoice.openAmount ?? 0;
        return <RemainingAmount amount={remaining} />;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const invoice = row.original;
        const normalizedStatus = (invoice.status || "").toUpperCase();
        const isReceipt = isInvoiceReceiptView(invoice.status);
        const canArchive =
          !invoice.archived &&
          (normalizedStatus === "PAID" || normalizedStatus === "CANCELLED");
        const isProcessing = processingInvoiceId === invoice.id;
        const hasActions =
          onViewDetails || onDownload || onEmail || (canArchive && onArchive);

        if (!hasActions) {
          return <span className="text-muted-foreground">—</span>;
        }

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
                      onViewDetails(invoice);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {isReceipt ? "View receipt" : "View invoice"}
                  </DropdownMenuItem>
                )}
                {onDownload && (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      void onDownload(invoice);
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isReceipt ? "Download receipt" : "Download invoice"}
                  </DropdownMenuItem>
                )}
                {onEmail && (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      void onEmail(invoice);
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {isReceipt ? "Email receipt" : "Email invoice"}
                  </DropdownMenuItem>
                )}
                {canArchive && onArchive && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={isProcessing}
                      onClick={() => onArchive(invoice.id)}
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

export const SALES_INVOICE_COLUMNS: ColumnDef<Invoice>[] =
  createSalesInvoiceColumns();
