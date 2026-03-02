import { type ColumnDef, type Row } from "@tanstack/react-table";
import type { BudgetLineDTO } from "@/types/budget";
import { Button } from "@/components/ui/button";
import type { Company } from "@/types/company";
import type { Role } from "@/types/hr";
import { hasAnyRole } from "@/lib/utils";

export function getBudgetLineColumns({
  onEdit,
  onDelete,
  company,
  role,
}: {
  onEdit: (line: BudgetLineDTO) => void;
  onDelete: (line: BudgetLineDTO) => void;
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
      cell: ({ row }) =>
        `${company.currency?.currencyCode || ""} ${row.getValue("amount")}`,
    },
    { header: "Notes", accessorKey: "notes" },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.original.status;
        return <div>{status === "IMPLEMENTED" ? "Draft" : status}</div>;
      },
    },
    ...(hasAnyRole(role, ["FINANCE_MANAGER", "SUPER_ADMIN"])
      ? [
          {
            header: "Actions",
            cell: ({ row }: { row: Row<BudgetLineDTO> }) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onEdit(row.original)}
                >
                  Edit
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(row.original)}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];
}
