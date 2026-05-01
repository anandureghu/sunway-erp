import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "@/service/apiClient";
import type { Invoice } from "@/types/sales";

const MISSING = "N/A";

const safe = (v: unknown) =>
  v === null || v === undefined || v === "" ? MISSING : String(v);

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString() : MISSING;

const money = (n?: number) =>
  typeof n === "number" ? n.toLocaleString() : MISSING;

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
    return <div className="p-8 text-sm text-muted-foreground">Loading invoice...</div>;
  }

  const isPaid = (invoice.status || "").toUpperCase() === "PAID";
  const items = invoice.type === "SALES"
    ? invoice.salesOrder?.items ?? []
    : invoice.purchaseOrder?.items ?? [];
  const terms = (invoice.invoiceTerms || "")
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const note = formatTemplate(
    isPaid ? invoice.invoiceNotesPaid : invoice.invoiceNotesUnpaid,
    {
      companyName: safe(invoice.companyName),
      invoiceDate: formatDate(invoice.invoiceDate),
      dueDate: formatDate(invoice.dueDate),
      paidDate: formatDate(invoice.paidDate),
      invoiceId: safe(invoice.invoiceId),
    },
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-white">
        <div className="flex justify-between bg-gradient-to-br from-gray-900 to-gray-800 p-10 text-white">
          <div>
            <h1 className="text-2xl font-bold">{safe(invoice.companyName)}</h1>
            <p className="text-gray-300">{safe(invoice.invoiceHeaderSubtitle)}</p>
          </div>
          <div className="rounded-xl bg-orange-500 px-6 py-4 text-center">
            <div className="text-xl font-bold">{isPaid ? "RECEIPT" : "INVOICE"}</div>
            <div className="text-sm">#{safe(invoice.invoiceId)}</div>
          </div>
        </div>

        <div className="space-y-8 p-10">
          <div className="grid gap-8 border-b border-gray-200 pb-8 md:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Status</p>
              <p className="font-semibold">{safe(invoice.status)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Invoice Details</p>
              <p>Invoice Date: {formatDate(invoice.invoiceDate)}</p>
              <p>Due Date: {formatDate(invoice.dueDate)}</p>
              <p>Paid Date: {formatDate(invoice.paidDate)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Reference</p>
              <p>{safe(invoice.invoiceId)}</p>
            </div>
          </div>

          <table className="w-full overflow-hidden rounded-lg border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Unit</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => (
                <tr key={idx} className="border-t border-gray-200">
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3">{safe(item.itemName)}</td>
                  <td className="p-3 text-right">{safe(item.quantity)}</td>
                  <td className="p-3 text-right">{money(item.unitPrice ?? item.unitCost)}</td>
                  <td className="p-3 text-right font-semibold">{money(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="rounded-xl bg-gray-50 p-6">
            <p className="text-xs font-bold uppercase text-gray-500">Notes</p>
            <p className="leading-7">{note || MISSING}</p>
          </div>

          {terms.length > 0 && (
            <div className="rounded-xl border border-gray-200 p-6">
              <p className="text-xs font-bold uppercase text-gray-500">Terms & Conditions</p>
              <ul>
                {terms.map((term, idx) => (
                  <li key={idx} className="ml-5 mt-3 list-decimal marker:text-orange-500">
                    {term}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-10 py-8 text-sm text-gray-600">
          <p className="font-semibold text-gray-900">{safe(invoice.invoiceFooterCompanyLine)}</p>
          <p>{safe(invoice.invoiceFooterTaxLine)}</p>
          <p>
            {safe(
              [invoice.companyStreet, invoice.companyCity, invoice.companyState, invoice.companyCountry]
                .filter(Boolean)
                .join(", "),
            )}
          </p>
          <p>{safe(invoice.invoiceFooterSignatureNote)}</p>
          <p className="text-gray-400">
            For support: {safe(invoice.companyEmail || invoice.invoiceFooterSupportEmail)} | For billing:{" "}
            {safe(invoice.billingEmail || invoice.invoiceFooterBillingEmail)}
          </p>
          <p className="text-gray-400">{invoice.companyWebsiteUrl ? `Website: ${invoice.companyWebsiteUrl}` : ""}</p>
        </div>
      </div>
    </div>
  );
}
