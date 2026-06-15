import { type ColumnDef } from "@tanstack/react-table";
import type { PaymentResponseDTO, PaymentsPageVariant } from "@/types/payment";
import { Badge } from "@/components/ui/badge";
import { CreditAmount, DebitAmount } from "@/components/accounting-amount";
import { Button } from "@/components/ui/button";
import { isPaymentArchivedTab } from "@/lib/payment-tab-utils";
import {
  formatPaymentMethodLabel,
  isDummyDocumentUrl,
} from "@/lib/payment-method-label";
import { Archive, Loader2 } from "lucide-react";

export const PAYMENT_COLUMNS = ({
  variant = "customer",
  onConfirm,
  onOpenInvoice,
  onOpenPurchaseOrder,
  onViewReceipt,
  onArchive,
  archivingPaymentId,
}: {
  variant?: PaymentsPageVariant;
  onConfirm: (payment: PaymentResponseDTO) => void;
  onOpenInvoice: (invoiceId: string) => void;
  onOpenPurchaseOrder: (purchaseOrderId: number) => void;
  onViewReceipt?: (payment: PaymentResponseDTO) => void;
  onArchive?: (payment: PaymentResponseDTO) => void;
  archivingPaymentId?: number | null;
}): ColumnDef<PaymentResponseDTO>[] => [
  { accessorKey: "id", header: "ID" },

  { accessorKey: "paymentCode", header: "Code" },

  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const item = row.original;
      const amt = Number(row.getValue("amount"));
      const dir =
        item.paymentDirection || (variant === "vendor" ? "VENDOR" : "CUSTOMER");
      if (dir === "VENDOR") {
        return <DebitAmount amount={amt} />;
      }
      return <CreditAmount amount={Math.abs(amt)} />;
    },
  },

  {
    accessorKey: "paymentMethod",
    header: "Method",
    cell: ({ row }) => {
      const value = row.getValue("paymentMethod") as string;
      return (
        <Badge className="bg-blue-100 text-blue-700">
          {formatPaymentMethodLabel(value)}
        </Badge>
      );
    },
  },

  {
    accessorKey: "effectiveDate",
    header: "Date",
    cell: ({ row }) => {
      const date = row.getValue("effectiveDate") as string;
      return new Date(date).toLocaleDateString();
    },
  },

  {
    id: "orderNumber",
    header: "Order No",
    cell: ({ row }) => {
      const item = row.original;
      const dir =
        item.paymentDirection || (variant === "vendor" ? "VENDOR" : "CUSTOMER");
      if (dir === "VENDOR") {
        const poLabel =
          item.purchaseOrderNumber ||
          (item.purchaseOrderId != null ? `PO #${item.purchaseOrderId}` : null);
        if (!poLabel) {
          return <span className="text-muted-foreground">—</span>;
        }
        return item.purchaseOrderId != null ? (
          <button
            type="button"
            className="font-mono text-sm text-blue-600 underline underline-offset-2 text-left"
            onClick={() => onOpenPurchaseOrder(item.purchaseOrderId!)}
          >
            {poLabel}
          </button>
        ) : (
          <span className="font-mono text-sm">{poLabel}</span>
        );
      }
      const so = item.salesOrderNumber;
      if (!so) {
        return <span className="text-muted-foreground">—</span>;
      }
      return <span className="font-mono text-sm">{so}</span>;
    },
  },

  {
    id: "reference",
    header: variant === "vendor" ? "Purchase invoice" : "Sales invoice",
    cell: ({ row }) => {
      const item = row.original;
      const inv = item.invoiceId;
      if (!inv) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <button
          type="button"
          className="text-blue-600 underline underline-offset-2 text-left text-sm"
          onClick={() => onOpenInvoice(inv)}
        >
          {inv}
        </button>
      );
    },
  },

  {
    id: "receiptPdf",
    header: "Receipt PDF",
    cell: ({ row }) => {
      const item = row.original;
      const method = (item.paymentMethod || "").toUpperCase();
      const isPendingVendor =
        variant === "vendor" && method === "PENDING_VENDOR_PAYMENT";
      if (isPendingVendor) {
        return <span className="text-muted-foreground text-xs">After confirm</span>;
      }
      const url = item.pdfUrl;
      const canUseDirect = url && !isDummyDocumentUrl(url);
      if (canUseDirect) {
        return (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
            data-no-row-nav
            onClick={(e) => e.stopPropagation()}
          >
            View
          </a>
        );
      }
      if (variant === "vendor" && onViewReceipt && !isPendingVendor) {
        return (
          <button
            type="button"
            className="text-blue-600 underline text-sm"
            data-no-row-nav
            onClick={(e) => {
              e.stopPropagation();
              void onViewReceipt(item);
            }}
          >
            View
          </button>
        );
      }
      return <span className="text-muted-foreground">—</span>;
    },
  },

  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const item = row.original;
      const method = (item.paymentMethod || "").toUpperCase();
      const dir = item.paymentDirection || "CUSTOMER";
      const isPending =
        dir === "VENDOR"
          ? method === "PENDING_VENDOR_PAYMENT"
          : method === "PENDING_REQUEST";
      const settled = isPaymentArchivedTab(item, variant);
      const canArchive = settled && !item.archived && onArchive != null;
      const isArchiving = archivingPaymentId === item.id;

      if (isPending) {
        return (
          <div data-no-row-nav onClick={(e) => e.stopPropagation()}>
            <Button size="sm" onClick={() => onConfirm(item)}>
              {dir === "VENDOR" ? "Confirm vendor payment" : "Confirm payment"}
            </Button>
          </div>
        );
      }
      if (item.archived) {
        return <span className="text-muted-foreground text-xs">Archived</span>;
      }
      if (canArchive) {
        return (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs">Confirmed</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={isArchiving}
              onClick={() => onArchive(item)}
            >
              {isArchiving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Archive className="h-3.5 w-3.5" />
              )}
              <span className="ml-1">
                {isArchiving ? "Archiving…" : "Archive"}
              </span>
            </Button>
          </div>
        );
      }
      return <span className="text-muted-foreground text-xs">Confirmed</span>;
    },
  },
];
