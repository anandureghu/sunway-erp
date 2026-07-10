import { apiClient } from "@/service/apiClient";
import type { FinanceInvoice } from "@/types/finance-invoice";
import axios from "axios";

export async function listPurchaseInvoices(): Promise<FinanceInvoice[]> {
  const res = await apiClient.get<FinanceInvoice[]>("/invoices", {
    params: { type: "PURCHASE" },
  });
  return res.data ?? [];
}

export async function getInvoice(id: number): Promise<FinanceInvoice> {
  const res = await apiClient.get<FinanceInvoice>(`/invoices/${id}`);
  return res.data;
}

export async function archiveInvoice(id: number): Promise<FinanceInvoice> {
  const res = await apiClient.post<FinanceInvoice>(`/invoices/${id}/archive`);
  return res.data;
}

export type CreatePurchaseInvoicePayload = {
  type: "PURCHASE";
  toParty: string;
  invoiceDate: string;
  dueDate?: string;
  amount: number;
  subtotalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  orderId?: number | null;
  debitAccount: number;
  creditAccount: number;
  bankAccountId?: number | null;
  supplierInvoiceNumber?: string;
  documentSource: "GENERATED" | "SUPPLIER_UPLOAD" | "EXTERNAL_LINK";
  externalDocumentUrl?: string;
  itemDescription?: string;
  notesRemarks?: string;
};

export function invoiceApiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; error?: string }
      | string
      | undefined;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object") {
      return data.message || data.error || err.message || fallback;
    }
    return err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

export async function findPurchaseInvoiceForOrder(
  orderId: string | number,
): Promise<FinanceInvoice | null> {
  const numericOrderId = Number(orderId);
  if (Number.isNaN(numericOrderId)) return null;
  const invoices = await listPurchaseInvoices();
  return (
    invoices.find(
      (inv) =>
        inv.type === "PURCHASE" && Number(inv.orderId) === numericOrderId,
    ) ?? null
  );
}

export async function createInvoiceWithDocument(
  payload: CreatePurchaseInvoicePayload,
  file: File | null,
): Promise<FinanceInvoice> {
  const formData = new FormData();
  formData.append(
    "invoice",
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
    "invoice.json",
  );
  if (file) {
    formData.append("file", file);
  }

  try {
    const res = await apiClient.post<FinanceInvoice>(
      "/invoices/with-document",
      formData,
    );
    return res.data;
  } catch (err: unknown) {
    throw new Error(invoiceApiError(err, "Failed to create invoice"));
  }
}

export async function updatePurchaseInvoice(
  invoiceId: number,
  payload: CreatePurchaseInvoicePayload,
): Promise<FinanceInvoice> {
  try {
    const res = await apiClient.put<FinanceInvoice>(
      `/invoices/${invoiceId}`,
      payload,
    );
    return res.data;
  } catch (err: unknown) {
    throw new Error(invoiceApiError(err, "Failed to update invoice"));
  }
}

export async function attachSupplierDocument(
  invoiceId: number,
  file: File,
): Promise<FinanceInvoice> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await apiClient.post<FinanceInvoice>(
      `/invoices/${invoiceId}/supplier-document`,
      formData,
    );
    return res.data;
  } catch (err: unknown) {
    throw new Error(invoiceApiError(err, "Upload failed"));
  }
}

export async function matchVendorInvoice(
  invoiceId: number,
  vendorInvoiceNumber: string,
  file: File | null,
): Promise<FinanceInvoice> {
  const formData = new FormData();
  formData.append("vendorInvoiceNumber", vendorInvoiceNumber);
  if (file) {
    formData.append("file", file);
  }
  try {
    const res = await apiClient.post<FinanceInvoice>(
      `/invoices/${invoiceId}/match-vendor-invoice`,
      formData,
    );
    return res.data;
  } catch (err: unknown) {
    throw new Error(invoiceApiError(err, "Failed to match vendor invoice"));
  }
}

export async function previewPdfText(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await apiClient.post<{ text?: string }>(
      "/invoices/preview-pdf-text",
      formData,
    );
    return res.data.text ?? "";
  } catch {
    throw new Error("Could not read PDF text");
  }
}

/** Direct PDF URL for embedding (blob public URL or external .pdf link). */
export async function getInvoicePdfUrl(invoiceId: number): Promise<string> {
  const res = await apiClient.get<string>(`/invoices/${invoiceId}/pdf`);
  return res.data;
}

function isUsableDocumentUrl(url?: string | null): boolean {
  return Boolean(url && url.trim() && !url.includes("dummy.url"));
}

export function invoiceDocumentPreviewUrl(inv: FinanceInvoice): string | null {
  // Fully paid → prefer receipt PDF; unpaid → original invoice PDF.
  const status = (inv.status || "").trim().toUpperCase();
  if (status === "PAID" && isUsableDocumentUrl(inv.receiptPdfUrl)) {
    return inv.receiptPdfUrl!;
  }
  if (isUsableDocumentUrl(inv.pdfUrl)) return inv.pdfUrl!;
  if (inv.externalDocumentUrl?.toLowerCase().includes(".pdf")) {
    return inv.externalDocumentUrl;
  }
  return null;
}
