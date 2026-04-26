import { type ColumnDef } from "@tanstack/react-table";
import type { GLAccountBalance } from "@/types/gl";
import {
  CreditAmount,
  DebitAmount,
  SignedColoredAmount,
} from "@/components/accounting-amount";
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

export const GL_BALANCE_COLUMNS = ({
  onEdit,
  onDelete,
}: {
  onEdit: (data: GLAccountBalance) => void;
  onDelete: (data: GLAccountBalance) => void;
}): ColumnDef<GLAccountBalance>[] => [
  { accessorKey: "id", header: "ID" },

  { accessorKey: "accountId", header: "Account ID" },
  { accessorKey: "fiscalYear", header: "Fiscal Year" },

  {
    accessorKey: "totalAssets",
    header: "Assets",
    cell: ({ row }) => <DebitAmount amount={Number(row.getValue("totalAssets"))} />,
  },

  {
    accessorKey: "totalLiabilities",
    header: "Liabilities",
    cell: ({ row }) => (
      <CreditAmount
        amount={Number(row.getValue("totalLiabilities"))}
      />
    ),
  },

  {
    accessorKey: "totalRevenue",
    header: "Revenue",
    cell: ({ row }) => (
      <CreditAmount
        amount={Number(row.getValue("totalRevenue"))}
      />
    ),
  },

  {
    accessorKey: "totalExpenses",
    header: "Expenses",
    cell: ({ row }) => (
      <DebitAmount
        amount={Number(row.getValue("totalExpenses"))}
      />
    ),
  },

  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) => (
      <SignedColoredAmount
        amount={Number(row.getValue("balance"))}
      />
    ),
  },

  {
    accessorKey: "asOfDate",
    header: "As of",
    cell: ({ row }) => {
      const date = row.getValue("asOfDate") as string;
      return date ? new Date(date).toLocaleDateString() : "-";
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
