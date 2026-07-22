import { apiClient } from "@/service/apiClient";
import type { Role } from "@/types/hr";
import type { Vendor } from "@/types/vendor";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ban, CheckCircle, Eye, MoreHorizontal, Pencil, XCircle } from "lucide-react";

interface VendorColumnsProps {
  onEdit: (vendor: Vendor) => void;
  onDeactivate: (vendor: Vendor) => void;
  onView?: (vendor: Vendor) => void;
  financeSettings?: boolean;
  role?: Role;
}

// Helper component to display optional values
const OptionalCell = ({
  value,
}: {
  value?: string | number | null | boolean;
}) => {
  if (value === null || value === undefined)
    return <span className="text-gray-500 whitespace-nowrap">-</span>;
  if (typeof value === "boolean")
    return (
      <span className="text-gray-900 whitespace-nowrap">
        {value ? "Yes" : "No"}
      </span>
    );
  if (typeof value === "string" && value.trim() === "")
    return <span className="text-gray-500 whitespace-nowrap">-</span>;
  return (
    <span className="text-gray-900 font-normal whitespace-nowrap">
      {String(value)}
    </span>
  );
};

// Status pill component
const StatusPill = ({
  value,
  approved = false,
  rejected = false,
}: {
  value: boolean | undefined;
  approved?: boolean;
  rejected?: boolean;
}) => {
  const isActive = value !== false;
  if (rejected) {
    return (
      <span
        className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-red-200 text-red-600`}
      >
        REJECTED
      </span>
    );
  }
  if (!approved) {
    return (
      <span
        className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-yellow-200 text-yellow-600`}
      >
        PENDING
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-semibold ${
        isActive ? "bg-green-200 text-green-500" : "bg-red-200 text-red-500"
      }`}
    >
      {isActive ? "YES" : "NO"}
    </span>
  );
};

type CellProps<TData> = CellContext<TData, unknown>;

const approveVendor = (id: number, status: boolean) => {
  apiClient
    .patch(`/vendors/${id}`, {}, { params: { status } })
    .then(() => {
      toast.success(`Vendor ${status ? "approved" : "rejected"} successfully`);
    })
    .catch(() => {
      toast.error(`Failed to ${status ? "approve" : "reject"} vendor`);
    });
};

export const getVendorColumns = ({
  onEdit,
  onDeactivate,
  onView,
  financeSettings = false,
  role,
}: VendorColumnsProps): ColumnDef<Vendor>[] => [
  {
    accessorKey: "id",
    header: "ID",
    enableSorting: true,
    cell: (ctx: CellProps<Vendor>) => (
      <span className="text-blue-600 font-medium">
        {String(ctx.getValue() ?? "-")}
      </span>
    ),
  },
  {
    accessorKey: "vendorName",
    header: "VENDOR NAME",
    enableSorting: true,
    cell: (ctx: CellProps<Vendor>) => (
      <div className="max-w-[200px] truncate">
        <OptionalCell value={ctx.getValue() as string | undefined} />
      </div>
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
      const vendor = ctx.row.original;
      return (
        <StatusPill
          value={vendor.active}
          approved={vendor.approved}
          rejected={vendor.rejected}
        />
      );
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
        vendor.is1099Vendor !== undefined
          ? vendor.is1099Vendor
          : (vendor as any).is_1099_vendor !== undefined
            ? (vendor as any).is_1099_vendor
            : (vendor as any).is1099 !== undefined
              ? (vendor as any).is1099
              : (ctx.getValue() as boolean | undefined);

      return <StatusPill value={value} approved />;
    },
  },
  {
    id: "actions",
    header: "ACTIONS",
    cell: ({ row }) => {
      const vendor = row.original;
      if (vendor.approved === false && vendor.rejected === false) {
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
                <DropdownMenuItem
                  className="text-green-700 focus:text-green-700"
                  onClick={() => approveVendor(vendor.id, true)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </DropdownMenuItem>
                {role === "FINANCE_MANAGER" && (
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => approveVendor(vendor.id, false)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }

      if (vendor.rejected || financeSettings) {
        return null;
      }

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
                <DropdownMenuItem onClick={() => onView(vendor)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit(vendor)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {vendor.active !== false && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => onDeactivate(vendor)}
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
