import { type ColumnDef, type Row } from "@tanstack/react-table";
import type { BudgetLineDTO } from "@/types/budget";
import { Button } from "@/components/ui/button";
import type { Company } from "@/types/company";
import type { Role } from "@/types/hr";
import { hasAnyRole } from "@/lib/utils";
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

export function getBudgetLineColumns({
  onEdit,
  onDelete,
  company,
  role,
  onStatusChange,
}: {
  onEdit: (line: BudgetLineDTO) => void;
  onDelete: (line: BudgetLineDTO) => void;
  onStatusChange: (id: number, status: string) => void;
  company: Company;
  role?: Role;
}): ColumnDef<BudgetLineDTO>[] {
  return [
    { header: "Credited Account", accessorKey: "accountName" },
    { header: "Picklist", accessorKey: "departmentId" },
    { header: "Project", accessorKey: "projectId" },
    // { header: "Start Date", accessorKey: "startDate" },
    // { header: "End Date", accessorKey: "endDate" },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: ({ row }) => {
        const code = company.currency?.currencyCode || "";
        return (
          <CreditAmount
            amount={Number(row.getValue("amount"))}
            currencyCode={code || undefined}
          />
        );
      },
    },
    { header: "Notes", accessorKey: "notes" },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.original.status ?? "";
        return (
          <StatusBadge
            status={status}
            label={status === "IMPLEMENTED" ? "Draft" : undefined}
          />
        );
      },
    },
    ...(hasAnyRole(role, ["FINANCE_MANAGER", "SUPER_ADMIN"])
      ? [
          {
            id: "actions",
            header: "Actions",
            cell: ({ row }: { row: Row<BudgetLineDTO> }) => {
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

                      {entry.status !== "APPROVED" && (
                        <DropdownMenuItem onClick={() => onEdit(entry)}>
                          Edit
                        </DropdownMenuItem>
                      )}

                      {(entry.status === "IMPLEMENTED" ||
                        entry.status === "HOLD") && (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              onStatusChange(entry.id!, "APPROVED")
                            }
                          >
                            Approve
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              onStatusChange(entry.id!, "REJECTED")
                            }
                          >
                            Reject
                          </DropdownMenuItem>

                          {entry.status !== "HOLD" && (
                            <DropdownMenuItem
                              onClick={() => onStatusChange(entry.id!, "HOLD")}
                            >
                              Hold
                            </DropdownMenuItem>
                          )}
                        </>
                      )}

                      {entry.status !== "APPROVED" && (
                        <DropdownMenuItem onClick={() => onDelete(entry)}>
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            },
          },
        ]
      : []),
  ];
}
