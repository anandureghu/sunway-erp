import { type ColumnDef } from "@tanstack/react-table";
import type { BudgetLineDTO } from "@/types/budget";
import { Button } from "@/components/ui/button";
import type { Company } from "@/types/company";

export function getBudgetLineColumns({
  onEdit,
  onDelete,
  company,
}: {
  onEdit: (line: BudgetLineDTO) => void;
  onDelete: (line: BudgetLineDTO) => void;
  company: Company;
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
        `${company.currency?.currencySymbol} ${row.getValue("amount")}`,
    },
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
