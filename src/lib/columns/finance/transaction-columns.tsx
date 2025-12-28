import { type ColumnDef } from "@tanstack/react-table";
// import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { TransactionResponseDTO } from "@/types/transactions";

export const TRANSACTION_COLUMNS = ({
  onEdit,
  onPost,
}: {
  onEdit: (data: TransactionResponseDTO) => void;
  onPost: (data: TransactionResponseDTO) => void;
}): ColumnDef<TransactionResponseDTO>[] => [
  // { accessorKey: "id", header: "ID" },

  { accessorKey: "transactionCode", header: "Transaction No" },
  { accessorKey: "transactionType", header: "Type" },
  // { accessorKey: "fiscalType", header: "Fiscal Type" },

  {
    accessorKey: "transactionDate",
    header: "Date",
    cell: ({ row }) =>
      new Date(row.getValue("transactionDate")).toLocaleDateString(),
  },

  // {
  //   accessorKey: "posted",
  //   header: "Posted",
  //   cell: ({ row }) =>
  //     row.getValue("posted") ? (
  //       <Badge className="bg-green-100 text-green-800">Posted</Badge>
  //     ) : (
  //       <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
  //     ),
  // },

  {
    accessorKey: "transactionDescription",
    header: "Description",
  },
  { accessorKey: "debitAccountName", header: "Debited From" },
  { accessorKey: "creditAccountName", header: "Credited To" },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = Number(row.getValue("amount"));
      return <>₹ {amount.toLocaleString()}</>;
    },
  },
  { accessorKey: "paymentId", header: "Payment ID" },

  { accessorKey: "invoiceId", header: "Invoice No" },
  // { accessorKey: "itemCode", header: "Item Code" },

  {
    id: "actions",
    header: "Actions",
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

            {!item.posted && (
              <DropdownMenuItem onClick={() => onPost(item)}>
                Post Transaction
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>ID: {item.id}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
