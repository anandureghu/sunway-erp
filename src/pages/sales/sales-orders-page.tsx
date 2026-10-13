/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import type { SalesOrder } from "@/types/sales";
import {
  createSalesOrderColumns,
  salesOrderDeliveryStatus,
} from "@/lib/columns/sales-columns";
import {
  archiveSalesOrder,
  cancelSalesOrder,
  confirmSalesOrder,
  listPicklists,
  listSalesOrdersPaged,
} from "@/service/salesFlowService";
import {
  bulkArchiveHistoryRecords,
  summarizeBulkActionResult,
} from "@/service/historyService";
import { CreateSalesOrderForm } from "./components/create-sales-order-form";
import { SalesOrdersListView } from "./components/sales-orders-list-view";
import type { KpiSummaryStat } from "@/components/kpi-summary-strip";
import {
  ClipboardList,
  Package,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { kpiFilterItem } from "@/lib/kpi-filter";
import { useServerPagedList } from "@/hooks/use-server-paged-list";

const DELIVERY_STATUSES = new Set(["picked", "dispatched", "delivered"]);

export default function SalesOrdersPage() {
  const { confirm, confirmCancel } = useConfirmDialog();
  const location = useLocation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [listTab, setListTab] = useState<"active" | "closed">("active");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [bulkArchiving, setBulkArchiving] = useState(false);
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(
    location.pathname.includes("/new"),
  );
  const [orderToEdit, setOrderToEdit] = useState<SalesOrder | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activePicklistByOrderId, setActivePicklistByOrderId] = useState<
    Record<string, { id: string; status: string; shipmentStatus?: string }>
  >({});
  const [kpiCounts, setKpiCounts] = useState({
    total: 0,
    confirmed: 0,
    quotation: 0,
    partiallyPaid: 0,
    active: 0,
    closed: 0,
  });

  const [actionState, setActionState] = useState<{
    id: string;
    type: "confirm" | "cancel" | "archive";
  } | null>(null);

  useEffect(() => {
    setShowCreateForm(location.pathname.includes("/new"));
  }, [location.pathname]);

  const orderStatusForApi = useMemo(() => {
    if (kpiFilter === "confirmed") return undefined;
    if (DELIVERY_STATUSES.has(statusFilter)) return undefined;
    return statusFilter;
  }, [statusFilter, kpiFilter]);

  const listFilters = useMemo(
    () => ({
      tab: listTab,
      status: orderStatusForApi ?? "all",
      paymentStatus: paymentStatusFilter,
      dateFrom,
      dateTo,
      confirmedOnly: kpiFilter === "confirmed",
    }),
    [
      listTab,
      orderStatusForApi,
      paymentStatusFilter,
      dateFrom,
      dateTo,
      kpiFilter,
    ],
  );

  const fetchOrders = useCallback(
    async (params: {
      page: number;
      size: number;
      search: string;
      tab: string;
      status: string;
      paymentStatus: string;
      dateFrom: string;
      dateTo: string;
      confirmedOnly: boolean;
    }) => {
      const status = params.confirmedOnly
        ? "NOT_QUOTATION"
        : params.status !== "all"
          ? params.status
          : undefined;
      return listSalesOrdersPaged({
        page: params.page,
        size: params.size,
        search: params.search,
        tab: params.tab,
        status,
        paymentStatus: params.paymentStatus,
        dateFrom: params.dateFrom || undefined,
        dateTo: params.dateTo || undefined,
      });
    },
    [],
  );

  const {
    rows: orders,
    loading,
    searchInput: searchQuery,
    setSearchInput: setSearchQuery,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalElements,
    pageCount,
    reload,
  } = useServerPagedList<
    SalesOrder,
    {
      tab: string;
      status: string;
      paymentStatus: string;
      dateFrom: string;
      dateTo: string;
      confirmedOnly: boolean;
    }
  >({
    fetcher: fetchOrders,
    filters: listFilters,
    enabled: !showCreateForm,
    errorMessage: "Failed to load sales orders",
  });

  useEffect(() => {
    if (showCreateForm) return;
    void listPicklists()
      .then((picklists) => {
        const byOrder: Record<
          string,
          { id: string; status: string; shipmentStatus?: string }
        > = {};
        for (const pl of picklists) {
          if (!pl.orderId || pl.status === "cancelled") continue;
          byOrder[String(pl.orderId)] = {
            id: pl.id,
            status: pl.status,
            shipmentStatus: pl.shipmentStatus,
          };
        }
        setActivePicklistByOrderId(byOrder);
      })
      .catch(() => setActivePicklistByOrderId({}));
  }, [showCreateForm, reload]);

  useEffect(() => {
    if (showCreateForm) return;
    let cancelled = false;
    (async () => {
      try {
        const [active, closed, quotation, partial] = await Promise.all([
          listSalesOrdersPaged({ page: 0, size: 1, tab: "active" }),
          listSalesOrdersPaged({ page: 0, size: 1, tab: "closed" }),
          listSalesOrdersPaged({
            page: 0,
            size: 1,
            tab: "active",
            status: "quotation",
          }),
          listSalesOrdersPaged({
            page: 0,
            size: 1,
            tab: "active",
            paymentStatus: "PARTIALLY_PAID",
          }),
        ]);
        if (cancelled) return;
        const quotationCount = quotation.totalElements;
        const activeTotal = active.totalElements;
        setKpiCounts({
          total: activeTotal,
          confirmed: Math.max(0, activeTotal - quotationCount),
          quotation: quotationCount,
          partiallyPaid: partial.totalElements,
          active: activeTotal,
          closed: closed.totalElements,
        });
        setLoadError(null);
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(e?.message || "Failed to load sales order counts");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showCreateForm, reload]);

  useEffect(() => {
    setStatusFilter("all");
    setPaymentStatusFilter("all");
    setRowSelection({});
    setKpiFilter(null);
  }, [listTab]);

  const applyKpiFilter = useCallback((key: string) => {
    setKpiFilter(key);
    setRowSelection({});
    setPaymentStatusFilter("all");
    switch (key) {
      case "quotation":
        setListTab("active");
        setStatusFilter("quotation");
        break;
      case "partially_paid":
        setListTab("active");
        setStatusFilter("all");
        setPaymentStatusFilter("PARTIALLY_PAID");
        break;
      case "confirmed":
        setListTab("active");
        setStatusFilter("all");
        break;
      default:
        setListTab("active");
        setStatusFilter("all");
        break;
    }
  }, []);

  const displayedOrders = useMemo(() => {
    if (!DELIVERY_STATUSES.has(statusFilter)) return orders;
    return orders.filter(
      (order) =>
        salesOrderDeliveryStatus(
          order,
          activePicklistByOrderId[String(order.id)],
        ) === statusFilter,
    );
  }, [orders, statusFilter, activePicklistByOrderId]);

  const salesOrderKpis = useMemo((): KpiSummaryStat[] => {
    return [
      kpiFilterItem(
        {
          label: "Total orders",
          value: kpiCounts.total,
          hint: "Non-archived sales orders",
          accent: "sky",
          icon: Package,
        },
        "all",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Confirmed orders",
          value: kpiCounts.confirmed,
          hint: "Confirmed and in fulfillment",
          accent: "emerald",
          icon: ShoppingBag,
        },
        "confirmed",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Quotation",
          value: kpiCounts.quotation,
          hint: "Awaiting confirmation",
          accent: "amber",
          icon: ClipboardList,
        },
        "quotation",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Partially paid",
          value: kpiCounts.partiallyPaid,
          hint: "Orders with partial payment",
          accent: "orange",
          icon: Wallet,
        },
        "partially_paid",
        kpiFilter,
        applyKpiFilter,
      ),
    ];
  }, [kpiCounts, kpiFilter, applyKpiFilter]);

  const handleConfirmOrder = useCallback(
    async (id: string) => {
      setActionState({ id, type: "confirm" });
      try {
        await confirmSalesOrder(id);
        toast.success("Order confirmed successfully");
        reload();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Failed to confirm order.",
        );
      } finally {
        setActionState(null);
      }
    },
    [reload],
  );

  const handleCancelOrder = useCallback(
    async (id: string) => {
      const order = orders.find((o) => o.id === id);
      if (!order) return toast.error("Order not found");
      if (order.status !== "quotation" && order.status !== "confirmed") {
        return toast.error(
          `Cannot cancel order with status "${order.status}". Only quotation or confirmed orders can be cancelled.`,
        );
      }
      const payment = (order.paymentStatus || "").trim().toUpperCase();
      if (payment === "PAID") {
        return toast.error(
          "Cannot cancel a paid order. Reverse or adjust payment in Accounts Receivable first.",
        );
      }
      if (!(await confirmCancel(`order ${order.orderNo}`))) {
        return;
      }

      setActionState({ id, type: "cancel" });
      try {
        await cancelSalesOrder(id);
        toast.success("Order cancelled successfully");
        reload();
      } catch (error: any) {
        const backendMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message;
        toast.error(backendMessage || "Failed to cancel order");
      } finally {
        setActionState(null);
      }
    },
    [orders, reload, confirmCancel],
  );

  const handleGeneratePicklist = useCallback(
    (id: string) =>
      navigate("/inventory/sales/picklist", { state: { salesOrderId: id } }),
    [navigate],
  );

  const handleViewPicklist = useCallback(
    (picklistId: string) => navigate(`/inventory/sales/picklist/${picklistId}`),
    [navigate],
  );

  const handleOpenOrder = useCallback(
    (id: string) => navigate(`/inventory/sales/orders/${id}`),
    [navigate],
  );

  const handleOpenInvoice = useCallback(
    (invoiceId: number | string) =>
      navigate(`/sales/invoices/${invoiceId}`),
    [navigate],
  );

  const handleArchiveOrder = useCallback(
    async (id: string) => {
      const order = orders.find((o) => o.id === id);
      if (!order) return toast.error("Order not found");
      if (order.status !== "completed" && order.status !== "cancelled") {
        return toast.error("Only completed or cancelled orders can be archived.");
      }
      if (order.archived) {
        return toast.error("Order is already archived.");
      }
      if (!(await confirm(`Archive order ${order.orderNo}?`))) return;
      setActionState({ id, type: "archive" });
      try {
        await archiveSalesOrder(id);
        toast.success("Order archived successfully");
        reload();
      } catch (error: any) {
        const backendMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message;
        toast.error(backendMessage || "Failed to archive order");
      } finally {
        setActionState(null);
      }
    },
    [orders, reload, confirm],
  );

  const selectedOrderIds = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => Number(id))
        .filter((id) => !Number.isNaN(id)),
    [rowSelection],
  );

  const handleBulkArchiveOrders = useCallback(async () => {
    if (selectedOrderIds.length === 0) return;
    if (
      !(await confirm(
        `Archive ${selectedOrderIds.length} selected order(s)? They will move to Operations Reports → History.`,
      ))
    ) {
      return;
    }
    setBulkArchiving(true);
    try {
      const result = await bulkArchiveHistoryRecords(
        "SALES_ORDER",
        selectedOrderIds,
      );
      toast.success(summarizeBulkActionResult(result));
      setRowSelection({});
      reload();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to archive selected orders.",
      );
    } finally {
      setBulkArchiving(false);
    }
  }, [confirm, reload, selectedOrderIds]);

  const handleEdit = useCallback(
    (id: string) => {
      const order = orders.find((o) => o.id === id);
      if (!order) {
        toast.error("Order not found");
        return;
      }
      if (order.status !== "quotation") {
        toast.error("Only quotations can be edited.");
        return;
      }
      setOrderToEdit(order);
      setShowCreateForm(true);
    },
    [orders],
  );

  const columns = useMemo(
    () =>
      createSalesOrderColumns({
        onOpenOrder: handleOpenOrder,
        onConfirm: handleConfirmOrder,
        onCancel: handleCancelOrder,
        onGeneratePicklist: handleGeneratePicklist,
        onViewPicklist: handleViewPicklist,
        onOpenInvoice: handleOpenInvoice,
        onEdit: handleEdit,
        onArchive: handleArchiveOrder,
        activePicklistByOrderId,
        processingOrderId: actionState?.id ?? null,
        processingAction: actionState?.type ?? null,
      }),
    [
      handleOpenOrder,
      handleConfirmOrder,
      handleCancelOrder,
      handleGeneratePicklist,
      handleViewPicklist,
      handleOpenInvoice,
      handleEdit,
      handleArchiveOrder,
      activePicklistByOrderId,
      actionState,
    ],
  );

  if (showCreateForm) {
    return (
      <CreateSalesOrderForm
        mode={orderToEdit ? "edit" : "create"}
        initialOrder={orderToEdit}
        onSuccess={() => {
          setOrderToEdit(null);
          setShowCreateForm(false);
          reload();
          navigate("/inventory/sales/orders", { replace: true });
        }}
        onCancel={() => {
          setOrderToEdit(null);
          setShowCreateForm(false);
        }}
      />
    );
  }

  return (
    <>
      <SalesOrdersListView
        loading={loading}
        error={loadError}
        orders={displayedOrders}
        listTab={listTab}
        onListTabChange={(tab) => {
          setListTab(tab);
          setKpiFilter(null);
        }}
        activeCount={kpiCounts.active}
        closedCount={kpiCounts.closed}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        paymentStatusFilter={paymentStatusFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        columns={columns}
        enableBulkArchive={listTab === "closed"}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        selectedCount={selectedOrderIds.length}
        onBulkArchive={handleBulkArchiveOrders}
        bulkArchiving={bulkArchiving}
        onCreateNew={() => {
          setOrderToEdit(null);
          setShowCreateForm(true);
        }}
        onSearchChange={setSearchQuery}
        onStatusChange={(value) => {
          setStatusFilter(value);
          setKpiFilter(null);
        }}
        onPaymentStatusChange={(value) => {
          setPaymentStatusFilter(value);
          setKpiFilter(null);
        }}
        onDateRangeChange={({ from, to }) => {
          setDateFrom(from);
          setDateTo(to);
        }}
        onRowClick={(id) => navigate(`/inventory/sales/orders/${id}`)}
        kpiItems={salesOrderKpis}
        serverPagination={{
          total: totalElements,
          pageIndex: page,
          pageSize,
          pageCount: Math.max(pageCount, 1),
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
      />
    </>
  );
}
