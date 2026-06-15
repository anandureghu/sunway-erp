export type AccountingProcessCode =
  | "MANUAL_JOURNAL"
  | "STOCK_VARIANCE"
  | "END_OF_SERVICE"
  | "EMPLOYEE_TICKET_PAYMENT"
  | "PAYROLL";

export interface ProcessAccountDefault {
  id?: number;
  processCode: AccountingProcessCode | "";
  debitAccountId?: number | null;
  creditAccountId?: number | null;
}

export interface ProcessAccountDefaultsUpdate {
  defaults: Array<{
    processCode: AccountingProcessCode;
    debitAccountId?: number;
    creditAccountId?: number;
  }>;
}
