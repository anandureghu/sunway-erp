import { useEffect, useState, useMemo, useCallback } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { PurchasePageHeader } from "./components/purchase-page-header";
import {
  listPurchaseOrders,
  getGoodsReceiptsByPurchaseOrder,
} from "@/service/purchaseFlowService";
import type { GoodsReceipt, PurchaseOrder } from "@/types/purchase";
import { toast } from "sonner";
import type { Row } from "@tanstack/react-table";
import { listItems, listWarehouses } from "@/service/inventoryService";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import type { Warehouse } from "@/types/inventory";
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

export default function ReceivingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Load orders and receipts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const ordersData = await listPurchaseOrders();
        if (cancelled) return;

        setOrders(ordersData);

        // Fetch receipts for all orders
        const allReceipts: GoodsReceipt[] = [];
        for (const order of ordersData) {
          try {
            const orderReceipts = await getGoodsReceiptsByPurchaseOrder(
              order.id,
            );
            allReceipts.push(...orderReceipts);
          } catch (e) {
            // Some orders may not have receipts yet, that's okay
            console.warn(`No receipts for order ${order.id}:`, e);
          }
        }

        if (!cancelled) {
          setReceipts(allReceipts);
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error("Error loading purchase orders:", e);
          const errorMessage =
            e?.response?.data?.message ||
            e?.response?.data?.error ||
            e?.message ||
            "Failed to load purchase orders. Please check if the API endpoint is configured correctly.";
          setLoadError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredReceipts = useMemo(() => {
    return receipts.filter((receipt) => {
      return (
        receipt.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.order?.orderNo.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [receipts, searchQuery]);

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
          order.supplier?.name?.toLowerCase().includes(query) ||
          order.supplier?.code?.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [orders, orderSearchQuery]);

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
      {
        label: "Goods receipts",
        value: receiptsTotal,
        hint: "Recorded against POs",
        accent: "sky",
        icon: ClipboardList,
      },
      {
        label: "POs ready",
        value: readyPo,
        hint: "Eligible to receive now",
        accent: "orange",
        icon: Package,
      },
      {
        label: "Completed GRNs",
        value: completedGrn,
        hint: "Inspection closed",
        accent: "emerald",
        icon: CheckCircle2,
      },
      {
        label: "Open receipts",
        value: openGrn,
        hint: "Pending or in progress",
        accent: "violet",
        icon: Truck,
      },
    ];
  }, [receipts, ordersReadyForReceiving]);

  if (showCreateForm) {
    return (
      <CreateReceiptForm
        onCancel={() => setShowCreateForm(false)}
        orderId={selectedOrderId}
        onSuccess={() => {
          setShowCreateForm(false);
          // Reload receipts
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PurchasePageHeader
        title="Receiving & quality inspection"
        description="Receive goods against released POs and record inspection outcomes."
        backHref="/inventory/purchase"
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

      {!loading && !loadError ? (
        <KpiSummaryStrip items={receivingKpis} />
      ) : null}

      {/* Orders Ready for Receiving */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Orders Ready for Receiving</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search purchase orders..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-4 text-center text-muted-foreground">
              Loading orders...
            </div>
          ) : loadError ? (
            <div className="py-4 text-center text-red-600">
              <p className="font-medium">Error loading purchase orders</p>
              <p className="text-sm mt-1">{loadError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : ordersReadyForReceiving.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">
              {orderSearchQuery.trim()
                ? `No purchase orders found matching "${orderSearchQuery}"`
                : "No purchase orders ready for receiving"}
            </div>
          ) : (
            <div className="space-y-2">
              {ordersReadyForReceiving.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{order.orderNo}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.supplier?.name || "Unknown Supplier"} • Expected:{" "}
                      {order.expectedDate || "N/A"}
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
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Goods Receipts</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search receipts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading...
            </div>
          ) : loadError ? (
            <div className="py-10 text-center text-red-600">{loadError}</div>
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
    }));

  useEffect(() => {
    (async () => {
      try {
        const [ordersData, itemsData, whData] = await Promise.all([
          listPurchaseOrders(),
          listItems(),
          listWarehouses(),
        ]);
        setOrders(ordersData);
        setCatalogItems(itemsData);
        setWarehouses(whData);
        if (orderId) {
          const order = ordersData.find((o) => o.id === orderId);
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

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PurchasePageHeader
        title="Create goods receipt"
        description="Select a released purchase order and enter quantities accepted or rejected per line."
        backHref="/inventory/purchase"
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Order</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedOrder?.id || ""}
              onChange={(e) => {
                const order = orders.find((o) => o.id === e.target.value);
                setSelectedOrder(order || null);
                if (order) {
                  setReceiptItems(buildReceiptLines(order));
                }
              }}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Purchase Order</option>
              {orders
                .filter((o) => {
                  const status = o.status?.toLowerCase();
                  return (
                    status === "ordered" ||
                    status === "approved" ||
                    status === "partially_received" ||
                    status === "confirmed"
                  );
                })
                .map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.orderNo} -{" "}
                    {(order.supplier as any)?.vendorName ||
                      (order.supplier as any)?.name ||
                      "N/A"}
                  </option>
                ))}
            </select>
          </CardContent>
        </Card>

        {selectedOrder && (
          <Card>
            <CardHeader>
              <CardTitle>Receipt Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Item</th>
                      <th className="p-2 text-left">Warehouse</th>
                      <th className="p-2 text-left">Ordered Qty</th>
                      <th className="p-2 text-left">Received Qty</th>
                      <th className="p-2 text-left">Accepted Qty</th>
                      <th className="p-2 text-left">Rejected Qty</th>
                      <th className="p-2 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptItems.map((item, idx) => {
                      const orderItem = selectedOrder.items.find(
                        (oi) => Number(oi.itemId) === item.itemId,
                      );
                      return (
                        <tr key={idx} className="border-t">
                          <td className="p-2">
                            {orderItem?.item?.itemId || `Item ${item.itemId}`}
                          </td>
                          <td className="p-2 min-w-[160px]">
                            <Select
                              value={
                                item.warehouseId ? String(item.warehouseId) : ""
                              }
                              onValueChange={(v) =>
                                updateItem(idx, "warehouseId", v)
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Warehouse" />
                              </SelectTrigger>
                              <SelectContent>
                                {warehouses
                                  .filter((w) => w.status === "active")
                                  .map((wh) => (
                                    <SelectItem
                                      key={wh.id}
                                      value={String(wh.id)}
                                    >
                                      {wh.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-2">{orderItem?.quantity || 0}</td>
                          <td className="p-2">
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
                              className="w-20"
                            />
                          </td>
                          <td className="p-2">
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
                              className="w-20"
                            />
                          </td>
                          <td className="p-2">
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
                              className="w-20"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="text"
                              value={item.remarks || ""}
                              onChange={(e) =>
                                updateItem(idx, "remarks", e.target.value)
                              }
                              placeholder="Remarks"
                              className="w-40"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!selectedOrder || receiptItems.length === 0 || loading}
          >
            {loading ? "Creating..." : "Create Receipt"}
          </Button>
        </div>
      </form>
    </div>
  );
}
