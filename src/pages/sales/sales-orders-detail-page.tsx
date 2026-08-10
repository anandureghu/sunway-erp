import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { apiClient } from "@/service/apiClient";
import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import { getInvoicePdfUrl } from "@/service/invoiceService";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { SalesOrderDetailCards } from "./components/sales-order-detail-cards";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { CreateSalesOrderForm } from "./components/create-sales-order-form";
import type { SalesOrder } from "@/types/sales";

function dtoToSalesOrder(so: SalesOrderResponseDTO): SalesOrder {
  return {
    id: String(so.id ?? ""),
    orderNo: so.orderNumber ?? String(so.id ?? ""),
    orderNumber: so.orderNumber,
    customerId: String(so.customerId ?? ""),
    customerName: so.customerName ?? "",
    customerEmail: so.customerEmail ?? "",
    customerPhone: so.customerPhone ?? "",
    orderDate: so.orderDate ?? "",
    invoiceDueDate: so.invoiceDueDate,
    requiredDate: undefined,
    status: (so.status ?? "quotation") as SalesOrder["status"],
    archived: so.archived,
    paymentStatus: so.paymentStatus,
    outstandingAmount: so.outstandingAmount,
    subtotal: so.subtotalAmount ?? 0,
    tax: so.taxAmount ?? 0,
    discount: so.discountAmount ?? 0,
    subtotalAmount: so.subtotalAmount,
    discountAmount: so.discountAmount,
    taxAmount: so.taxAmount,
    total: so.totalAmount ?? 0,
    totalAmount: so.totalAmount,
    shippingAddress: so.shippingAddress,
    notes: undefined,
    salesPerson: undefined,
    createdAt: "",
    updatedAt: "",
    bankAccountId:
      so.bankAccountId != null ? Number(so.bankAccountId) : undefined,
    bankAccountName: so.bankAccountName,
    debitAccountId:
      so.debitAccountId != null ? Number(so.debitAccountId) : undefined,
    debitAccountName: so.debitAccountName,
    debitAccountBalance: so.debitAccountBalance,
    sufficientDebitBalance: so.sufficientDebitBalance,
    debitBalanceShortage: so.debitBalanceShortage,
    creditAccountId:
      so.creditAccountId != null ? Number(so.creditAccountId) : undefined,
    creditAccountName: so.creditAccountName,
    items: (so.items ?? []).map((item, idx) => ({
      id: String(item.itemId ?? idx),
      orderId: String(so.id ?? ""),
      itemId: Number(item.itemId ?? 0),
      itemName: item.itemName,
      quantity: item.quantity ?? 0,
      unitPrice: item.unitPrice ?? 0,
      lineSubtotal: item.lineSubtotal,
      discountPercent: item.discountPercent,
      discount: item.discountPercent ?? 0,
      taxRate: item.taxRate,
      taxAmount: item.taxAmount,
      tax: item.taxAmount ?? 0,
      total: item.lineTotal ?? 0,
      warehouseId: item.warehouseId,
      warehouseName: item.warehouseName,
    })),
  };
}

const SalesOrdersDetailPage = () => {
  const { id } = useParams();
  const { confirmCancel } = useConfirmDialog();
  const [so, setSo] = useState<SalesOrderResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const updateStatus = async (action: "confirm" | "cancel") => {
    if (!so) return;
    if (
      action === "cancel" &&
      !(await confirmCancel(`order ${so.orderNumber || so.id}`))
    ) {
      return;
    }

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
    if (!id) return;
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get<SalesOrderResponseDTO>(
          `/sales/orders/${id}`,
        );
        if (!cancelled) setSo(data);
      } catch {
        if (!cancelled) setSo(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDownloadDocumentPdf = async () => {
    if (!so?.salesInvoiceId) return;
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

  if (editing && so) {
    return (
      <CreateSalesOrderForm
        mode="edit"
        initialOrder={dtoToSalesOrder(so)}
        onCancel={() => setEditing(false)}
        onSuccess={() => {
          setEditing(false);
          apiClient
            .get<SalesOrderResponseDTO>(`/sales/orders/${id}`)
            .then(({ data }) => setSo(data));
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        <p className="text-sm text-muted-foreground">Loading order…</p>
      </div>
    );
  }

  if (!so) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-muted-foreground">Order not found.</p>
        <Button variant="outline" asChild>
          <Link to="/inventory/sales/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to orders
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80">
      <div className="w-full space-y-5 p-4 sm:p-6">
        <PageHeader
          variant="darkBlue"
          title={`Order ${so.orderNumber || so.id}`}
          description={`Order date: ${so.orderDate || "N/A"}`}
          backHref="/inventory/sales/orders"
        />

        <SalesOrderDetailCards
          so={so}
          onEdit={() => setEditing(true)}
          onConfirm={() => void updateStatus("confirm")}
          onCancel={() => void updateStatus("cancel")}
          onDownloadDocument={() => void handleDownloadDocumentPdf()}
          onReturned={() => {
            apiClient
              .get<SalesOrderResponseDTO>(`/sales/orders/${id}`)
              .then(({ data }) => setSo(data));
          }}
        />
      </div>
    </div>
  );
};

export default SalesOrdersDetailPage;
