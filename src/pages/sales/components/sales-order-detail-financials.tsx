import { CurrencyAmount } from "@/components/currency/currency-amount";
import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Landmark,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  formatStatusLabel,
  paidAmount,
  paymentStatusKey,
} from "./sales-order-detail-utils";

type Props = {
  so: SalesOrderResponseDTO;
};

export function SalesOrderDetailFinancials({ so }: Props) {
  const payment = paymentStatusKey(so);
  const isPaid = payment === "PAID";
  const isPartial = payment === "PARTIALLY_PAID";
  const paid = paidAmount(so);

  const accounts = [
    so.bankAccountName
      ? { icon: Landmark, label: "Bank account", value: so.bankAccountName }
      : null,
    so.debitAccountName
      ? {
          icon: Wallet,
          label: "Debit account",
          value: so.debitAccountName,
          extra:
            so.debitAccountBalance != null ? (
              <span className="text-slate-500">
                Balance:{" "}
                <CurrencyAmount amount={so.debitAccountBalance} className="inline" />
              </span>
            ) : null,
        }
      : null,
    so.creditAccountName
      ? { icon: Building2, label: "Credit account", value: so.creditAccountName }
      : null,
  ].filter(Boolean) as {
    icon: typeof Landmark;
    label: string;
    value: string;
    extra?: ReactNode;
  }[];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Payment &amp; accounts</h2>
        <p className="mt-1 text-sm text-slate-500">
          Settlement status and posting accounts for this order
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <CreditCard className="h-4 w-4" />
          </div>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Payment status
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {formatStatusLabel(payment)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {isPaid && so.paidDate
              ? `Paid on ${so.paidDate}`
              : isPartial
                ? "Partial settlement recorded"
                : "No payment recorded yet"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Amount paid
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-600">
            <CurrencyAmount amount={paid > 0 ? paid : 0} />
          </p>
          <p className="mt-1 text-xs text-slate-500">
            of <CurrencyAmount amount={so.totalAmount ?? 0} className="inline" /> total
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Outstanding
          </p>
          <p
            className={`mt-2 text-2xl font-bold tabular-nums ${
              (so.outstandingAmount ?? 0) > 0 ? "text-rose-600" : "text-slate-900"
            }`}
          >
            <CurrencyAmount amount={so.outstandingAmount ?? 0} />
          </p>
          <p className="mt-1 text-xs text-slate-500">Remaining balance due</p>
        </div>
      </div>

      {isPartial ? (
        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="text-center">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Total
            </p>
            <p className="mt-1 text-base font-bold text-slate-800">
              <CurrencyAmount amount={so.totalAmount ?? 0} />
            </p>
          </div>
          <div className="border-x border-amber-200 text-center">
            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
              Paid
            </p>
            <p className="mt-1 text-base font-bold text-emerald-700">
              <CurrencyAmount amount={paid > 0 ? paid : 0} />
            </p>
          </div>
          <div className="text-center">
            <p className="text-[11px] font-medium uppercase tracking-wide text-rose-600">
              Due
            </p>
            <p className="mt-1 text-base font-bold text-rose-600">
              <CurrencyAmount amount={so.outstandingAmount ?? 0} />
            </p>
          </div>
        </div>
      ) : null}

      {isPaid ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            Fully paid —{" "}
            <span className="font-semibold">
              <CurrencyAmount amount={so.totalAmount ?? 0} />
            </span>
          </span>
          {so.paidDate ? (
            <span className="ml-auto text-xs text-emerald-700">on {so.paidDate}</span>
          ) : null}
        </div>
      ) : null}

      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {accounts.map((account) => (
            <div
              key={account.label}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <account.icon className="h-4 w-4" />
              </div>
              <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {account.label}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                {account.value}
              </p>
              {account.extra ? (
                <p className="mt-1 text-xs">{account.extra}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
