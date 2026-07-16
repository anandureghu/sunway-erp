import { Ban, Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
          {isActive ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDeactivate(company);
              }}
            >
              <Ban className="h-4 w-4 text-red-600" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onReactivate(company);
              }}
            >
              <RotateCcw className="h-4 w-4 text-emerald-600" />
            </Button>
          )}
        </div>
      );
    },
  },
];
