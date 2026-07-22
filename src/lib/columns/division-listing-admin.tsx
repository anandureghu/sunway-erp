import Info from "@/components/info";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DivisionResponseDTO } from "@/types/division";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface DivisionColumnsProps {
  onEdit?: (division: DivisionResponseDTO) => void;
  onDelete: (division: DivisionResponseDTO) => void;
}

export const getDivisionColumns = ({
  onEdit,
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
    id: "departmentName",
    header: "Department",
    cell: ({ row }) => (
      <Info
        title={row.original.departmentName ?? "—"}
        subtitle={row.original.departmentCode ?? ""}
      />
    ),
  },
  {
    accessorKey: "managerId",
    header: "Manager",
    cell: ({ row }) => {
      const division = row.original;
      if (division.managerId == null) {
        return <span className="text-slate-400">—</span>;
      }
      const name = [division.managerFirstName, division.managerLastName]
        .filter(Boolean)
        .join(" ");
      return (
        <Info
          title={name || "—"}
          subtitle={division.managerId.toString()}
        />
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const division = row.original;
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(division)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => onDelete(division)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
