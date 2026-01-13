"use client";
import type { ColumnDef } from "@tanstack/react-table";
import type { Employee } from "../../../types/hr";
import { Badge } from "@/components/ui/badge";
import type { CellContext } from "@tanstack/react-table";

const EmployeeCell = ({ value }: { value: string }) => (
  <span className="font-medium">{value}</span>
);

const OptionalCell = ({ value }: { value?: string }) => (
  <span>{value ?? "-"}</span>
);

const StatusCell = ({ value }: { value?: string }) => {
  const raw = String(value ?? "");
  const key = raw.toUpperCase();

  const mapLabel: Record<string, string> = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    ON_LEAVE: "On Leave",
  };

  const label = mapLabel[key] ?? (raw || "-");

  let className = "";
  switch (key) {
    case "ACTIVE":
      className = "bg-green-100 text-green-900 border-green-300";
      break;
    case "INACTIVE":
      className = "bg-red-100 text-red-900 border-red-300";
      break;
    case "ON_LEAVE":
      className = "bg-amber-100 text-amber-900 border-amber-300";
      break;
    default:
      className = "bg-gray-100 text-gray-900 border-gray-300";
  }

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
};

type CellProps<TData> = CellContext<TData, unknown>;

export const EMPLOYEE_COLUMNS: ColumnDef<Employee>[] = [
  { 
    accessorKey: "employeeNo", 
    header: "Employee No", 
    enableSorting: true,
    cell: (ctx: CellProps<Employee>) => <EmployeeCell value={ctx.getValue() as string} />
  },
  {
    accessorKey: "username",
    header: "Username",
    enableSorting: true,
    cell: (ctx: CellProps<Employee>) => <OptionalCell value={ctx.getValue() as string | undefined} />
  },
  {
    accessorKey: "email",
    header: "Email",
    enableSorting: true,
    cell: (ctx: CellProps<Employee>) => <OptionalCell value={ctx.getValue() as string | undefined} />
  },
  { 
    accessorKey: "firstName", 
    header: "First Name", 
    enableSorting: true,
    cell: (ctx: CellProps<Employee>) => <EmployeeCell value={ctx.getValue() as string} />
  },
  { 
    accessorKey: "lastName", 
    header: "Last Name", 
    enableSorting: true,
    cell: (ctx: CellProps<Employee>) => <EmployeeCell value={ctx.getValue() as string} />
  },
  { 
    accessorKey: "department", 
    header: "Department", 
    enableSorting: true,
    cell: (ctx: CellProps<Employee>) => <OptionalCell value={ctx.getValue() as string | undefined} />
  },
  { 
    accessorKey: "designation", 
    header: "Designation", 
    enableSorting: true,
    cell: (ctx: CellProps<Employee>) => <OptionalCell value={ctx.getValue() as string | undefined} />
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: true,
    cell: (ctx: CellProps<Employee>) => <StatusCell value={ctx.getValue() as string} />
  }
];

