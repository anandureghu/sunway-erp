import { type ColumnDef } from "@tanstack/react-table";
import type { BudgetLineDTO } from "@/types/budget";
import { Button } from "@/components/ui/button";

export function getBudgetLineColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (line: BudgetLineDTO) => void;
  onDelete: (line: BudgetLineDTO) => void;
}): ColumnDef<BudgetLineDTO>[] {
  return [
    { header: "Account", accessorKey: "accountId" },
    { header: "Dept", accessorKey: "departmentId" },
    { header: "Project", accessorKey: "projectId" },
    { header: "Period", accessorKey: "period" },
    { header: "Amount", accessorKey: "amount" },
    { header: "Notes", accessorKey: "notes" },
    {
      header: "Actions",
      cell: ({ row }) => (
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
  ];
}
