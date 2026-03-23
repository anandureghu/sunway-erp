import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SalesOrder } from "@/types/sales";

type Props = {
  open: boolean;
  order: SalesOrder | null;
  onOpenChange: (open: boolean) => void;
};

export function SalesOrderDetailsDialog({ open, order, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details - {order?.orderNo}</DialogTitle>
          <DialogDescription>
            Complete information about this sales order
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
                    <Badge
                      className={
                        order.status === "confirmed"
                          ? "bg-blue-100 text-blue-800"
                          : order.status === "draft"
                            ? "bg-gray-100 text-gray-800"
                            : order.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                      }
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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
                  {order.requiredDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Required Date
                      </p>
                      <p className="font-medium">
                        {format(new Date(order.requiredDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.customerName ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Customer Name</p>
                      <p className="font-medium">{order.customerName}</p>
                    </div>
                    {order.customerId && (
                      <div>
                        <p className="text-sm text-muted-foreground">Customer ID</p>
                        <p className="font-medium">{order.customerId}</p>
                      </div>
                    )}
                    {order.customerEmail && (
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{order.customerEmail}</p>
                      </div>
                    )}
                    {order.customerPhone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{order.customerPhone}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Customer information not available
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
                  <div className="space-y-3">
                    <div className="grid grid-cols-5 gap-4 font-medium text-sm border-b pb-2">
                      <div>Item</div>
                      <div className="text-right">Quantity</div>
                      <div className="text-right">Unit Price</div>
                      <div className="text-right">Discount</div>
                      <div className="text-right">Total</div>
                    </div>
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-5 gap-4 text-sm border-b pb-2"
                      >
                        <div>
                          <p className="font-medium">
                            {item.itemName || `Item ${item.itemId}`}
                          </p>
                          {item.item?.sku && (
                            <p className="text-xs text-muted-foreground">
                              SKU: {item.item.sku}
                            </p>
                          )}
                        </div>
                        <div className="text-right">{item.quantity}</div>
                        <div className="text-right">
                          ₹{item.unitPrice.toLocaleString()}
                        </div>
                        <div className="text-right">{item.discount}%</div>
                        <div className="text-right font-medium">
                          ₹{item.total.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No items in this order</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
