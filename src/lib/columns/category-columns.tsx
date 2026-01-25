"use client";

import type { ItemCategory } from "@/types/inventory";
import { type ColumnDef } from "@tanstack/react-table";

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
        return (
          <div className="flex items-center gap-2">
            {onViewDetails && !isSubcategory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(category.id);
                }}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium px-3 py-1.5 rounded transition-colors text-sm"
              >
                VIEW
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(category);
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
                  onDelete(category.id);
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
