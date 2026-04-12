import { type ColumnDef } from "@tanstack/react-table";
import type {
  PaymentResponseDTO,
  PaymentsPageVariant,
} from "@/types/payment";
import { Badge } from "@/components/ui/badge";
import { CreditAmount, DebitAmount } from "@/components/accounting-amount";
import { Button } from "@/components/ui/button";

export const PAYMENT_COLUMNS = ({
  variant = "customer",
  onConfirm,
  onOpenInvoice,
  onOpenPurchaseOrder,
}: {
  variant?: PaymentsPageVariant;
  onConfirm: (payment: PaymentResponseDTO) => void;
  onOpenInvoice: (invoiceId: string) => void;
  onOpenPurchaseOrder: (purchaseOrderId: number) => void;
}): ColumnDef<PaymentResponseDTO>[] => [
  { accessorKey: "id", header: "ID" },

  { accessorKey: "paymentCode", header: "Code" },

  {
    accessorKey: "amount",
    header: "Amount (₹)",
    cell: ({ row }) => {
      const item = row.original;
      const amt = Number(row.getValue("amount"));
      const dir =
        item.paymentDirection || (variant === "vendor" ? "VENDOR" : "CUSTOMER");
      if (dir === "VENDOR") {
        return <DebitAmount amount={amt} currencyCode="₹" />;
      }
      return <CreditAmount amount={Math.abs(amt)} currencyCode="₹" />;
    },
  },

  {
    accessorKey: "paymentMethod",
    header: "Method",
    cell: ({ row }) => {
      const value = row.getValue("paymentMethod") as string;
      return (
        <Badge className="bg-blue-100 text-blue-700">
          {value?.replace(/_/g, " ")}
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
    id: "reference",
    header: variant === "vendor" ? "Purchase order" : "Sales invoice",
    cell: ({ row }) => {
      const item = row.original;
      const dir = item.paymentDirection || (variant === "vendor" ? "VENDOR" : "CUSTOMER");
      if (dir === "VENDOR" && item.purchaseOrderId != null) {
        return (
          <button
            type="button"
            className="text-blue-600 underline underline-offset-2"
            onClick={() => onOpenPurchaseOrder(item.purchaseOrderId!)}
          >
            PO #{item.purchaseOrderId}
          </button>
        );
      }
      const inv = item.invoiceId;
      if (!inv) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <button
          type="button"
          className="text-blue-600 underline underline-offset-2"
          onClick={() => onOpenInvoice(inv)}
        >
          {inv}
        </button>
      );
    },
  },

  {
    accessorKey: "pdfUrl",
    header: "Receipt PDF",
    cell: ({ row }) => {
      const url = row.getValue("pdfUrl") as string;
      return url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline"
        >
          View
        </a>
      ) : (
        "-"
      );
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
      return isPending ? (
        <Button size="sm" onClick={() => onConfirm(item)}>
          {dir === "VENDOR" ? "Confirm vendor payment" : "Confirm payment"}
        </Button>
      ) : (
        <span className="text-muted-foreground text-xs">Confirmed</span>
      );
    },
  },
];
