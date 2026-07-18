import type { Customer } from "@/types/customer";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import {
  formatCustomerCode,
  isCustomerActive,
} from "@/lib/customer-api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ban, Eye, MoreHorizontal, Pencil } from "lucide-react";

interface CustomerColumnsProps {
  onEdit: (customer: Customer) => void;
  onDeactivate: (customer: Customer) => void;
  onView?: (customer: Customer) => void;
}

const OptionalCell = ({ value }: { value?: string | number | null | boolean }) => {
  if (value === null || value === undefined) return <span className="text-gray-500 whitespace-nowrap">-</span>;
  if (typeof value === "boolean") return <span className="text-gray-900 whitespace-nowrap">{value ? "Active" : "Inactive"}</span>;
  if (typeof value === "string" && value.trim() === "") return <span className="text-gray-500 whitespace-nowrap">-</span>;
  return <span className="text-gray-900 font-normal whitespace-nowrap">{String(value)}</span>;
};

const StatusPill = ({ value }: { value: boolean | undefined }) => {
  const isActive = value !== false;
  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isActive ? "bg-green-500 text-white" : "bg-red-500 text-white"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

type CellProps<TData> = CellContext<TData, unknown>;

export const getCustomerColumns = ({
  onEdit,
  onDeactivate,
  onView,
}: CustomerColumnsProps): ColumnDef<Customer>[] => [
  {
    accessorKey: "id",
    header: "Customer Code",
    enableSorting: true,
    cell: (ctx: CellProps<Customer>) => (
      <span className="font-mono text-sm">{formatCustomerCode(ctx.row.original.id)}</span>
    ),
  },
  {
    accessorKey: "name",
    header: "CUSTOMER NAME",
    enableSorting: true,
    cell: (ctx: CellProps<Customer>) => {
      const value = ctx.getValue() as string | null | undefined;
      const customer = ctx.row.original;
      const displayValue = value ?? customer.customerName ?? null;
      return (
        <div className="max-w-[200px] truncate">
          <OptionalCell value={displayValue} />
        </div>
      );
    },
  },
  {
    accessorKey: "contactPersonName",
    header: "CONTACT PERSON",
    enableSorting: true,
    cell: (ctx: CellProps<Customer>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "email",
    header: "EMAIL",
    enableSorting: true,
    cell: (ctx: CellProps<Customer>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "phoneNo",
    header: "PHONE",
    enableSorting: true,
    cell: (ctx: CellProps<Customer>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "city",
    header: "CITY",
    enableSorting: true,
    cell: (ctx: CellProps<Customer>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "country",
    header: "COUNTRY",
    enableSorting: true,
    cell: (ctx: CellProps<Customer>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "active",
    header: "STATUS",
    enableSorting: true,
    cell: ({ row }) => <StatusPill value={isCustomerActive(row.original)} />,
  },
  {
    id: "actions",
    header: "ACTIONS",
    cell: ({ row }) => {
      const customer = row.original;
      const active = isCustomerActive(customer);
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
              {onView && (
                <DropdownMenuItem onClick={() => onView(customer)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit(customer)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {active && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => onDeactivate(customer)}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
