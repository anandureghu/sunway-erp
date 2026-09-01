import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { Calendar } from "lucide-react";
import {
  formatOptionalDate,
  formatRecordTimestamp,
} from "./formatters";

type Props = {
  item: ItemResponseDTO;
};

export function ItemDetailAudit({ item }: Props) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-4">
      <h2 className="text-base font-bold text-slate-900">Audit</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Receipt dates and catalog record timestamps
      </p>

      <div className="mt-3">
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">
          <Calendar className="h-3.5 w-3.5" />
          Dates
        </div>
        <div className="mt-2 space-y-1.5 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Received</span>
            <span className="font-semibold">
              {formatOptionalDate(item.dateReceived)}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Sale by</span>
            <span className="font-semibold">
              {formatOptionalDate(item.expiryDate)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
          Record
        </p>
        <div className="mt-2 space-y-1.5 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Created</span>
            <span className="font-semibold">
              {formatRecordTimestamp(item.createdAt)}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Updated</span>
            <span className="font-semibold">
              {formatRecordTimestamp(item.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
