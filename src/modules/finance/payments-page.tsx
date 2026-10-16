"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { SelectableDataTable } from "@/components/selectable-data-table";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";

import type { PaymentResponseDTO, PaymentsPageVariant } from "@/types/payment";
import { PAYMENT_COLUMNS } from "@/lib/columns/finance/payment-colums";
import { PaymentDialog } from "./payment-dialog";
import { OtherPaymentDialog } from "./other-payment-dialog";
import { ConfirmPaymentDialog } from "./confirm-payment-dialog";
import { useNavigate } from "react-router-dom";
import { isPaymentArchivedTab } from "@/lib/payment-tab-utils";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import {
  bulkArchiveHistoryRecords,
  summarizeBulkActionResult,
} from "@/service/historyService";
import { useServerPagedList } from "@/hooks/use-server-paged-list";
import type { PageResult } from "@/types/page";

type PaymentListTab = "outstanding" | "archived";

export default function PaymentsPage({
  companyId,
  variant = "customer",
}: {
  companyId: number;
  variant?: PaymentsPageVariant;
}) {
  const { confirm } = useConfirmDialog();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<PaymentResponseDTO | null>(null);
  const [open, setOpen] = useState(false);
  const [listTab, setListTab] = useState<PaymentListTab>("outstanding");
  const [archivingPaymentId, setArchivingPaymentId] = useState<number | null>(
    null,
  );
  const [confirmPayment, setConfirmPayment] =
    useState<PaymentResponseDTO | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [bulkArchiving, setBulkArchiving] = useState(false);
  const [otherPaymentOpen, setOtherPaymentOpen] = useState(false);
  const [outstandingCount, setOutstandingCount] = useState(0);
  const [completedTabCount, setCompletedTabCount] = useState(0);

  const directionParam =
    variant === "vendor" ? "VENDOR" : variant === "other" ? "OTHER" : "CUSTOMER";

  const apiListTab = listTab === "archived" ? "completed" : "outstanding";

  const fetcher = useCallback(
    async ({
      page,
      size,
      search,
      direction,
      listTab: tab,
    }: {
      page: number;
      size: number;
      search: string;
      direction: string;
      listTab: string;
    }): Promise<PageResult<PaymentResponseDTO>> => {
      const res = await apiClient.get<PageResult<PaymentResponseDTO>>(
        `/finance/payments/company/${companyId}`,
        {
          params: {
            direction,
            listTab: tab,
            search: search || undefined,
            page,
            size,
          },
        },
      );
      return res.data;
    },
    [companyId],
  );

  const {
    rows: payments,
    loading,
    searchInput,
    setSearchInput,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalElements,
    pageCount,
    reload,
  } = useServerPagedList<
    PaymentResponseDTO,
    { direction: string; listTab: string }
  >({
    fetcher,
    filters: { direction: directionParam, listTab: apiListTab },
    enabled: !!companyId,
    errorMessage: "Failed to load payments",
  });

  const loadTabCounts = useCallback(async () => {
    if (!companyId) {
      setOutstandingCount(0);
      setCompletedTabCount(0);
      return;
    }
    try {
      const res = await apiClient.get<{ outstanding: number; completed: number }>(
        `/finance/payments/company/${companyId}/tab-counts`,
        { params: { direction: directionParam } },
      );
      setOutstandingCount(res.data.outstanding ?? 0);
      setCompletedTabCount(res.data.completed ?? 0);
    } catch {
      /* badges are best-effort */
    }
  }, [companyId, directionParam]);

  useEffect(() => {
    void loadTabCounts();
  }, [loadTabCounts, payments]);

  const handleDialogSuccess = (
    _updated: PaymentResponseDTO,
    _mode: "add" | "edit",
  ) => {
    setSelected(null);
    reload();
    void loadTabCounts();
  };

  const submitConfirmPayment = useCallback(
    async (
      payment: PaymentResponseDTO,
      payload: { amount: number; paymentMethod?: string; applyCreditAmount?: number },
    ) => {
      try {
        const body: {
          amount: number;
          paymentMethod?: string;
          applyCreditAmount?: number;
        } = {
          amount: payload.amount,
        };
        if (payload.paymentMethod) {
          body.paymentMethod = payload.paymentMethod;
        }
        if (payload.applyCreditAmount) {
          body.applyCreditAmount = payload.applyCreditAmount;
        }
        await apiClient.post<PaymentResponseDTO>(
          `/finance/payments/${payment.id}/confirm`,
          body,
        );
        reload();
        void loadTabCounts();
        toast.success(
          variant === "vendor"
            ? "Vendor payment confirmed"
            : variant === "other"
              ? "Expense payment confirmed"
              : "Payment confirmed",
        );
        setConfirmOpen(false);
        setConfirmPayment(null);
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { message?: string } } };
        toast.error(
          ax?.response?.data?.message ||
            (err instanceof Error ? err.message : "Failed to confirm payment"),
        );
        throw err;
      }
    },
    [variant, reload, loadTabCounts],
  );

  const handleConfirmPayment = useCallback(
    (payment: PaymentResponseDTO) => {
      setConfirmPayment(payment);
      setConfirmOpen(true);
    },
    [],
  );

  const handleConfirmWithAmount = useCallback(
    async (payload: {
      amount: number;
      paymentMethod?: string;
      applyCreditAmount?: number;
    }) => {
      if (!confirmPayment) return;
      setConfirming(true);
      try {
        await submitConfirmPayment(confirmPayment, payload);
      } finally {
        setConfirming(false);
      }
    },
    [confirmPayment, submitConfirmPayment],
  );

  const handleOpenInvoice = useCallback(
    async (invoiceCode: string) => {
      const backTo =
        variant === "vendor" ? "/finance/payable" : "/finance/receivable";
      try {
        const res = await apiClient.get<{
          id: number;
          type?: "SALES" | "PURCHASE";
        }>(`/invoices/code/${invoiceCode}`);
        const invoiceId = res.data?.id;
        if (!invoiceId) throw new Error("Invoice not found");
        if (res.data?.type === "PURCHASE") {
          navigate(`/inventory/purchase/invoices/${invoiceId}`, {
            state: { backTo },
          });
        } else {
          navigate(`/sales/invoices/${invoiceId}`, {
            state: { backTo },
          });
        }
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { message?: string } } };
        toast.error(
          ax?.response?.data?.message ||
            (err instanceof Error ? err.message : "Unable to open invoice"),
        );
      }
    },
    [navigate, variant],
  );

  const handleOpenPurchaseOrder = useCallback(
    (purchaseOrderId: number) => {
      navigate(`/inventory/purchase/orders/${purchaseOrderId}`);
    },
    [navigate],
  );

  const handleViewReceipt = useCallback(
    async (payment: PaymentResponseDTO) => {
      try {
        const res = await apiClient.get<string>(
          `/finance/payments/${payment.id}/pdf`,
        );
        if (res.data && !res.data.includes("dummy.url")) {
          reload();
          window.open(res.data, "_blank", "noopener,noreferrer");
        } else {
          toast.error("Receipt PDF is not available yet.");
        }
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { message?: string } } };
        toast.error(
          ax?.response?.data?.message ||
            (err instanceof Error ? err.message : "Could not open receipt PDF."),
        );
      }
    },
    [reload],
  );

  const handleArchivePayment = useCallback(
    async (payment: PaymentResponseDTO) => {
      if (!isPaymentArchivedTab(payment, variant)) return;
      if (payment.archived) {
        toast.error("Payment is already archived.");
        return;
      }
      const label = payment.paymentCode ?? `#${payment.id}`;
      if (!(await confirm(`Archive payment ${label}?`))) return;
      setArchivingPaymentId(payment.id);
      try {
        await apiClient.post<PaymentResponseDTO>(
          `/finance/payments/${payment.id}/archive`,
        );
        toast.success("Payment archived");
        reload();
        void loadTabCounts();
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { message?: string } } };
        toast.error(
          ax?.response?.data?.message ||
            (err instanceof Error ? err.message : "Failed to archive payment"),
        );
      } finally {
        setArchivingPaymentId(null);
      }
    },
    [variant, confirm, reload, loadTabCounts],
  );

  const selectedPaymentIds = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => Number(id))
        .filter((id) => !Number.isNaN(id)),
    [rowSelection],
  );

  const handleBulkArchivePayments = useCallback(async () => {
    if (selectedPaymentIds.length === 0) return;
    if (
      !(await confirm(
        `Archive ${selectedPaymentIds.length} selected payment(s)? They will move to Operations and management Reports → History.`,
      ))
    ) {
      return;
    }
    setBulkArchiving(true);
    try {
      const historyType =
        variant === "vendor"
          ? "VENDOR_PAYMENT"
          : variant === "other"
            ? "OTHER_PAYMENT"
            : "CUSTOMER_PAYMENT";
      const result = await bulkArchiveHistoryRecords(
        historyType,
        selectedPaymentIds,
      );
      toast.success(summarizeBulkActionResult(result));
      setRowSelection({});
      reload();
      void loadTabCounts();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(
        ax?.response?.data?.message ||
          (err instanceof Error
            ? err.message
            : "Failed to archive selected payments."),
      );
    } finally {
      setBulkArchiving(false);
    }
  }, [confirm, reload, loadTabCounts, selectedPaymentIds, variant]);

  const columns = useMemo(
    () =>
      PAYMENT_COLUMNS({
        variant,
        listTab,
        onConfirm: handleConfirmPayment,
        onOpenInvoice: handleOpenInvoice,
        onOpenPurchaseOrder: handleOpenPurchaseOrder,
        onViewReceipt:
          variant === "vendor" || variant === "customer"
            ? handleViewReceipt
            : undefined,
        onArchive: handleArchivePayment,
        archivingPaymentId,
      }),
    [
      variant,
      listTab,
      handleConfirmPayment,
      handleOpenInvoice,
      handleOpenPurchaseOrder,
      handleViewReceipt,
      handleArchivePayment,
      archivingPaymentId,
    ],
  );

  return (
    <div className="p-0 space-y-4">
      <Tabs
        value={listTab}
        onValueChange={(v) => {
          setListTab(v as PaymentListTab);
          setRowSelection({});
        }}
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
                {completedTabCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:max-w-2xl">
            <div className="relative w-full max-w-md min-w-[12rem] sm:flex-1 lg:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={
                  variant === "other"
                    ? "Search code, category, paid to, method…"
                    : variant === "vendor"
                      ? "Search code, invoice, PO, supplier, method…"
                      : "Search code, invoice, SO, customer, method…"
                }
                className="pl-9"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            {variant === "other" && (
              <Button
                onClick={() => setOtherPaymentOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add expense payment
              </Button>
            )}
          </div>
        </div>
      </Tabs>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          Loading payments…
        </div>
      ) : payments.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {listTab === "outstanding"
            ? "No pending payments match your search."
            : "No completed payments match your search."}
        </div>
      ) : (
        <div className="space-y-4">
          {listTab === "archived" && variant !== "other" ? (
            <BulkActionBar
              selectedCount={selectedPaymentIds.length}
              onArchive={handleBulkArchivePayments}
              onClear={() => setRowSelection({})}
              archiving={bulkArchiving}
            />
          ) : null}
          <SelectableDataTable
            data={payments}
            columns={columns}
            enableRowSelection={listTab === "archived" && variant !== "other"}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            getRowId={(row) => String(row.id)}
            isRowSelectable={(row) =>
              isPaymentArchivedTab(row, variant) && !row.archived
            }
            serverPagination={{
              total: totalElements,
              pageIndex: page,
              pageSize,
              pageCount,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
          />
        </div>
      )}

      {variant === "other" ? (
        <OtherPaymentDialog
          open={otherPaymentOpen}
          onOpenChange={setOtherPaymentOpen}
          companyId={companyId}
          onSuccess={() => {
            reload();
            void loadTabCounts();
          }}
        />
      ) : (
        <PaymentDialog
          open={open}
          onOpenChange={setOpen}
          data={selected}
          companyId={companyId}
          onSuccess={handleDialogSuccess}
        />
      )}

      <ConfirmPaymentDialog
        open={confirmOpen}
        onOpenChange={(o) => {
          setConfirmOpen(o);
          if (!o) setConfirmPayment(null);
        }}
        payment={confirmPayment}
        variant={variant}
        confirming={confirming}
        onConfirm={handleConfirmWithAmount}
      />
    </div>
  );
}
