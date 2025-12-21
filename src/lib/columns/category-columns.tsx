"use client";

import type { ItemCategory } from "@/types/inventory";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, Plus } from "lucide-react";

export function createCategoryColumns(
  onViewDetails?: (id: string) => void,
  onEdit?: (category: ItemCategory) => void,
  onDelete?: (id: string) => void,
  onAddSubcategory?: (category: ItemCategory) => void,
  parentCategories?: ItemCategory[]
): ColumnDef<ItemCategory>[] {
  return [
    {
      accessorKey: "name",
      header: "Category / Subcategory Name",
      cell: ({ row }) => {
        const category = row.original;
        const isSubcategory = !!category.parentId;
        const parentName = parentCategories?.find(p => p.id === category.parentId)?.name;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {isSubcategory && (
                <span className="text-xs text-gray-400 font-mono">└─</span>
              )}
              <span className={`font-medium ${isSubcategory ? "text-blue-700" : "text-gray-900"}`}>
                {category.name}
              </span>
            </div>
            {isSubcategory && parentName && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="text-gray-400">↳</span>
                <span>Parent: <span className="font-medium text-gray-700">{parentName}</span></span>
              </div>
            )}
            {isSubcategory && (
              <span className="text-xs text-blue-600 font-medium ml-6">Subcategory</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const isSubcategory = !!row.original.parentId;
        return (
          <span className={`text-xs px-2 py-1 rounded-full ${
            isSubcategory 
              ? "bg-blue-100 text-blue-800" 
              : "bg-green-100 text-green-800"
          }`}>
            {isSubcategory ? "Subcategory" : "Category"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const category = row.original;
        const isSubcategory = !!category.parentId;
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
              {onViewDetails && !isSubcategory && (
                <DropdownMenuItem onClick={() => onViewDetails(category.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}
              {onAddSubcategory && !isSubcategory && (
                <DropdownMenuItem onClick={() => onAddSubcategory(category)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subcategory
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(category)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit {isSubcategory ? "Subcategory" : "Category"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(category.id);
                  }}
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

