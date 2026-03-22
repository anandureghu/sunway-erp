import { cn } from "@/lib/utils";

function formatAmount(
  n: number,
  options?: Intl.NumberFormatOptions,
): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
}

type CurrencyProps = {
  amount: number | string;
  /** Prefix e.g. "₹", "$", or "AED" */
  currencyCode?: string;
  className?: string;
};

/** Debit: red, leading minus (stored amounts are positive). */
export function DebitAmount({
  amount,
  currencyCode,
  className,
}: CurrencyProps) {
  const n = Math.abs(Number(amount));
  if (Number.isNaN(n)) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span
      className={cn(
        "tabular-nums font-medium text-red-600 dark:text-red-400",
        className,
      )}
    >
      {currencyCode ? `${currencyCode} ` : ""}−{formatAmount(n)}
    </span>
  );
}

/** Credit: green, leading plus. */
export function CreditAmount({
  amount,
  currencyCode,
  className,
}: CurrencyProps) {
  const n = Math.abs(Number(amount));
  if (Number.isNaN(n)) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span
      className={cn(
        "tabular-nums font-medium text-emerald-600 dark:text-emerald-400",
        className,
      )}
    >
      {currencyCode ? `${currencyCode} ` : ""}+{formatAmount(n)}
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
