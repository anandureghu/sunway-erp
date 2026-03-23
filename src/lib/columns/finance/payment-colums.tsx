import { type ColumnDef } from "@tanstack/react-table";
import type { PaymentResponseDTO } from "@/types/payment";
import { Badge } from "@/components/ui/badge";
import { CreditAmount } from "@/components/accounting-amount";
import { Button } from "@/components/ui/button";
// import { Button } from "@/components/ui/button";
// import { MoreHorizontal } from "lucide-react";
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
// } from "@/components/ui/dropdown-menu";

export const PAYMENT_COLUMNS = ({
  onConfirm,
  onOpenInvoice,
}: {
  onConfirm: (payment: PaymentResponseDTO) => void;
  onOpenInvoice: (invoiceId: string) => void;
}) //   {
//   onEdit,
//   onDelete,
// }: {
//   onEdit: (data: PaymentResponseDTO) => void;
//   onDelete: (data: PaymentResponseDTO) => void;
// }
: ColumnDef<PaymentResponseDTO>[] => [
  { accessorKey: "id", header: "ID" },

  { accessorKey: "paymentCode", header: "Code" },

  {
    accessorKey: "amount",
    header: "Amount (₹)",
    cell: ({ row }) => {
      const amt = Number(row.getValue("amount"));
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
          {value?.replace("_", " ")}
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
    accessorKey: "invoiceId",
    header: "Invoice ID",
    cell: ({ row }) => {
      const value = row.getValue("invoiceId") as string | null;
      if (!value) return <span>-</span>;
      return (
        <button
          type="button"
          className="text-blue-600 underline underline-offset-2"
          onClick={() => onOpenInvoice(value)}
        >
          {value}
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
        <a href={url} target="_blank" className="text-blue-600 underline">
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
      const isPending = (item.paymentMethod || "").toUpperCase() === "PENDING_REQUEST";
      return isPending ? (
        <Button size="sm" onClick={() => onConfirm(item)}>
          Confirm Payment
        </Button>
      ) : (
        <span className="text-muted-foreground text-xs">Confirmed</span>
      );
    },
  },
];
