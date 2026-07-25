import type { ItemResponseDTO } from "@/service/erpApiTypes";
import {
  Box,
  FileText,
  Layers,
  MapPin,
  Tag,
} from "lucide-react";
import {
  formatOptionalDate,
  formatUnitLabel,
  safeLocaleQty,
} from "./formatters";
import { STATUS_LABELS } from "./item-detail-utils";

type Props = {
  item: ItemResponseDTO;
};

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

export function ItemDetailBody({ item }: Props) {
  const unit = item.unitMeasure || "pcs";
  const statusLabel =
    STATUS_LABELS[item.status ?? "active"] ??
    String(item.status ?? "active").replace(/_/g, " ");

  const highlights = [
    item.category
      ? {
          icon: Tag,
          title: item.category,
          body: item.subCategory
            ? `Sub-category: ${item.subCategory}`
            : "Primary catalog category",
        }
      : null,
    item.type
      ? {
          icon: Box,
          title: item.type,
          body: `Measured in ${formatUnitLabel(unit)}`,
        }
      : item.location
        ? {
            icon: MapPin,
            title: "Bin location",
            body: item.location,
          }
        : {
            icon: Layers,
            title: formatUnitLabel(unit),
            body: `Reorder at ${safeLocaleQty(item.reorderLevel, unit)}`,
          },
  ].filter(Boolean) as {
    icon: typeof Tag;
    title: string;
    body: string;
  }[];

  const specs: { label: string; value: string }[] = [
    { label: "Brand", value: item.brand?.trim() || "—" },
    { label: "Category", value: item.category?.trim() || "—" },
    { label: "Sub category", value: item.subCategory?.trim() || "—" },
    { label: "Item type", value: item.type?.trim() || "—" },
    { label: "Unit of measure", value: formatUnitLabel(unit) },
    { label: "Barcode", value: item.barcode?.trim() || "—" },
    { label: "Serial no.", value: item.serialNo?.trim() || "—" },
    { label: "Bin / location", value: item.location?.trim() || "—" },
    { label: "Date received", value: formatOptionalDate(item.dateReceived) },
    { label: "Sale by date", value: formatOptionalDate(item.expiryDate) },
    { label: "Status", value: statusLabel },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-900">
            Description &amp; Highlights
          </h2>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          {item.description?.trim() ||
            `${item.name} is listed in the inventory catalog${
              item.brand ? ` under ${item.brand}` : ""
            }${item.category ? ` in the ${item.category} category` : ""}. Stock is tracked by SKU ${
              item.sku || item.id
            }.`}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {highlights.map((h) => (
            <div
              key={h.title}
              className="rounded-xl border border-indigo-100/80 bg-indigo-50/50 p-4"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                <h.icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">{h.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{h.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Technical Specs</h2>
        <div className="mt-2 flex-1">
          {specs.map((row) => (
            <SpecRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      </div>
    </div>
  );
}
