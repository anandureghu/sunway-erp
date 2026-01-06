import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Vendor } from "@/types/vendor";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

interface VendorColumnsProps {
  onEdit: (vendor: Vendor) => void;
  onDelete: (vendor: Vendor) => void;
  onView?: (vendor: Vendor) => void;
}

// Helper component to display optional values
const OptionalCell = ({ value }: { value?: string | number | null | boolean }) => {
  if (value === null || value === undefined) return <span>-</span>;
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  if (typeof value === "string" && value.trim() === "") return <span>-</span>;
  return <span>{String(value)}</span>;
};

// Status pill component
const StatusPill = ({ value }: { value: boolean | undefined }) => {
  const isActive = value !== false;
  return (
    <Badge
      variant={isActive ? "default" : "destructive"}
      className={isActive ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
    >
      {isActive ? "YES" : "NO"}
    </Badge>
  );
};

type CellProps<TData> = CellContext<TData, unknown>;

export const getVendorColumns = ({
  onEdit,
  onDelete,
  onView,
}: VendorColumnsProps): ColumnDef<Vendor>[] => [
  {
    accessorKey: "id",
    header: "ID",
    enableSorting: true,
    cell: (ctx: CellProps<Vendor>) => (
      <OptionalCell value={String(ctx.getValue() ?? "")} />
    ),
  },
  {
    accessorKey: "vendorName",
    header: "VENDOR NAME",
    enableSorting: true,
    cell: (ctx: CellProps<Vendor>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "contactPersonName",
    header: "CONTACT PERSON",
    enableSorting: true,
    cell: (ctx: CellProps<Vendor>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "email",
    header: "EMAIL",
    enableSorting: true,
    cell: (ctx: CellProps<Vendor>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "phoneNo",
    header: "PHONE",
    enableSorting: true,
    cell: (ctx: CellProps<Vendor>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "city",
    header: "CITY",
    enableSorting: true,
    cell: (ctx: CellProps<Vendor>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "country",
    header: "COUNTRY",
    enableSorting: true,
    cell: (ctx: CellProps<Vendor>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "active",
    header: "ACTIVE",
    enableSorting: true,
    cell: (ctx: CellProps<Vendor>) => {
      const value = ctx.getValue() as boolean | undefined;
      return <StatusPill value={value} />;
    },
  },
  {
    accessorKey: "is1099Vendor",
    header: "1099 VENDOR",
    enableSorting: true,
    cell: (ctx: CellProps<Vendor>) => {
      const vendor = ctx.row.original;
      // Try multiple possible field names
      const value = 
        vendor.is1099Vendor !== undefined ? vendor.is1099Vendor :
        (vendor as any).is_1099_vendor !== undefined ? (vendor as any).is_1099_vendor :
        (vendor as any).is1099 !== undefined ? (vendor as any).is1099 :
        ctx.getValue() as boolean | undefined;
      
      return <StatusPill value={value} />;
    },
  },
  {
    id: "actions",
    header: "ACTIONS",
    cell: ({ row }) => {
      const vendor = row.original;
      return (
        <div className="flex gap-2">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView(vendor);
              }}
            >
              VIEW
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(vendor);
            }}
          >
            EDIT
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(vendor);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            DELETE
          </Button>
        </div>
      );
    },
  },
];

