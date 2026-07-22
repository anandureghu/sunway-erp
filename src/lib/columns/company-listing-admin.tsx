import { Ban, MoreHorizontal, Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/lib/status-badge";
import { formatBytes } from "@/lib/utils";
import type { Company } from "@/types/company";
import type { ColumnDef } from "@tanstack/react-table";

interface CompanyColumnsProps {
  onEdit: (company: Company) => void;
  onDeactivate: (company: Company) => void;
  onReactivate: (company: Company) => void;
}

export const getCompanyColumns = ({
  onEdit,
  onDeactivate,
  onReactivate,
}: CompanyColumnsProps): ColumnDef<Company>[] => [
  {
    accessorKey: "companyCode",
    header: "Company Code",
  },
  {
    accessorKey: "companyName",
    header: "Company Name",
  },
  {
    accessorKey: "employeeCount",
    header: "Number of employees:",
    cell: ({ getValue }) => getValue<number>() ?? 0,
  },
  {
    accessorKey: "industry",
    header: "Industry",
    cell: ({ getValue }) => (getValue() as string | null) || "—",
  },
  {
    accessorKey: "cloudStorageBytes",
    header: "Cloud Storage",
    cell: ({ getValue }) => formatBytes(getValue<number>()),
  },
  {
    accessorKey: "databaseStorageBytes",
    header: "Database Storage",
    cell: ({ getValue }) => formatBytes(getValue<number>()),
  },
  {
    accessorKey: "city",
    header: "City",
  },
  {
    accessorKey: "state",
    header: "State/Region",
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
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={row.original.active === false ? "INACTIVE" : "ACTIVE"} />
    ),
  },
  {
    accessorKey: "createdAt",
    header: "On Boarded Date",
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
      const isActive = company.active !== false;
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
              <DropdownMenuItem onClick={() => onEdit(company)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isActive ? (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => onDeactivate(company)}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-emerald-600 focus:text-emerald-600"
                  onClick={() => onReactivate(company)}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reactivate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
