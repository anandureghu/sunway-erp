import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { apiClient } from "@/service/apiClient";
import type { Invoice } from "@/types/sales";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { resolveBackHref } from "@/lib/navigation-back";
import { useCompanyCurrency } from "@/hooks/use-company-currency";
import {
  formatInvoiceDate,
  isPaidInvoiceView,
  safeInvoiceValue,
} from "@/lib/invoice-document-utils";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { InvoiceDocumentPreview } from "@/components/invoice/invoice-document-preview";

export default function InvoiceDetailPage() {
  const { alert } = useConfirmDialog();
  const { id } = useParams();
  const location = useLocation();
  const { currencyCode: companyCurrencyCode } = useCompanyCurrency();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    apiClient.get(`/invoices/${id}`).then((res) => {
      setInvoice(res.data);
    });
  }, [id]);

  if (!invoice) {
    return <div className="p-8">Loading invoice…</div>;
  }

  const currencyCode = invoice.currencyCode ?? companyCurrencyCode;
  const isSales = invoice.type === "SALES";
  const isReceiptView = isPaidInvoiceView(invoice.status);
  const orderNo =
    invoice.orderNumber ||
    (isSales
      ? invoice.salesOrder?.orderNumber
      : invoice.purchaseOrder?.orderNumber);
  const invoiceHeaderDescription = [
    orderNo ? `${isSales ? "SO" : "PO"} ${orderNo}` : "",
    invoice.toParty ? String(invoice.toParty) : "",
    invoice.dueDate ? `Due ${formatInvoiceDate(invoice.dueDate)}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const handleDownloadPdf = () => {
    apiClient
      .get<string>(`/invoices/${invoice.id}/pdf`)
      .then((res) => {
        const pdfUrl = res.data;
        if (!pdfUrl) {
          throw new Error("PDF URL not returned");
        }
        window.open(pdfUrl, "_blank");
      })
      .catch(async (error) => {
        console.error("Invoice PDF download failed", error);
        await alert(
          isReceiptView
            ? "Unable to download receipt PDF"
            : "Unable to download invoice PDF",
        );
      });
  };

  const handleSendEmail = async () => {
    try {
      if (isReceiptView) {
        await apiClient.post(`/invoices/${invoice.id}/receipt-email`);
      } else {
        await apiClient.post(`/invoices/${invoice.id}/email`);
      }
      await alert(
        `${isReceiptView ? "Receipt" : "Invoice"} email sent to customer`,
      );
    } catch (error) {
      console.error("Email sending failed", error);
      await alert("Unable to send email");
    }
  };

  const statusRaw = (invoice.status || "").toLowerCase();
  const statusColors: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-800",
    unpaid: "bg-rose-100 text-rose-700",
    partially_paid: "bg-amber-100 text-amber-800",
    overdue: "bg-red-100 text-red-700",
    adjusted: "bg-purple-100 text-purple-800",
    cancelled: "bg-slate-100 text-slate-600",
    draft: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 pb-6 pt-4 sm:px-6 sm:pt-6">
      <PageHeader
        variant="darkBlue"
        title={
          isReceiptView
            ? `Receipt ${safeInvoiceValue(invoice.invoiceId)}`
            : `Invoice ${safeInvoiceValue(invoice.invoiceId)}`
        }
        description={invoiceHeaderDescription || undefined}
        backHref={resolveBackHref(
          location.state,
          isSales
            ? "/inventory/sales/invoices"
            : "/inventory/purchase/invoices",
        )}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {isReceiptView && (
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-md border border-white/40 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100"
              >
                Print
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="rounded-md border border-white/40 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100"
            >
              {isReceiptView ? "Download Receipt" : "Download Invoice"}
            </button>
            <button
              type="button"
              onClick={() => void handleSendEmail()}
              className="rounded-md border border-white/40 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100"
            >
              {isReceiptView ? "Email Receipt" : "Email Invoice"}
            </button>
            <Badge className={`text-xs font-semibold uppercase ${statusColors[statusRaw] || "bg-slate-100 text-slate-600"}`}>
              {invoice.status || "UNPAID"}
            </Badge>
          </div>
        }
      />

      <InvoiceDocumentPreview
        id="invoice-pdf"
        invoice={invoice}
        currencyCode={currencyCode}
      />
    </div>
  );
}
