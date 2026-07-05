import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "@/service/apiClient";
import type { Invoice } from "@/types/sales";
import { InvoiceDocumentPreview } from "@/components/invoice/invoice-document-preview";

export default function PublicInvoicePage() {
  const { invoiceCode } = useParams<{ invoiceCode: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!invoiceCode) return;
    apiClient
      .get<Invoice>(`/public/invoices/${invoiceCode}`)
      .then((res) => setInvoice(res.data))
      .catch(() => setInvoice(null));
  }, [invoiceCode]);

  if (!invoice) {
    return (
      <div className="p-8 text-sm text-muted-foreground">Loading invoice...</div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <InvoiceDocumentPreview invoice={invoice} currencyCode={invoice.currencyCode} />
    </div>
  );
}
