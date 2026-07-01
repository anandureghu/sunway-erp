import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import {
  CalendarClock,
  CreditCard,
  Mail,
  Phone,
  ReceiptText,
  User,
} from "lucide-react";
import { CurrencyAmount } from "@/components/currency/currency-amount";

type Props = {
  so: SalesOrderResponseDTO;
};

export function SalesOrderDetailCards({ so }: Props) {
  const totalItems = (so.items || []).reduce(
    (acc, item) => acc + (item.quantity || 0),
    0,
  );
  const itemRows = so.items || [];
  const status = (so.status || "draft").toUpperCase();
  const showCogs = status !== "DRAFT" && status !== "CANCELLED";

  const totalRevenue = so.totalAmount ?? 0;
  const totalCogs = itemRows.reduce((sum, line) => sum + (line.cogsAmount ?? 0), 0);
  const hasFifoCogs = itemRows.some((line) => (line.cogsAmount ?? 0) > 0);
  const grossMargin = totalRevenue - totalCogs;
  const marginPct =
    totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : null;

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
                    <th className="px-4 py-3 text-right font-medium">
                      Unit Price
                    </th>
                    {showCogs ? (
                      <>
                        <th className="px-4 py-3 text-right font-medium">
                          FIFO cost
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          COGS
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Margin
                        </th>
                      </>
                    ) : null}
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {itemRows.map((item) => {
                    const lineCogs = item.cogsAmount ?? 0;
                    const lineRevenue = item.lineTotal ?? 0;
                    const lineMargin = lineRevenue - lineCogs;
                    return (
                    <tr key={item.itemId} className="border-t">
                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {item.itemName || "Unnamed item"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Warehouse: {item.warehouseName || "N/A"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.quantity || 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <CurrencyAmount amount={item.unitPrice || 0} />
                      </td>
                      {showCogs ? (
                        <>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {(item.fifoUnitCost ?? 0) > 0 ? (
                              <CurrencyAmount amount={item.fifoUnitCost ?? 0} />
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {lineCogs > 0 ? (
                              <CurrencyAmount amount={lineCogs} />
                            ) : (
                              "—"
                            )}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-medium ${
                              lineMargin >= 0 ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {lineCogs > 0 ? (
                              <CurrencyAmount amount={lineMargin} />
                            ) : (
                              "—"
                            )}
                          </td>
                        </>
                      ) : null}
                      <td className="px-4 py-3 text-right font-semibold">
                        <CurrencyAmount amount={item.lineTotal || 0} />
                      </td>
                    </tr>
                    );
                  })}
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
              <span>
                <CurrencyAmount amount={so.totalAmount || 0} />
              </span>
            </div>
            {showCogs && hasFifoCogs ? (
              <>
                <Separator className="my-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total COGS (FIFO)</span>
                  <span>
                    <CurrencyAmount amount={totalCogs} />
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Gross margin</span>
                  <span
                    className={
                      grossMargin >= 0 ? "text-emerald-600" : "text-red-600"
                    }
                  >
                    <CurrencyAmount amount={grossMargin} />
                    {marginPct !== null ? (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        ({marginPct.toFixed(1)}%)
                      </span>
                    ) : null}
                  </span>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4">
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

          {/* <Card className="shadow-sm">
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
          </Card> */}
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
                variant={
                  (so.paymentStatus || "").toUpperCase() === "PAID"
                    ? "default"
                    : (so.paymentStatus || "").toUpperCase() === "PARTIALLY_PAID"
                      ? "secondary"
                      : "outline"
                }
              >
                {(so.paymentStatus || "UNPAID").replace(/_/g, " ")}
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
                <span>
                  <CurrencyAmount amount={so.totalAmount || 0} />
                </span>
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
                  : (so.paymentStatus || "").toUpperCase() === "PARTIALLY_PAID"
                    ? "Partially paid. Fulfillment can proceed; remaining balance is outstanding."
                    : "Awaiting payment before fulfillment."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
