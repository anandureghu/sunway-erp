"use client";

import type { Warehouse } from "@/types/inventory";
import { type ColumnDef } from "@tanstack/react-table";
import { MapPin } from "lucide-react";

// Helper component to display optional values
const OptionalCell = ({ value }: { value?: string | number | null | boolean }) => {
  if (value === null || value === undefined) return <span className="text-gray-500 whitespace-nowrap">-</span>;
  if (typeof value === "string" && value.trim() === "") return <span className="text-gray-500 whitespace-nowrap">-</span>;
  return <span className="text-gray-900 font-normal whitespace-nowrap">{String(value)}</span>;
};

// Status pill component
const StatusPill = ({ value }: { value: string }) => {
  const isActive = value === "active";
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

export function createWarehouseColumns(
  onEdit?: (warehouse: Warehouse) => void,
  onDelete?: (id: string) => void,
  onView?: (warehouse: Warehouse) => void
): ColumnDef<Warehouse>[] {
  return [
    {
      accessorKey: "name",
      header: "WAREHOUSE NAME",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">
          <span className="text-gray-900 font-normal whitespace-nowrap">{row.original.name}</span>
        </div>
      ),
    },
    {
      id: "address",
      header: "ADDRESS",
      enableSorting: false,
      cell: ({ row }) => {
        const { street, city, country, pin } = row.original;
        const line1 = [street, city].filter(Boolean).join(", ");
        const line2 = [country, pin].filter(Boolean).join(" - ");
        return (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 mt-0.5 text-indigo-500 shrink-0" />
            <div className="leading-tight">
              <div className="text-gray-900 whitespace-nowrap">{line1 || "-"}</div>
              {line2 && <div className="text-xs text-gray-500">{line2}</div>}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "PHONE",
      enableSorting: true,
      cell: ({ row }) => <OptionalCell value={row.original.phone} />,
    },
    {
      accessorKey: "contactPersonName",
      header: "CONTACT PERSON",
      enableSorting: true,
      cell: ({ row }) => <OptionalCell value={row.original.contactPersonName} />,
    },
    {
      accessorKey: "managerName",
      header: "MANAGER",
      enableSorting: true,
      cell: ({ row }) => <OptionalCell value={row.original.managerName} />,
    },
    {
      accessorKey: "status",
      header: "ACTIVE",
      enableSorting: true,
      cell: ({ row }) => <StatusPill value={row.original.status} />,
    },
    {
      id: "actions",
      header: "ACTIONS",
      cell: ({ row }) => {
        const warehouse = row.original;
        return (
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(warehouse);
                }}
                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 font-medium px-3 py-1.5 rounded transition-colors text-sm"
              >
                EDIT
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(String(warehouse.id));
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium px-3 py-1.5 rounded transition-colors text-sm"
              >
                DELETE
              </button>
            )}
          </div>
        );
      },
    },
  ];
}
