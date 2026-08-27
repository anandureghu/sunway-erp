import { CurrencyAmount } from "@/components/currency/currency-amount";
import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import { AlertTriangle } from "lucide-react";

export function SalesOrderBalanceWarning({ so }: { so: SalesOrderResponseDTO }) {
  return (
    <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div className="space-y-1">
        <p className="font-medium">Insufficient funds to confirm</p>
        <p className="text-amber-900/90">
          There is not enough available balance to confirm this order.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-amber-900/80">
          <span>
            Order total:{" "}
            <CurrencyAmount amount={so.totalAmount ?? 0} className="inline" />
          </span>
          {so.debitAccountBalance != null ? (
            <span>
              Available:{" "}
              <CurrencyAmount amount={so.debitAccountBalance} className="inline" />
            </span>
          ) : null}
          {so.debitBalanceShortage != null && so.debitBalanceShortage > 0 ? (
            <span>
              Short by:{" "}
              <CurrencyAmount
                amount={so.debitBalanceShortage}
                className="inline font-medium"
              />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
