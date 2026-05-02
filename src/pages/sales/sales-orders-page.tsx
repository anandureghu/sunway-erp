/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { SalesOrder } from "@/types/sales";
import { createSalesOrderColumns } from "@/lib/columns/sales-columns";
import {
  cancelSalesOrder,
  confirmSalesOrder,
  listSalesOrders,
} from "@/service/salesFlowService";
import { CreateSalesOrderForm } from "./components/create-sales-order-form";
import { SalesOrderDetailsDialog } from "./components/sales-order-details-dialog";
import { SalesOrdersListView } from "./components/sales-orders-list-view";
import type { KpiSummaryStat } from "@/components/kpi-summary-strip";
import {
  ClipboardList,
  CircleDollarSign,
  Package,
  ShoppingBag,
} from "lucide-react";
import { CurrencyAmount } from "@/components/currency/currency-amount";

export default function SalesOrdersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(
    (location.state as { searchQuery?: string })?.searchQuery || "",
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [listTab, setListTab] = useState<"active" | "closed">("active");
  const [showCreateForm, setShowCreateForm] = useState(
    location.pathname.includes("/new"),
  );
  const [orderToEdit, setOrderToEdit] = useState<SalesOrder | null>(null);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] =
    useState<SalesOrder | null>(null);
  const [showOrderDetailsDialog, setShowOrderDetailsDialog] = useState(false);
  const [actionState, setActionState] = useState<{
    id: string;
    type: "confirm" | "cancel";
  } | null>(null);

  useEffect(() => {
    setShowCreateForm(location.pathname.includes("/new"));
  }, [location.pathname]);

  const refreshOrders = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listSalesOrders();
      setOrders(data);
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load sales orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showCreateForm) return;
    void refreshOrders();
  }, [showCreateForm, location.pathname, refreshOrders]);

  useEffect(() => {
    setStatusFilter("all");
  }, [listTab]);

  const isClosedOrder = useCallback(
    (o: SalesOrder) =>
      o.status === "cancelled" || o.status === "completed",
    [],
  );

  const activeCount = useMemo(
    () => orders.filter((o) => !isClosedOrder(o)).length,
    [orders, isClosedOrder],
  );

  const closedCount = useMemo(
    () => orders.filter((o) => isClosedOrder(o)).length,
    [orders, isClosedOrder],
  );

  const salesOrderKpis = useMemo((): KpiSummaryStat[] => {
    const draftCount = orders.filter((o) => o.status === "draft").length;
    const openPipelineValue = orders
      .filter((o) => !isClosedOrder(o))
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    return [
      {
        label: "Total orders",
        value: orders.length,
        hint: "All sales orders in scope",
        accent: "sky",
        icon: Package,
      },
      {
        label: "Open pipeline",
        value: activeCount,
        hint: "Excluding completed & cancelled",
        accent: "emerald",
        icon: ShoppingBag,
      },
      {
        label: "Draft",
        value: draftCount,
        hint: "Awaiting confirmation",
        accent: "amber",
        icon: ClipboardList,
      },
      {
        label: "Open order value",
        value: <CurrencyAmount amount={openPipelineValue} />,
        hint: "Sum of open order totals",
        accent: "violet",
        icon: CircleDollarSign,
      },
    ];
  }, [orders, activeCount, isClosedOrder]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      const inTab =
        listTab === "closed" ? isClosedOrder(order) : !isClosedOrder(order);
      if (!inTab) return false;
      const matchesSearch =
        !q ||
        order.orderNo.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter, listTab, isClosedOrder]);

  const handleConfirmOrder = useCallback(
    async (id: string) => {
      setActionState({ id, type: "confirm" });
      try {
        const updated = await confirmSalesOrder(id);
        // Optimistic UI update so status changes immediately in table.
        setOrders((prev) =>
          prev.map((order) =>
            order.id === id
              ? {
                  ...order,
                  status: updated.status,
                  paymentStatus: updated.paymentStatus ?? "UNPAID",
                }
              : order,
          ),
        );
        toast.success("Order confirmed successfully");
        void refreshOrders();
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
    [refreshOrders],
  );

  const handleCancelOrder = useCallback(
    async (id: string) => {
      const order = orders.find((o) => o.id === id);
      if (!order) return toast.error("Order not found");
      if (
        order.status !== "draft" &&
        order.status !== "confirmed"
      ) {
        return toast.error(
          `Cannot cancel order with status "${order.status}". Only draft or confirmed orders can be cancelled.`,
        );
      }
      if (!confirm(`Cancel order ${order.orderNo}? This cannot be undone.`)) {
        return;
      }

      setActionState({ id, type: "cancel" });
      try {
        const updated = await cancelSalesOrder(id);
        setOrders((prev) =>
          prev.map((so) =>
            so.id === id
              ? {
                  ...so,
                  status: updated.status,
                }
              : so,
          ),
        );
        toast.success("Order cancelled successfully");
        void refreshOrders();
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
    [orders, refreshOrders],
  );

  const handleGeneratePicklist = useCallback(
    (id: string) => navigate("/inventory/sales/picklist", { state: { salesOrderId: id } }),
    [navigate],
  );

  const handleViewDetails = useCallback(
    (id: string) => {
      const order = orders.find((o) => o.id === id);
      if (!order) return;
      setSelectedOrderForDetails(order);
      setShowOrderDetailsDialog(true);
    },
    [orders],
  );

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
      setOrderToEdit(order);
      setShowCreateForm(true);
    },
    [orders],
  );

  const columns = useMemo(
    () =>
      createSalesOrderColumns(
        handleConfirmOrder,
        handleCancelOrder,
        handleGeneratePicklist,
        handleViewDetails,
        handleEdit,
        actionState?.id ?? null,
        actionState?.type ?? null,
      ),
    [
      handleConfirmOrder,
      handleCancelOrder,
      handleGeneratePicklist,
      handleViewDetails,
      handleEdit,
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
          void refreshOrders();
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
        orders={filteredOrders}
        listTab={listTab}
        onListTabChange={setListTab}
        activeCount={activeCount}
        closedCount={closedCount}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        columns={columns}
        onCreateNew={() => {
          setOrderToEdit(null);
          setShowCreateForm(true);
        }}
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
        onRowClick={(id) => navigate(`/inventory/sales/orders/${id}`)}
        kpiItems={salesOrderKpis}
      />
      <SalesOrderDetailsDialog
        open={showOrderDetailsDialog}
        order={selectedOrderForDetails}
        onOpenChange={setShowOrderDetailsDialog}
      />
    </>
  );
}
