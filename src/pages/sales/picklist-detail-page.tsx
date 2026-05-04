import { apiClient } from "@/service/apiClient";
import {
  type PicklistResponseDTO,
  type SalesOrderResponseDTO,
} from "@/service/erpApiTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SalesPageHeader } from "./components/sales-page-header";

const PicklistDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [picklist, setPicklist] = useState<PicklistResponseDTO | null>(null);
  const [salesOrder, setSalesOrder] = useState<SalesOrderResponseDTO | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiClient
      .get<PicklistResponseDTO>(`/warehouse/picklists/${id}`)
      .then(async ({ data }) => {
        if (!mounted) return;
        setPicklist(data);
        if (!data.salesOrderId) return;
        try {
          const so = await apiClient.get<SalesOrderResponseDTO>(
            `/sales/orders/${data.salesOrderId}`,
          );
          if (mounted) {
            setSalesOrder(so.data);
          }
        } catch {
          if (mounted) {
            setSalesOrder(null);
          }
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading || !picklist) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }
  const canCreateDispatch = picklist.status?.toLowerCase() === "picked";

  const getOrderLineForItem = (itemId?: number) => {
    if (!itemId || !salesOrder?.items) return undefined;
    return salesOrder.items.find((line) => line.itemId === itemId);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <SalesPageHeader
        title={`Picklist #${picklist.picklistNumber}`}
        description={
          picklist.createdAt
            ? `Created ${new Date(picklist.createdAt).toLocaleString()}`
            : undefined
        }
        backHref="/inventory/sales/picklist"
        actions={
          <>
            {canCreateDispatch && (
              <Button
                size="lg"
                className="bg-white text-slate-900 hover:bg-white/90"
                onClick={() =>
                  navigate("/inventory/sales/picklist", {
                    state: {
                      activeTab: "dispatches",
                      initialPicklistId: String(picklist.id),
                      openCreateDispatch: true,
                    },
                  })
                }
              >
                Dispatch Shipment
              </Button>
            )}
            <Badge
              variant="outline"
              className="capitalize border-white/25 bg-white/10 text-white hover:bg-white/10"
            >
              {picklist.status}
            </Badge>
          </>
        }
      />

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Picklist Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Picklist Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Picklist Number</p>
              <p className="font-medium">{picklist.picklistNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Picklist ID</p>
              <p className="font-medium">#{picklist.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{picklist.status}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created Time</p>
              <p className="font-medium">
                {picklist.createdAt
                  ? new Date(picklist.createdAt).toLocaleString()
                  : "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Linked Order */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Related Sales Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Sales Order ID</p>
              <p className="font-medium">#{picklist.salesOrderId}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Order Number</p>
              <p className="font-medium">{salesOrder?.orderNumber || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="font-medium">{salesOrder?.customerName || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Order Status</p>
              <p className="font-medium capitalize">
                {salesOrder?.status?.toLowerCase() || "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment Status</p>
              <p className="font-medium">{salesOrder?.paymentStatus || "-"}</p>
            </div>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() =>
                navigate(`/inventory/sales/orders/${picklist.salesOrderId}`)
              }
            >
              View Sales Order Details
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items to Pick</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-left">Warehouse</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                  <th className="px-3 py-2 text-right">Quantity</th>
                  <th className="px-3 py-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {picklist.items && picklist.items.length > 0 ? (
                  picklist.items.map((item) => {
                    const orderLine = getOrderLineForItem(item.itemId);
                    return (
                      <tr
                        key={item.itemId}
                        className="border-t cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          navigate(`/inventory/stocks/${item.itemId}`)
                        }
                      >
                        <td className="px-3 py-2 font-medium text-primary underline underline-offset-2">
                          {item.itemName}
                        </td>
                        <td className="px-3 py-2">
                          {orderLine?.warehouseName || "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {orderLine?.unitPrice != null
                            ? Number(orderLine.unitPrice).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {orderLine?.lineTotal != null
                            ? Number(orderLine.lineTotal).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )
                            : "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-3 py-3 text-muted-foreground" colSpan={5}>
                      No items added to this picklist.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Separator className="my-4" />

          {/* Summary */}
          <div className="flex justify-end">
            <div className="text-sm">
              <span className="text-muted-foreground">Total Items: </span>
              <span className="font-semibold">
                {picklist.items?.length || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PicklistDetailPage;
