import { Button } from "@/components/ui/button";
import { isInvoiceReceiptView } from "@/lib/invoice-status-filter";
import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import {
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Pencil,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { SalesOrderBalanceWarning } from "./sales-order-balance-warning";
import { SalesOrderDetailCustomer } from "./sales-order-detail-customer";
import { SalesOrderHeroTotals } from "./sales-order-hero-totals";
import { CreateSalesReturnDialog } from "./create-sales-return-dialog";
import {
  formatStatusLabel,
  ORDER_STATUS_STYLES,
  orderStatusKey,
  PAYMENT_STATUS_STYLES,
  paymentStatusKey,
} from "./sales-order-detail-utils";

type Props = {
  so: SalesOrderResponseDTO;
  onEdit: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onDownloadDocument: () => void;
  onReturned?: () => void;
  onGeneratePicklist?: () => void;
  onViewPicklist?: () => void;
  hasActivePicklist?: boolean;
};

export function SalesOrderDetailHero({
  so,
  onEdit,
  onConfirm,
  onCancel,
  onDownloadDocument,
  onReturned,
  onGeneratePicklist,
  onViewPicklist,
  hasActivePicklist = false,
}: Props) {
  const status = orderStatusKey(so);
  const payment = paymentStatusKey(so);
  const isQuotation = status === "QUOTATION";
  const canConfirm = isQuotation && so.sufficientDebitBalance !== false;
  const insufficientBalance = isQuotation && so.sufficientDebitBalance === false;
  const hasSalesInvoice = so.salesInvoiceId != null;
  const showDocumentActions =
    hasSalesInvoice && !isQuotation && status !== "CANCELLED";
  const showReceiptActions = isInvoiceReceiptView(so.paymentStatus);
  const canReturn =
    !isQuotation &&
    status !== "CANCELLED" &&
    (so.items ?? []).some((line) => {
      const ordered = line.quantity ?? 0;
      const returned = line.returnedQty ?? 0;
      return ordered - returned > 0;
    });
  const canCancelOrder =
    status !== "CANCELLED" &&
    status !== "COMPLETED" &&
    payment !== "PAID" &&
    (isQuotation || status === "CONFIRMED");
  const canGeneratePicklist =
    status === "CONFIRMED" &&
    payment === "PAID" &&
    !hasActivePicklist &&
    Boolean(onGeneratePicklist);
  const canViewPicklist = hasActivePicklist && Boolean(onViewPicklist);
  const hasActions =
    isQuotation ||
    canCancelOrder ||
    showDocumentActions ||
    canReturn ||
    canGeneratePicklist ||
    canViewPicklist;

  const statusStyle =
    ORDER_STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700";
  const paymentStyle =
    PAYMENT_STATUS_STYLES[payment] ?? "bg-slate-100 text-slate-600";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="p-5 sm:p-6">
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

        <div className="mt-4 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
          <div className="min-w-0 space-y-4 lg:col-span-7 xl:col-span-8">
            <SalesOrderDetailCustomer so={so} />

            {insufficientBalance ? <SalesOrderBalanceWarning so={so} /> : null}

            {hasActions ? (
              <div className="flex flex-wrap gap-2.5">
                {isQuotation ? (
                  <>
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="h-10 gap-2 rounded-xl border-sky-200 text-sky-700 hover:bg-sky-50"
                      onClick={onEdit}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit order
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      className="h-10 gap-2 rounded-xl bg-sky-600 hover:bg-sky-700"
                      onClick={onConfirm}
                      disabled={!canConfirm}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Confirm order
                    </Button>
                  </>
                ) : null}

                {canCancelOrder ? (
                  <Button
                    type="button"
                    size="lg"
                    variant="destructive"
                    className="h-10 gap-2 rounded-xl"
                    onClick={onCancel}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel
                  </Button>
                ) : null}

                {showDocumentActions ? (
                  <>
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="h-10 gap-2 rounded-xl"
                      onClick={onDownloadDocument}
                    >
                      <Download className="h-4 w-4" />
                      {showReceiptActions
                        ? "Download receipt"
                        : "Download invoice"}
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      variant="secondary"
                      className="h-10 gap-2 rounded-xl"
                      asChild
                    >
                      <Link
                        to={`/sales/invoices/${so.salesInvoiceId}`}
                        state={{
                          backTo: `/inventory/sales/orders/${so.id}`,
                        }}
                      >
                        <FileText className="h-4 w-4" />
                        {showReceiptActions ? "Open receipt" : "Open invoice"}
                      </Link>
                    </Button>
                  </>
                ) : null}

                {canGeneratePicklist ? (
                  <Button
                    type="button"
                    size="lg"
                    className="h-10 gap-2 rounded-xl bg-violet-600 hover:bg-violet-700"
                    onClick={onGeneratePicklist}
                  >
                    <ClipboardList className="h-4 w-4" />
                    Generate picklist
                  </Button>
                ) : null}

                {canViewPicklist ? (
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="h-10 gap-2 rounded-xl"
                    onClick={onViewPicklist}
                  >
                    <ClipboardList className="h-4 w-4" />
                    View picklist
                  </Button>
                ) : null}

                {canReturn && onReturned ? (
                  <CreateSalesReturnDialog so={so} onReturned={onReturned} />
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            <SalesOrderHeroTotals so={so} />
          </div>
        </div>
      </div>
    </div>
  );
}
