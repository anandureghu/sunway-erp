import { cn } from "@/lib/utils";
import { formatCurrencyAmount } from "@/lib/currency";
import { useCompanyCurrency } from "@/hooks/use-company-currency";
import { CurrencyMissingWarningBadge } from "@/components/currency/currency-missing-warning-badge";

type CurrencyProps = {
  amount: number | string;
  currencyCode?: string;
  className?: string;
};

/** Debit: red, leading minus (stored amounts are positive). */
export function DebitAmount({
  amount,
  currencyCode,
  className,
}: CurrencyProps) {
  const { currencyCode: companyCurrencyCode, currencyConfigured } =
    useCompanyCurrency();
  const n = Math.abs(Number(amount));
  if (Number.isNaN(n)) {
    return <span className="text-muted-foreground">—</span>;
  }
  const resolvedCurrencyCode = currencyCode ?? companyCurrencyCode;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 tabular-nums font-medium text-red-600 dark:text-red-400",
        className,
      )}
    >
      <span>
        −
        {formatCurrencyAmount({
          amount: n,
          currencyCode: resolvedCurrencyCode,
        })}
      </span>
      {!resolvedCurrencyCode && !currencyConfigured ? (
        <CurrencyMissingWarningBadge />
      ) : null}
    </span>
  );
}

/** Credit: green, leading plus. */
export function CreditAmount({
  amount,
  currencyCode,
  className,
}: CurrencyProps) {
  const { currencyCode: companyCurrencyCode, currencyConfigured } =
    useCompanyCurrency();
  const n = Math.abs(Number(amount));
  if (Number.isNaN(n)) {
    return <span className="text-muted-foreground">—</span>;
  }
  const resolvedCurrencyCode = currencyCode ?? companyCurrencyCode;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 tabular-nums font-medium text-emerald-600 dark:text-emerald-400",
        className,
      )}
    >
      <span>
        +
        {formatCurrencyAmount({
          amount: n,
          currencyCode: resolvedCurrencyCode,
        })}
      </span>
      {!resolvedCurrencyCode && !currencyConfigured ? (
        <CurrencyMissingWarningBadge />
      ) : null}
    </span>
  );
}

/** Invoice/payable total: neutral blue. Plain balance, no leading sign. */
export function TotalAmount({ amount, currencyCode, className }: CurrencyProps) {
  const n = Number(amount);
  if (Number.isNaN(n)) {
    return <span className="text-muted-foreground">—</span>;
  }
  const { currencyCode: companyCurrencyCode, currencyConfigured } =
    useCompanyCurrency();
  const resolvedCurrencyCode = currencyCode ?? companyCurrencyCode;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 tabular-nums font-semibold text-blue-700 dark:text-blue-400",
        className,
      )}
    >
      <span>
        {formatCurrencyAmount({ amount: n, currencyCode: resolvedCurrencyCode })}
      </span>
      {!resolvedCurrencyCode && !currencyConfigured ? (
        <CurrencyMissingWarningBadge />
      ) : null}
    </span>
  );
}

/** Amount already collected/settled: green. Plain balance, no leading sign. */
export function PaidAmount({ amount, currencyCode, className }: CurrencyProps) {
  const n = Number(amount);
  if (Number.isNaN(n)) {
    return <span className="text-muted-foreground">—</span>;
  }
  const { currencyCode: companyCurrencyCode, currencyConfigured } =
    useCompanyCurrency();
  const resolvedCurrencyCode = currencyCode ?? companyCurrencyCode;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 tabular-nums font-medium text-emerald-600 dark:text-emerald-400",
        className,
      )}
    >
      <span>
        {formatCurrencyAmount({ amount: n, currencyCode: resolvedCurrencyCode })}
      </span>
      {!resolvedCurrencyCode && !currencyConfigured ? (
        <CurrencyMissingWarningBadge />
      ) : null}
    </span>
  );
}

/** Balance still outstanding: amber when > 0, muted once fully settled. */
export function RemainingAmount({ amount, currencyCode, className }: CurrencyProps) {
  const n = Number(amount);
  if (Number.isNaN(n)) {
    return <span className="text-muted-foreground">—</span>;
  }
  const { currencyCode: companyCurrencyCode, currencyConfigured } =
    useCompanyCurrency();
  const resolvedCurrencyCode = currencyCode ?? companyCurrencyCode;
  const isSettled = n <= 0.001;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 tabular-nums font-medium",
        isSettled
          ? "text-muted-foreground"
          : "text-amber-600 dark:text-amber-400",
        className,
      )}
    >
      <span>
        {formatCurrencyAmount({ amount: n, currencyCode: resolvedCurrencyCode })}
      </span>
      {!resolvedCurrencyCode && !currencyConfigured ? (
        <CurrencyMissingWarningBadge />
      ) : null}
    </span>
  );
}

/** Portion of a balance covered by an applied credit note: violet. Plain balance, no leading sign. */
export function CreditNoteAppliedAmount({
  amount,
  currencyCode,
  className,
}: CurrencyProps) {
  const n = Number(amount);
  if (Number.isNaN(n)) {
    return <span className="text-muted-foreground">—</span>;
  }
  const { currencyCode: companyCurrencyCode, currencyConfigured } =
    useCompanyCurrency();
  const resolvedCurrencyCode = currencyCode ?? companyCurrencyCode;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 tabular-nums font-medium text-violet-600 dark:text-violet-400",
        className,
      )}
    >
      <span>
        {formatCurrencyAmount({ amount: n, currencyCode: resolvedCurrencyCode })}
      </span>
      {!resolvedCurrencyCode && !currencyConfigured ? (
        <CurrencyMissingWarningBadge />
      ) : null}
    </span>
  );
}

/** Signed balance: non-negative → credit styling, negative → debit styling. */
export function SignedColoredAmount({
  amount,
  currencyCode,
  className,
}: CurrencyProps) {
  const n = Number(amount);
  if (Number.isNaN(n)) {
    return <span className="text-muted-foreground">—</span>;
  }
  if (n >= 0) {
    return (
      <CreditAmount amount={n} currencyCode={currencyCode} className={className} />
    );
  }
  return (
    <DebitAmount amount={n} currencyCode={currencyCode} className={className} />
  );
}
