/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { PurchaseOrder } from "@/types/purchase";
import { createPurchaseOrderColumns } from "@/lib/columns/purchase-columns";
import { enrichPurchaseOrdersWithVendors } from "@/lib/enrich-purchase-orders";
import { listVendors } from "@/service/vendorService";
import {
  cancelPurchaseOrder,
  confirmPurchaseOrder,
  listPurchaseOrders,
} from "@/service/purchaseFlowService";
import type { Row } from "@tanstack/react-table";
import { PurchaseOrdersListView } from "./components/purchase-orders-list-view";
import { PurchaseOrderDetailsDialog } from "./components/purchase-order-details-dialog";
import { PurchaseOrderForm } from "./components/purchase-order-form";

export default function PurchaseOrdersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(
    (location.state as { searchQuery?: string })?.searchQuery || "",
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] =
    useState<PurchaseOrder | null>(null);
  const [showOrderDetailsDialog, setShowOrderDetailsDialog] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<PurchaseOrder | null>(null);

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
          errorData?.message ||
          errorData?.error ||
          e?.message ||
          errorMessage;
      }
      setLoadError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshOrders();
  }, [refreshOrders]);

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
    async (id: string) => {
      try {
        await confirmPurchaseOrder(id);
        toast.success("Order confirmed successfully");
        void refreshOrders();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Failed to confirm order.",
        );
      }
    },
    [refreshOrders],
  );

  const handleCancelOrder = useCallback(
    async (id: string) => {
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
      if (
        !confirm(
          `Cancel order ${order.orderNo}? This action cannot be undone.`,
        )
      ) {
        return;
      }
      try {
        await cancelPurchaseOrder(id);
        toast.success("Order cancelled successfully");
        void refreshOrders();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Failed to cancel order",
        );
      }
    },
    [orders, refreshOrders],
  );

  const handleViewDetails = useCallback(
    (id: string) => {
      const order = orders.find((o) => o.id === id);
      if (order) {
        setSelectedOrderForDetails(order);
        setShowOrderDetailsDialog(true);
      }
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
        onOpenOrder: (id) =>
          navigate(`/inventory/purchase/orders/${id}`),
        onConfirm: handleConfirmOrder,
        onCancel: handleCancelOrder,
        onViewDetails: handleViewDetails,
        onEdit: handleEdit,
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
      handleViewDetails,
      handleEdit,
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
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
        onRowClick={handleRowClick}
        onRetry={() => void refreshOrders()}
      />
      <PurchaseOrderDetailsDialog
        open={showOrderDetailsDialog}
        onOpenChange={setShowOrderDetailsDialog}
        order={selectedOrderForDetails}
      />
    </>
  );
}
