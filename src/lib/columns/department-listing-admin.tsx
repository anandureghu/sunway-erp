import { Button } from "@/components/ui/button";
import type { Department } from "@/types/department";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

interface DepartmentColumnsProps {
  onEdit: (dept: Department) => void;
  onDelete: (dept: Department) => void;
}

export const getDepartmentColumns = ({
  onEdit,
  onDelete,
}: DepartmentColumnsProps): ColumnDef<Department>[] => [
  {
    accessorKey: "departmentCode",
    header: "Code",
  },
  {
    accessorKey: "departmentName",
    header: "Name",
  },
  {
    accessorKey: "managerId",
    header: "Manager ID",
    cell: ({ getValue }) => getValue() ?? "-",
  },
  {
    id: "companyName",
    header: "Company",
    cell: ({ row }) => row.original.company?.companyName ?? "-",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ getValue }) =>
      new Date(getValue() as string).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const dept = row.original;
      return (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(dept);
            }}
          >
            <Pencil className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(dept);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      );
    },
  },
];
