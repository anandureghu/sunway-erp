import { CurrencyAmount } from "@/components/currency/currency-amount";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import {
  AlertTriangle,
  ArrowDownToLine,
  Calendar,
  Package,
  Warehouse,
} from "lucide-react";
import {
  formatOptionalDate,
  formatRecordTimestamp,
  safeLocaleNumber,
  safeLocaleQty,
} from "./formatters";
import {
  displaySellingPrice,
  resolveStockIndicator,
  warehouseLabel,
} from "./item-detail-utils";

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
      hint: `${safeLocaleNumber(available)} available`,
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
          <h2 className="text-base font-bold text-slate-900">Stock Overview</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Live inventory levels and warehouse placement for this SKU
          </p>
        </div>

        {/* <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5">
          <div>
            <p className="text-3xl font-bold tabular-nums text-slate-900">
              {safeLocaleNumber(available)}
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Units available
            </p>
          </div>
          <div className="h-10 w-px bg-slate-100" />
          <div className="w-28 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
              <span>Fill</span>
              <span>{fillPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Avail</span>
              <span>Total</span>
            </div>
          </div>
        </div> */}
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
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Pricing
          </p>
          <div className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Cost</span>
              <span className="font-semibold tabular-nums">
                <CurrencyAmount amount={item.costPrice} />
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Selling</span>
              <span className="font-semibold tabular-nums text-indigo-600">
                <CurrencyAmount amount={displaySellingPrice(item)} />
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">
            <Calendar className="h-3.5 w-3.5" />
            Dates
          </div>
          <div className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Received</span>
              <span className="font-semibold">
                {formatOptionalDate(item.dateReceived)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Sale by</span>
              <span className="font-semibold">
                {formatOptionalDate(item.expiryDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Record
          </p>
          <div className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Created</span>
              <span className="font-semibold">
                {formatRecordTimestamp(item.createdAt)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Updated</span>
              <span className="font-semibold">
                {formatRecordTimestamp(item.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
