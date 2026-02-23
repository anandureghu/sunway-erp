"use client";

import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { type ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, MapPin, Warehouse } from "lucide-react";
import { Link } from "react-router-dom";

export const STOCK_COLUMNS: ColumnDef<ItemResponseDTO>[] = [
  {
    accessorKey: "item.imageUrl",
    header: "",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <img
          src={item.imageUrl || ""}
          alt={item.name}
          className="max-w-[50px] max-h-[50px] min-w-[50px] min-h-[50px] object-cover rounded-full"
        />
      );
    },
  },
  {
    accessorKey: "item.sku",
    header: "SKU/Item Code",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex item-center gap-2">
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
      const item = row.original;
      return <span className="font-medium">{item.name}</span>;
    },
  },
  {
    accessorKey: "item.category",
    header: "Category",
    cell: ({ row }) => {
      const item = row.original;
      return <span className="text-gray-600">{item.category}</span>;
    },
  },
  {
    accessorKey: "item.subcategory",
    header: "SubCategory",
    cell: ({ row }) => {
      const item = row.original;
      return <span className="text-gray-600">{item.subCategory || "-"}</span>;
    },
  },
  {
    accessorKey: "item.brand",
    header: "Brand",
    cell: ({ row }) => {
      const item = row.original;
      return <span className="text-gray-600">{item.brand || "-"}</span>;
    },
  },
  {
    accessorKey: "item.warehouse_name",
    header: "Warehouse",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <Link
          to={`/inventory/warehouses/${item.warehouse_id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 underline">
              {item.warehouse_name}
            </span>
          </div>
        </Link>
      );
    },
  },
  {
    accessorKey: "item.warehouse_location",
    header: "Location",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{item.warehouse_location}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => {
      const stock = row.original;
      const isLowStock = stock.quantity <= (stock.reorderLevel || 0);
      return (
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${isLowStock ? "text-red-600" : ""}`}>
            {stock.quantity.toLocaleString()} {stock.unitMeasure}
          </span>
          {isLowStock && <AlertTriangle className="h-4 w-4 text-red-500" />}
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
          {stock.available.toLocaleString()} {stock.unitMeasure}
        </span>
      );
    },
  },
  {
    accessorKey: "reservedQuantity",
    header: "Reserved",
    cell: ({ row }) => {
      const stock = row.original;
      if (!stock.reserved || stock.reserved === 0) {
        return <span className="text-gray-400">-</span>;
      }
      return (
        <span className="text-amber-600">
          {stock.reserved.toLocaleString()} {stock.unitMeasure}
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
