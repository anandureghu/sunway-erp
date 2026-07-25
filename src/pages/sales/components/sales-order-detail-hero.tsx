import { Button } from "@/components/ui/button";
import { isInvoiceReceiptView } from "@/lib/invoice-status-filter";
import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import {
  CheckCircle2,
  Download,
  FileText,
  Pencil,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { SalesOrderBalanceWarning } from "./sales-order-balance-warning";
import { SalesOrderHeroTotals } from "./sales-order-hero-totals";
import {
  formatStatusLabel,
  ORDER_STATUS_STYLES,
  orderStatusKey,
  PAYMENT_STATUS_STYLES,
  paymentStatusKey,
  totalLineQty,
} from "./sales-order-detail-utils";

type Props = {
  so: SalesOrderResponseDTO;
  onEdit: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onDownloadDocument: () => void;
};

export function SalesOrderDetailHero({
  so,
  onEdit,
  onConfirm,
  onCancel,
  onDownloadDocument,
}: Props) {
  const status = orderStatusKey(so);
  const payment = paymentStatusKey(so);
  const isDraft = status === "DRAFT";
  const canConfirm = isDraft && so.sufficientDebitBalance !== false;
  const insufficientBalance = isDraft && so.sufficientDebitBalance === false;
  const hasSalesInvoice = so.salesInvoiceId != null;
  const showDocumentActions =
    hasSalesInvoice && status !== "DRAFT" && status !== "CANCELLED";
  const showReceiptActions = isInvoiceReceiptView(so.paymentStatus);
  const lineCount = (so.items || []).length;
  const qty = totalLineQty(so);

  const statusStyle =
    ORDER_STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700";
  const paymentStyle =
    PAYMENT_STATUS_STYLES[payment] ?? "bg-slate-100 text-slate-600";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-700">
              Sales order
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold capitalize ${statusStyle}`}
            >
              {formatStatusLabel(status)}
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${paymentStyle}`}
            >
              {formatStatusLabel(payment)}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {so.orderNumber || `Order #${so.id}`}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Order date: {so.orderDate || "—"}
            <span className="mx-1.5 text-slate-300">·</span>
            Invoice due: {so.invoiceDueDate || "Not set"}
            {so.paidDate ? (
              <>
                <span className="mx-1.5 text-slate-300">·</span>
                Paid: {so.paidDate}
              </>
            ) : null}
          </p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
            <span>
              <span className="font-semibold text-slate-900">{lineCount}</span>{" "}
              line{lineCount === 1 ? "" : "s"}
            </span>
            <span className="text-slate-300">·</span>
            <span>
              <span className="font-semibold text-slate-900">{qty}</span> units
            </span>
            {so.customerName ? (
              <>
                <span className="text-slate-300">·</span>
                <span className="truncate">{so.customerName}</span>
              </>
            ) : null}
          </div>

          {insufficientBalance ? <SalesOrderBalanceWarning so={so} /> : null}

          <div className="mt-6 flex flex-wrap gap-2.5">
            {isDraft ? (
              <>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="h-11 gap-2 rounded-xl border-sky-200 text-sky-700 hover:bg-sky-50"
                  onClick={onEdit}
                >
                  <Pencil className="h-4 w-4" />
                  Edit order
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="h-11 gap-2 rounded-xl bg-sky-600 hover:bg-sky-700"
                  onClick={onConfirm}
                  disabled={!canConfirm}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm order
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="destructive"
                  className="h-11 gap-2 rounded-xl"
                  onClick={onCancel}
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
              </>
            ) : null}

            {showDocumentActions ? (
              <>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="h-11 gap-2 rounded-xl"
                  onClick={onDownloadDocument}
                >
                  <Download className="h-4 w-4" />
                  {showReceiptActions ? "Download receipt" : "Download invoice"}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  className="h-11 gap-2 rounded-xl"
                  asChild
                >
                  <Link
                    to={`/sales/invoices/${so.salesInvoiceId}`}
                    state={{ backTo: `/inventory/sales/orders/${so.id}` }}
                  >
                    <FileText className="h-4 w-4" />
                    {showReceiptActions ? "Open receipt" : "Open invoice"}
                  </Link>
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <SalesOrderHeroTotals so={so} />
      </div>
    </div>
  );
}
