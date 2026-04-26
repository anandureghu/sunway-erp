import { cn } from "@/lib/utils";
import { formatCurrencyAmount } from "@/lib/currency";
import { useCompanyCurrency } from "@/hooks/use-company-currency";
import { CurrencyMissingWarningBadge } from "./currency-missing-warning-badge";

type CurrencyAmountProps = {
  amount: number | string;
  currencyCode?: string;
  className?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showWarningWhenMissing?: boolean;
};

export function CurrencyAmount({
  amount,
  currencyCode,
  className,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  showWarningWhenMissing = true,
}: CurrencyAmountProps) {
  const { currencyCode: companyCurrencyCode, currencyConfigured } = useCompanyCurrency();
  const resolvedCurrencyCode = currencyCode ?? companyCurrencyCode;

  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", className)}>
      <span>
        {formatCurrencyAmount({
          amount,
          currencyCode: resolvedCurrencyCode,
          minimumFractionDigits,
          maximumFractionDigits,
        })}
      </span>
      {!resolvedCurrencyCode && showWarningWhenMissing && !currencyConfigured ? (
        <CurrencyMissingWarningBadge />
      ) : null}
    </span>
  );
}
