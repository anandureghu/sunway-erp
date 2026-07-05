import { useEffect, useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GOODS_RECEIPT_COLUMNS } from "@/lib/columns/purchase-columns";
import {
  Plus,
  Search,
  ClipboardCheck,
  Package,
  Truck,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import {
  listPurchaseOrders,
  listGoodsReceipts,
} from "@/service/purchaseFlowService";
import type { GoodsReceipt, PurchaseOrder } from "@/types/purchase";
import { toast } from "sonner";
import type { Row } from "@tanstack/react-table";
import { listItems, listWarehouses } from "@/service/inventoryService";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import type { Warehouse } from "@/types/inventory";
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

type ReceivingListTab = "ready" | "receipts";

export default function ReceivingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [activeTab, setActiveTab] = useState<ReceivingListTab>("ready");
  const [receiptStatusFilter, setReceiptStatusFilter] = useState<
    "all" | "completed" | "open"
  >("all");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [receiptsLoading, setReceiptsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleRowClick = useCallback(
    (row: Row<GoodsReceipt>) => {
      const receipt = row.original;
      navigate(`/inventory/purchase/receiving/${receipt.id}`);
    },
    [navigate],
  );

  // Deep-link from PO list/detail: open receipt form for a PO
  useEffect(() => {
    const st = location.state as { openReceiveForOrderId?: string } | null;
    const oid = st?.openReceiveForOrderId;
    if (oid) {
      setSelectedOrderId(oid);
      setShowCreateForm(true);
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
      console.error("Error loading receiving data:", e);
      const errorMessage =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to load receiving data.";
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

  const filteredReceipts = useMemo(() => {
    return receipts.filter((receipt) => {
      const matchesSearch =
        receipt.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.order?.orderNo.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (receiptStatusFilter === "completed") {
        return receipt.status === "completed";
      }
      if (receiptStatusFilter === "open") {
        return receipt.status !== "completed" && receipt.status !== "cancelled";
      }
      return true;
    });
  }, [receipts, searchQuery, receiptStatusFilter]);

  // Get orders ready for receiving (ordered or partially received) with search filter
  const ordersReadyForReceiving = useMemo(() => {
    let filtered = orders.filter((order) => {
      const status = order.status?.toLowerCase();
      return (
        status === "ordered" ||
        status === "partially_received" ||
        status === "approved" ||
        status === "confirmed"
      );
    });

    // Apply search filter if provided
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
  }, [orders, orderSearchQuery]);

  const applyKpiFilter = useCallback((key: string) => {
    setKpiFilter(key);
    switch (key) {
      case "ready":
        setActiveTab("ready");
        setReceiptStatusFilter("all");
        break;
      case "completed":
        setActiveTab("receipts");
        setReceiptStatusFilter("completed");
        break;
      case "open":
        setActiveTab("receipts");
        setReceiptStatusFilter("open");
        break;
      default:
        setActiveTab("receipts");
        setReceiptStatusFilter("all");
        break;
    }
  }, []);

  const receivingKpis = useMemo((): KpiSummaryStat[] => {
    const receiptsTotal = receipts.length;
    const readyPo = ordersReadyForReceiving.length;
    const completedGrn = receipts.filter(
      (r) => r.status === "completed",
    ).length;
    const openGrn = receipts.filter(
      (r) => r.status !== "completed" && r.status !== "cancelled",
    ).length;
    return [
      kpiFilterItem(
        {
          label: "Goods receipts",
          value: receiptsTotal,
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
          label: "Purchase Orders ready",
          value: readyPo,
          hint: "Eligible to receive now",
          accent: "orange",
          icon: Package,
        },
        "ready",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Completed Goods Receipts",
          value: completedGrn,
          hint: "Inspection closed",
          accent: "emerald",
          icon: CheckCircle2,
        },
        "completed",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Open Goods Receipts",
          value: openGrn,
          hint: "Pending or in progress",
          accent: "violet",
          icon: Truck,
        },
        "open",
        kpiFilter,
        applyKpiFilter,
      ),
    ];
  }, [receipts, ordersReadyForReceiving, kpiFilter, applyKpiFilter]);

  if (showCreateForm) {
    return (
      <CreateReceiptForm
        onCancel={() => setShowCreateForm(false)}
        orderId={selectedOrderId}
        onSuccess={() => {
          setShowCreateForm(false);
          void refreshData();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Receiving & quality inspection"
        description="Receive goods against released Purchase Orders and record inspection outcomes."
        backHref="/inventory/purchase"
        variant="darkGreen"
        actions={
          <Button
            size="lg"
            className="bg-white text-slate-900 hover:bg-white/90"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Receipt
          </Button>
        }
      />

      {!ordersLoading && !loadError ? (
        <KpiSummaryStrip items={receivingKpis} />
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value as ReceivingListTab);
              setKpiFilter(null);
              setReceiptStatusFilter("all");
            }}
            className="w-full gap-4"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1 lg:w-auto">
                <TabsTrigger value="ready" className="gap-2">
                  <Package className="h-4 w-4" />
                  Ready Orders
                  <Badge variant="secondary" className="font-normal">
                    {ordersReadyForReceiving.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="receipts" className="gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Goods receipts
                  <Badge variant="secondary" className="font-normal">
                    {receipts.length}
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
              <p className="font-medium">Error loading receiving data</p>
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
            ) : ordersReadyForReceiving.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                {orderSearchQuery.trim()
                  ? `No purchase orders found matching "${orderSearchQuery}"`
                  : "No purchase orders ready for receiving"}
              </div>
            ) : (
              <div className="space-y-2">
                {ordersReadyForReceiving.map((order) => (
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
                        setShowCreateForm(true);
                      }}
                    >
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Receive Goods
                    </Button>
                  </div>
                ))}
              </div>
            )
          ) : receiptsLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading receipts...
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              {searchQuery.trim()
                ? `No receipts found matching "${searchQuery}"`
                : "No goods receipts found"}
            </div>
          ) : (
            <DataTable
              columns={GOODS_RECEIPT_COLUMNS}
              data={filteredReceipts}
              onRowClick={handleRowClick}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateReceiptForm({
  onCancel,
  orderId,
  onSuccess,
}: {
  onCancel: () => void;
  orderId: string;
  onSuccess: () => void;
}) {
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null,
  );
  const [receiptItems, setReceiptItems] = useState<
    Array<{
      itemId: number;
      warehouseId: number;
      receivedQty: number;
      acceptedQty: number;
      rejectedQty: number;
      remarks?: string;
      batchNo?: string;
      lotNo?: string;
      unitCost?: number;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [catalogItems, setCatalogItems] = useState<ItemResponseDTO[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const defaultWarehouseIdForItem = (itemId: number) => {
    const it = catalogItems.find((i) => Number(i.id) === itemId);
    if (it?.warehouse_id != null) return Number(it.warehouse_id);
    const first = warehouses.find((w) => w.status === "active");
    return first ? Number(first.id) : 0;
  };

  const buildReceiptLines = (order: PurchaseOrder) =>
    order.items.map((item) => ({
      itemId: Number(item.itemId),
      warehouseId: defaultWarehouseIdForItem(Number(item.itemId)),
      receivedQty: item.quantity,
      acceptedQty: item.quantity,
      rejectedQty: 0,
      remarks: "",
      batchNo: "",
      lotNo: "",
      unitCost: item.unitCost ?? item.unitPrice ?? item.otherUnitCost,
    }));

  const receivableOrders = useMemo(
    () =>
      orders.filter((o) => {
        const status = o.status?.toLowerCase();
        return (
          status === "ordered" ||
          status === "approved" ||
          status === "partially_received" ||
          status === "confirmed"
        );
      }),
    [orders],
  );

  useEffect(() => {
    (async () => {
      try {
        const [ordersData, vendorsData, itemsData, whData] = await Promise.all([
          listPurchaseOrders(),
          listVendors(),
          listItems(),
          listWarehouses(),
        ]);
        const enriched = enrichPurchaseOrdersWithVendors(
          ordersData,
          vendorsData,
        );
        setOrders(enriched);
        setCatalogItems(itemsData);
        setWarehouses(whData);
        if (orderId) {
          const order = enriched.find((o) => o.id === orderId);
          if (order) {
            setSelectedOrder(order);
            setReceiptItems(
              order.items.map((item) => {
                const iid = Number(item.itemId);
                const it = itemsData.find((i) => Number(i.id) === iid);
                const whId =
                  it?.warehouse_id != null
                    ? Number(it.warehouse_id)
                    : whData.find((w) => w.status === "active")
                      ? Number(whData.find((w) => w.status === "active")!.id)
                      : 0;
                return {
                  itemId: iid,
                  warehouseId: whId,
                  receivedQty: item.quantity,
                  acceptedQty: item.quantity,
                  rejectedQty: 0,
                  remarks: "",
                  batchNo: "",
                  lotNo: "",
                  unitCost:
                    item.unitCost ?? item.unitPrice ?? item.otherUnitCost,
                };
              }),
            );
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
    if (receiptItems.some((r) => !r.warehouseId || r.warehouseId <= 0)) {
      toast.error("Select a warehouse for each receipt line.");
      return;
    }

    setLoading(true);
    try {
      const { createGoodsReceipt } =
        await import("@/service/purchaseFlowService");
      await createGoodsReceipt({
        purchaseOrderId: Number(selectedOrder.id),
        items: receiptItems,
      });
      toast.success("Goods receipt created successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Error creating goods receipt:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create goods receipt",
      );
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index: number, field: string, value: number | string) => {
    const updated = [...receiptItems];
    if (field === "warehouseId") {
      updated[index] = { ...updated[index], warehouseId: Number(value) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    // Auto-calculate accepted + rejected = received
    if (field === "receivedQty") {
      const received = Number(value);
      const rejected = updated[index].rejectedQty || 0;
      updated[index].acceptedQty = Math.max(0, received - rejected);
    } else if (field === "rejectedQty") {
      const rejected = Number(value);
      const received = updated[index].receivedQty || 0;
      updated[index].acceptedQty = Math.max(0, received - rejected);
    }
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
        title="Create goods receipt"
        description="Select a released purchase order and enter quantities accepted or rejected per line."
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
            Choose a released purchase order to receive against.
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
              Enter received, accepted, and rejected quantities per line.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pr-4 w-12">Sl No</th>
                    <th className="pb-3 pr-4">Item</th>
                    <th className="pb-3 pr-4">Warehouse</th>
                    <th className="pb-3 pr-4 text-right">Unit cost</th>
                    <th className="pb-3 pr-4 text-right">Ordered</th>
                    <th className="pb-3 pr-4 text-right">Received</th>
                    <th className="pb-3 pr-4 text-right">Accepted</th>
                    <th className="pb-3 pr-4 text-right">Rejected</th>
                    <th className="pb-3 pr-4">Batch</th>
                    <th className="pb-3 pr-4">Lot</th>
                    <th className="pb-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptItems.map((item, idx) => {
                    const orderItem = selectedOrder.items.find(
                      (oi) => Number(oi.itemId) === item.itemId,
                    );
                    const catalogItem = catalogItems.find(
                      (ci) => Number(ci.id) === item.itemId,
                    );
                    const itemSku = catalogItem?.sku || null;
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
                          {itemSku ? (
                            <p className="text-xs text-slate-500">
                              SKU: {itemSku}
                            </p>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4 min-w-[180px]">
                          <Select
                            value={
                              item.warehouseId ? String(item.warehouseId) : ""
                            }
                            onValueChange={(v) =>
                              updateItem(idx, "warehouseId", v)
                            }
                          >
                            <SelectTrigger className="h-9 rounded-lg">
                              <SelectValue placeholder="Warehouse" />
                            </SelectTrigger>
                            <SelectContent>
                              {warehouses
                                .filter((w) => w.status === "active")
                                .map((wh) => (
                                  <SelectItem key={wh.id} value={String(wh.id)}>
                                    {wh.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums text-slate-600">
                          {orderItem?.unitCost ?? orderItem?.unitPrice ?? "—"}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          {orderItem?.quantity || 0}
                        </td>
                        <td className="py-3 pr-4">
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
                        <td className="py-3 pr-4">
                          <Input
                            type="number"
                            min="0"
                            value={item.acceptedQty}
                            onChange={(e) =>
                              updateItem(
                                idx,
                                "acceptedQty",
                                Number(e.target.value),
                              )
                            }
                            className="ml-auto w-24 rounded-lg text-right tabular-nums"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <Input
                            type="number"
                            min="0"
                            value={item.rejectedQty}
                            onChange={(e) =>
                              updateItem(
                                idx,
                                "rejectedQty",
                                Number(e.target.value),
                              )
                            }
                            className="ml-auto w-24 rounded-lg text-right tabular-nums"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <Input
                            type="text"
                            value={item.batchNo || ""}
                            onChange={(e) =>
                              updateItem(idx, "batchNo", e.target.value)
                            }
                            placeholder="Batch no."
                            className="min-w-[120px] rounded-lg"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <Input
                            type="text"
                            value={item.lotNo || ""}
                            onChange={(e) =>
                              updateItem(idx, "lotNo", e.target.value)
                            }
                            placeholder="Lot no."
                            className="min-w-[100px] rounded-lg"
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
            {loading ? "Creating…" : "Create receipt"}
          </Button>
        </div>
      </form>
    </div>
  );
}
