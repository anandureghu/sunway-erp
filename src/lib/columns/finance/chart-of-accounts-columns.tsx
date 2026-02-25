import { type ColumnDef } from "@tanstack/react-table";
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
import type { ChartOfAccounts } from "@/types/coa";
import type { Company } from "@/types/company";

export const CHART_OF_ACCOUNTS_COLUMNS = ({
  onEdit,
  onDelete,
  company,
}: {
  onEdit: (account: ChartOfAccounts) => void;
  onDelete: (account: ChartOfAccounts) => void;
  company: Company;
}): ColumnDef<ChartOfAccounts>[] => [
  { accessorKey: "id", header: "ID" },

  { accessorKey: "accountCode", header: "Account Code" },
  { accessorKey: "accountName", header: "Account Name" },
  { accessorKey: "description", header: "Description" },

  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("type")}</Badge>,
  },

  { accessorKey: "parentId", header: "Parent ID" },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        className={
          row.getValue("status") === "active"
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-700"
        }
      >
        {row.getValue("status")}
      </Badge>
    ),
  },

  { accessorKey: "glAccountClassTypeKey", header: "GL Class Key" },
  { accessorKey: "glAccountType", header: "GL Account Type" },

  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) => {
      const b = row.getValue("balance");
      return (
        <span>
          {company.currency?.currencyCode} {Number(b).toLocaleString()}
        </span>
      );
    },
  },

  // { accessorKey: "companyId", header: "Company ID" },

  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const account = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            <DropdownMenuItem onClick={() => onEdit(account)}>
              Edit
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onDelete(account)}>
              Delete
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-muted-foreground">
              ID: {account.id}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
