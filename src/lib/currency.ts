export const CURRENCY_NOT_SET_MESSAGE =
  "Set currency from Company Profile to enable currency display.";

type FormatCurrencyAmountOptions = {
  amount: number | string;
  currencyCode?: string | null;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export function formatCurrencyAmount({
  amount,
  currencyCode,
  locale,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
}: FormatCurrencyAmountOptions): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return "—";

  const plain = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);

  const raw = (currencyCode ?? "").trim();
  if (!raw) return plain;

  // A valid ISO 4217 code → let Intl render the localized currency.
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: raw.toUpperCase(),
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value);
  } catch {
    // Not an ISO code (e.g. a "$" / "د.إ" symbol) — prefix it to the amount
    // instead of dropping it, so the symbol is always shown.
    return `${raw}${plain}`;
  }
}
