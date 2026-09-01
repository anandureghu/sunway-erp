import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { safeLocaleQty } from "./formatters";
import {
  resolveStockIndicator,
  warehouseLabel,
} from "./item-detail-utils";
import {
  AlertTriangle,
  ArrowDownToLine,
  Package,
  Warehouse,
} from "lucide-react";

type Props = {
  item: ItemResponseDTO;
};

export function ItemDetailStockOverview({ item }: Props) {
  const unit = item.unitMeasure || "pcs";
  const indicator = resolveStockIndicator(item);
  const available = Number(item.available ?? 0);
  const quantity = Number(item.quantity ?? 0);
  const reserved = Number(item.reserved ?? 0);
  const reorder = Number(item.reorderLevel ?? 0);

  const cards = [
    {
      icon: Package,
      title: "On hand",
      value: safeLocaleQty(quantity, unit),
      hint: `${available.toLocaleString()} available`,
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
    {
      icon: Warehouse,
      title: "Warehouse",
      value: warehouseLabel(item) || "Unassigned",
      hint: item.warehouse_location || item.location || "No bin location",
      tone: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Inventory Control</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Live inventory levels, warehouse placement, and stock policy
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
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
