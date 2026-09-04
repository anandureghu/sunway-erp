"use client";

import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { formatOptionalDate } from "@/pages/inventory/inventory-item-detail/formatters";
import { resolveCatalogStatus } from "@/pages/inventory/inventory-item-detail/item-detail-utils";
import { catalogDiscountPercent, hasCatalogDiscount } from "@/lib/item-catalog-pricing";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import { type ColumnDef } from "@tanstack/react-table";
import { AlertTriangle } from "lucide-react";

export const STOCK_COLUMNS: ColumnDef<ItemResponseDTO>[] = [
  {
    accessorKey: "sku",
    header: "Item code",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{item.sku}</span>
          {item.barcode && (
            <span className="text-xs text-gray-500">{item.barcode}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Item name",
    cell: ({ row }) => {
      const item = row.original;
      return <span className="font-medium">{item.name}</span>;
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const item = row.original;
      return <span className="text-gray-600">{item.category}</span>;
    },
  },
  {
    accessorKey: "brand",
    header: "Brand",
    cell: ({ row }) => {
      const item = row.original;
      return <span className="text-gray-600">{item.brand || "-"}</span>;
    },
  },
  {
    id: "catalogDiscount",
    header: "Discount",
    cell: ({ row }) => {
      const item = row.original;
      if (!hasCatalogDiscount(item)) {
        return <span className="text-gray-400">—</span>;
      }
      const pct = catalogDiscountPercent(item);
      return (
        <span className="font-medium text-amber-700 tabular-nums">{pct}%</span>
      );
    },
  },
  {
    accessorKey: "sellingPrice",
    header: "Selling price",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex flex-col gap-0.5 tabular-nums">
          <CurrencyAmount amount={item.sellingPrice} className="font-medium" />
          {hasCatalogDiscount(item) ? (
            <span className="text-[11px] text-slate-500">
              List <CurrencyAmount amount={item.listPrice ?? item.sellingPrice} className="inline" />
            </span>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Qty on hand",
    cell: ({ row }) => {
      const stock = row.original;
      const qty = Number(stock.quantity ?? 0);
      const isLowStock = qty <= (stock.reorderLevel || 0);
      return (
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${isLowStock ? "text-red-600" : ""}`}>
            {qty.toLocaleString()} {stock.unitMeasure || ""}
          </span>
          {isLowStock && <AlertTriangle className="h-4 w-4 text-red-500" />}
        </div>
      );
    },
  },
  {
    accessorKey: "reserved",
    header: "Qty on reserve",
    cell: ({ row }) => {
      const stock = row.original;
      const reserved = Number(stock.reserved ?? 0);
      if (!reserved) {
        return <span className="text-gray-400">-</span>;
      }
      return (
        <span className="text-amber-600">
          {reserved.toLocaleString()} {stock.unitMeasure || ""}
        </span>
      );
    },
  },
  {
    accessorKey: "quantityOnOrder",
    header: "Qty on order",
    cell: ({ row }) => {
      const stock = row.original;
      const onOrder = Number(stock.quantityOnOrder ?? 0);
      if (!onOrder) {
        return <span className="text-gray-400">-</span>;
      }
      return (
        <span className="text-blue-600">
          {onOrder.toLocaleString()} {stock.unitMeasure || ""}
        </span>
      );
    },
  },
  {
    accessorKey: "dateReceived",
    header: "Date received",
    cell: ({ row }) => (
      <span className="text-gray-600">
        {formatOptionalDate(row.original.dateReceived)}
      </span>
    ),
  },
  {
    accessorKey: "expiryDate",
    header: "Sale by date",
    cell: ({ row }) => (
      <span className="text-gray-600">
        {formatOptionalDate(row.original.expiryDate)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = resolveCatalogStatus(row.original);
      const cfg: Record<string, { label: string; className: string }> = {
        active: { label: "Active", className: "bg-green-100 text-green-700" },
        discontinued: {
          label: "Discontinued",
          className: "bg-red-100 text-red-700",
        },
        out_of_stock: {
          label: "Out of Stock",
          className: "bg-amber-100 text-amber-700",
        },
      };
      const { label, className } = cfg[status] ?? {
        label: status,
        className: "bg-gray-100 text-gray-600",
      };
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
        >
          {label}
        </span>
      );
    },
  },
];
