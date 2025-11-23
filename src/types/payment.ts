export interface PaymentResponseDTO {
  id: number;
  paymentCode: string | null;

  companyId: number;

  amount: number | string;
  paymentMethod: string;

  effectiveDate: string;

  invoiceId: string | null;

  pdfUrl: string | null;

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
