export type CreditNoteStatus = "DRAFT" | "APPLIED" | "PARTIALLY_APPLIED";

export interface CreditNote {
  id: number;
  creditNoteNumber: string;
  creditNoteDate: string;
  customerName: string;
  status: CreditNoteStatus;
  project?: string | null;
  referenceNumber: string;
  amount: number;
  remainingAmount: number;
}
