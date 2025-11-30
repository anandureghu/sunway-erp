import { type ColumnDef } from "@tanstack/react-table";
import type { GLAccountBalance } from "@/types/gl";
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
    cell: ({ row }) => (
      <>₹ {Number(row.getValue("totalAssets")).toLocaleString()}</>
    ),
  },

  {
    accessorKey: "totalLiabilities",
    header: "Liabilities",
    cell: ({ row }) => (
      <>₹ {Number(row.getValue("totalLiabilities")).toLocaleString()}</>
    ),
  },

  {
    accessorKey: "totalRevenue",
    header: "Revenue",
    cell: ({ row }) => (
      <>₹ {Number(row.getValue("totalRevenue")).toLocaleString()}</>
    ),
  },

  {
    accessorKey: "totalExpenses",
    header: "Expenses",
    cell: ({ row }) => (
      <>₹ {Number(row.getValue("totalExpenses")).toLocaleString()}</>
    ),
  },

  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) => (
      <Badge
        className={
          Number(row.getValue("balance")) >= 0
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }
      >
        ₹ {Number(row.getValue("balance")).toLocaleString()}
      </Badge>
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
