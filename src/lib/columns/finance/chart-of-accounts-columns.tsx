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

import type { Company } from "@/types/company";
import type { ChartOfAccounts } from "@/types/finance/chart-of-accounts";
import Info from "@/components/info";

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

  { accessorKey: "accountNo", header: "Account No" },
  {
    accessorKey: "accountName",
    header: "Account Name",
    cell: ({ row }) => {
      const coa = row.original;
      return <Info title={coa.accountName} subtitle={coa.accountCode} />;
    },
  },

  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue<string>("type")}</Badge>
    ),
  },

  {
    accessorKey: "parentName",
    header: "Parent Account",
    cell: ({ row }) => row.getValue("parentName") ?? "-",
  },

  {
    accessorKey: "departmentName",
    header: "Department",
    cell: ({ row }) => row.getValue("departmentName") ?? "-",
  },

  { accessorKey: "projectCode", header: "Project Code" },

  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) => {
      const balance = row.getValue<string | number>("balance") ?? "0";
      const numeric =
        typeof balance === "string" ? parseFloat(balance) : balance;

      return (
        <span className="font-medium">
          {company.currency?.currencyCode || ""}{" "}
          {numeric.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      );
    },
  },

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
