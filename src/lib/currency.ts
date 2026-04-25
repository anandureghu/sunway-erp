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

  const normalizedCode = (currencyCode ?? "").trim().toUpperCase();
  if (normalizedCode) {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: normalizedCode,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(value);
    } catch {
      // Fallback to plain localized number if currency code is invalid.
    }
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}
