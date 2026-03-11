import type { ColumnDef } from "@tanstack/react-table";
import type { BudgetResponseDTO } from "@/types/budget";
import { Button } from "@/components/ui/button";
import type { Company } from "@/types/company";
import type { Role } from "@/types/hr";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const BUDGET_COLUMNS = ({
  onEdit,
  onApprove,
  onReject,
  onHold,
  company,
}: {
  onEdit: (row: BudgetResponseDTO) => void;
  onApprove: (row: BudgetResponseDTO) => void;
  onReject: (row: BudgetResponseDTO) => void;
  onHold: (row: BudgetResponseDTO) => void;
  company: Company;
  role?: Role;
}): ColumnDef<BudgetResponseDTO>[] => [
  {
    header: "Name",
    accessorKey: "budgetName",
  },
  {
    header: "Fiscal Year",
    accessorKey: "fiscalYear",
  },
  {
    header: "Amount",
    accessorKey: "amount",
    cell: ({ row }) => {
      const amount = row.getValue("amount");
      return `${company.currency?.currencyCode || ""} ${amount}`;
    },
  },
  {
    header: "Start Date",
    accessorKey: "startDate",
    cell: ({ row }) => {
      return new Date(row?.original?.startDate).toDateString();
    },
  },
  {
    header: "End Date",
    accessorKey: "endDate",
    cell: ({ row }) => {
      return new Date(row?.original?.endDate).toDateString();
    },
  },
  {
    header: "Status",
    accessorKey: "status",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      return new Date(row?.original?.createdAt).toDateString();
    },
  },
  // { accessorKey: "createdByName", header: "Created By" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const entry = row.original;

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <Separator />

              {(entry.status === "APPROVED" || entry.status === "HOLD") && (
                <DropdownMenuItem onClick={() => onEdit(entry)}>
                  Revise
                </DropdownMenuItem>
              )}

              {(entry.status === "IMPLEMENTED" || entry.status === "HOLD") && (
                <>
                  <DropdownMenuItem onClick={() => onApprove(entry)}>
                    Approve
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => onReject(entry)}>
                    Reject
                  </DropdownMenuItem>

                  {entry.status !== "HOLD" && (
                    <DropdownMenuItem onClick={() => onHold(entry)}>
                      Hold
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
