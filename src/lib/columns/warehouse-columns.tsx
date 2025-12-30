"use client";

import type { Warehouse } from "@/types/inventory";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, MapPin } from "lucide-react";

export function createWarehouseColumns(
  onEdit?: (warehouse: Warehouse) => void,
  onDelete?: (id: string) => void
): ColumnDef<Warehouse>[] {
  return [
    {
      accessorKey: "name",
      header: "Warehouse Name",
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">{row.original.name}</span>
      ),
    },

    {
      id: "address",
      header: "Address",
      cell: ({ row }) => {
        const { street, city, country, pin } = row.original;

        const line1 = [street, city].filter(Boolean).join(", ");
        const line2 = [country, pin].filter(Boolean).join(" - ");

        return (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 text-indigo-500 shrink-0" />
            <div className="leading-tight">
              <div>{line1 || "—"}</div>
              <div className="text-xs text-gray-500">{line2}</div>
            </div>
          </div>
        );
      },
    },

    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">{row.original.phone}</span>
      ),
    },

    {
      accessorKey: "contactPersonName",
      header: "Contact Person",
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">
          {row.original.contactPersonName}
        </span>
      ),
    },
    {
      accessorKey: "managerName",
      header: "Manager",
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">
          {row.original.managerName}
        </span>
      ),
    },

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;

        return (
          <Badge
            variant="outline"
            className={
              status === "active"
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : "bg-gray-100 text-gray-700 border-gray-200"
            }
          >
            {status}
          </Badge>
        );
      },
    },

    {
      id: "actions",
      cell: ({ row }) => {
        const warehouse = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>

              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(warehouse)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Warehouse
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {onDelete && (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => onDelete(String(warehouse.id))}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
