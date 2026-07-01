import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import {
  CalendarClock,
  CreditCard,
  Mail,
  MapPin,
  Package,
  Phone,
  ReceiptText,
  Truck,
  User,
} from "lucide-react";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import type { ReactNode } from "react";

type Props = {
  so: SalesOrderResponseDTO;
};

function SummaryStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div
        className={`mt-1 truncate text-sm font-semibold ${highlight ? "text-base" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

export function SalesOrderDetailCards({ so }: Props) {
  const totalItems = (so.items || []).reduce(
    (acc, item) => acc + (item.quantity || 0),
    0,
  );
  const itemRows = so.items || [];
  const status = (so.status || "draft").toUpperCase();
  const showCogs = status !== "DRAFT" && status !== "CANCELLED";

  const totalRevenue = so.totalAmount ?? 0;
  const totalCogs = itemRows.reduce(
    (sum, line) => sum + (line.cogsAmount ?? 0),
    0,
  );
  const hasFifoCogs = itemRows.some((line) => (line.cogsAmount ?? 0) > 0);
  const grossMargin = totalRevenue - totalCogs;
  const marginPct =
    totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : null;

  const shippingAddress =
    so.shippingAddress?.trim() || so.deliveryAddress?.trim() || "";
  const customerAddress = so.customerAddress?.trim() || "";
  const displayAddress =
    shippingAddress || customerAddress || "No address on file";
  const showShippingNote =
    shippingAddress &&
    customerAddress &&
    shippingAddress.toLowerCase() !== customerAddress.toLowerCase();

  const paymentStatus = (so.paymentStatus || "UNPAID").toUpperCase();
  const nextStep =
    paymentStatus === "PAID"
      ? "Payment complete. Fulfillment can proceed."
      : paymentStatus === "PARTIALLY_PAID"
        ? "Partially paid. Fulfillment can proceed; remaining balance is outstanding."
        : "Awaiting payment before fulfillment.";

  return (
    <div className="space-y-6">
      {/* Order summary — full width strip */}
      <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-50 via-white to-blue-50/40 shadow-sm">
        <div className="border-b border-slate-200/80 bg-white/50 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Order summary</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Key order details at a glance
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8">
          <SummaryStat label="Order no." value={so.orderNumber || "N/A"} />
          <SummaryStat
            label="Order status"
            value={
              <Badge variant="secondary" className="capitalize">
                {(so.status || "draft").toLowerCase()}
              </Badge>
            }
          />
          <SummaryStat
            label="Payment"
            value={
              <Badge
                variant={
                  paymentStatus === "PAID"
                    ? "default"
                    : paymentStatus === "PARTIALLY_PAID"
                      ? "secondary"
                      : "outline"
                }
              >
                {paymentStatus.replace(/_/g, " ")}
              </Badge>
            }
          />
          <SummaryStat
            label="Line items"
            value={`${itemRows.length} (${totalItems} qty)`}
          />
          <SummaryStat
            label="Order total"
            highlight
            value={<CurrencyAmount amount={so.totalAmount ?? 0} />}
          />
          <SummaryStat
            label="Order date"
            value={so.orderDate || "—"}
          />
          <SummaryStat
            label="Invoice due"
            value={so.invoiceDueDate || "Not set"}
          />
          <div className="col-span-2 min-w-0 rounded-xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm sm:col-span-3 lg:col-span-2 xl:col-span-2">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" />
              Next step
            </p>
            <p className="mt-1 text-sm font-medium leading-snug text-slate-800">
              {nextStep}
            </p>
          </div>
        </div>
      </section>

      {/* Items + customer */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="shadow-sm lg:col-span-8">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="h-4 w-4" />
              Items ordered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[720px] text-sm">
                <colgroup>
                  <col className="w-14" />
                  <col />
                  <col className="w-16" />
                  <col className="w-28" />
                  <col className="w-28" />
                  {showCogs ? (
                    <>
                      <col className="w-24" />
                      <col className="w-24" />
                      <col className="w-24" />
                    </>
                  ) : null}
                </colgroup>
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium">SL</th>
                    <th className="px-4 py-3 text-left font-medium">Item</th>
                    <th className="px-3 py-3 text-right font-medium">Qty</th>
                    <th className="px-3 py-3 text-right font-medium">
                      Unit price
                    </th>
                    <th className="px-3 py-3 text-right font-medium">Amount</th>
                    {showCogs ? (
                      <>
                        <th className="px-3 py-3 text-right font-medium">
                          FIFO cost
                        </th>
                        <th className="px-3 py-3 text-right font-medium">
                          COGS
                        </th>
                        <th className="px-3 py-3 text-right font-medium">
                          Margin
                        </th>
                      </>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {itemRows.map((item, index) => {
                    const lineCogs = item.cogsAmount ?? 0;
                    const lineRevenue = item.lineTotal ?? 0;
                    const lineMargin = lineRevenue - lineCogs;
                    return (
                      <tr
                        key={item.itemId}
                        className="border-t border-border/60"
                      >
                        <td className="px-3 py-3 align-top text-muted-foreground">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <p className="font-medium leading-snug">
                            {item.itemName || "Unnamed item"}
                          </p>
                          <p className="mt-1 text-xs leading-snug text-muted-foreground">
                            Warehouse: {item.warehouseName || "N/A"}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-right align-top">
                          {item.quantity || 0}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-right align-top">
                          <CurrencyAmount amount={item.unitPrice || 0} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-right align-top font-semibold">
                          <CurrencyAmount amount={item.lineTotal || 0} />
                        </td>
                        {showCogs ? (
                          <>
                            <td className="whitespace-nowrap px-3 py-3 text-right align-top text-muted-foreground">
                              {(item.fifoUnitCost ?? 0) > 0 ? (
                                <CurrencyAmount
                                  amount={item.fifoUnitCost ?? 0}
                                />
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-right align-top">
                              {lineCogs > 0 ? (
                                <CurrencyAmount amount={lineCogs} />
                              ) : (
                                "—"
                              )}
                            </td>
                            <td
                              className={`whitespace-nowrap px-3 py-3 text-right align-top font-medium ${
                                lineMargin >= 0
                                  ? "text-emerald-600"
                                  : "text-red-600"
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Separator className="my-4" />
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>
                  Total items:{" "}
                  <span className="font-medium text-foreground">
                    {totalItems}
                  </span>
                </span>
              </div>
              <div className="text-base font-semibold">
                Order total:{" "}
                <CurrencyAmount amount={so.totalAmount || 0} />
              </div>
            </div>
            {showCogs && hasFifoCogs ? (
              <>
                <Separator className="my-3" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">
                      Total COGS (FIFO)
                    </span>
                    <CurrencyAmount amount={totalCogs} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm font-semibold">
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
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-4">
          <Card className="shadow-sm lg:sticky lg:top-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-xl border bg-slate-50/80 p-4">
                <p className="text-lg font-semibold leading-tight">
                  {so.customerName || "N/A"}
                </p>
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="break-all font-medium">
                      {so.customerEmail || "—"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium">
                      {so.customerPhone || "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4">
                <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {showShippingNote ? "Delivery address" : "Address"}
                </p>
                <p className="text-sm leading-relaxed text-slate-800">
                  {displayAddress}
                </p>
                {showShippingNote ? (
                  <div className="mt-4 border-t border-dashed pt-3">
                    <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <Truck className="h-3.5 w-3.5" />
                      Customer address
                    </p>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {customerAddress}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-blue-50/60 px-3 py-2.5 text-xs text-blue-900/80">
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Invoice due{" "}
                  <span className="font-semibold">
                    {so.invoiceDueDate || "not set"}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
