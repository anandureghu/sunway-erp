import type { ColumnDef } from "@tanstack/react-table";
import type { BudgetResponseDTO } from "@/types/budget";
import { Button } from "@/components/ui/button";
import type { Company } from "@/types/company";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/lib/status-badge";
import { CreditAmount } from "@/components/accounting-amount";
import { Badge } from "@/components/ui/badge";

const TYPE_LABELS: Record<string, string> = {
  OPEX: "OPEX",
  CAPEX: "CAPEX",
  PROJECT: "Project",
};

export const BUDGET_COLUMNS = ({
  onRevise,
  onDistribute,
  onApprove,
  onReject,
  onHold,
  company,
}: {
  onRevise: (row: BudgetResponseDTO) => void;
  onDistribute: (row: BudgetResponseDTO) => void;
  onApprove: (row: BudgetResponseDTO) => void;
  onReject: (row: BudgetResponseDTO) => void;
  onHold: (row: BudgetResponseDTO) => void;
  company: Company;
}): ColumnDef<BudgetResponseDTO>[] => [
  {
    header: "Name",
    accessorKey: "budgetName",
  },
  {
    header: "Type",
    accessorKey: "budgetType",
    cell: ({ row }) => {
      const type = row.original.budgetType ?? "OPEX";
      return (
        <Badge variant="outline" className="font-normal">
          {TYPE_LABELS[type] ?? type}
        </Badge>
      );
    },
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
      const code = company.currency?.currencyCode || "";
      return (
        <CreditAmount amount={Number(amount)} currencyCode={code || undefined} />
      );
    },
  },
  {
    header: "Start Date",
    accessorKey: "startDate",
    cell: ({ row }) => {
      return row.original.startDate
        ? new Date(row.original.startDate).toDateString()
        : "—";
    },
  },
  {
    header: "End Date",
    accessorKey: "endDate",
    cell: ({ row }) => {
      return row.original.endDate
        ? new Date(row.original.endDate).toDateString()
        : "—";
    },
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => (
      <StatusBadge status={String(row.getValue("status") ?? "")} />
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      return new Date(row.original.createdAt).toDateString();
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const entry = row.original;
      const isActiveApproved =
        entry.status === "APPROVED" && entry.isActive !== false;
      const canApproveOrHold =
        entry.status === "IMPLEMENTED" || entry.status === "HOLD";
      const hasActions = isActiveApproved || canApproveOrHold;

      if (!hasActions) {
        return <span className="text-muted-foreground">—</span>;
      }

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

              {isActiveApproved && (
                <>
                  <DropdownMenuItem onClick={() => onRevise(entry)}>
                    Revise
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDistribute(entry)}>
                    Distribute Budget
                  </DropdownMenuItem>
                </>
              )}

              {canApproveOrHold && (
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
