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
import { Archive, Loader2, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/lib/status-badge";
import { CreditAmount, DebitAmount } from "@/components/accounting-amount";

export function createSalesInvoiceColumns(
  onArchive?: (id: number) => void,
  processingInvoiceId?: number | null,
): ColumnDef<Invoice>[] {
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={String(row.getValue("status") ?? "")} />
    ),
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
      return type === "SALES" ? (
        <CreditAmount amount={total} />
      ) : (
        <DebitAmount amount={total} />
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const payment = row.original;
      const normalizedStatus = (payment.status || "").toUpperCase();
      const canArchive =
        !payment.archived &&
        (normalizedStatus === "PAID" || normalizedStatus === "CANCELLED");
      const isProcessing = processingInvoiceId === payment.id;

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
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(payment.id.toString() || "")
              }
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
            {canArchive && onArchive && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={isProcessing}
                  onClick={() => onArchive(payment.id)}
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
      );
    },
  },
  ];
}

export const SALES_INVOICE_COLUMNS: ColumnDef<Invoice>[] =
  createSalesInvoiceColumns();
