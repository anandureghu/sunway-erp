import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { CURRENCY_NOT_SET_MESSAGE } from "@/lib/currency";

export function useCompanyCurrency() {
  const { company } = useAuth();

  return useMemo(() => {
    const currencyCode = company?.currency?.currencyCode?.trim().toUpperCase() ?? "";
    const currencySymbol = company?.currency?.currencySymbol?.trim() ?? "";
    const currencyConfigured = Boolean(currencyCode);

    return {
      currencyCode: currencyConfigured ? currencyCode : undefined,
      currencySymbol: currencyConfigured ? currencySymbol : undefined,
      currencyConfigured,
      warningMessage: CURRENCY_NOT_SET_MESSAGE,
    };
  }, [company?.currency?.currencyCode, company?.currency?.currencySymbol]);
}
