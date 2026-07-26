import { CurrencyAmount } from "@/components/currency/currency-amount";
import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import { ArrowUpRight, ShoppingCart } from "lucide-react";
import {
  formatStatusLabel,
  nextStepMessage,
  paymentStatusKey,
} from "./sales-order-detail-utils";

export function SalesOrderHeroTotals({ so }: { so: SalesOrderResponseDTO }) {
  const payment = paymentStatusKey(so);

  return (
    <div className="flex flex-col justify-between gap-4 lg:col-span-2">
      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Order total
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-sky-600 sm:text-4xl">
          <CurrencyAmount amount={so.totalAmount ?? 0} />
        </p>
        <div className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between gap-2 text-slate-500">
            <span>Subtotal</span>
            <span className="font-medium tabular-nums text-slate-800">
              <CurrencyAmount amount={so.subtotalAmount ?? 0} />
            </span>
          </div>
          <div className="flex justify-between gap-2 text-slate-500">
            <span>Discount</span>
            <span className="font-medium tabular-nums text-slate-800">
              <CurrencyAmount amount={so.discountAmount ?? 0} />
            </span>
          </div>
          <div className="flex justify-between gap-2 text-slate-500">
            <span>Tax</span>
            <span className="font-medium tabular-nums text-slate-800">
              <CurrencyAmount amount={so.taxAmount ?? 0} />
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-4 text-white shadow-md shadow-sky-500/20">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">
              Fulfillment
            </p>
            <p className="mt-0.5 text-sm font-semibold leading-snug">
              {nextStepMessage(so)}
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold capitalize text-sky-700">
          {formatStatusLabel(payment)}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}
