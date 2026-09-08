import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { FileText } from "lucide-react";
import { formatUnitLabel } from "./formatters";

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

  const specs: { label: string; value: string }[] = [
    { label: "Brand", value: item.brand?.trim() || "—" },
    { label: "Manufacturer part no.", value: item.manufacturerPartNumber?.trim() || "—" },
    { label: "Model", value: item.model?.trim() || "—" },
    { label: "Category", value: item.category?.trim() || "—" },
    { label: "Sub category", value: item.subCategory?.trim() || "—" },
    { label: "Item type", value: item.type?.trim() || "—" },
    { label: "Criticality", value: item.criticality?.trim() || "—" },
    { label: "HSN / tariff code", value: item.hsnCode?.trim() || "—" },
    { label: "Unit of measure", value: formatUnitLabel(unit) },
    { label: "Weight", value: item.weightKg != null ? `${item.weightKg} kg` : "—" },
    { label: "Dimensions", value: item.dimensions?.trim() || "—" },
    {
      label: "Warranty",
      value:
        item.warrantyMonths != null ? `${item.warrantyMonths} months` : "—",
    },
    { label: "Barcode", value: item.barcode?.trim() || "—" },
    { label: "Serial no.", value: item.serialNo?.trim() || "—" },
  ];

  const remarks = item.remarks?.trim();

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-900">Description</h2>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          {item.description?.trim() ||
            `${item.name} is listed in the inventory catalog${
              item.brand ? ` under ${item.brand}` : ""
            }${item.category ? ` in the ${item.category} category` : ""}. Stock is tracked by SKU ${
              item.sku || "—"
            }.`}
        </p>

        {remarks ? (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Remarks
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{remarks}</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">
          Technical specifications
        </h2>
        <div className="mt-2 flex-1">
          {specs.map((row) => (
            <SpecRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      </div>
    </div>
  );
}
