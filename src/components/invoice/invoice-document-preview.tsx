import type { Invoice, SalesOrderItem } from "@/types/sales";
import type { PurchaseOrderItem } from "@/types/purchase";
import { cn } from "@/lib/utils";
import {
  formatInvoiceDate,
  formatInvoiceTemplate,
  INVOICE_DOC_MISSING,
  invoiceDocTitle,
  invoiceMoney,
  invoiceStatusColor,
  isPaidInvoiceView,
  safeInvoiceValue,
} from "@/lib/invoice-document-utils";

type InvoiceDocumentPreviewProps = {
  invoice: Invoice;
  currencyCode?: string;
  id?: string;
  className?: string;
};

type InvoiceLineItem = SalesOrderItem | PurchaseOrderItem;

function lineDiscountLabel(item: InvoiceLineItem): string {
  if ("discountPercent" in item && item.discountPercent != null) {
    return `${item.discountPercent}%`;
  }
  if (item.discount > 0) {
    return `${item.discount}%`;
  }
  return "—";
}

function lineAmount(item: InvoiceLineItem): number | undefined {
  if ("lineTotal" in item && typeof item.lineTotal === "number") {
    return item.lineTotal;
  }
  return item.total;
}

function lineUnitPrice(item: InvoiceLineItem): number | undefined {
  if ("unitCost" in item && item.unitCost != null) {
    return item.unitCost;
  }
  return item.unitPrice;
}

function lineExtraDescription(item: InvoiceLineItem): string | undefined {
  if ("notes" in item && item.notes?.trim()) {
    return item.notes.trim();
  }
  return undefined;
}

export function InvoiceDocumentPreview({
  invoice,
  currencyCode,
  id,
  className,
}: InvoiceDocumentPreviewProps) {
  const isSales = invoice.type === "SALES";
  const isPaid = isPaidInvoiceView(invoice.status);
  const isPartiallyPaid =
    (invoice.status || "").toUpperCase() === "PARTIALLY_PAID" ||
    (!isPaid &&
      (invoice.paidAmount ?? 0) > 0 &&
      (invoice.outstanding ?? 0) > 0);
  const order = isSales ? invoice.salesOrder : invoice.purchaseOrder;
  const items = order?.items ?? [];
  const statusColor = invoiceStatusColor(invoice.status);
  const docTitle = invoiceDocTitle(invoice);
  const partyLabel = isSales ? "Bill To" : "Supplier";
  const orderLabel = isSales ? "Sales Order" : "Purchase Order";
  const orderNumber = isSales
    ? safeInvoiceValue(invoice.salesOrder?.orderNumber ?? invoice.orderNumber)
    : safeInvoiceValue(
        invoice.purchaseOrder?.orderNumber ?? invoice.orderNumber,
      );
  const partyName = isSales
    ? safeInvoiceValue(invoice.salesOrder?.customerName ?? invoice.toParty)
    : safeInvoiceValue(invoice.purchaseOrder?.supplierName ?? invoice.toParty);
  const partyEmail = isSales
    ? safeInvoiceValue(invoice.salesOrder?.customerEmail)
    : "";
  const partyPhone = isSales
    ? safeInvoiceValue(invoice.salesOrder?.customerPhone)
    : "";
  const partyAddress = isSales
    ? safeInvoiceValue(invoice.salesOrder?.shippingAddress)
    : "";
  const brandSub = isSales ? "Customer Invoice" : "Accounts Payable";
  const termsAndConditions = (invoice.invoiceTerms || "")
    .split(/\r?\n/)
    .map((term) => term.trim())
    .filter(Boolean);
  const notesText = formatInvoiceTemplate(
    isPaid ? invoice.invoiceNotesPaid : invoice.invoiceNotesUnpaid,
    {
      companyName: safeInvoiceValue(invoice.companyName),
      invoiceDate: formatInvoiceDate(invoice.invoiceDate),
      dueDate: formatInvoiceDate(invoice.dueDate),
      paidDate: formatInvoiceDate(invoice.paidDate),
      invoiceId: safeInvoiceValue(invoice.invoiceId),
    },
  );
  const addressLine = [
    invoice.companyStreet,
    invoice.companyCity,
    invoice.companyState,
    invoice.companyCountry,
  ]
    .filter(Boolean)
    .join(", ");
  const showPaymentInfo =
    isSales && Boolean(invoice.bankAccountName) && !isPaid;
  const showNotes = isSales && Boolean(notesText.trim());
  const showTerms = isSales && termsAndConditions.length > 0;
  const showDiscount = (invoice.discountAmount ?? 0) > 0;
  const showTax = (invoice.taxAmount ?? 0) > 0;
  const showQr =
    Boolean(invoice.invoiceQrEnabled) && Boolean(invoice.publicInvoiceUrl);
  const qrImageUrl = showQr
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
        invoice.publicInvoiceUrl as string,
      )}`
    : null;

  return (
    <div
      id={id}
      className={cn(
        "w-full max-w-[820px] overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-800 shadow-sm",
        className,
      )}
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <div className="border-b-[3px] border-blue-500 px-8 pb-4 pt-8">
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="align-top">
                <div className="text-[22px] font-extrabold text-blue-800">
                  {safeInvoiceValue(invoice.companyName)}
                </div>
                <div className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-slate-500">
                  {brandSub}
                </div>
              </td>
              <td className="align-top text-right">
                <div className="text-lg font-extrabold uppercase tracking-[0.06em] text-slate-900">
                  {docTitle}
                </div>
                <div className="mt-1 font-mono text-xs text-slate-500">
                  {safeInvoiceValue(invoice.invoiceId)}
                </div>
                <span
                  className="mt-1.5 inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase text-white"
                  style={{ backgroundColor: statusColor }}
                >
                  {(invoice.status || "UNPAID").toUpperCase()}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="space-y-6 px-8 py-6">
        <section>
          <div className="mb-3 border-b border-slate-200 pb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-500">
            Invoice Details
          </div>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="w-1/3 align-top pr-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    {partyLabel}
                  </div>
                  <div className="mt-1 text-[13px] font-semibold text-slate-900">
                    {partyName}
                  </div>
                  {partyEmail !== INVOICE_DOC_MISSING && (
                    <div className="mt-1 text-[11px] text-slate-500">
                      {partyEmail}
                    </div>
                  )}
                  {partyPhone !== INVOICE_DOC_MISSING && (
                    <div className="text-[11px] text-slate-500">
                      {partyPhone}
                    </div>
                  )}
                  {partyAddress !== INVOICE_DOC_MISSING && (
                    <div className="text-[11px] text-slate-500">
                      {partyAddress}
                    </div>
                  )}
                </td>
                <td className="w-1/3 align-top pr-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    Invoice Date
                  </div>
                  <div className="mt-1 text-[13px] font-semibold text-slate-900">
                    {formatInvoiceDate(invoice.invoiceDate)}
                  </div>
                  <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    Due Date
                  </div>
                  <div className="mt-1 text-[13px] font-semibold text-slate-900">
                    {formatInvoiceDate(invoice.dueDate)}
                  </div>
                </td>
                <td className="w-1/3 align-top">
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    {orderLabel}
                  </div>
                  <div className="mt-1 text-[13px] font-semibold text-slate-900">
                    {orderNumber}
                  </div>
                  {!isSales && invoice.supplierInvoiceNumber && (
                    <>
                      <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        Vendor Invoice #
                      </div>
                      <div className="mt-1 text-[13px] font-semibold text-slate-900">
                        {invoice.supplierInvoiceNumber}
                      </div>
                    </>
                  )}
                  {(isPaid || isPartiallyPaid) && invoice.paidDate && (
                    <>
                      <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        {isPaid ? "Paid Date" : "Last Payment"}
                      </div>
                      <div className="mt-1 text-[13px] font-semibold text-slate-900">
                        {formatInvoiceDate(invoice.paidDate)}
                      </div>
                    </>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <div className="mb-3 border-b border-slate-200 pb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-500">
            Line Items
          </div>
          <table className="invoice-document-lines w-full border-collapse border border-slate-200 text-[13px] [&_thead]:bg-blue-800 [&_thead_tr]:border-0 [&_thead_th]:bg-transparent [&_thead_th]:font-bold [&_thead_th]:text-white [&_thead_th]:uppercase">
            <thead>
              <tr>
                <th className="w-10 px-3 py-2.5 text-center text-[10px] tracking-[0.06em]">
                  #
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] tracking-[0.06em]">
                  Description
                </th>
                <th className="px-3 py-2.5 text-right text-[10px] tracking-[0.06em]">
                  Qty
                </th>
                <th className="px-3 py-2.5 text-right text-[10px] tracking-[0.06em]">
                  Unit
                </th>
                <th className="px-3 py-2.5 text-right text-[10px] tracking-[0.06em]">
                  Discount
                </th>
                <th className="px-3 py-2.5 text-right text-[10px] tracking-[0.06em]">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {(items as InvoiceLineItem[]).map((item, index) => {
                const discount = lineDiscountLabel(item);
                const extraDescription = lineExtraDescription(item);
                return (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-slate-50" : "bg-white"}
                  >
                    <td className="border-b border-slate-200 px-3 py-2 text-center text-slate-500">
                      {index + 1}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2">
                      <div className="font-semibold text-slate-900">
                        {safeInvoiceValue(item.itemName)}
                      </div>
                      {extraDescription && (
                        <div className="mt-0.5 text-[10px] text-slate-500">
                          {extraDescription}
                        </div>
                      )}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2 text-right">
                      {safeInvoiceValue(item.quantity)}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2 text-right">
                      {invoiceMoney(lineUnitPrice(item), currencyCode)}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2 text-right">
                      {discount}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2 text-right font-bold text-slate-900">
                      {invoiceMoney(lineAmount(item), currencyCode)}
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-center text-slate-400"
                  >
                    No line items
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-3 flex justify-end">
            <table className="w-full max-w-xs border-collapse border border-slate-200 text-[13px]">
              <tbody>
                <tr>
                  <td className="border-b border-slate-200 px-3 py-2 text-slate-500">
                    Amount
                  </td>
                  <td className="border-b border-slate-200 px-3 py-2 text-right font-semibold">
                    {invoiceMoney(
                      invoice.subtotalAmount ?? invoice.amount,
                      currencyCode,
                    )}
                  </td>
                </tr>
                {showDiscount && (
                  <tr>
                    <td className="border-b border-slate-200 px-3 py-2 text-slate-500">
                      Discount
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2 text-right font-semibold">
                      {invoiceMoney(invoice.discountAmount, currencyCode)}
                    </td>
                  </tr>
                )}
                {showDiscount && (
                  <tr>
                    <td className="border-b border-slate-200 px-3 py-2 text-slate-500">
                      Subtotal
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2 text-right font-semibold">
                      {invoiceMoney(
                        (invoice.subtotalAmount ?? invoice.amount) -
                          (invoice.discountAmount ?? 0),
                        currencyCode,
                      )}
                    </td>
                  </tr>
                )}
                {showTax && (
                  <tr>
                    <td className="border-b border-slate-200 px-3 py-2 text-slate-500">
                      Tax
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2 text-right font-semibold">
                      {invoiceMoney(invoice.taxAmount, currencyCode)}
                    </td>
                  </tr>
                )}
                <tr className="bg-blue-50">
                  <td className="border-t-2 border-blue-500 px-3 py-2.5 font-bold text-blue-800">
                    Total Due
                  </td>
                  <td className="border-t-2 border-blue-500 px-3 py-2.5 text-right font-bold text-blue-800">
                    {invoiceMoney(invoice.amount, currencyCode)}
                  </td>
                </tr>
                {isPartiallyPaid && (invoice.paidAmount ?? 0) > 0 && (
                  <tr>
                    <td className="border-b border-slate-200 px-3 py-2 text-emerald-600">
                      Paid Amount
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2 text-right font-semibold text-emerald-600">
                      {invoiceMoney(invoice.paidAmount, currencyCode)}
                    </td>
                  </tr>
                )}
                {isPartiallyPaid && (
                  <tr className="bg-amber-50">
                    <td className="border-t-2 border-amber-400 px-3 py-2.5 font-bold text-amber-700">
                      Balance Due
                    </td>
                    <td className="border-t-2 border-amber-400 px-3 py-2.5 text-right font-bold text-amber-700">
                      {invoiceMoney(invoice.outstanding, currencyCode)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {showPaymentInfo && (
          <section>
            <div className="mb-3 border-b border-slate-200 pb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-500">
              Payment Information
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3.5 text-[12px] leading-relaxed text-slate-600">
              <p>
                <strong>Bank Name:</strong>{" "}
                {safeInvoiceValue(invoice.bankAccountName)}
              </p>
              <p>
                <strong>Account Holder:</strong>{" "}
                {safeInvoiceValue(invoice.companyName)}
              </p>
              <p>
                <strong>Account Number:</strong>{" "}
                {safeInvoiceValue(invoice.bankAccountNumber)}
              </p>
              <p>
                <strong>IFSC/SWIFT:</strong>{" "}
                {safeInvoiceValue(invoice.bankIfscCode)}
              </p>
              <p>
                <strong>Branch:</strong>{" "}
                {safeInvoiceValue(invoice.bankBranchName)}
              </p>
              <p>
                <strong>Reference:</strong>{" "}
                {safeInvoiceValue(invoice.invoiceId)}
              </p>
            </div>
          </section>
        )}

        {showNotes && (
          <section>
            <div className="mb-3 border-b border-slate-200 pb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-500">
              Notes
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3.5 text-[12px] leading-relaxed text-slate-600 whitespace-pre-wrap">
              {notesText}
              {addressLine && (
                <p className="mt-2">Company Address: {addressLine}</p>
              )}
              {invoice.companyPhone && (
                <p className="mt-2">Contact: {invoice.companyPhone}</p>
              )}
            </div>
          </section>
        )}

        {showTerms && (
          <section>
            <div className="mb-3 border-b border-slate-200 pb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-500">
              Terms and Conditions
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3.5 text-[12px] text-slate-600">
              <ol className="list-decimal space-y-2 pl-5">
                {termsAndConditions.map((term, idx) => (
                  <li key={idx}>{term}</li>
                ))}
              </ol>
            </div>
          </section>
        )}

        <section>
          <div className="mb-3 border-b border-slate-200 pb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-500">
            Signatures
          </div>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="w-1/2 px-6 text-center align-bottom">
                  <div className="mt-12 border-t-2 border-slate-900 pt-2">
                    <div className="text-[12px] font-bold text-slate-900">
                      {partyName}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      {isSales
                        ? "Customer Signature & Date"
                        : "Supplier Signature & Date"}
                    </div>
                  </div>
                </td>
                <td className="w-1/2 px-6 text-center align-bottom">
                  <div className="mt-12 border-t-2 border-slate-900 pt-2">
                    <div className="text-[12px] font-bold text-slate-900">
                      {safeInvoiceValue(invoice.companyName)}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      Authorized Signatory & Date
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <table className="w-full border-collapse border-t border-slate-200">
        <tbody>
          <tr>
            <td className="w-[70%] px-8 py-5 align-top text-[10px] text-slate-400">
              <p className="font-semibold text-slate-700">
                {safeInvoiceValue(
                  invoice.invoiceFooterCompanyLine || invoice.companyName,
                )}
              </p>
              {invoice.invoiceFooterTaxLine && (
                <p className="mt-1">{invoice.invoiceFooterTaxLine}</p>
              )}
              {addressLine && <p className="mt-1">Address: {addressLine}</p>}
              <p className="mt-1">
                {safeInvoiceValue(
                  invoice.invoiceFooterSignatureNote ||
                    "This is a computer-generated document and does not require a physical signature.",
                )}
              </p>
              <p className="mt-1">
                For support:{" "}
                {safeInvoiceValue(
                  invoice.companyEmail || invoice.invoiceFooterSupportEmail,
                )}{" "}
                | For billing:{" "}
                {safeInvoiceValue(
                  invoice.billingEmail || invoice.invoiceFooterBillingEmail,
                )}
              </p>
              {invoice.companyWebsiteUrl && (
                <p className="mt-1">Website: {invoice.companyWebsiteUrl}</p>
              )}
            </td>
            {showQr && qrImageUrl && (
              <td className="w-[30%] px-8 py-5 text-center align-top">
                <div className="mx-auto mb-2 h-[120px] w-[120px] overflow-hidden rounded-xl border-2 border-slate-200 bg-white">
                  <img
                    src={qrImageUrl}
                    alt="Invoice QR"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="text-[11px] text-slate-500">
                  Scan to View Online
                </div>
              </td>
            )}
          </tr>
          <tr>
            <td
              colSpan={2}
              className="px-8 pb-5 text-right text-[10px] text-slate-400"
            >
              Ref: {safeInvoiceValue(invoice.invoiceId)} |{" "}
              {safeInvoiceValue(invoice.companyName)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
