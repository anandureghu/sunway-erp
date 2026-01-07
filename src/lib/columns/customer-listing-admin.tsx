import type { Customer } from "@/types/customer";
import type { ColumnDef, CellContext } from "@tanstack/react-table";

interface CustomerColumnsProps {
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onView?: (customer: Customer) => void;
}

// Helper component to display optional values
const OptionalCell = ({ value }: { value?: string | number | null | boolean }) => {
  if (value === null || value === undefined) return <span className="text-gray-500 whitespace-nowrap">-</span>;
  if (typeof value === "boolean") return <span className="text-gray-900 whitespace-nowrap">{value ? "Active" : "Inactive"}</span>;
  if (typeof value === "string" && value.trim() === "") return <span className="text-gray-500 whitespace-nowrap">-</span>;
  return <span className="text-gray-900 font-normal whitespace-nowrap">{String(value)}</span>;
};

// Status pill component
const StatusPill = ({ value }: { value: boolean | undefined }) => {
  const isActive = value !== false;
  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isActive 
          ? "bg-green-500 text-white" 
          : "bg-red-500 text-white"
      }`}
    >
      {isActive ? "YES" : "NO"}
    </span>
  );
};

type CellProps<TData> = CellContext<TData, unknown>;

export const getCustomerColumns = ({
  onEdit,
  onDelete,
  onView,
}: CustomerColumnsProps): ColumnDef<Customer>[] => [
  {
    accessorKey: "id",
    header: "ID",
    enableSorting: true,
    cell: (ctx: CellProps<Customer>) => (
      <OptionalCell value={String(ctx.getValue() ?? "")} />
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
    header: "ACTIVE",
    enableSorting: true,
    cell: (ctx: CellProps<Customer>) => {
      const customer = ctx.row.original;
      const status = 
        customer.active !== undefined ? customer.active :
        customer.isActive !== undefined ? customer.isActive :
        (customer as any).is_active !== undefined ? (customer as any).is_active :
        ctx.getValue() as boolean | undefined;
      
      return <StatusPill value={status} />;
    },
  },
  {
    id: "actions",
    header: "ACTIONS",
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <div className="flex items-center gap-2">
          {onView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(customer);
              }}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium px-3 py-1.5 rounded transition-colors text-sm"
            >
              VIEW
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(customer);
            }}
            className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 font-medium px-3 py-1.5 rounded transition-colors text-sm"
          >
            EDIT
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(customer);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium px-3 py-1.5 rounded transition-colors text-sm"
          >
            DELETE
          </button>
        </div>
      );
    },
  },
];

