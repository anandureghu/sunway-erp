import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { MapPin, Truck, Warehouse } from "lucide-react";
import { Link } from "react-router-dom";
import { warehouseLabel } from "./item-detail-utils";

type Props = {
  item: ItemResponseDTO;
};

export function ItemDetailLocation({ item }: Props) {
  const warehouse = warehouseLabel(item);
  const address = item.warehouse_location?.trim() || null;
  const bin = item.location?.trim() || null;
  const supplier = item.preferredVendorName?.trim() || null;
  const supplierPart = item.supplierPartNo?.trim() || null;
  const leadTime =
    item.leadTimeDays != null ? `${item.leadTimeDays} days` : null;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-indigo-600" />
        <h2 className="text-base font-semibold text-slate-900">
          Location and supplier
        </h2>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Primary warehouse placement, bin, and preferred supplier for this SKU
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <Warehouse className="h-3.5 w-3.5" />
            Warehouse
          </div>
          {warehouse ? (
            item.warehouse_id ? (
              <Link
                to={`/inventory/warehouses/${item.warehouse_id}`}
                className="mt-2 block text-sm font-semibold text-slate-900 underline-offset-2 hover:underline"
              >
                {warehouse}
              </Link>
            ) : (
              <p className="mt-2 text-sm font-semibold text-slate-900">{warehouse}</p>
            )
          ) : (
            <p className="mt-2 text-sm font-semibold text-slate-900">Unassigned</p>
          )}
          <p className="mt-1 text-xs leading-snug text-slate-500">
            {address || "No warehouse address on file"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <MapPin className="h-3.5 w-3.5" />
            Bin / location
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">{bin || "—"}</p>
          <p className="mt-1 text-xs leading-snug text-slate-500">
            Shelf or bin identifier within the warehouse
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <Truck className="h-3.5 w-3.5" />
            Preferred supplier
          </div>
          {supplier && item.preferredVendorId ? (
            <Link
              to={`/inventory/purchase/suppliers/${item.preferredVendorId}`}
              className="mt-2 block text-sm font-semibold text-slate-900 underline-offset-2 hover:underline"
            >
              {supplier}
            </Link>
          ) : (
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {supplier || "—"}
            </p>
          )}
          <p className="mt-1 text-xs leading-snug text-slate-500">
            {[
              supplierPart ? `Part ${supplierPart}` : null,
              leadTime ? `Lead ${leadTime}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "No supplier linked"}
          </p>
        </div>
      </div>
    </section>
  );
}
