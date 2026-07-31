import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import {
  CalendarClock,
  Mail,
  MapPin,
  Phone,
  Truck,
  User,
} from "lucide-react";

type Props = {
  so: SalesOrderResponseDTO;
};

export function SalesOrderDetailCustomer({ so }: Props) {
  const shippingAddress =
    so.shippingAddress?.trim() || so.deliveryAddress?.trim() || "";
  const customerAddress = so.customerAddress?.trim() || "";
  const hasShipping = Boolean(shippingAddress);
  const hasCustomerAddress = Boolean(customerAddress);
  const showBothAddresses =
    hasShipping &&
    hasCustomerAddress &&
    shippingAddress.toLowerCase() !== customerAddress.toLowerCase();

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <User className="h-4 w-4 text-sky-600" />
        <h2 className="text-base font-semibold text-slate-900">Customer</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl bg-sky-50/70 p-3.5 sm:p-4">
          <p className="text-base font-semibold leading-tight text-slate-900 sm:text-lg">
            {so.customerName || "N/A"}
          </p>
          {so.customerId != null ? (
            <p className="mt-1 text-xs text-slate-500">
              Customer ID: {String(so.customerId)}
            </p>
          ) : null}
          <div className="mt-2.5 space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span className="break-all font-medium text-slate-800">
                {so.customerEmail || "—"}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span className="font-medium text-slate-800">
                {so.customerPhone || "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-slate-200 p-3.5 sm:p-4">
          {hasShipping ? (
            <>
              <p className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <Truck className="h-3.5 w-3.5" />
                Shipping address
              </p>
              <p className="text-sm leading-relaxed text-slate-800">
                {shippingAddress}
              </p>
            </>
          ) : null}

          {showBothAddresses ? (
            <div
              className={
                hasShipping
                  ? "mt-3 border-t border-dashed border-slate-200 pt-2.5"
                  : undefined
              }
            >
              <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
                Customer address
              </p>
              <p className="text-sm leading-relaxed text-slate-700">
                {customerAddress}
              </p>
            </div>
          ) : null}

          {!hasShipping && hasCustomerAddress ? (
            <>
              <p className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
                Customer address
              </p>
              <p className="text-sm leading-relaxed text-slate-800">
                {customerAddress}
              </p>
            </>
          ) : null}

          {!hasShipping && !hasCustomerAddress ? (
            <p className="text-sm text-slate-400">No address on file</p>
          ) : null}
        </div>

        <div className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 sm:col-span-2 sm:p-4 xl:col-span-1 xl:flex-col xl:gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <CalendarClock className="h-3.5 w-3.5" />
              Invoice date
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {so.orderDate || "—"}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <CalendarClock className="h-3.5 w-3.5" />
              Due date
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {so.invoiceDueDate || "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
