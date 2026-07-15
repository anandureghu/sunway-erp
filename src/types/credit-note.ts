export type CreditNoteStatus =
  | "DRAFT"
  | "APPLIED"
  | "AVAILABLE"
  | "PARTIALLY_APPLIED";

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
  amount: number;
  remainingAmount: number;
}
