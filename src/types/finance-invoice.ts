import type { PurchaseOrderResponseDTO } from "@/service/purchaseFlowService";

export type InvoiceDocumentSource =
  | "GENERATED"
  | "SUPPLIER_UPLOAD"
  | "EXTERNAL_LINK";

/** Mirrors backend InvoiceResponse for finance / purchase AP invoices. */
export interface FinanceInvoice {
  id: number;
  invoiceId: string;
  companyId: number;
  companyName?: string;
  toParty?: string;
  status?: string;
  invoiceDate?: string;
  dueDate?: string;
  paidDate?: string;
  amount?: number;
  subtotalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  openAmount?: number;
  outstanding?: number;
  itemDescription?: string;
  notesRemarks?: string;
  pdfUrl?: string | null;
  supplierInvoiceNumber?: string | null;
  documentSource?: InvoiceDocumentSource | null;
  externalDocumentUrl?: string | null;
  type?: "SALES" | "PURCHASE";
  orderId?: number | null;
  debitAccountId?: number;
  creditAccountId?: number;
  purchaseOrder?: PurchaseOrderResponseDTO | null;
  createdAt?: string;
}
