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
    header: "SKU",
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
      return (
        <div className="flex flex-col">
          <span className="font-medium">{item.name}</span>
          {item.category && (
            <span className="text-xs text-gray-500">{item.category}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "warehouse.name",
    header: "Warehouse",
    cell: ({ row }) => {
      const warehouse = row.original.warehouse;
      return (
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-gray-400" />
          <div className="flex flex-col">
            <span>{warehouse.name}</span>
            <span className="text-xs text-gray-500">{warehouse.location}</span>
          </div>
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
  {
    accessorKey: "batchNo",
    header: "Batch/Lot",
    cell: ({ row }) => {
      const stock = row.original;
      return (
        <div className="flex flex-col gap-1">
          {stock.batchNo && (
            <Badge variant="outline" className="text-xs">
              Batch: {stock.batchNo}
            </Badge>
          )}
          {stock.lotNo && (
            <Badge variant="outline" className="text-xs">
              Lot: {stock.lotNo}
            </Badge>
          )}
          {!stock.batchNo && !stock.lotNo && (
            <span className="text-gray-400 text-xs">-</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "item.reorderLevel",
    header: "Reorder Level",
    cell: ({ row }) => {
      const stock = row.original;
      const reorderLevel = stock.item.reorderLevel || 0;
      const isLowStock = stock.quantity <= reorderLevel;
      return (
        <div className="flex items-center gap-2">
          <span className={isLowStock ? "text-red-600 font-medium" : ""}>
            {reorderLevel.toLocaleString()} {stock.item.unit}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "lastUpdated",
    header: "Last Updated",
    cell: ({ row }) => {
      const date = new Date(row.original.lastUpdated);
      return <span className="text-sm text-gray-600">{date.toLocaleDateString()}</span>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => {
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
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Transfer Stock</DropdownMenuItem>
            <DropdownMenuItem>Adjust Stock</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Movement History</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

