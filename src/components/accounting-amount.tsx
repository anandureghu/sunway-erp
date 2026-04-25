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
