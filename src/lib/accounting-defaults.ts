import type { Company } from "@/types/company";

/** Sales orders and sales invoices need sales GL legs + default bank. */
export function hasSalesAccountingDefaults(
  company: Company | null | undefined,
): boolean {
  if (!company) return false;
  return (
    company.defaultSalesDebitAccountId != null &&
    company.defaultSalesCreditAccountId != null &&
    company.defaultBankAccountId != null
  );
}

/** Purchase requisitions need purchase GL legs only. */
export function hasPurchaseAccountingDefaults(
  company: Company | null | undefined,
): boolean {
  if (!company) return false;
  return (
    company.defaultPurchaseDebitAccountId != null &&
    company.defaultPurchaseCreditAccountId != null
  );
}
