import type { ComponentType } from "react";
import { CircleDollarSign } from "lucide-react";

type CurrencySymbolIconProps = {
  className?: string;
  symbol?: string;
};

export function CurrencySymbolIcon({ className, symbol }: CurrencySymbolIconProps) {
  const trimmedSymbol = symbol?.trim();
  if (!trimmedSymbol) return <CircleDollarSign className={className} />;

  return (
    <span
      className={className}
      title={trimmedSymbol}
      aria-label={`Currency symbol ${trimmedSymbol}`}
    >
      {trimmedSymbol}
    </span>
  );
}

export function createCurrencySymbolIcon(
  symbol?: string,
): ComponentType<{ className?: string }> {
  return function CurrencySymbolKpiIcon({ className }: { className?: string }) {
    return <CurrencySymbolIcon className={className} symbol={symbol} />;
  };
}
