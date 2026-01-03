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

  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  switch (key) {
    case "ACTIVE":
      variant = "outline";
      break;
    case "INACTIVE":
      variant = "destructive";
      break;
    case "ON_LEAVE":
      variant = "secondary";
      break;
    default:
      variant = "default";
  }

  return (
    <Badge variant={variant} className="">
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

