import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { PurchaseOrder } from "@/types/purchase";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrder | null;
};

export function PurchaseOrderDetailsDialog({
  open,
  onOpenChange,
  order,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details — {order?.orderNo}</DialogTitle>
          <DialogDescription>
            Complete information about this purchase order
          </DialogDescription>
        </DialogHeader>
        {order && (
          <div className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Number</p>
                    <p className="font-medium">{order.orderNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="secondary" className="capitalize">
                      {order.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-medium">
                      {order.orderDate
                        ? format(new Date(order.orderDate), "MMM dd, yyyy")
                        : "N/A"}
                    </p>
                  </div>
                  {order.requisitionId && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Source requisition
                      </p>
                      <p className="font-medium">PR #{order.requisitionId}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supplier Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.supplier ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Supplier Name
                      </p>
                      <p className="font-medium">
                        {(order.supplier as { vendorName?: string }).vendorName ||
                          order.supplier.name ||
                          "N/A"}
                      </p>
                    </div>
                    {order.supplier.email && (
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{order.supplier.email}</p>
                      </div>
                    )}
                    {order.supplier.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{order.supplier.phone}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Supplier information not available
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                {order.items.length > 0 ? (
                  <div className="space-y-3 overflow-x-auto">
                    <div className="grid grid-cols-6 gap-3 font-medium text-sm border-b pb-2 min-w-[560px]">
                      <div>Item</div>
                      <div className="text-right">Qty</div>
                      <div className="text-right">Item cost</div>
                      <div className="text-right">Other</div>
                      <div className="text-right">Applied</div>
                      <div className="text-right">Total</div>
                    </div>
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-6 gap-3 text-sm border-b pb-2 min-w-[560px]"
                      >
                        <div>
                          <p className="font-medium">
                            Item #{item.itemId}
                          </p>
                        </div>
                        <div className="text-right">{item.quantity}</div>
                        <div className="text-right tabular-nums">
                          {item.actualItemPrice != null
                            ? `${item.actualItemPrice.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : "—"}
                        </div>
                        <div className="text-right tabular-nums text-muted-foreground">
                          {item.otherUnitCost != null &&
                          item.otherUnitCost > 0
                            ? `${item.otherUnitCost.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : "—"}
                        </div>
                        <div className="text-right font-medium tabular-nums">
                          {item.unitPrice.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-right font-medium tabular-nums">
                          {item.total.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No items in this order</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">
                      {order.subtotal.toLocaleString()}
                    </span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span className="font-medium">
                        {order.tax.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{order.total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
