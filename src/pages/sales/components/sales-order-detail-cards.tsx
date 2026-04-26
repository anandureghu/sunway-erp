import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import { Building2, CalendarClock, CreditCard, Mail, Phone, ReceiptText, User } from "lucide-react";

type Props = {
  so: SalesOrderResponseDTO;
};

export function SalesOrderDetailCards({ so }: Props) {
  const totalItems = (so.items || []).reduce((acc, item) => acc + (item.quantity || 0), 0);
  const itemRows = so.items || [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ReceiptText className="h-4 w-4" />
              Items Ordered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Item</th>
                    <th className="px-4 py-3 text-right font-medium">Qty</th>
                    <th className="px-4 py-3 text-right font-medium">Unit Price</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {itemRows.map((item) => (
                    <tr key={item.itemId} className="border-t">
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.itemName || "Unnamed item"}</p>
                        <p className="text-xs text-muted-foreground">
                          Warehouse: {item.warehouseName || "N/A"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">{item.quantity || 0}</td>
                      <td className="px-4 py-3 text-right">{(item.unitPrice || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {(item.lineTotal || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Separator className="my-4" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Items</span>
              <span className="font-medium">{totalItems}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold mt-2">
              <span>Order Total</span>
              <span>{(so.totalAmount || 0).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{so.customerName || "N/A"}</p>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <p className="font-medium">{so.customerEmail || "N/A"}</p>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <p className="font-medium">{so.customerPhone || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Accounting Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Bank Account</p>
                <p className="font-medium">{so.bankAccountName || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Debit Account</p>
                <p className="font-medium">{so.debitAccountName || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Credit Account</p>
                <p className="font-medium">{so.creditAccountName || "N/A"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="shadow-sm xl:sticky xl:top-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Order Number</span>
              <span className="font-medium">{so.orderNumber || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Order Status</span>
              <Badge variant="secondary" className="capitalize">
                {(so.status || "draft").toLowerCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Payment Status</span>
              <Badge
                variant={(so.paymentStatus || "").toUpperCase() === "PAID" ? "default" : "outline"}
              >
                {(so.paymentStatus || "UNPAID").replace("_", " ")}
              </Badge>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Items</span>
                <span>{itemRows.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Units</span>
                <span>{totalItems}</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-base">
                <span>Total</span>
                <span>{(so.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-muted-foreground flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Invoice Due Date
              </p>
              <p className="font-medium">{so.invoiceDueDate || "Not set"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Next Step
              </p>
              <p className="font-medium">
                {(so.paymentStatus || "").toUpperCase() === "PAID"
                  ? "Payment complete. Fulfillment can proceed."
                  : "Awaiting payment before fulfillment."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
