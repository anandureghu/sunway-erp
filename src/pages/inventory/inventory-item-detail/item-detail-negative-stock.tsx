import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { Ban } from "lucide-react";

type Props = {
  item: ItemResponseDTO;
};

export function ItemDetailNegativeStock({ item }: Props) {
  const allowed = Boolean(item.negativeStockPermitted);

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-4">
      <div className="flex items-center gap-2">
        <Ban className="h-4 w-4 text-indigo-600" />
        <h2 className="text-base font-bold text-slate-900">
          Negative stock permitted
        </h2>
      </div>
      <p className="mt-0.5 text-xs text-slate-500">
        Whether sales can exceed available warehouse quantity
      </p>
      <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-slate-100 pt-3">
        <span className="text-sm text-slate-500">Allowed</span>
        <span className="text-sm font-semibold text-slate-900">
          {allowed ? "Yes" : "No"}
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-slate-500">
        {allowed
          ? "Sales may exceed available warehouse quantity."
          : "Sales cannot exceed available stock at the selected warehouse."}
      </p>
    </section>
  );
}
