import type { ColumnDef, Row } from "@tanstack/react-table";
import type { BudgetResponseDTO } from "@/types/budget";
import { Button } from "@/components/ui/button";
import type { Company } from "@/types/company";
import type { Role } from "@/types/hr";
import { hasAnyRole } from "@/lib/utils";

export const BUDGET_COLUMNS = ({
  onEdit,
  onPost,
  company,
  role,
}: {
  onEdit: (row: BudgetResponseDTO) => void;
  onPost: (row: BudgetResponseDTO) => void;
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
  // {
  //   header: "Start Date",
  //   accessorKey: "startDate",
  // },
  // {
  //   header: "End Date",
  //   accessorKey: "endDate",
  // },
  {
    header: "Status",
    accessorKey: "status",
  },
  ...(hasAnyRole(role, ["FINANCE_MANAGER", "SUPER_ADMIN"])
    ? [
        {
          id: "actions",
          header: "Actions",
          cell: ({ row }: { row: Row<BudgetResponseDTO> }) => {
            const data = row.original;
            return (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(data);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPost(data);
                  }}
                >
                  Approve
                </Button>
              </div>
            );
          },
        },
      ]
    : []),
];
