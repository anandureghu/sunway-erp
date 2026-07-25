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
  const displayAddress =
    shippingAddress || customerAddress || "No address on file";
  const showShippingNote =
    Boolean(shippingAddress) &&
    Boolean(customerAddress) &&
    shippingAddress.toLowerCase() !== customerAddress.toLowerCase();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:sticky lg:top-6">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <User className="h-4 w-4 text-sky-600" />
        <h2 className="text-base font-semibold text-slate-900">Customer</h2>
      </div>

      <div className="space-y-4 p-5">
        <div className="rounded-xl bg-sky-50/70 p-4">
          <p className="text-lg font-semibold leading-tight text-slate-900">
            {so.customerName || "N/A"}
          </p>
          {so.customerId != null ? (
            <p className="mt-1 text-xs text-slate-500">
              Customer ID: {String(so.customerId)}
            </p>
          ) : null}
          <div className="mt-3 space-y-2.5 text-sm">
            <div className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span className="break-all font-medium text-slate-800">
                {so.customerEmail || "—"}
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span className="font-medium text-slate-800">
                {so.customerPhone || "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-slate-200 p-4">
          <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <MapPin className="h-3.5 w-3.5" />
            {showShippingNote ? "Delivery address" : "Address"}
          </p>
          <p className="text-sm leading-relaxed text-slate-800">{displayAddress}</p>
          {showShippingNote ? (
            <div className="mt-4 border-t border-dashed border-slate-200 pt-3">
              <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <Truck className="h-3.5 w-3.5" />
                Customer address
              </p>
              <p className="text-sm leading-relaxed text-slate-700">
                {customerAddress}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <span>
            Invoice due{" "}
            <span className="font-semibold text-slate-800">
              {so.invoiceDueDate || "not set"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
