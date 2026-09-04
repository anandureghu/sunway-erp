import type {
  ItemResponseDTO,
  ItemWarehouseStockRowDTO,
} from "@/service/erpApiTypes";
import { safeLocaleQty } from "./formatters";
import { resolveStockIndicator } from "./item-detail-utils";
import {
  AlertTriangle,
  ArrowDownToLine,
  Loader2,
  Package,
  Warehouse,
} from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
  item: ItemResponseDTO;
  warehouseStock: ItemWarehouseStockRowDTO[];
  warehouseStockLoading: boolean;
};

export function ItemDetailStockOverview({
  item,
  warehouseStock,
  warehouseStockLoading,
}: Props) {
  const unit = item.unitMeasure || "pcs";
  const indicator = resolveStockIndicator(item);
  const reorder = Number(item.reorderLevel ?? 0);

  const totals = warehouseStock.reduce(
    (acc, row) => {
      acc.onHand += Number(row.quantityOnHand ?? 0);
      acc.reserved += Number(row.reserved ?? 0);
      acc.available += Number(row.available ?? 0);
      return acc;
    },
    { onHand: 0, reserved: 0, available: 0 },
  );

  const hasWarehouseRows = warehouseStock.length > 0;
  const onHand = hasWarehouseRows ? totals.onHand : Number(item.quantity ?? 0);
  const reserved = hasWarehouseRows ? totals.reserved : Number(item.reserved ?? 0);
  const available = hasWarehouseRows
    ? totals.available
    : Number(item.available ?? 0);

  const cards = [
    {
      icon: Package,
      title: "On hand",
      value: safeLocaleQty(onHand, unit),
      hint: `${available.toLocaleString()} available across warehouses`,
      tone: "bg-indigo-50 text-indigo-600",
    },
    {
      icon: ArrowDownToLine,
      title: "Reserved",
      value: safeLocaleQty(reserved, unit),
      hint: "Allocated to open orders",
      tone: "bg-amber-50 text-amber-600",
    },
    {
      icon: AlertTriangle,
      title: "Reorder level",
      value: safeLocaleQty(reorder, unit),
      hint:
        indicator === "low_stock"
          ? "At or below reorder — restock soon"
          : `Min ${safeLocaleQty(item.minimum, unit)} · Max ${safeLocaleQty(item.maximum, unit)}`,
      tone:
        indicator === "low_stock"
          ? "bg-rose-50 text-rose-600"
          : "bg-slate-100 text-slate-600",
    },
  ];

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-bold text-slate-900">Inventory Control</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Live inventory levels by warehouse and stock policy
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-slate-200/80 bg-white p-3"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.tone}`}
            >
              <card.icon className="h-3.5 w-3.5" />
            </div>
            <p className="mt-2.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
              {card.title}
            </p>
            <p className="mt-0.5 truncate text-sm font-bold text-slate-900">
              {card.value}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
              {card.hint}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <Warehouse className="h-4 w-4 text-indigo-600" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Stock by warehouse
            </h3>
            <p className="text-[11px] text-slate-500">
              On-hand, reserved, and available quantity at each location
            </p>
          </div>
        </div>

        {warehouseStockLoading ? (
          <div className="flex items-center gap-2 px-4 py-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading warehouse stock…
          </div>
        ) : warehouseStock.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">
            No warehouse stock rows yet. Receive stock into a warehouse to see
            quantities here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-2.5 font-medium">Warehouse</th>
                  <th className="px-4 py-2.5 text-right font-medium">On hand</th>
                  <th className="px-4 py-2.5 text-right font-medium">Reserved</th>
                  <th className="px-4 py-2.5 text-right font-medium">Available</th>
                </tr>
              </thead>
              <tbody>
                {warehouseStock.map((row) => (
                  <tr
                    key={row.warehouseId}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      <Link
                        to={`/inventory/warehouses/${row.warehouseId}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {row.warehouseName || `Warehouse ${row.warehouseId}`}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-800">
                      {safeLocaleQty(row.quantityOnHand, unit)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-800">
                      {safeLocaleQty(row.reserved, unit)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-900">
                      {safeLocaleQty(row.available, unit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-slate-500">Negative stock permitted</span>
          <span className="font-semibold text-slate-900">
            {item.negativeStockPermitted ? "Yes" : "No"}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          {item.negativeStockPermitted
            ? "Sales may exceed available warehouse quantity."
            : "Sales cannot exceed available stock at the selected warehouse."}
        </p>
      </div>
    </section>
  );
}
