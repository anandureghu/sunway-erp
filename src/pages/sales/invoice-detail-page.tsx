import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "@/service/apiClient";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Invoice } from "@/types/sales";

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

const money = (n?: number) =>
  typeof n === "number" ? `₹ ${n.toLocaleString()}` : MISSING;

/* =======================
   COMPONENT
======================= */

const termsAndConditions = [
  "Payment is due within 30 days of the invoice date. Late payments may incur a 2% monthly interest charge on the outstanding balance.",

  "All payments must be made in Qatari Riyals (QAR) to the bank account specified above. International wire transfer fees are the responsibility of the client.",

  "Services, licenses, hosting, and support are provided on a subscription basis. Non-payment will result in automatic suspension of services after 14 days past the due date.",

  "Any disputes regarding this invoice must be raised in writing within 7 business days of receipt. Silence will be deemed as acceptance of all charges.",

  "This invoice is subject to Qatar's taxation laws. While currently at 0% VAT, any future tax changes will be applied as per government regulations.",

  "Hosting and support services include a 99.9% uptime guarantee. Credits for downtime exceeding this threshold must be claimed within 30 days.",

  "All intellectual property rights for custom development work transfer to the client upon full payment of this invoice.",

  "MyWeb Systems QFZ LLC reserves the right to update these terms with prior written notice to the client.",
];

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [tab, setTab] = useState<"invoice" | "receipt">("invoice");

  useEffect(() => {
    apiClient.get(`/invoices/${id}`).then((res) => {
      setInvoice(res.data);
    });
  }, [id]);

  if (!invoice) {
    return <div className="p-8">Loading invoice…</div>;
  }

  const isSales = invoice.type === "SALES";
  const order = isSales ? invoice.salesOrder : invoice.purchaseOrder;
  const items = order?.items ?? [];

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
      .catch((error) => {
        console.error("Invoice PDF download failed", error);
        alert("Unable to download invoice PDF");
      });
  };

  /* =======================
     RENDER
  ======================= */

  return (
    <div className="min-h-screen p-6" style={{ background: COLORS.gray100 }}>
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft />
      </Button>

      {/* TOGGLE */}
      <div className="max-w-5xl mx-auto my-6 flex gap-3">
        {(["invoice", "receipt"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 rounded-xl py-4 text-lg font-semibold border"
            style={{
              background: tab === t ? COLORS.orange500 : COLORS.white,
              color: tab === t ? COLORS.white : COLORS.gray900,
              borderColor: COLORS.gray200,
            }}
          >
            {t === "invoice" ? "📄 Invoice" : "🧾 Receipt"}
          </button>
        ))}
      </div>

      {/* ACTIONS */}
      <div className="max-w-5xl mx-auto mb-8 grid md:grid-cols-3 gap-4">
        <button
          // onClick={() => window.print()}
          className="rounded-xl py-4 text-lg font-semibold border"
          style={{ borderColor: COLORS.gray200 }}
        >
          🖨️ Print
        </button>

        <button
          onClick={handleDownloadPdf}
          className="rounded-xl py-4 text-lg font-semibold border"
          style={{ borderColor: COLORS.gray200 }}
        >
          📥 Download PDF
        </button>

        <button
          className="rounded-xl py-4 text-lg font-semibold"
          style={{ background: COLORS.orange500, color: COLORS.white }}
        >
          📧 Email
        </button>
      </div>

      {/* INVOICE */}
      <div
        id="invoice-pdf"
        className="max-w-5xl mx-auto rounded-2xl overflow-hidden"
        style={{ background: COLORS.white, color: COLORS.gray900 }}
      >
        {/* HEADER */}
        <div
          className="p-10 flex justify-between"
          style={{
            background: `linear-gradient(135deg, ${COLORS.gray900}, ${COLORS.gray800})`,
            color: COLORS.white,
          }}
        >
          <div>
            <h1 className="text-2xl font-bold">{safe(invoice.companyName)}</h1>
            <p style={{ color: COLORS.gray300 }}>
              Invoice generated by ERP system
            </p>
          </div>

          <div
            className="rounded-xl px-6 py-4 text-center"
            style={{ background: COLORS.orange500 }}
          >
            <div className="text-xl font-bold">{tab.toUpperCase()}</div>
            <div className="text-sm">#{safe(invoice.invoiceId)}</div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-10 space-y-10">
          {/* INFO */}
          <div
            className="grid md:grid-cols-3 gap-8 pb-8 border-b"
            style={{ borderColor: COLORS.gray200 }}
          >
            <div>
              <p
                className="text-xs font-bold uppercase"
                style={{ color: COLORS.gray500 }}
              >
                {isSales ? "Bill To" : "Supplier"}
              </p>
              {isSales && (
                <>
                  <p className="font-semibold">
                    {invoice?.salesOrder?.customerName}
                  </p>
                  <p className="">{invoice?.salesOrder?.customerEmail}</p>
                  <p className="">{invoice?.salesOrder?.customerPhone}</p>
                </>
              )}
              <p style={{ color: COLORS.gray600 }}>
                Status: {safe(invoice.status)}
              </p>
            </div>

            <div>
              <p
                className="text-xs font-bold uppercase"
                style={{ color: COLORS.gray500 }}
              >
                Invoice Details
              </p>
              <p>Invoice Date: {formatDate(invoice.invoiceDate)}</p>
              <p>Due Date: {formatDate(invoice.dueDate)}</p>
              <p>Paid Date: {formatDate(invoice.paidDate)}</p>
            </div>

            <div>
              <p
                className="text-xs font-bold uppercase"
                style={{ color: COLORS.gray500 }}
              >
                Reference
              </p>
              <p>
                <strong>{isSales ? "Sales" : "Purchase"} Order ID: </strong>{" "}
                <br />
                {isSales
                  ? invoice.salesOrder?.orderNumber
                  : invoice.purchaseOrder?.orderNumber}
              </p>
              {/* <p>Debit: {safe(invoice.debitAccountName)}</p>
              <p>Credit: {safe(invoice.creditAccountName)}</p> */}
            </div>
          </div>

          {/* ITEMS */}
          <table
            className="w-full text-sm border rounded-lg overflow-hidden"
            style={{ borderColor: COLORS.gray200 }}
          >
            <thead style={{ background: COLORS.gray50 }}>
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Unit</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, i: number) => (
                <tr
                  key={i}
                  style={{ borderTop: `1px solid ${COLORS.gray200}` }}
                >
                  <td className="p-3">{i + 1}</td>
                  <td className="p-3">{safe(item.itemName)}</td>
                  <td className="p-3 text-right">{safe(item.quantity)}</td>
                  <td className="p-3 text-right">
                    {money(item.unitPrice ?? item.unitCost)}
                  </td>
                  <td className="p-3 text-right font-semibold">
                    {money(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTALS */}
          <div className="flex justify-end">
            <div
              className="w-full rounded-xl p-6"
              style={{ background: COLORS.gray50 }}
            >
              <div className="flex justify-between">
                <span>Amount</span>
                <span>{money(invoice.amount)}</span>
              </div>
              <div
                className="flex justify-between font-bold pt-3 mt-3"
                style={{ borderTop: `1px solid ${COLORS.gray200}` }}
              >
                <span>Outstanding</span>
                <span>{money(invoice.outstanding)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900">
              💳 Payment Information
            </h3>

            <div className="grid grid-cols-2 gap-y-6 gap-x-10">
              <div>
                <p className="text-xs font-semibold tracking-widest text-gray-500">
                  BANK NAME
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  Qatar National Bank (QNB)
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-widest text-gray-500">
                  ACCOUNT NAME
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  MyWeb Systems QFZ LLC
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-widest text-gray-500">
                  ACCOUNT NUMBER
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  QA12 QNBA 0000 0000 1234 5678 90
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-widest text-gray-500">
                  SWIFT CODE
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  QNBAQAQA
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-widest text-gray-500">
                  BRANCH
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  West Bay Main Branch
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-widest text-gray-500">
                  REFERENCE
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  INV-2025-001
                </p>
              </div>
            </div>
          </div>

          {/* NOTES */}
          <div className="rounded-xl p-6" style={{ background: COLORS.gray50 }}>
            <p
              className="text-xs font-bold uppercase"
              style={{ color: COLORS.gray500 }}
            >
              Notes
            </p>
            <p>
              Thank you for choosing MyWeb Systems QFZ LLC for your digital
              transformation needs. This invoice covers the complete website
              redesign project as per our agreement dated December 15, 2024. All
              services have been delivered as specified, and the website is now
              live at your production domain. Please ensure payment is made by
              the due date to maintain uninterrupted hosting services. For any
              questions or clarifications regarding this invoice, please contact
              our accounts department at accounts@myweb.qa or call +974 7103
              2141.
            </p>
          </div>

          <div className="rounded-xl p-6 border-[1.5px] border-gray-200">
            <p
              className="text-xs font-bold uppercase"
              style={{ color: COLORS.gray500 }}
            >
              ⚖️ Terms & Conditions
            </p>
            <ul>
              {termsAndConditions.map((term, idx) => (
                <li
                  key={idx}
                  className="list-decimal marker:text-orange-500 ml-5 mt-3"
                >
                  {term}
                  <br />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* NOTES */}

        {/* FOOTER */}
        <div className="flex justify-between items-start gap-10 px-10 py-8 bg-gray-50 text-sm text-gray-600">
          {/* Left content */}
          <div className="space-y-3">
            <p>
              <span className="font-semibold text-gray-900">
                MyWeb Systems QFZ LLC
              </span>
              <span className="mx-1">|</span>
              Commercial Registration: 123456789
            </p>

            <p>
              Qatar Free Zone Company
              <span className="mx-1">|</span>
              Tax ID: QA-123456789
            </p>

            <p>
              This is a computer-generated document and does not require a
              physical signature.
            </p>

            <p className="text-gray-400">
              For support: support@myweb.qa
              <span className="mx-1">|</span>
              For billing: accounts@myweb.qa
            </p>
          </div>

          {/* Right QR section */}
          <div className="flex flex-col items-center gap-2">
            <div className="h-28 w-28 rounded-xl border-2 border-gray-200 bg-white" />
            <p className="text-gray-500 font-medium">Scan to View Online</p>
          </div>
        </div>
      </div>
    </div>
  );
}
