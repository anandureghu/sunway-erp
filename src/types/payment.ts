/** Which finance list this row belongs to (filters API). */
export type PaymentsPageVariant = "customer" | "vendor" | "other";

export interface PaymentResponseDTO {
  id: number;
  paymentCode: string | null;

  companyId: number;

  amount: number | string;
  paymentMethod: string;

  effectiveDate: string;

  invoiceId: string | null;

  /** CUSTOMER = AR; VENDOR = AP vendor payable */
  paymentDirection?: string | null;
  purchaseOrderId?: number | null;
  purchaseOrderNumber?: string | null;
  supplierId?: number | null;
  supplierName?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  salesOrderNumber?: string | null;

  pdfUrl: string | null;

  /** UI archive (hides from default Completed list; does not change payment method). */
  archived?: boolean;

  /** Remaining balance on linked invoice (confirm dialog). */
  invoiceOutstanding?: number | string | null;
  /** Total on linked invoice (confirm dialog). */
  invoiceTotal?: number | string | null;
  /** Sum of all confirmed payments applied to the linked invoice (cash collected across all payments). */
  invoicePaidAmount?: number | string | null;
  /** Portion of the linked invoice written off via applied credit notes (across all payments). */
  invoiceCreditAppliedAmount?: number | string | null;
  /** Vendor's own invoice number recorded via "Match Vendor Invoice", when present. */
  supplierInvoiceNumber?: string | null;
  /** Available (unapplied) credit note balance for this payment's customer/supplier. */
  availableCreditAmount?: number | string | null;
  /** Portion of this payment covered by an applied credit note rather than cash. */
  creditAppliedAmount?: number | string | null;
  /** Set for OTHER-direction (ad-hoc expense) payments. */
  expenseCategory?: string | null;
  /** Set for OTHER-direction (ad-hoc expense) payments: who the expense was paid to. */
  payee?: string | null;

  createdAt: string;
}

export interface CreatePaymentDTO {
  companyId: number;
  amount: number | string;
  paymentMethod: string;
  effectiveDate: string;
  notes?: string;
  invoiceId?: string | null; // optional
}

export interface CreateOtherPaymentDTO {
  companyId: number;
  expenseCategory: string;
  payee?: string;
  amount: number | string;
  effectiveDate: string;
  notes?: string;
}

export interface ConfirmPaymentPayload {
  amount: number;
  paymentMethod?: string;
  applyCreditAmount?: number;
}
