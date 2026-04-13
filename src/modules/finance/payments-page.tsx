"use client";

import { useEffect, useState, useCallback } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

import type {
  PaymentResponseDTO,
  PaymentsPageVariant,
} from "@/types/payment";
import { PAYMENT_COLUMNS } from "@/lib/columns/finance/payment-colums";
import { PaymentDialog } from "./payment-dialog";
import { useNavigate } from "react-router-dom";

export default function PaymentsPage({
  companyId,
  variant = "customer",
}: {
  companyId: number;
  variant?: PaymentsPageVariant;
}) {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PaymentResponseDTO | null>(null);
  const [open, setOpen] = useState(false);

  const directionParam = variant === "vendor" ? "VENDOR" : "CUSTOMER";
  const title =
    variant === "vendor" ? "Vendor payments" : "Customer payments";
  const subtitle =
    variant === "vendor"
      ? "Accounts payable — payables created from purchase orders and vendor settlements."
      : "Accounts receivable — customer receipts against sales invoices.";

  const fetchPayments = useCallback(async () => {
    if (!companyId) {
      setPayments([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiClient.get<PaymentResponseDTO[]>(
        `/finance/payments/company/${companyId}`,
        { params: { direction: directionParam } },
      );
      setPayments(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [companyId, directionParam]);

  useEffect(() => {
    void fetchPayments();
  }, [fetchPayments]);

  const handleDialogSuccess = (
    updated: PaymentResponseDTO,
    mode: "add" | "edit",
  ) => {
    if (mode === "add") setPayments((prev) => [...prev, updated]);
    else
      setPayments((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );

    setSelected(null);
  };

  const handleConfirmPayment = async (payment: PaymentResponseDTO) => {
    try {
      const res = await apiClient.post<PaymentResponseDTO>(
        `/finance/payments/${payment.id}/confirm`,
      );
      setPayments((prev) =>
        prev.map((p) => (p.id === payment.id ? res.data : p)),
      );
      toast.success(
        variant === "vendor"
          ? "Vendor payment confirmed"
          : "Payment confirmed",
      );
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(
        ax?.response?.data?.message ||
          (err instanceof Error ? err.message : "Failed to confirm payment"),
      );
    }
  };

  const handleOpenInvoice = async (invoiceCode: string) => {
    try {
      const res = await apiClient.get(`/invoices/code/${invoiceCode}`);
      const invoiceId = res.data?.id;
      if (!invoiceId) throw new Error("Invoice not found");
      navigate(`/sales/invoices/${invoiceId}`);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(
        ax?.response?.data?.message ||
          (err instanceof Error ? err.message : "Unable to open invoice"),
      );
    }
  };

  const handleOpenPurchaseOrder = (purchaseOrderId: number) => {
    navigate(`/inventory/purchase/orders/${purchaseOrderId}`);
  };

  const columns = PAYMENT_COLUMNS({
    variant,
    onConfirm: handleConfirmPayment,
    onOpenInvoice: handleOpenInvoice,
    onOpenPurchaseOrder: handleOpenPurchaseOrder,
  });

  if (loading)
    return (
      <div className="flex h-64 justify-center items-center">
        Loading payments...
      </div>
    );

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search payments..." className="pl-10" />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable data={payments} columns={columns} />
        </CardContent>
      </Card>

      <PaymentDialog
        open={open}
        onOpenChange={setOpen}
        data={selected}
        companyId={companyId}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
