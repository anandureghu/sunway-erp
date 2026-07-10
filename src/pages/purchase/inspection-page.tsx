import { useEffect, useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { DataTable } from "@/components/datatable";
import { SelectableDataTable } from "@/components/selectable-data-table";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createGoodsReceiptColumns } from "@/lib/columns/purchase-columns";
import {
  Plus,
  Search,
  ClipboardCheck,
  Package,
  CheckCircle2,
  ClipboardList,
  Hourglass,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import {
  listPurchaseOrders,
  listGoodsReceipts,
  createGoodsReceiptForInspection,
  confirmGoodsReceiptInspection,
  archiveGoodsReceipt,
} from "@/service/purchaseFlowService";
import {
  bulkArchiveHistoryRecords,
  summarizeBulkActionResult,
} from "@/service/historyService";
import type { GoodsReceipt, PurchaseOrder } from "@/types/purchase";
import { toast } from "sonner";
import type { Row, RowSelectionState } from "@tanstack/react-table";
import { listVendors } from "@/service/vendorService";
import { enrichPurchaseOrdersWithVendors } from "@/lib/enrich-purchase-orders";
import { purchaseLineItemName } from "@/lib/purchase-line-item";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";
import { kpiFilterItem } from "@/lib/kpi-filter";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";

function purchaseOrderSupplierLabel(order: PurchaseOrder): string {
  return (
    order.supplierName ||
    order.supplier?.name ||
    (order.supplier as { vendorName?: string } | undefined)?.vendorName ||
    "No supplier assigned"
  );
}

function orderDeliveryLabel(order: PurchaseOrder): string {
  const deliveryDate = order.requiredDeliveryDate || order.expectedDate;
  if (deliveryDate) {
    try {
      return format(new Date(deliveryDate), "MMM d, yyyy");
    } catch {
      return deliveryDate;
    }
  }
  if (order.orderDate) {
    try {
      return `Ordered ${format(new Date(order.orderDate), "MMM d, yyyy")}`;
    } catch {
      return `Ordered ${order.orderDate}`;
    }
  }
  return "No date set";
}

type InspectionListTab = "ready" | "pending" | "inspected";

export default function InspectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm } = useConfirmDialog();
  const [searchQuery, setSearchQuery] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [showStartForm, setShowStartForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [inspectingReceipt, setInspectingReceipt] = useState<GoodsReceipt | null>(
    null,
  );
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [activeTab, setActiveTab] = useState<InspectionListTab>("ready");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [receiptsLoading, setReceiptsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkArchiving, setBulkArchiving] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const handleRowClick = useCallback(
    (row: Row<GoodsReceipt>) => {
      const receipt = row.original;
      if (receipt.status === "pending_inspection") {
        setInspectingReceipt(receipt);
        return;
      }
      navigate(`/inventory/purchase/inspection/${receipt.id}`);
    },
    [navigate],
  );

  // Deep-link from PO list/detail: open the start-inspection form for a PO
  useEffect(() => {
    const st = location.state as { openReceiveForOrderId?: string } | null;
    const oid = st?.openReceiveForOrderId;
    if (oid) {
      setSelectedOrderId(oid);
      setShowStartForm(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const refreshData = useCallback(async () => {
    setLoadError(null);
    setOrdersLoading(true);
    setReceiptsLoading(true);
    try {
      const [ordersData, vendorsData] = await Promise.all([
        listPurchaseOrders(),
        listVendors(),
      ]);
      const enriched = enrichPurchaseOrdersWithVendors(ordersData, vendorsData);
      setOrders(enriched);
      setOrdersLoading(false);

      const allReceipts = await listGoodsReceipts(enriched);
      setReceipts(allReceipts);
    } catch (e: any) {
      console.error("Error loading inspection data:", e);
      const errorMessage =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to load inspection data.";
      setLoadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setOrdersLoading(false);
      setReceiptsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const pendingReceipts = useMemo(
    () => receipts.filter((r) => r.status === "pending_inspection"),
    [receipts],
  );
  const inspectedReceipts = useMemo(
    () => receipts.filter((r) => r.status === "inspected"),
    [receipts],
  );

  const filteredPendingReceipts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return pendingReceipts;
    return pendingReceipts.filter(
      (r) =>
        r.receiptNo.toLowerCase().includes(q) ||
        r.order?.orderNo.toLowerCase().includes(q),
    );
  }, [pendingReceipts, searchQuery]);

  const filteredInspectedReceipts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return inspectedReceipts;
    return inspectedReceipts.filter(
      (r) =>
        r.receiptNo.toLowerCase().includes(q) ||
        r.order?.orderNo.toLowerCase().includes(q),
    );
  }, [inspectedReceipts, searchQuery]);

  // Purchase orders that already have a receipt awaiting inspection - excluded
  // from "ready for inspection" so a second, overlapping intake can't be
  // started against the same PO while one is still unresolved.
  const orderIdsWithPendingInspection = useMemo(
    () => new Set(pendingReceipts.map((r) => r.orderId)),
    [pendingReceipts],
  );

  // Purchase orders still needing (further) goods to be logged for inspection
  const ordersReadyForInspection = useMemo(() => {
    let filtered = orders.filter((order) => {
      const status = order.status?.toLowerCase();
      const isReceivableStatus =
        status === "ordered" ||
        status === "partially_received" ||
        status === "approved" ||
        status === "confirmed";
      return (
        isReceivableStatus && !orderIdsWithPendingInspection.has(order.id)
      );
    });

    if (orderSearchQuery.trim()) {
      const query = orderSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderNo.toLowerCase().includes(query) ||
          purchaseOrderSupplierLabel(order).toLowerCase().includes(query) ||
          order.supplier?.code?.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [orders, orderSearchQuery, orderIdsWithPendingInspection]);

  const applyKpiFilter = useCallback((key: string) => {
    setKpiFilter(key);
    setRowSelection({});
    switch (key) {
      case "ready":
        setActiveTab("ready");
        break;
      case "pending":
        setActiveTab("pending");
        break;
      case "inspected":
        setActiveTab("inspected");
        break;
      default:
        setActiveTab("ready");
        break;
    }
  }, []);

  const inspectionKpis = useMemo((): KpiSummaryStat[] => {
    return [
      kpiFilterItem(
        {
          label: "Goods receipts",
          value: receipts.length,
          hint: "Recorded against Purchase Orders",
          accent: "sky",
          icon: ClipboardList,
        },
        "all",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Ready for inspection",
          value: ordersReadyForInspection.length,
          hint: "Purchase orders eligible to log receipts",
          accent: "orange",
          icon: Package,
        },
        "ready",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Pending inspection",
          value: pendingReceipts.length,
          hint: "Awaiting accept/reject decision",
          accent: "violet",
          icon: Hourglass,
        },
        "pending",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Inspected",
          value: inspectedReceipts.length,
          hint: "Inspection closed",
          accent: "emerald",
          icon: CheckCircle2,
        },
        "inspected",
        kpiFilter,
        applyKpiFilter,
      ),
    ];
  }, [
    receipts,
    ordersReadyForInspection,
    pendingReceipts,
    inspectedReceipts,
    kpiFilter,
    applyKpiFilter,
  ]);

  const selectedReceiptIds = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => Number(id))
        .filter((id) => !Number.isNaN(id)),
    [rowSelection],
  );

  const handleArchiveReceipt = useCallback(
    async (id: string) => {
      const receipt = receipts.find((r) => r.id === id);
      if (!receipt) return toast.error("Goods receipt not found");
      if (receipt.status !== "inspected") {
        return toast.error("Only inspected goods receipts can be archived.");
      }
      if (!(await confirm(`Archive receipt ${receipt.receiptNo}?`))) return;
      setArchivingId(id);
      try {
        await archiveGoodsReceipt(id);
        toast.success("Goods receipt archived successfully");
        void refreshData();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to archive goods receipt",
        );
      } finally {
        setArchivingId(null);
      }
    },
    [receipts, confirm, refreshData],
  );

  const handleBulkArchiveReceipts = useCallback(async () => {
    if (selectedReceiptIds.length === 0) return;
    if (
      !(await confirm(
        `Archive ${selectedReceiptIds.length} selected receipt(s)? They will move to Operations and management Reports → History.`,
      ))
    ) {
      return;
    }
    setBulkArchiving(true);
    try {
      const result = await bulkArchiveHistoryRecords(
        "GOODS_RECEIPT",
        selectedReceiptIds,
      );
      toast.success(summarizeBulkActionResult(result));
      setRowSelection({});
      await refreshData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to archive selected receipts.",
      );
    } finally {
      setBulkArchiving(false);
    }
  }, [confirm, refreshData, selectedReceiptIds]);

  const inspectedColumns = useMemo(
    () =>
      createGoodsReceiptColumns({
        onOpenReceipt: (id) => navigate(`/inventory/purchase/inspection/${id}`),
        onArchive: handleArchiveReceipt,
        processingReceiptId: archivingId,
      }),
    [navigate, handleArchiveReceipt, archivingId],
  );

  const pendingColumns = useMemo(
    () =>
      createGoodsReceiptColumns({
        onOpenReceipt: (id) => {
          const receipt = pendingReceipts.find((r) => r.id === id);
          if (receipt) setInspectingReceipt(receipt);
        },
      }),
    [pendingReceipts],
  );

  if (showStartForm) {
    return (
      <StartInspectionForm
        onCancel={() => setShowStartForm(false)}
        orderId={selectedOrderId}
        excludeOrderIds={orderIdsWithPendingInspection}
        onSuccess={() => {
          setShowStartForm(false);
          void refreshData();
        }}
      />
    );
  }

  if (inspectingReceipt) {
    return (
      <InspectForm
        receipt={inspectingReceipt}
        onCancel={() => setInspectingReceipt(null)}
        onSuccess={() => {
          setInspectingReceipt(null);
          void refreshData();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Quality inspection"
        description="Confirm inspection outcomes on goods received against released Purchase Orders."
        backHref="/inventory/purchase"
        variant="darkGreen"
        actions={
          <Button
            size="lg"
            className="bg-white text-slate-900 hover:bg-white/90"
            onClick={() => setShowStartForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Start Inspection
          </Button>
        }
      />

      {!ordersLoading && !loadError ? (
        <KpiSummaryStrip items={inspectionKpis} />
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value as InspectionListTab);
              setKpiFilter(null);
              setRowSelection({});
            }}
            className="w-full gap-4"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1 lg:w-auto">
                <TabsTrigger value="ready" className="gap-2">
                  <Package className="h-4 w-4" />
                  Ready for inspection
                  <Badge variant="secondary" className="font-normal">
                    {ordersReadyForInspection.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="pending" className="gap-2">
                  <Hourglass className="h-4 w-4" />
                  Pending inspection
                  <Badge variant="secondary" className="font-normal">
                    {pendingReceipts.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="inspected" className="gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Inspected
                  <Badge variant="secondary" className="font-normal">
                    {inspectedReceipts.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={
                    activeTab === "ready"
                      ? "Search purchase orders..."
                      : "Search receipts..."
                  }
                  value={activeTab === "ready" ? orderSearchQuery : searchQuery}
                  onChange={(e) =>
                    activeTab === "ready"
                      ? setOrderSearchQuery(e.target.value)
                      : setSearchQuery(e.target.value)
                  }
                  className="w-64 pl-8"
                />
              </div>
            </div>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <div className="py-10 text-center text-red-600">
              <p className="font-medium">Error loading inspection data</p>
              <p className="mt-1 text-sm">{loadError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => void refreshData()}
              >
                Retry
              </Button>
            </div>
          ) : activeTab === "ready" ? (
            ordersLoading ? (
              <div className="py-10 text-center text-muted-foreground">
                Loading orders...
              </div>
            ) : ordersReadyForInspection.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                {orderSearchQuery.trim()
                  ? `No purchase orders found matching "${orderSearchQuery}"`
                  : "No purchase orders ready for inspection"}
              </div>
            ) : (
              <div className="space-y-2">
                {ordersReadyForInspection.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{order.orderNo}</p>
                      <p className="text-sm text-muted-foreground">
                        {purchaseOrderSupplierLabel(order)} •{" "}
                        {order.expectedDate ? "Expected" : "Delivery"}:{" "}
                        {orderDeliveryLabel(order)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setShowStartForm(true);
                      }}
                    >
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Start Inspection
                    </Button>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === "pending" ? (
            receiptsLoading ? (
              <div className="py-10 text-center text-muted-foreground">
                Loading receipts...
              </div>
            ) : filteredPendingReceipts.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                {searchQuery.trim()
                  ? `No receipts found matching "${searchQuery}"`
                  : "No receipts pending inspection"}
              </div>
            ) : (
              <DataTable
                columns={pendingColumns}
                data={filteredPendingReceipts}
                onRowClick={handleRowClick}
              />
            )
          ) : receiptsLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading receipts...
            </div>
          ) : filteredInspectedReceipts.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              {searchQuery.trim()
                ? `No receipts found matching "${searchQuery}"`
                : "No inspected goods receipts found"}
            </div>
          ) : (
            <div className="space-y-4">
              <BulkActionBar
                selectedCount={selectedReceiptIds.length}
                onArchive={handleBulkArchiveReceipts}
                onClear={() => setRowSelection({})}
                archiving={bulkArchiving}
              />
              <SelectableDataTable
                columns={inspectedColumns}
                data={filteredInspectedReceipts}
                onRowClick={handleRowClick}
                enableRowSelection
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                getRowId={(row) => row.id}
                isRowSelectable={(row) => !row.archived}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StartInspectionForm({
  onCancel,
  orderId,
  excludeOrderIds,
  onSuccess,
}: {
  onCancel: () => void;
  orderId: string;
  excludeOrderIds?: Set<string>;
  onSuccess: () => void;
}) {
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null,
  );
  const [receiptItems, setReceiptItems] = useState<
    Array<{
      itemId: number;
      purchaseOrderItemId: number;
      receivedQty: number;
      remarks?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);

  const buildReceiptLines = (order: PurchaseOrder) =>
    order.items.map((item) => ({
      itemId: Number(item.itemId),
      purchaseOrderItemId: Number(item.id),
      receivedQty: item.quantity,
      remarks: "",
    }));

  const receivableOrders = useMemo(
    () =>
      orders.filter((o) => {
        const status = o.status?.toLowerCase();
        const isReceivableStatus =
          status === "ordered" ||
          status === "approved" ||
          status === "partially_received" ||
          status === "confirmed";
        // Keep the order visible if it's the one this form was deep-linked to
        // open for, even if it also has a pending inspection outstanding.
        const isExcluded =
          excludeOrderIds?.has(o.id) && o.id !== orderId;
        return isReceivableStatus && !isExcluded;
      }),
    [orders, excludeOrderIds, orderId],
  );

  useEffect(() => {
    (async () => {
      try {
        const [ordersData, vendorsData] = await Promise.all([
          listPurchaseOrders(),
          listVendors(),
        ]);
        const enriched = enrichPurchaseOrdersWithVendors(
          ordersData,
          vendorsData,
        );
        setOrders(enriched);
        if (orderId) {
          const order = enriched.find((o) => o.id === orderId);
          if (order) {
            setSelectedOrder(order);
            setReceiptItems(buildReceiptLines(order));
          }
        }
      } catch (e: any) {
        toast.error(e?.message || "Failed to load purchase orders");
      }
    })();
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) {
      toast.error("Please select a purchase order");
      return;
    }
    if (receiptItems.length === 0) {
      toast.error("Please add items to receive");
      return;
    }
    if (receiptItems.some((r) => r.receivedQty < 0)) {
      toast.error("Received quantity cannot be negative.");
      return;
    }

    setLoading(true);
    try {
      await createGoodsReceiptForInspection({
        purchaseOrderId: Number(selectedOrder.id),
        items: receiptItems,
      });
      toast.success("Logged for inspection successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Error logging goods receipt:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to log goods receipt",
      );
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (
    index: number,
    field: "receivedQty" | "remarks",
    value: number | string,
  ) => {
    const updated = [...receiptItems];
    updated[index] = { ...updated[index], [field]: value } as (typeof updated)[number];
    setReceiptItems(updated);
  };

  const handleOrderSelect = (value: string) => {
    const order = receivableOrders.find((o) => o.id === value) ?? null;
    setSelectedOrder(order);
    if (order) setReceiptItems(buildReceiptLines(order));
  };

  return (
    <div className="space-y-5 p-6">
      <PageHeader
        variant="darkGreen"
        title="Start inspection"
        description="Select a released purchase order and log what physically arrived, pending inspection."
        onBack={onCancel}
        actions={
          <Button
            type="button"
            size="lg"
            variant="secondary"
            className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
            onClick={onCancel}
          >
            Cancel
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">
            Purchase order
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Choose a released purchase order to log a receipt against.
          </p>
          <Select
            value={selectedOrder?.id || ""}
            onValueChange={handleOrderSelect}
          >
            <SelectTrigger className="rounded-lg">
              <SelectValue placeholder="Select purchase order" />
            </SelectTrigger>
            <SelectContent>
              {receivableOrders.map((order) => (
                <SelectItem key={order.id} value={order.id}>
                  {order.orderNo} — {purchaseOrderSupplierLabel(order)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedOrder && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Order
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedOrder.orderNo}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Supplier
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {purchaseOrderSupplierLabel(selectedOrder)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Line items
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedOrder.items.length}
                </p>
              </div>
            </div>
          )}
        </div>

        {selectedOrder && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-slate-900">
              Receipt items
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Enter the quantity that physically arrived per line. Warehouse,
              batch, lot and cost are entered later, once inspection is
              confirmed, from Inventory (Stocks) → Receive goods.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pr-4 w-12">Sl No</th>
                    <th className="pb-3 pr-4">Item</th>
                    <th className="pb-3 pr-4 text-right">Ordered</th>
                    <th className="pb-3 pr-4 text-right">Received</th>
                    <th className="pb-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptItems.map((item, idx) => {
                    const orderItem = selectedOrder.items.find(
                      (oi) => Number(oi.itemId) === item.itemId,
                    );
                    return (
                      <tr
                        key={idx}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-3 pr-4 tabular-nums text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-medium text-slate-900">
                            {orderItem
                              ? purchaseLineItemName(orderItem)
                              : `Item #${item.itemId}`}
                          </p>
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          {orderItem?.quantity || 0}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <Input
                            type="number"
                            min="0"
                            value={item.receivedQty}
                            onChange={(e) =>
                              updateItem(
                                idx,
                                "receivedQty",
                                Number(e.target.value),
                              )
                            }
                            className="ml-auto w-24 rounded-lg text-right tabular-nums"
                          />
                        </td>
                        <td className="py-3">
                          <Input
                            type="text"
                            value={item.remarks || ""}
                            onChange={(e) =>
                              updateItem(idx, "remarks", e.target.value)
                            }
                            placeholder="Optional notes"
                            className="min-w-[160px] rounded-lg"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className={cn("rounded-lg", loading && "opacity-80")}
            disabled={!selectedOrder || receiptItems.length === 0 || loading}
          >
            {loading ? "Logging…" : "Log for inspection"}
          </Button>
        </div>
      </form>
    </div>
  );
}

type InspectLine = {
  goodsReceiptItemId: number;
  itemLabel: string;
  orderedQuantity: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  remarks?: string;
};

function InspectForm({
  receipt,
  onCancel,
  onSuccess,
}: {
  receipt: GoodsReceipt;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [lines, setLines] = useState<InspectLine[]>(() =>
    receipt.items.map((item) => ({
      goodsReceiptItemId: Number(item.id),
      itemLabel: item.item?.name || `Item #${item.itemId}`,
      orderedQuantity: item.orderedQuantity,
      receivedQty: item.receivedQuantity,
      acceptedQty: item.receivedQuantity,
      // Nothing physically arrived for this line - default to writing off the
      // full remaining ordered quantity as rejected/short-shipped, editable
      // down to 0 if the inspector wants to leave it open for a later receipt.
      rejectedQty: item.receivedQuantity === 0 ? item.orderedQuantity : 0,
      remarks: item.notes || "",
    })),
  );
  const [loading, setLoading] = useState(false);

  const updateLine = (
    index: number,
    field: "acceptedQty" | "rejectedQty" | "remarks",
    value: number | string,
  ) => {
    const updated = [...lines];
    const line = { ...updated[index] };
    if (field === "acceptedQty") {
      const accepted = Math.max(0, Math.min(line.receivedQty, Number(value)));
      line.acceptedQty = accepted;
      line.rejectedQty = line.receivedQty - accepted;
    } else if (field === "rejectedQty") {
      if (line.receivedQty === 0) {
        // Nothing received - "rejected" here means writing off up to the full
        // remaining ordered quantity, not bounded by receivedQty (which is 0).
        line.rejectedQty = Math.max(
          0,
          Math.min(line.orderedQuantity, Number(value)),
        );
        line.acceptedQty = 0;
      } else {
        const rejected = Math.max(
          0,
          Math.min(line.receivedQty, Number(value)),
        );
        line.rejectedQty = rejected;
        line.acceptedQty = line.receivedQty - rejected;
      }
    } else {
      line.remarks = value as string;
    }
    updated[index] = line;
    setLines(updated);
  };

  const isLineValid = (line: InspectLine) =>
    line.receivedQty === 0
      ? line.acceptedQty === 0 &&
        line.rejectedQty >= 0 &&
        line.rejectedQty <= line.orderedQuantity
      : line.acceptedQty + line.rejectedQty === line.receivedQty;

  const isValid = lines.every(isLineValid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast.error(
        "Accepted + rejected must equal received quantity for every line.",
      );
      return;
    }
    setLoading(true);
    try {
      await confirmGoodsReceiptInspection(receipt.id, {
        items: lines.map((line) => ({
          goodsReceiptItemId: line.goodsReceiptItemId,
          acceptedQty: line.acceptedQty,
          rejectedQty: line.rejectedQty,
          remarks: line.remarks,
        })),
      });
      toast.success("Inspection confirmed successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Error confirming inspection:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to confirm inspection",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 p-6">
      <PageHeader
        variant="darkGreen"
        title={`Inspect ${receipt.receiptNo}`}
        description={`Purchase order ${receipt.order?.orderNo || receipt.orderId}. Confirm accepted and rejected quantities per line.`}
        onBack={onCancel}
        actions={
          <Button
            type="button"
            size="lg"
            variant="secondary"
            className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
            onClick={onCancel}
          >
            Cancel
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">
            Inspection items
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Accepted + rejected must always equal the received quantity. If
            nothing was received, the rejected quantity defaults to the full
            ordered quantity and accepted stays at 0.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4 w-12">Sl No</th>
                  <th className="pb-3 pr-4">Item</th>
                  <th className="pb-3 pr-4 text-right">Ordered</th>
                  <th className="pb-3 pr-4 text-right">Received</th>
                  <th className="pb-3 pr-4 text-right">Accepted</th>
                  <th className="pb-3 pr-4 text-right">Rejected</th>
                  <th className="pb-3">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const lineValid = isLineValid(line);
                  return (
                    <tr
                      key={line.goodsReceiptItemId}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-3 pr-4 tabular-nums text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {line.itemLabel}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {line.orderedQuantity}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {line.receivedQty}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <Input
                          type="number"
                          min="0"
                          max={line.receivedQty}
                          value={line.acceptedQty}
                          disabled={line.receivedQty === 0}
                          onChange={(e) =>
                            updateLine(idx, "acceptedQty", e.target.value)
                          }
                          className={cn(
                            "ml-auto w-24 rounded-lg text-right tabular-nums",
                            !lineValid && "border-red-400",
                          )}
                        />
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <Input
                          type="number"
                          min="0"
                          max={
                            line.receivedQty === 0
                              ? line.orderedQuantity
                              : line.receivedQty
                          }
                          value={line.rejectedQty}
                          onChange={(e) =>
                            updateLine(idx, "rejectedQty", e.target.value)
                          }
                          className={cn(
                            "ml-auto w-24 rounded-lg text-right tabular-nums",
                            !lineValid && "border-red-400",
                          )}
                        />
                      </td>
                      <td className="py-3">
                        <Input
                          type="text"
                          value={line.remarks || ""}
                          onChange={(e) =>
                            updateLine(idx, "remarks", e.target.value)
                          }
                          placeholder="Optional notes"
                          className="min-w-[160px] rounded-lg"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className={cn("rounded-lg", loading && "opacity-80")}
            disabled={!isValid || loading}
          >
            {loading ? "Confirming…" : "Confirm inspection"}
          </Button>
        </div>
      </form>
    </div>
  );
}
