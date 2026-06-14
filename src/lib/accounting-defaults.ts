import type { Company } from "@/types/company";
import type {
  AccountingProcessCode,
  ProcessAccountDefault,
} from "@/types/process-account-default";

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

export const ACCOUNTING_PROCESS_LABELS: Record<AccountingProcessCode, string> =
  {
    MANUAL_JOURNAL: "Manual journal entry",
    STOCK_VARIANCE: "Variance process",
    END_OF_SERVICE: "End of service payment",
    EMPLOYEE_TICKET_PAYMENT: "Employee ticket payment",
    PAYROLL: "Payroll",
  };

/** Processes that post a debit only (no credit account). */
export const DEBIT_ONLY_PROCESS_CODES: ReadonlySet<AccountingProcessCode> =
  new Set(["PAYROLL"]);

export const ALL_ACCOUNTING_PROCESS_CODES = Object.keys(
  ACCOUNTING_PROCESS_LABELS,
) as AccountingProcessCode[];

export function getProcessDefaults(
  defaults: ProcessAccountDefault[] | null | undefined,
  processCode: AccountingProcessCode,
): { debitAccountId?: number; creditAccountId?: number } | null {
  if (!defaults?.length) return null;
  const row = defaults.find((d) => d.processCode === processCode);
  if (!row?.debitAccountId || !row?.creditAccountId) return null;
  return {
    debitAccountId: row.debitAccountId,
    creditAccountId: row.creditAccountId,
  };
}

