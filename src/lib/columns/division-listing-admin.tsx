import Info from "@/components/info";
import { Button } from "@/components/ui/button";
import type { DivisionResponseDTO } from "@/types/division";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";

interface DivisionColumnsProps {
  onEdit?: (division: DivisionResponseDTO) => void;
  onDelete: (division: DivisionResponseDTO) => void;
}

export const getDivisionColumns = ({
  onDelete,
}: DivisionColumnsProps): ColumnDef<DivisionResponseDTO>[] => [
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "managerId",
    header: "Manager ID",
    cell: ({ row }) => {
      const division = row.original;
      return (
        <Info
          title={`${division.managerFirstName} ${division.managerLastName}`}
          subtitle={division.managerId.toString()}
        />
      );
    },
  },
  {
    id: "companyName",
    header: "Company",
    cell: ({ row }) => (
      <Info
        title={row.original.companyName}
        subtitle={row.original.companyCode}
      />
    ),
  },
  {
    id: "departmentName",
    header: "Department",
    cell: ({ row }) => (
      <Info
        title={row.original.departmentName}
        subtitle={row.original.departmentCode}
      />
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const division = row.original;
      return (
        <div className="flex gap-2">
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(division);
            }}
          >
            <Pencil className="h-4 w-4 text-blue-600" />
          </Button> */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(division);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      );
    },
  },
];
