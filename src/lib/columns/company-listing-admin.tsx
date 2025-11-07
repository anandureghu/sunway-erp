import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Company } from "@/types/company";
import type { ColumnDef } from "@tanstack/react-table";

interface CompanyColumnsProps {
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
}

export const getCompanyColumns = ({
  onEdit,
  onDelete,
}: CompanyColumnsProps): ColumnDef<Company>[] => [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "companyName",
    header: "Company Name",
  },
  {
    accessorKey: "nooEmployees",
    header: "Employees",
  },
  {
    accessorKey: "city",
    header: "City",
  },
  {
    accessorKey: "state",
    header: "State",
  },
  {
    accessorKey: "country",
    header: "Country",
  },
  {
    accessorKey: "phoneNo",
    header: "Phone",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ getValue }) => {
      const date = new Date(getValue() as string);
      return date.toLocaleString();
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const company = row.original;
      return (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(company);
            }}
          >
            <Pencil className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(company);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      );
    },
  },
];
