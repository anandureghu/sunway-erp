import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { apiClient } from "@/service/apiClient";
import type { Invoice } from "@/types/sales";
import { PageHeader } from "@/components/PageHeader";
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
      />

      <div
        className={`mx-auto mb-8 mt-6 grid max-w-5xl grid-cols-1 gap-4 ${
          isReceiptView ? "sm:grid-cols-3" : "sm:grid-cols-2"
        }`}
      >
        {isReceiptView ? (
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-slate-200 bg-white py-4 text-lg font-semibold"
          >
            Print
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleDownloadPdf}
          className="rounded-xl border border-slate-200 bg-white py-4 text-lg font-semibold"
        >
          {isReceiptView ? "Download Receipt" : "Download Invoice"}
        </button>

        <button
          type="button"
          onClick={() => void handleSendEmail()}
          className="rounded-xl bg-orange-500 py-4 text-lg font-semibold text-white"
        >
          {isReceiptView ? "Email Receipt" : "Email Invoice"}
        </button>
      </div>

      <InvoiceDocumentPreview
        id="invoice-pdf"
        invoice={invoice}
        currencyCode={currencyCode}
      />
    </div>
  );
}
