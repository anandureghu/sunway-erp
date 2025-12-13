import type { ColumnDef } from "@tanstack/react-table";
import type { BudgetResponseDTO } from "@/types/budget";
import { Button } from "@/components/ui/button";

export const BUDGET_COLUMNS = ({
  onEdit,
  onPost,
}: {
  onEdit: (row: BudgetResponseDTO) => void;
  onPost: (row: BudgetResponseDTO) => void;
}): ColumnDef<BudgetResponseDTO>[] => [
  {
    header: "Name",
    accessorKey: "budgetName",
  },
  {
    header: "Budget Year",
    accessorKey: "budgetYear",
  },
  {
    header: "Amount",
    accessorKey: "amount",
  },
  {
    header: "Start Date",
    accessorKey: "startDate",
  },
  {
    header: "End Date",
    accessorKey: "endDate",
  },
  {
    header: "Status",
    accessorKey: "status",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
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
];
