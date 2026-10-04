import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Receipt } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";
import { loanService, type LoanPaymentRecord as Record } from "@/service/loanService";

/**
 * A loan's payment record: every repayment (payroll instalment, final settlement or
 * manual payment) with Month · Paid amount · Total payment (running total), plus a
 * repaid / balance summary. Used in the loan's view mode and in HR Reports → Loan
 * History.
 */

const money = (n: number | null | undefined) =>
  Number(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const monthLabel = (ym: string | null) => {
  if (!ym) return "—";
  const [y, m] = ym.split("-").map(Number);
  return y && m
    ? new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : ym;
};

const SOURCE_LABEL: { [k: string]: string } = {
  PAYROLL: "Payroll",
  SETTLEMENT: "Final settlement",
  MANUAL: "Manual payment",
};

export default function LoanPaymentRecord({
  employeeId,
  loanId,
  currencySymbol,
  refreshKey,
  className,
}: {
  employeeId: number;
  loanId: number;
  /** Shown before amounts; falls back to the loan's currency code. */
  currencySymbol?: string;
  /** Change to reload (e.g. after a manual payment). */
  refreshKey?: unknown;
  className?: string;
}) {
  const [record, setRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loanService
      .getPaymentRecord(employeeId, loanId)
      .then((r) => !cancelled && setRecord(r))
      .catch((err) => !cancelled && setError(getApiErrorMessage(err, "Could not load the payment record.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [employeeId, loanId, refreshKey]);

  const cur = currencySymbol || record?.currencyCode || "";
  const repaidPct =
    record && record.loanAmount > 0
      ? Math.min(100, Math.round(((record.loanAmount - record.balance) / record.loanAmount) * 100))
      : 0;

  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
          <Receipt className="h-4 w-4" />
        </span>
        <div>
          <h4 className="text-sm font-bold text-slate-800">Payment record</h4>
          <p className="text-[11px] text-slate-400">Every repayment of this loan, oldest first</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading payments…
        </div>
      ) : error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : record ? (
        <>
          {/* Summary */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            <Stat label="Loan amount" value={`${cur} ${money(record.loanAmount)}`.trim()} />
            <Stat label="Total paid" value={`${cur} ${money(record.loanAmount - record.balance)}`.trim()} tone="text-emerald-700" />
            <Stat label="Balance" value={`${cur} ${money(record.balance)}`.trim()} tone={record.balance > 0 ? "text-amber-700" : "text-slate-500"} />
          </div>
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-[11px] text-slate-500">
              <span>{repaidPct}% repaid</span>
              <span>
                {record.rows.length} payment{record.rows.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                style={{ width: `${repaidPct}%` }}
              />
            </div>
          </div>

          {record.incomplete && (
            <p className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Some repayments were made before payment records were kept, so the list doesn't
              add up to the amount repaid. New payments are recorded automatically.
            </p>
          )}

          {record.rows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
              No repayments yet — they appear here when payroll deducts an instalment.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Month</th>
                    <th className="px-3 py-2 text-right">Paid amount</th>
                    <th className="px-3 py-2 text-right">Total payment</th>
                  </tr>
                </thead>
                <tbody>
                  {record.rows.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-800">{monthLabel(r.month)}</p>
                        <p className="text-[11px] text-slate-400">
                          {SOURCE_LABEL[r.source] ?? r.source}
                          {r.reference ? ` · ${r.reference}` : ""}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-800">
                        {cur} {money(r.amount)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-emerald-700">
                        {cur} {money(r.totalPaid)}
                        <p className="text-[11px] text-slate-400">Balance {money(r.balanceAfter)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50 font-semibold">
                    <td className="px-3 py-2 text-slate-600">Total</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-800">
                      {cur} {money(record.totalPaid)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-700">
                      {cur} {money(record.totalPaid)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={cn("truncate text-sm font-bold tabular-nums", tone ?? "text-slate-800")}>{value}</p>
    </div>
  );
}
