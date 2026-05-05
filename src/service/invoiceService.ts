import { apiClient } from "@/service/apiClient";
import type { FinanceInvoice } from "@/types/finance-invoice";

function apiBase(): string {
  return import.meta.env.VITE_APP_BASE_URL
    ? (import.meta.env.VITE_APP_BASE_URL as string) || "https://api.picominds.com/api"
    : "/api";
}

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

export async function createInvoiceWithDocument(
  payload: CreatePurchaseInvoicePayload,
  file: File | null,
): Promise<FinanceInvoice> {
  const formData = new FormData();
  formData.append(
    "invoice",
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
  );
  if (file) {
    formData.append("file", file);
  }

  const res = await fetch(`${apiBase()}/invoices/with-document`, {
    method: "POST",
    headers: authHeader(),
    body: formData,
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const err = await res.json();
      msg = err?.message || err?.error || JSON.stringify(err) || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg || "Failed to create invoice");
  }

  return res.json() as Promise<FinanceInvoice>;
}

export async function attachSupplierDocument(
  invoiceId: number,
  file: File,
): Promise<FinanceInvoice> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${apiBase()}/invoices/${invoiceId}/supplier-document`, {
    method: "POST",
    headers: authHeader(),
    body: formData,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const err = await res.json();
      msg = err?.message || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg || "Upload failed");
  }
  return res.json() as Promise<FinanceInvoice>;
}

export async function previewPdfText(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${apiBase()}/invoices/preview-pdf-text`, {
    method: "POST",
    headers: authHeader(),
    body: formData,
  });
  if (!res.ok) {
    throw new Error("Could not read PDF text");
  }
  const data = (await res.json()) as { text?: string };
  return data.text ?? "";
}

/** Direct PDF URL for embedding (blob public URL or external .pdf link). */
export function invoiceDocumentPreviewUrl(inv: FinanceInvoice): string | null {
  if (inv.pdfUrl) return inv.pdfUrl;
  if (inv.externalDocumentUrl?.toLowerCase().includes(".pdf")) {
    return inv.externalDocumentUrl;
  }
  return null;
}
