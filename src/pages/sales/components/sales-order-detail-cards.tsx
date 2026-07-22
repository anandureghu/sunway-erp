import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Mail,
  MapPin,
  Package,
  Phone,
  ReceiptText,
  Truck,
  User,
  Warehouse,
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
  const isPartiallyPaid = paymentStatus === "PARTIALLY_PAID";
  const isPaid = paymentStatus === "PAID";
  const paidAmount = (so.totalAmount ?? 0) - (so.outstandingAmount ?? 0);
  const nextStep =
    isPaid
      ? "Payment complete. Fulfillment can proceed."
      : isPartiallyPaid
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
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
            label="Payment status"
            value={
              <Badge
                variant={
                  isPaid
                    ? "default"
                    : isPartiallyPaid
                      ? "secondary"
                      : "outline"
                }
              >
                {paymentStatus.replace(/_/g, " ")}
              </Badge>
            }
          />
          <SummaryStat
            label="Order total"
            highlight
            value={<CurrencyAmount amount={so.totalAmount ?? 0} />}
          />
          <SummaryStat label="Order date" value={so.orderDate || "—"} />
          <SummaryStat label="Invoice due" value={so.invoiceDueDate || "Not set"} />
          {isPaid && so.paidDate ? (
            <SummaryStat label="Paid date" value={so.paidDate} />
          ) : null}
          <div className="col-span-2 min-w-0 rounded-xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" />
              Next step
            </p>
            <p className="mt-1 text-sm font-medium leading-snug text-slate-800">
              {nextStep}
            </p>
          </div>
        </div>

        {/* Partial payment breakdown */}
        {isPartiallyPaid && (
          <div className="mx-4 mb-4 grid grid-cols-3 gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="text-center">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total amount</p>
              <p className="mt-1 text-base font-bold text-slate-800">
                <CurrencyAmount amount={so.totalAmount ?? 0} />
              </p>
            </div>
            <div className="text-center border-x border-amber-200">
              <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">Paid amount</p>
              <p className="mt-1 text-base font-bold text-emerald-700">
                <CurrencyAmount amount={paidAmount > 0 ? paidAmount : 0} />
              </p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-medium uppercase tracking-wide text-rose-600">Due amount</p>
              <p className="mt-1 text-base font-bold text-rose-600">
                <CurrencyAmount amount={so.outstandingAmount ?? 0} />
              </p>
            </div>
          </div>
        )}

        {isPaid && (
          <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Fully paid — <span className="font-semibold"><CurrencyAmount amount={so.totalAmount ?? 0} /></span></span>
            {so.paidDate ? <span className="ml-auto text-xs text-emerald-700">on {so.paidDate}</span> : null}
          </div>
        )}
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
                  <col className="w-24" />
                  <col className="w-28" />
                </colgroup>
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium">SL</th>
                    <th className="px-4 py-3 text-left font-medium">Item</th>
                    <th className="px-3 py-3 text-right font-medium">Qty</th>
                    <th className="px-3 py-3 text-right font-medium">Unit price</th>
                    <th className="px-3 py-3 text-right font-medium">Discount</th>
                    <th className="px-3 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {itemRows.map((item, index) => {
                    const discount = item.discountPercent ?? 0;
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
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Warehouse className="h-3 w-3 shrink-0" />
                            <span className="font-medium">Warehouse:</span>
                            {item.warehouseName || "N/A"}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-right align-top">
                          {item.quantity || 0}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-right align-top">
                          <CurrencyAmount amount={item.unitPrice || 0} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-right align-top">
                          {discount > 0 ? (
                            <span className="text-amber-600 font-medium">{discount}%</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-right align-top font-semibold">
                          <CurrencyAmount amount={item.lineTotal || 0} />
                        </td>
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
