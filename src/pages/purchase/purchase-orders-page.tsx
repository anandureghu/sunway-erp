/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { PurchaseOrder } from "@/types/purchase";
import { isVendorEligibleForPurchase } from "@/lib/vendor-api";
import { createPurchaseOrderColumns } from "@/lib/columns/purchase-columns";
import { enrichPurchaseOrdersWithVendors } from "@/lib/enrich-purchase-orders";
import { listVendors } from "@/service/vendorService";
import {
  archivePurchaseOrder,
  listPurchaseOrders,
} from "@/service/purchaseFlowService";
import {
  bulkArchiveHistoryRecords,
  summarizeBulkActionResult,
} from "@/service/historyService";
import type { Row } from "@tanstack/react-table";
import { PurchaseOrdersListView } from "./components/purchase-orders-list-view";
import type { KpiSummaryStat } from "@/components/kpi-summary-strip";
import {
  CircleDollarSign,
  ClipboardList,
  Package,
  ShoppingCart,
} from "lucide-react";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import { PurchaseOrderForm } from "./components/purchase-order-form";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";

export default function PurchaseOrdersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const [searchQuery, setSearchQuery] = useState(
    (location.state as { searchQuery?: string })?.searchQuery || "",
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<PurchaseOrder | null>(null);
  const [actionState, setActionState] = useState<{
    id: string;
    type: "archive";
  } | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [bulkArchiving, setBulkArchiving] = useState(false);

  const refreshOrders = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [ordersData, vendorsData] = await Promise.all([
        listPurchaseOrders(),
        listVendors(),
      ]);
      setOrders(enrichPurchaseOrdersWithVendors(ordersData, vendorsData));
    } catch (e: any) {
      const errorData = e?.response?.data;
      let errorMessage = "Failed to load purchase orders";
      if (
        errorData?.message?.includes("No static resource") ||
        errorData?.error?.includes("No static resource")
      ) {
        errorMessage =
          "Purchase Orders API endpoint is not configured on the server.";
      } else {
        errorMessage =
          errorData?.message || errorData?.error || e?.message || errorMessage;
      }
      setLoadError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshOrders();
  }, [refreshOrders]);

  const purchaseOrderKpis = useMemo((): KpiSummaryStat[] => {
    const terminal = (status: string) => {
      const s = (status || "").toLowerCase();
      return s === "received" || s === "cancelled";
    };
    const draftCount = orders.filter(
      (o) => (o.status || "").toLowerCase() === "draft",
    ).length;
    const terminalCount = orders.filter((o) =>
      terminal(o.status),
    ).length;
    const openCommitment = orders
      .filter((o) => !terminal(o.status))
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    return [
      {
        label: "Total Purchase Orders",
        value: orders.length,
        hint: "All purchase orders loaded",
        accent: "sky",
        icon: ShoppingCart,
      },
      
      {
        label: "Draft Purchase Orders",
        value: draftCount,
        hint: "Awaiting release to supplier",
        accent: "amber",
        icon: ClipboardList,
      },
      {
        label: "Completed or cancelled POs",
        value: terminalCount,
        hint: "Fully received or cancelled",
        accent: "emerald",
        icon: Package,
      },
      {
        label: "Open commitment",
        value: <CurrencyAmount amount={openCommitment} />,
        hint: "Sum of open Purchase Order totals",
        accent: "violet",
        icon: CircleDollarSign,
      },
    ];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !searchQuery.trim() ||
        order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const handleConfirmOrder = useCallback(
    (id: string) => {
      const order = orders.find((o) => o.id === id);
      if (!order) {
        toast.error("Order not found");
        return;
      }
      if ((order.status || "").toLowerCase() !== "draft") {
        toast.error("Only draft purchase orders can be released.");
        return;
      }
      if (!order.supplierId) {
        toast.error(
          "Assign a supplier on the purchase order before releasing to the supplier.",
        );
        navigate(`/inventory/purchase/orders/${id}`);
        return;
      }
      const supplier = order.supplier;
      if (
        !supplier ||
        !isVendorEligibleForPurchase({
          approved: supplier.approved === true,
          rejected: supplier.rejected === true,
          active: supplier.status === "active",
        })
      ) {
        toast.error(
          "Only approved and active suppliers can be released on a purchase order.",
        );
        navigate(`/inventory/purchase/orders/${id}`);
        return;
      }
      navigate(`/inventory/purchase/orders/${id}`, {
        state: { openPostingDialog: "release" as const },
      });
    },
    [navigate, orders],
  );

  const handleCancelOrder = useCallback(
    (id: string) => {
      const order = orders.find((o) => o.id === id);
      if (!order) {
        toast.error("Order not found");
        return;
      }
      if (order.status !== "draft") {
        toast.error(
          `Cannot cancel order with status "${order.status}". Only draft orders can be cancelled.`,
        );
        return;
      }
      navigate(`/inventory/purchase/orders/${id}`, {
        state: { openPostingDialog: "cancel" as const },
      });
    },
    [navigate, orders],
  );

  const handleArchiveOrder = useCallback(
    async (id: string) => {
      const order = orders.find((o) => o.id === id);
      if (!order) return toast.error("Order not found");
      if (order.status !== "received" && order.status !== "cancelled") {
        return toast.error(
          "Only received or cancelled orders can be archived.",
        );
      }
      if (order.archived) return toast.error("Order is already archived.");
      const archiveMessage = order.requisitionId
        ? `Archive order ${order.orderNo}? The linked requisition${order.requisitionNo ? ` ${order.requisitionNo}` : ""} will also be archived.`
        : `Archive order ${order.orderNo}?`;
      if (!(await confirm(archiveMessage))) return;
      setActionState({ id, type: "archive" });
      try {
        const updated = await archivePurchaseOrder(id);
        setOrders((prev) =>
          prev.map((po) =>
            po.id === id
              ? {
                  ...po,
                  archived: updated.archived ?? true,
                }
              : po,
          ),
        );
        toast.success(
          order.requisitionId
            ? "Order and linked requisition archived successfully"
            : "Order archived successfully",
        );
        void refreshOrders();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Failed to archive order",
        );
      } finally {
        setActionState(null);
      }
    },
    [orders, refreshOrders, confirm],
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
        `Archive ${selectedOrderIds.length} selected order(s)? They will move to Operations and management Reports → History.`,
      ))
    ) {
      return;
    }
    setBulkArchiving(true);
    try {
      const result = await bulkArchiveHistoryRecords(
        "PURCHASE_ORDER",
        selectedOrderIds,
      );
      toast.success(summarizeBulkActionResult(result));
      setRowSelection({});
      await refreshOrders();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to archive selected orders.",
      );
    } finally {
      setBulkArchiving(false);
    }
  }, [confirm, refreshOrders, selectedOrderIds]);

  const handleEdit = useCallback(
    (id: string) => {
      const order = orders.find((o) => o.id === id);
      if (!order) {
        toast.error("Order not found");
        return;
      }
      if (order.status !== "draft") {
        toast.error("Only draft orders can be edited.");
        return;
      }
      if (order.vendorPaymentSettled) {
        toast.error(
          "This purchase order cannot be edited after vendor payment is confirmed.",
        );
        return;
      }
      setOrderToEdit(order);
    },
    [orders],
  );

  const handleRowClick = useCallback(
    (row: Row<PurchaseOrder>) => {
      navigate(`/inventory/purchase/orders/${row.original.id}`);
    },
    [navigate],
  );

  const columns = useMemo(
    () =>
      createPurchaseOrderColumns({
        onOpenOrder: (id) => navigate(`/inventory/purchase/orders/${id}`),
        onConfirm: handleConfirmOrder,
        onCancel: handleCancelOrder,
        onEdit: handleEdit,
        onArchive: handleArchiveOrder,
        processingOrderId: actionState?.id ?? null,
        processingAction: actionState?.type ?? null,
        onReceiveGoods: (orderId) =>
          navigate("/inventory/purchase/receiving", {
            state: { openReceiveForOrderId: orderId },
          }),
        onViewRequisition: (reqId) =>
          navigate(`/inventory/purchase/requisitions/${reqId}`),
      }),
    [
      navigate,
      handleConfirmOrder,
      handleCancelOrder,
      handleEdit,
      handleArchiveOrder,
      actionState,
    ],
  );

  if (orderToEdit) {
    return (
      <PurchaseOrderForm
        mode="edit"
        initialOrder={orderToEdit}
        onCancel={() => setOrderToEdit(null)}
        onSaved={() => {
          setOrderToEdit(null);
          void refreshOrders();
        }}
      />
    );
  }

  return (
    <>
      <PurchaseOrdersListView
        loading={loading}
        error={loadError}
        orders={filteredOrders}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        columns={columns}
        enableBulkArchive
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        selectedCount={selectedOrderIds.length}
        onBulkArchive={handleBulkArchiveOrders}
        bulkArchiving={bulkArchiving}
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
        onRowClick={handleRowClick}
        onRetry={() => void refreshOrders()}
        kpiItems={purchaseOrderKpis}
      />
    </>
  );
}
