import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import {
  catalogDiscountPercent,
  hasCatalogDiscount,
  listPriceOf,
} from "@/lib/item-catalog-pricing";
import {
  displaySellingPrice,
  marginPercent,
} from "./item-detail-utils";

type Props = {
  item: ItemResponseDTO;
};

export function ItemDetailCostSelling({ item }: Props) {
  const selling = displaySellingPrice(item);
  const list = listPriceOf(item);
  const discountPct = catalogDiscountPercent(item);
  const margin = marginPercent(item);

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-4">
      <h2 className="text-base font-bold text-slate-900">Cost and selling</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Purchase cost, list price, and current selling price
      </p>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-slate-500">Cost</span>
          <span className="font-semibold tabular-nums">
            <CurrencyAmount amount={item.costPrice} />
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-500">List price</span>
          <span className="font-semibold tabular-nums text-slate-700">
            <CurrencyAmount amount={list} />
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-500">Selling price</span>
          <span className="font-semibold tabular-nums text-indigo-600">
            <CurrencyAmount amount={selling} />
          </span>
        </div>
        {hasCatalogDiscount(item) ? (
          <div className="flex justify-between gap-2 rounded-lg bg-amber-50 px-2.5 py-2 text-amber-900">
            <span className="text-amber-800">Catalog discount</span>
            <span className="font-semibold tabular-nums">{discountPct}% off list</span>
          </div>
        ) : null}
        {margin != null ? (
          <div className="flex justify-between gap-2 border-t border-slate-100 pt-2">
            <span className="text-slate-500">Margin</span>
            <span className="font-semibold tabular-nums text-rose-600">
              {margin > 0 ? "+" : ""}
              {margin}%
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
