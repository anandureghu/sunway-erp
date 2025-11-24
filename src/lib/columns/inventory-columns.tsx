"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Stock } from "@/types/inventory";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, AlertTriangle, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Stock with details type
type StockWithDetails = Stock & {
  item: NonNullable<Stock["item"]>;
  warehouse: NonNullable<Stock["warehouse"]>;
};

export const STOCK_COLUMNS: ColumnDef<StockWithDetails>[] = [
  {
    accessorKey: "item.sku",
    header: "SKU/Item Code",
    cell: ({ row }) => {
      const item = row.original.item;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{item.sku}</span>
          {item.barcode && (
            <span className="text-xs text-gray-500">{item.barcode}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "item.name",
    header: "Item Name",
    cell: ({ row }) => {
      const item = row.original.item;
      return <span className="font-medium">{item.name}</span>;
    },
  },
  {
    accessorKey: "item.itemType",
    header: "Item Type",
    cell: ({ row }) => {
      const item = row.original.item;
      return <span className="text-gray-600">{item.itemType || "-"}</span>;
    },
  },
  {
    accessorKey: "item.category",
    header: "Category",
    cell: ({ row }) => {
      const item = row.original.item;
      return <span className="text-gray-600">{item.category}</span>;
    },
  },
  {
    accessorKey: "item.subcategory",
    header: "SubCategory",
    cell: ({ row }) => {
      const item = row.original.item;
      return <span className="text-gray-600">{item.subcategory || "-"}</span>;
    },
  },
  {
    accessorKey: "item.brand",
    header: "Brand",
    cell: ({ row }) => {
      const item = row.original.item;
      return <span className="text-gray-600">{item.brand || "-"}</span>;
    },
  },
  {
    accessorKey: "warehouse.location",
    header: "Location",
    cell: ({ row }) => {
      const warehouse = row.original.warehouse;
      return (
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{warehouse.location}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => {
      const stock = row.original;
      const isLowStock = stock.quantity <= (stock.item.reorderLevel || 0);
      return (
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${isLowStock ? "text-red-600" : ""}`}>
            {stock.quantity.toLocaleString()} {stock.item.unit}
          </span>
          {isLowStock && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "availableQuantity",
    header: "Available",
    cell: ({ row }) => {
      const stock = row.original;
      return (
        <span className="text-gray-600">
          {stock.availableQuantity.toLocaleString()} {stock.item.unit}
        </span>
      );
    },
  },
  {
    accessorKey: "reservedQuantity",
    header: "Reserved",
    cell: ({ row }) => {
      const stock = row.original;
      if (!stock.reservedQuantity || stock.reservedQuantity === 0) {
        return <span className="text-gray-400">-</span>;
      }
      return (
        <span className="text-amber-600">
          {stock.reservedQuantity.toLocaleString()} {stock.item.unit}
        </span>
      );
    },
  },
  // {
  //   id: "actions",
  //   header: "Actions",
  //   cell: () => {
  //     return (
  //       <div onClick={(e) => e.stopPropagation()}>
  //         <DropdownMenu>
  //           <DropdownMenuTrigger asChild>
  //             <Button variant="ghost" className="h-8 w-8 p-0">
  //               <span className="sr-only">Open menu</span>
  //               <MoreHorizontal className="h-4 w-4" />
  //             </Button>
  //           </DropdownMenuTrigger>
  //           <DropdownMenuContent align="end">
  //             <DropdownMenuLabel>Actions</DropdownMenuLabel>
  //             <DropdownMenuSeparator />
  //             <DropdownMenuItem>Transfer Stock</DropdownMenuItem>
  //             <DropdownMenuItem>Adjust Stock</DropdownMenuItem>
  //             <DropdownMenuSeparator />
  //             <DropdownMenuItem>View Movement History</DropdownMenuItem>
  //           </DropdownMenuContent>
  //         </DropdownMenu>
  //       </div>
  //     );
  //   },
  // },
];

