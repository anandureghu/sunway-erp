/** Which finance list this row belongs to (filters API). */
export type PaymentsPageVariant = "customer" | "vendor";

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

  pdfUrl: string | null;

  /** UI archive (hides from default Completed list; does not change payment method). */
  archived?: boolean;

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
