import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Vendor } from "@/types/vendor";
import type { ColumnDef, CellContext } from "@tanstack/react-table";

interface VendorColumnsProps {
  onEdit: (vendor: Vendor) => void;
  onDelete: (vendor: Vendor) => void;
}

// Helper component to display optional values
const OptionalCell = ({ value }: { value?: string | number | null | boolean }) => {
  if (value === null || value === undefined) return <span>-</span>;
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  if (typeof value === "string" && value.trim() === "") return <span>-</span>;
  return <span>{String(value)}</span>;
};

type CellProps<TData> = CellContext<TData, unknown>;

export const getVendorColumns = ({
  onEdit,
  onDelete,
}: VendorColumnsProps): ColumnDef<Vendor>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: (ctx: CellProps<Vendor>) => (
      <OptionalCell value={String(ctx.getValue() ?? "")} />
    ),
  },
  {
    accessorKey: "vendorName",
    header: "Vendor Name",
    cell: (ctx: CellProps<Vendor>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "contactPersonName",
    header: "Contact Person",
    cell: (ctx: CellProps<Vendor>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: (ctx: CellProps<Vendor>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "phoneNo",
    header: "Phone",
    cell: (ctx: CellProps<Vendor>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "city",
    header: "City",
    cell: (ctx: CellProps<Vendor>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "country",
    header: "Country",
    cell: (ctx: CellProps<Vendor>) => (
      <OptionalCell value={ctx.getValue() as string | undefined} />
    ),
  },
  {
    accessorKey: "active",
    header: "Active",
    cell: (ctx: CellProps<Vendor>) => (
      <OptionalCell value={ctx.getValue() as boolean | undefined} />
    ),
  },
  {
    accessorKey: "is1099Vendor",
    header: "1099 Vendor",
    cell: (ctx: CellProps<Vendor>) => {
      const vendor = ctx.row.original;
      // Try multiple possible field names
      const value = 
        vendor.is1099Vendor !== undefined ? vendor.is1099Vendor :
        (vendor as any).is_1099_vendor !== undefined ? (vendor as any).is_1099_vendor :
        (vendor as any).is1099 !== undefined ? (vendor as any).is1099 :
        ctx.getValue() as boolean | undefined;
      
      return <OptionalCell value={value} />;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const vendor = row.original;
      return (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(vendor);
            }}
          >
            <Pencil className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(vendor);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      );
    },
  },
];

