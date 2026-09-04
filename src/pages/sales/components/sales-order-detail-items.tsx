import { CurrencyAmount } from "@/components/currency/currency-amount";
import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import {
  lineItemGrossAmount,
  salesDiscountPercentLabel,
  salesGrossSubtotal,
} from "@/lib/sales-order-money";
import { Package, ReceiptText, Warehouse } from "lucide-react";
import { Link } from "react-router-dom";
import { totalLineQty } from "./sales-order-detail-utils";

type Props = {
  so: SalesOrderResponseDTO;
};

export function SalesOrderDetailItems({ so }: Props) {
  const itemRows = so.items || [];
  const qty = totalLineQty(so);
  const tax = so.taxAmount ?? 0;
  const discountAmount = so.discountAmount ?? 0;
  const grossSubtotal = salesGrossSubtotal({
    subtotalAmount: so.subtotalAmount,
    discountAmount,
    items: itemRows,
  });
  const discountPctLabel = salesDiscountPercentLabel({
    discountAmount,
    grossSubtotal,
    items: itemRows,
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-sky-600" />
          <h2 className="text-base font-semibold text-slate-900">Line items</h2>
        </div>
        <span className="text-xs text-slate-500">
          {itemRows.length} line{itemRows.length === 1 ? "" : "s"} · {qty} units
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] table-fixed text-sm">
          <colgroup>
            <col className="w-12" />
            <col />
            <col className="w-20" />
            <col className="w-36" />
            <col className="w-24" />
            <col className="w-36" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 text-center">#</th>
              <th className="px-3 py-3 text-left">Item Name</th>
              <th className="px-3 py-3 text-center">Qty</th>
              <th className="px-3 py-3 text-center">Unit price</th>
              <th className="px-3 py-3 text-center">Discount</th>
              <th className="px-4 py-3 text-center">Line item</th>
            </tr>
          </thead>
          <tbody>
            {itemRows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No line items on this order
                </td>
              </tr>
            ) : (
              itemRows.map((item, index) => {
                const discount = item.discountPercent ?? 0;
                return (
                  <tr
                    key={`${item.itemId}-${index}`}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="px-4 py-3 align-middle text-center tabular-nums text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-3 py-3 align-middle text-left">
                      {item.itemSku ? (
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                          {item.itemSku}
                        </p>
                      ) : null}
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
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <Warehouse className="h-3 w-3 shrink-0" />
                        {item.warehouseName || "No warehouse"}
                      </p>
                    </td>
                    <td className="px-3 py-3 align-middle text-center tabular-nums text-slate-800">
                      <div>{item.quantity || 0}</div>
                      {(item.returnedQty ?? 0) > 0 ? (
                        <div className="mt-0.5 text-[11px] font-medium text-amber-700">
                          {item.returnedQty} returned
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <div className="flex justify-center">
                        <CurrencyAmount amount={item.unitPrice || 0} />
                      </div>
                    </td>
                    <td className="px-3 py-3 align-middle text-center tabular-nums">
                      {discount > 0 ? (
                        <span className="font-medium text-amber-600">
                          {discount}%
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle font-semibold">
                      <div className="flex justify-center">
                        <CurrencyAmount amount={lineItemGrossAmount(item)} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-100 bg-slate-50/50">
              <td
                colSpan={4}
                rowSpan={tax > 0 ? 4 : 3}
                className="px-4 py-3 align-bottom"
              >
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Package className="h-4 w-4" />
                  Total units:{" "}
                  <span className="font-semibold text-slate-800">{qty}</span>
                </div>
              </td>
              <td className="px-3 py-2 text-center text-sm text-slate-500">
                Subtotal
              </td>
              <td className="px-4 py-2 text-sm font-semibold">
                <div className="flex justify-center">
                  <CurrencyAmount amount={grossSubtotal} />
                </div>
              </td>
            </tr>
            <tr className="bg-slate-50/50">
              <td className="px-3 py-2 text-center text-sm text-slate-500">
                Discount
              </td>
              <td className="px-4 py-2 text-sm font-semibold">
                <div className="flex justify-center gap-1">
                  <CurrencyAmount amount={discountAmount} />
                  {discountPctLabel ? (
                    <span className="font-normal text-slate-500">
                      ({discountPctLabel})
                    </span>
                  ) : null}
                </div>
              </td>
            </tr>
            {tax > 0 ? (
              <tr className="bg-slate-50/50">
                <td className="px-3 py-2 text-center text-sm text-slate-500">Tax</td>
                <td className="px-4 py-2 text-sm font-semibold">
                  <div className="flex justify-center">
                    <CurrencyAmount amount={tax} />
                  </div>
                </td>
              </tr>
            ) : null}
            <tr className="bg-slate-50/50">
              <td className="border-t border-slate-200 px-3 py-2.5 text-center text-sm font-semibold text-slate-900">
                Total
              </td>
              <td className="border-t border-slate-200 px-4 py-2.5 text-base font-bold text-sky-600">
                <div className="flex justify-center">
                  <CurrencyAmount amount={so.totalAmount ?? 0} />
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
