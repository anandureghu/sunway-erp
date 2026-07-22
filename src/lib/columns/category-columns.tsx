"use client";

import type { ItemCategory } from "@/types/inventory";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

// Status pill component
const StatusPill = ({ value }: { value: string }) => {
  const isActive = value === "active";
  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isActive ? "bg-green-500 text-white" : "bg-red-500 text-white"
      }`}
    >
      {isActive ? "YES" : "NO"}
    </span>
  );
};

export function createCategoryColumns(
  onViewDetails?: (id: string) => void,
  onEdit?: (category: ItemCategory) => void,
  onDelete?: (id: string) => void,
  // onAddSubcategory?: (category: ItemCategory) => void,
  parentCategories?: ItemCategory[]
): ColumnDef<ItemCategory>[] {
  return [
    {
      accessorKey: "name",
      header: "CATEGORY NAME",
      enableSorting: true,
      cell: ({ row }) => {
        const category = row.original;
        const isSubcategory = !!category.parentId;
        const parentName = parentCategories?.find(
          (p) => p.id === category.parentId
        )?.name;
        return (
          <div className="max-w-[250px]">
            <div className="flex items-center gap-2">
              {isSubcategory && (
                <span className="text-xs text-gray-400 font-mono">└─</span>
              )}
              <span
                className={`font-normal whitespace-nowrap truncate ${
                  isSubcategory ? "text-blue-700" : "text-gray-900"
                }`}
              >
                {category.name}{" "}
                {!isSubcategory && `(${category.subCategories?.length || 0})`}
              </span>
            </div>
            {isSubcategory && parentName && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <span>
                  Parent: <span className="font-medium">{parentName}</span>
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "code",
      header: "CODE",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-gray-900 font-normal whitespace-nowrap">
          {row.original.code || "-"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "ACTIVE",
      enableSorting: true,
      cell: ({ row }) => <StatusPill value={row.original.status || ""} />,
    },
    {
      id: "actions",
      header: "ACTIONS",
      cell: ({ row }) => {
        const category = row.original;
        const isSubcategory = !!category.parentId;
        if (!onViewDetails && !onEdit && !onDelete) return null;
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
                {onViewDetails && !isSubcategory && (
                  <DropdownMenuItem onClick={() => onViewDetails(category.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(category)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => onDelete(category.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
