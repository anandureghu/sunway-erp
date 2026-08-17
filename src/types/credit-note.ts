export type CreditNoteStatus =
  | "DRAFT"
  | "APPLIED"
  | "AVAILABLE"
  | "PARTIALLY_APPLIED"
  | "CASHED";

export interface CreditNote {
  id: number;
  creditNoteNumber: string;
  creditNoteDate: string;
  customerName?: string | null;
  supplierName?: string | null;
  customerId?: number | null;
  supplierId?: number | null;
  status: CreditNoteStatus;
  project?: string | null;
  referenceNumber: string;
  source?: string | null;
  reason?: string | null;
  amount: number;
  remainingAmount: number;
  cashOutPaymentCode?: string | null;
}
