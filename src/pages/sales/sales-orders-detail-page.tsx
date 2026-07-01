import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/service/apiClient";
import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import { getInvoicePdfUrl } from "@/service/invoiceService";
import { isInvoiceReceiptView } from "@/lib/invoice-status-filter";
import { CheckCircle2, Clock3, XCircle, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { SalesOrderDetailCards } from "./components/sales-order-detail-cards";
import { SalesPageHeader } from "./components/sales-page-header";
import { CurrencyAmount } from "@/components/currency/currency-amount";

const SalesOrdersDetailPage = () => {
  const { id } = useParams();
  const [so, setSo] = useState<SalesOrderResponseDTO | null>(null);

  const updateStatus = async (action: "confirm" | "cancel") => {
    if (!so) return;

    try {
      await apiClient.post(`/sales/orders/${so.id}/${action}`);
      const { data } = await apiClient.get<SalesOrderResponseDTO>(
        `/sales/orders/${so.id}`,
      );
      setSo(data);
      if (action === "confirm") {
        toast.success("Order confirmed successfully");
      } else {
        toast.success("Order cancelled");
      }
    } catch (error: unknown) {
      console.error("Status update failed", error);
      const err = error as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          `Failed to ${action} order.`,
      );
    }
  };

  useEffect(() => {
    apiClient
      .get<SalesOrderResponseDTO>(`/sales/orders/${id}`)
      .then(({ data }) => setSo(data));
  }, [id]);

  if (!so) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  const status = (so.status || "").toUpperCase();
  const statusMeta =
    status === "CANCELLED"
      ? {
          label: "Cancelled",
          icon: XCircle,
          className: "border-rose-200 bg-rose-100 text-rose-700",
        }
      : status === "COMPLETED"
        ? {
            label: "Completed",
            icon: CheckCircle2,
            className: "border-emerald-200 bg-emerald-100 text-emerald-800",
          }
        : status === "CONFIRMED"
          ? {
              label: "Confirmed",
              icon: CheckCircle2,
              className: "border-emerald-200 bg-emerald-100 text-emerald-700",
            }
          : {
              label: "Draft",
              icon: Clock3,
              className: "border-amber-200 bg-amber-100 text-amber-700",
            };
  const StatusIcon = statusMeta.icon;
  const showReceiptActions = isInvoiceReceiptView(so.paymentStatus);
  const hasSalesInvoice = so.salesInvoiceId != null;
  const showDocumentActions =
    hasSalesInvoice && status !== "DRAFT" && status !== "CANCELLED";
  const canConfirm =
    status === "DRAFT" && so.sufficientDebitBalance !== false;
  const insufficientBalance =
    status === "DRAFT" && so.sufficientDebitBalance === false;

  const handleDownloadDocumentPdf = async () => {
    if (!so.salesInvoiceId) return;
    try {
      const url = await getInvoicePdfUrl(so.salesInvoiceId);
      if (url && !url.includes("dummy.url")) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("PDF is not available.");
      }
    } catch {
      toast.error("Could not download document.");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <SalesPageHeader
        title={`Order ${so.orderNumber}`}
        description={`Order date: ${so.orderDate || "N/A"}`}
        backHref="/inventory/sales/orders"
        actions={
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <Badge
              variant="outline"
              className={`justify-center border px-3 py-1 text-xs font-medium sm:justify-end ${statusMeta.className}`}
            >
              <StatusIcon className="mr-1 h-3.5 w-3.5" />
              {statusMeta.label}
            </Badge>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-white/70">
                Order value
              </p>
              <CurrencyAmount
                amount={so.totalAmount ?? 0}
                className="text-2xl font-bold text-white"
              />
            </div>
          </div>
        }
      />

      {status === "DRAFT" && insufficientBalance && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <p className="font-medium">Insufficient debit account balance</p>
            <p className="text-amber-900/90">
              {so.debitAccountName
                ? `Account "${so.debitAccountName}" does not have enough balance to confirm this order.`
                : "The selected debit account does not have enough balance to confirm this order."}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-amber-900/80">
              <span>
                Order total:{" "}
                <CurrencyAmount amount={so.totalAmount ?? 0} className="inline" />
              </span>
              {so.debitAccountBalance != null ? (
                <span>
                  Available:{" "}
                  <CurrencyAmount
                    amount={so.debitAccountBalance}
                    className="inline"
                  />
                </span>
              ) : null}
              {so.debitBalanceShortage != null && so.debitBalanceShortage > 0 ? (
                <span>
                  Short by:{" "}
                  <CurrencyAmount
                    amount={so.debitBalanceShortage}
                    className="inline font-medium"
                  />
                </span>
              ) : null}
            </div>
            <p className="text-xs text-amber-900/70">
              You can save and edit this draft. Confirmation is blocked until the
              account is funded.
            </p>
          </div>
        </div>
      )}

      {status === "DRAFT" && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => updateStatus("confirm")} disabled={!canConfirm}>
            Confirm Order
          </Button>
          <Button variant="destructive" onClick={() => updateStatus("cancel")}>
            Cancel Order
          </Button>
        </div>
      )}

      {showDocumentActions && !showReceiptActions && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => void handleDownloadDocumentPdf()}
          >
            Download invoice
          </Button>
          <Button type="button" variant="secondary" size="sm" className="rounded-lg" asChild>
            <Link
              to={`/sales/invoices/${so.salesInvoiceId}`}
              state={{ backTo: `/inventory/sales/orders/${so.id}` }}
            >
              Open invoice
            </Link>
          </Button>
        </div>
      )}

      {showDocumentActions && showReceiptActions && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => void handleDownloadDocumentPdf()}
          >
            Download receipt
          </Button>
          <Button type="button" variant="secondary" size="sm" className="rounded-lg" asChild>
            <Link
              to={`/sales/invoices/${so.salesInvoiceId}`}
              state={{ backTo: `/inventory/sales/orders/${so.id}` }}
            >
              Open receipt
            </Link>
          </Button>
        </div>
      )}

      <SalesOrderDetailCards so={so} />
    </div>
  );
};

export default SalesOrdersDetailPage;
