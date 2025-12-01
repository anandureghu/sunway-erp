import { type ColumnDef } from "@tanstack/react-table";
import type { PaymentResponseDTO } from "@/types/payment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const PAYMENT_COLUMNS = ({
  onEdit,
  onDelete,
}: {
  onEdit: (data: PaymentResponseDTO) => void;
  onDelete: (data: PaymentResponseDTO) => void;
}): ColumnDef<PaymentResponseDTO>[] => [
  { accessorKey: "id", header: "ID" },

  { accessorKey: "paymentCode", header: "Code" },

  {
    accessorKey: "amount",
    header: "Amount (₹)",
    cell: ({ row }) => {
      const amt = Number(row.getValue("amount"));
      return <>₹ {amt.toLocaleString()}</>;
    },
  },

  {
    accessorKey: "paymentMethod",
    header: "Method",
    cell: ({ row }) => {
      const value = row.getValue("paymentMethod") as string;
      return (
        <Badge className="bg-blue-100 text-blue-700">
          {value.replace("_", " ")}
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

  { accessorKey: "invoiceId", header: "Invoice ID" },

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
    cell: ({ row }) => {
      const item = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            <DropdownMenuItem onClick={() => onEdit(item)}>
              Edit
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onDelete(item)}>
              Delete
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>ID: {item.id}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
