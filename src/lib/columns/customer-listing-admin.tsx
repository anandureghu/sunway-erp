import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Customer } from "@/types/customer";
import type { ColumnDef, CellContext } from "@tanstack/react-table";

interface CustomerColumnsProps {
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

// Helper component to display optional values
const OptionalCell = ({ value }: { value?: string | number | null }) => {
  if (value === null || value === undefined) return <span>-</span>;
  if (typeof value === "string" && value.trim() === "") return <span>-</span>;
  return <span>{String(value)}</span>;
};

type CellProps<TData> = CellContext<TData, unknown>;

export const getCustomerColumns = ({
  onEdit,
  onDelete,
}: CustomerColumnsProps): ColumnDef<Customer>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: (ctx: CellProps<Customer>) => (
      <OptionalCell value={String(ctx.getValue() ?? "")} />
    ),
  },
  {
    accessorKey: "name",
    header: "Customer Name",
    cell: (ctx: CellProps<Customer>) => {
      const value = ctx.getValue() as string | null | undefined;
      // Fallback to customerName if name is not available
      const customer = ctx.row.original;
      const displayValue = value ?? customer.customerName ?? null;
      return <OptionalCell value={displayValue} />;
    },
  },
  {
    accessorKey: "contactPersonName",
    header: "Contact Person",
    cell: (ctx: CellProps<Customer>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: (ctx: CellProps<Customer>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "phoneNo",
    header: "Phone",
    cell: (ctx: CellProps<Customer>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "city",
    header: "City",
    cell: (ctx: CellProps<Customer>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "state",
    header: "State",
    cell: (ctx: CellProps<Customer>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "country",
    header: "Country",
    cell: (ctx: CellProps<Customer>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "customerType",
    header: "Type",
    cell: (ctx: CellProps<Customer>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: (ctx: CellProps<Customer>) => {
      const date = ctx.getValue() as string | undefined;
      if (!date) return "-";
      try {
        return new Date(date).toLocaleString();
      } catch {
        return "-";
      }
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(customer);
            }}
          >
            <Pencil className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(customer);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      );
    },
  },
];

