import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { apiClient } from "@/service/apiClient";
import type { Invoice } from "@/types/sales";
import { SalesPageHeader } from "./components/sales-page-header";
import { formatCurrencyAmount } from "@/lib/currency";
import { resolveBackHref } from "@/lib/navigation-back";
import { useCompanyCurrency } from "@/hooks/use-company-currency";
import { isInvoicePaymentSettled } from "@/lib/invoice-status-filter";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";

/* =======================
   CONSTANTS
======================= */

const MISSING = "N/A";

const COLORS = {
  white: "rgb(255, 255, 255)",

  gray900: "rgb(17, 24, 39)",
  gray800: "rgb(31, 41, 55)",
  gray700: "rgb(55, 65, 81)",
  gray600: "rgb(75, 85, 99)",
  gray500: "rgb(107, 114, 128)",
  gray300: "rgb(209, 213, 219)",
  gray200: "rgb(229, 231, 235)",
  gray100: "rgb(243, 244, 246)",
  gray50: "rgb(249, 250, 251)",

  orange500: "rgb(249, 115, 22)",
  orange600: "rgb(234, 88, 12)",
};

/* =======================
   HELPERS
======================= */

const safe = (v: any) =>
  v === null || v === undefined || v === "" ? MISSING : v;

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString() : MISSING;

const formatTemplate = (
  template: string | undefined,
  replacements: Record<string, string>,
) => {
  if (!template) return "";
  return Object.entries(replacements).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
    template,
  );
};

/* =======================
   COMPONENT
======================= */

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
  const money = (n?: number) =>
    typeof n === "number"
      ? formatCurrencyAmount({ amount: n, currencyCode })
      : MISSING;

  const isSales = invoice.type === "SALES";
  const order = isSales ? invoice.salesOrder : invoice.purchaseOrder;
  const items = order?.items ?? [];
  const isPaid = isInvoicePaymentSettled(invoice.status);
  const isReceiptView = isPaid;
  const termsAndConditions = (invoice.invoiceTerms || "")
    .split(/\r?\n/)
    .map((term) => term.trim())
    .filter(Boolean);
  const orderNo =
    invoice.orderNumber ||
    (isSales ? invoice.salesOrder?.orderNumber : invoice.purchaseOrder?.orderNumber);
  const invoiceHeaderDescription = [
    orderNo ? `SO ${orderNo}` : "",
    invoice.toParty ? String(invoice.toParty) : "",
    invoice.dueDate ? `Due ${formatDate(invoice.dueDate)}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const dynamicNote = formatTemplate(
    isPaid ? invoice.invoiceNotesPaid : invoice.invoiceNotesUnpaid,
    {
      companyName: safe(invoice.companyName),
      invoiceDate: formatDate(invoice.invoiceDate),
      dueDate: formatDate(invoice.dueDate),
      paidDate: formatDate(invoice.paidDate),
      invoiceId: safe(invoice.invoiceId),
    },
  );
  const showQr = !!invoice.invoiceQrEnabled && !!invoice.publicInvoiceUrl;
  const qrImageUrl = showQr
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
        invoice.publicInvoiceUrl as string,
      )}`
    : null;
  const addressLine = [
    invoice.companyStreet,
    invoice.companyCity,
    invoice.companyState,
    invoice.companyCountry,
  ]
    .filter(Boolean)
    .join(", ");

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

  /* =======================
     RENDER
  ======================= */

  return (
    <div
      className="min-h-screen px-4 pb-6 pt-4 sm:px-6 sm:pt-6"
      style={{ background: COLORS.gray100 }}
    >
      <SalesPageHeader
        title={
          isReceiptView
            ? `Receipt ${safe(invoice.invoiceId)}`
            : `Invoice ${safe(invoice.invoiceId)}`
        }
        description={invoiceHeaderDescription || undefined}
        backHref={resolveBackHref(
          location.state,
          isSales ? "/inventory/sales/invoices" : "/inventory/purchase/invoices",
        )}
      />

      {/* ACTIONS */}
      <div className="my-6 max-w-5xl mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          // onClick={() => window.print()}
          className="rounded-xl py-4 text-lg font-semibold border bg-white"
          style={{ borderColor: COLORS.gray200 }}
        >
          🖨️ Print
        </button>

        <button
          onClick={handleDownloadPdf}
          className="rounded-xl py-4 text-lg font-semibold border bg-white"
          style={{ borderColor: COLORS.gray200 }}
        >
          {isReceiptView ? "🧾 Download Receipt" : "📥 Download Invoice"}
        </button>

        <button
          onClick={handleSendEmail}
          className="rounded-xl py-4 text-lg font-semibold"
          style={{ background: COLORS.orange500, color: COLORS.white }}
        >
          {isReceiptView ? "📧 Email Receipt" : "📧 Email Invoice"}
        </button>
      </div>

      {/* INVOICE */}
      <div
        id="invoice-pdf"
        className="max-w-[800px] rounded-lg overflow-hidden border border-gray-200 shadow-sm"
        style={{ background: COLORS.white, color: COLORS.gray900, fontFamily: "Helvetica, Arial, sans-serif" }}
      >
        {/* HEADER */}
        <div
          className="p-8 flex justify-between"
          style={{ backgroundColor: "#1a1a1a", color: "#FFFFFF" }}
        >
          <div className="flex flex-col justify-center">
            <h1 className="text-[22px] font-bold m-0 mb-1.5">{safe(invoice.companyName)}</h1>
            {invoice.invoiceHeaderSubtitle ? (
              <p className="text-[12px] leading-4 text-[#D1D5DB] m-0">
                {invoice.invoiceHeaderSubtitle}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col justify-center text-right items-end">
            <div
              className="px-4 py-2.5 rounded-md text-center"
              style={{ backgroundColor: "#E67E22" }}
            >
              <div className="text-[16px] font-bold">
                {isPaid ? (isSales ? "RECEIPT" : "PAID") : (isSales ? "INVOICE" : "PURCHASE")}
              </div>
              <div className="text-[12px] mt-1">
                {safe(invoice.invoiceId)}
              </div>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-8">
          {/* INFO META */}
          <div
            className="grid grid-cols-3 gap-5 pb-6 mb-8 border-b-2"
            style={{ borderColor: "#E5E7EB" }}
          >
            {/* BILL TO / SUPPLIER */}
            <div className="pr-5">
              <div className="text-[11px] font-bold uppercase text-gray-500 mb-2 tracking-wider">
                {isSales ? "Bill To" : "Supplier"}
              </div>

              {isSales ? (
                <div>
                  <div className="font-semibold text-gray-900 text-[14px]">
                    {safe(invoice?.salesOrder?.customerName)}
                  </div>
                  <div className="text-[13px] text-gray-500 leading-[18px] mt-1">
                    {safe(invoice?.salesOrder?.customerEmail)}
                  </div>
                  <div className="text-[13px] text-gray-500 leading-[18px]">
                    {safe(invoice?.salesOrder?.customerPhone)}
                  </div>
                </div>
              ) : null}

              <div className="mt-2 text-[13px] font-semibold text-red-600">
                <span className="text-gray-900 font-normal">Status: </span>
                {safe(invoice.status)}
              </div>
            </div>

            {/* INVOICE DETAILS */}
            <div className="pr-5">
              <div className="text-[11px] font-bold uppercase text-gray-500 mb-2 tracking-wider">
                Invoice Details
              </div>
              <div className="text-[13px] text-gray-500 mb-1">
                Invoice Date: <span className="text-gray-900 ml-1">{formatDate(invoice.invoiceDate)}</span>
              </div>
              <div className="text-[13px] text-gray-500 mb-1">
                Due Date: <span className="text-gray-900 ml-1">{formatDate(invoice.dueDate)}</span>
              </div>
              <div className="text-[13px] text-gray-500">
                Paid Date: <span className="text-gray-900 ml-1">{isPaid ? formatDate(invoice.paidDate) : "N/A"}</span>
              </div>
            </div>

            {/* REFERENCE */}
            <div>
              <div className="text-[11px] font-bold uppercase text-gray-500 mb-2 tracking-wider">
                Reference
              </div>
              <div className="text-[13px] font-semibold text-gray-900 mb-1">
                {isSales ? "Sales Order ID:" : "Purchase Order ID:"}
              </div>
              <div className="text-[13px] text-gray-500">
                {isSales
                  ? safe(invoice.salesOrder?.orderNumber)
                  : safe(invoice.purchaseOrder?.orderNumber)}
              </div>
            </div>
          </div>

          {/* ITEMS */}
          <table className="w-full text-[13px] mb-8" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th className="p-2.5 px-3 text-left bg-[#F9FAFB] border-b-2 border-[#E5E7EB] text-[11px] uppercase text-gray-500 font-medium tracking-wider">#</th>
                <th className="p-2.5 px-3 text-left bg-[#F9FAFB] border-b-2 border-[#E5E7EB] text-[11px] uppercase text-gray-500 font-medium tracking-wider">Description</th>
                <th className="p-2.5 px-3 text-right bg-[#F9FAFB] border-b-2 border-[#E5E7EB] text-[11px] uppercase text-gray-500 font-medium tracking-wider">Qty</th>
                <th className="p-2.5 px-3 text-right bg-[#F9FAFB] border-b-2 border-[#E5E7EB] text-[11px] uppercase text-gray-500 font-medium tracking-wider">Unit</th>
                <th className="p-2.5 px-3 text-right bg-[#F9FAFB] border-b-2 border-[#E5E7EB] text-[11px] uppercase text-gray-500 font-medium tracking-wider">Discount</th>
                <th className="p-2.5 px-3 text-right bg-[#F9FAFB] border-b-2 border-[#E5E7EB] text-[11px] uppercase text-gray-500 font-medium tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, i: number) => (
                <tr key={i} className="border-b border-[#E5E7EB]">
                  <td className="p-3.5 px-3">{i + 1}</td>
                  <td className="p-3.5 px-3">
                    <div className="font-[500] text-gray-900">{safe(item.itemName)}</div>
                    <div className="text-gray-500 text-[12px] mt-0.5">{safe(item.itemDescription)}</div>
                  </td>
                  <td className="p-3.5 px-3 text-right">{safe(item.quantity)}</td>
                  <td className="p-3.5 px-3 text-right">{money(item.unitPrice ?? item.unitCost)}</td>
                  <td className="p-3.5 px-3 text-right">0%</td>
                  <td className="p-3.5 px-3 text-right font-bold text-gray-900">{money(item.lineTotal)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-3.5 text-center text-gray-500 border-b border-[#E5E7EB]">—</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* TOTAL */}
          <div className="w-full bg-[#F9FAFB] p-5 rounded-md mb-8">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="text-[13px] text-[#6B7280]">Total Amount</td>
                  <td className="text-[18px] font-bold text-right text-gray-900">{money(invoice.amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* PAYMENT INFORMATION */}
          {isSales && invoice.bankAccountName && !isPaid && (
            <div className="mt-6 p-5 border-2 border-[#E5E7EB] rounded-[16px] bg-white">
              <h4 className="text-[14px] uppercase text-gray-500 font-[500] mb-4 flex items-center gap-2">Payment Information</h4>
              <p className="text-[13px] text-gray-800 mb-3.5 leading-[1.6]"><strong>Bank Name:</strong> <span className="ml-1">{safe(invoice.bankAccountName)}</span></p>
              <p className="text-[13px] text-gray-800 mb-3.5 leading-[1.6]"><strong>Account Holder:</strong> <span className="ml-1">{safe(invoice.companyName)}</span></p>
              <p className="text-[13px] text-gray-800 mb-3.5 leading-[1.6]"><strong>Account Number:</strong> <span className="ml-1">{safe(invoice.bankAccountNumber)}</span></p>
              <p className="text-[13px] text-gray-800 mb-3.5 leading-[1.6]"><strong>IFSC/SWIFT:</strong> <span className="ml-1">{safe(invoice.bankIfscCode)}</span></p>
              <p className="text-[13px] text-gray-800 mb-3.5 leading-[1.6]"><strong>Branch:</strong> <span className="ml-1">{safe(invoice.bankBranchName)}</span></p>
              <p className="text-[13px] text-gray-800 mb-0 leading-[1.6]"><strong>Reference:</strong> <span className="ml-1">{safe(invoice.invoiceId)}</span></p>
            </div>
          )}

          {/* NOTES */}
          {isSales && (
            <div className="mt-7 p-[15px] rounded-[15px] bg-[#F9FAFB]">
              <h4 className="text-[14px] uppercase text-[#6C7280] font-normal mb-3 m-0">Notes</h4>
              <p className="text-[13px] text-gray-900 mb-2 leading-relaxed m-0">{dynamicNote || MISSING}</p>
              {addressLine && (
                <p className="text-[13px] text-gray-900 mb-2 mt-2 leading-relaxed m-0">
                  Company Address: <span className="ml-1">{addressLine}</span>
                </p>
              )}
              {invoice.companyPhone && (
                <p className="text-[13px] text-gray-900 mb-0 mt-2 leading-relaxed m-0">
                  Contact: <span className="ml-1">{invoice.companyPhone}</span>
                </p>
              )}
            </div>
          )}

          {/* TERMS AND CONDITIONS */}
          {isSales && termsAndConditions.length > 0 && (
            <div className="mt-6 p-5 border-2 border-[#E5E7EB] rounded-[16px] bg-white">
              <h4 className="text-[14px] uppercase text-gray-500 font-[500] mb-4 flex items-center gap-2">⚖ Terms & Conditions</h4>
              <ol className="pl-5 m-0 text-[13px] text-[#1F2937] leading-[1.6] marker:text-[#E67E22] marker:font-bold">
                {termsAndConditions.map((term, idx) => (
                  <li key={idx} className="mb-3.5">
                    {term}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <table className="w-full border-t-2 border-[#E5E7EB] p-5 bg-[#F9FAFB] text-[12px] text-[#6B7280]">
          <tbody>
            <tr>
              <td className="w-[70%] align-top p-5">
                <p className="font-[600] text-[#111827] mb-1.5 m-0">
                  {safe(invoice.invoiceFooterCompanyLine || invoice.companyName)}
                </p>

                <p className="mt-1.5 m-0 text-[#9CA3AF]">
                  {safe(invoice.invoiceFooterTaxLine)}
                </p>

                {addressLine && (
                  <p className="mt-1.5 m-0 text-[#9CA3AF]">
                    Address: {safe(addressLine)}
                  </p>
                )}

                <p className="mt-1.5 m-0 text-[#9CA3AF]">
                  {safe(invoice.invoiceFooterSignatureNote || "This is a computer-generated document and does not require a physical signature.")}
                </p>

                <p className="mt-1.5 m-0 text-[#9CA3AF]">
                  For support:{" "}
                  {safe(invoice.companyEmail || invoice.invoiceFooterSupportEmail)}
                  <span className="mx-1">|</span>
                  For billing:{" "}
                  {safe(invoice.billingEmail || invoice.invoiceFooterBillingEmail)}
                </p>

                {invoice.companyWebsiteUrl && (
                  <p className="mt-1.5 m-0 text-[#9CA3AF]">
                    Website: {safe(invoice.companyWebsiteUrl)}
                  </p>
                )}
              </td>

              {showQr && qrImageUrl && (
                <td className="w-[30%] align-top text-center p-5">
                  <div className="h-[120px] w-[120px] border-2 border-[#E5E7EB] rounded-[12px] bg-white mx-auto mb-2 overflow-hidden">
                    <img
                      src={qrImageUrl}
                      alt="Invoice QR"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[11px] text-[#6B7280]">Scan to View Online</div>
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
