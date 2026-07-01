"use client";

import type { DispatchCarrier } from "@/types/inventory";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

const StatusPill = ({ value }: { value: string }) => {
  const isActive = value === "active";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

export function createCarrierColumns(
  onEdit?: (carrier: DispatchCarrier) => void,
  onDelete?: (id: string) => void,
): ColumnDef<DispatchCarrier>[] {
  return [
    {
      accessorKey: "name",
      header: "Carrier",
      cell: ({ row }) => (
        <span className="font-medium text-slate-900">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "driverName",
      header: "Driver",
      cell: ({ row }) => row.original.driverName || "—",
    },
    {
      accessorKey: "vehicleNumber",
      header: "Vehicle",
      cell: ({ row }) => row.original.vehicleNumber || "—",
    },
    {
      accessorKey: "driverPhone",
      header: "Driver phone",
      cell: ({ row }) => row.original.driverPhone || "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusPill value={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          {onEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-rose-600 hover:text-rose-700"
              onClick={() => onDelete(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];
}
