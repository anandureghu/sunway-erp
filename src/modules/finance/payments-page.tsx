"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DataTable } from "@/components/datatable";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";

import type { PaymentResponseDTO, PaymentsPageVariant } from "@/types/payment";
import { PAYMENT_COLUMNS } from "@/lib/columns/finance/payment-colums";
import { PaymentDialog } from "./payment-dialog";
import { useNavigate } from "react-router-dom";
import { isPaymentArchivedTab } from "@/lib/payment-tab-utils";

type PaymentListTab = "outstanding" | "archived";

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
  const [listTab, setListTab] = useState<PaymentListTab>("outstanding");
  const [searchQuery, setSearchQuery] = useState("");

  const directionParam = variant === "vendor" ? "VENDOR" : "CUSTOMER";

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
        variant === "vendor" ? "Vendor payment confirmed" : "Payment confirmed",
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
      const res = await apiClient.get<{
        id: number;
        type?: "SALES" | "PURCHASE";
      }>(`/invoices/code/${invoiceCode}`);
      const invoiceId = res.data?.id;
      if (!invoiceId) throw new Error("Invoice not found");
      if (res.data?.type === "PURCHASE") {
        navigate(`/inventory/purchase/invoices/${invoiceId}`);
      } else {
        navigate(`/sales/invoices/${invoiceId}`);
      }
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

  const outstandingCount = useMemo(
    () => payments.filter((p) => !isPaymentArchivedTab(p, variant)).length,
    [payments, variant],
  );

  const archivedCount = useMemo(
    () => payments.filter((p) => isPaymentArchivedTab(p, variant)).length,
    [payments, variant],
  );

  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return payments.filter((p) => {
      const archived = isPaymentArchivedTab(p, variant);
      const matchesTab = listTab === "archived" ? archived : !archived;

      const matchesSearch =
        !q ||
        (p.paymentCode?.toLowerCase().includes(q) ?? false) ||
        (p.invoiceId?.toLowerCase().includes(q) ?? false) ||
        String(p.purchaseOrderId ?? "").includes(q) ||
        (p.paymentMethod?.toLowerCase().includes(q) ?? false) ||
        String(p.amount ?? "")
          .toLowerCase()
          .includes(q);

      return matchesTab && matchesSearch;
    });
  }, [payments, variant, listTab, searchQuery]);

  return (
    <div className="p-0 space-y-4">
      {/* <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div> */}

      <Card>
        <CardHeader className="pb-0">
          <Tabs
            value={listTab}
            onValueChange={(v) => setListTab(v as PaymentListTab)}
            className="w-full gap-4"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1 lg:w-auto">
                <TabsTrigger value="outstanding" className="gap-2">
                  Current Payments
                  <Badge variant="secondary" className="font-normal">
                    {outstandingCount}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="archived" className="gap-2">
                  Completed
                  <Badge variant="secondary" className="font-normal">
                    {archivedCount}
                  </Badge>
                </TabsTrigger>
              </TabsList>
              <div className="relative w-full max-w-md lg:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search code, invoice, PO, method…"
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </Tabs>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              Loading payments…
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {listTab === "outstanding"
                ? "No pending payments match your search."
                : "No archived payments match your search."}
            </div>
          ) : (
            <DataTable data={filteredPayments} columns={columns} />
          )}
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
