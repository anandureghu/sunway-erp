import { CurrencyAmount } from "@/components/currency/currency-amount";
import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import { Package, ReceiptText, Warehouse } from "lucide-react";
import { Link } from "react-router-dom";
import { totalLineQty } from "./sales-order-detail-utils";

type Props = {
  so: SalesOrderResponseDTO;
};

export function SalesOrderDetailItems({ so }: Props) {
  const itemRows = so.items || [];
  const qty = totalLineQty(so);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-sky-600" />
          <h2 className="text-base font-semibold text-slate-900">Items ordered</h2>
        </div>
        <span className="text-xs text-slate-500">
          {itemRows.length} line{itemRows.length === 1 ? "" : "s"} · {qty} units
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3">#</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-3 py-3 text-right">Qty</th>
              <th className="px-3 py-3 text-right">Unit price</th>
              <th className="px-3 py-3 text-right">Discount</th>
              <th className="px-5 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {itemRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                  No items on this order
                </td>
              </tr>
            ) : (
              itemRows.map((item, index) => {
                const discount = item.discountPercent ?? 0;
                return (
                  <tr
                    key={`${item.itemId}-${index}`}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="px-5 py-4 align-top text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="font-medium leading-snug text-slate-900">
                        {item.itemId ? (
                          <Link
                            to={`/inventory/stocks/${item.itemId}`}
                            className="hover:text-sky-600 hover:underline underline-offset-2"
                          >
                            {item.itemName || "Unnamed item"}
                          </Link>
                        ) : (
                          item.itemName || "Unnamed item"
                        )}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Warehouse className="h-3 w-3 shrink-0" />
                        {item.warehouseName || "No warehouse"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right align-top tabular-nums text-slate-800">
                      {item.quantity || 0}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right align-top tabular-nums text-slate-800">
                      <CurrencyAmount amount={item.unitPrice || 0} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right align-top">
                      {discount > 0 ? (
                        <span className="font-medium text-amber-600">
                          {discount}%
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right align-top font-semibold tabular-nums text-slate-900">
                      <CurrencyAmount amount={item.lineTotal || 0} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Package className="h-4 w-4" />
          Total units:{" "}
          <span className="font-semibold text-slate-800">{qty}</span>
        </div>
        <div className="text-base font-bold text-slate-900">
          Order total:{" "}
          <span className="text-sky-600">
            <CurrencyAmount amount={so.totalAmount || 0} />
          </span>
        </div>
      </div>
    </div>
  );
}
