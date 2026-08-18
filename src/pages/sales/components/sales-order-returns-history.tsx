"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/service/apiClient";
import { StatusBadge } from "@/lib/status-badge";
import { RotateCcw } from "lucide-react";

type ReturnLine = {
  itemId?: number;
  itemName?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
};

type SalesReturnRow = {
  id: number;
  returnNumber?: string;
  totalAmount?: number;
  reason?: string | null;
  restock?: boolean;
  status?: string;
  creditNoteNumber?: string | null;
  creditNoteStatus?: string | null;
  createdAt?: string;
  items?: ReturnLine[];
};

type Props = {
  salesOrderId: number;
  refreshKey?: number;
};

export function SalesOrderReturnsHistory({ salesOrderId, refreshKey = 0 }: Props) {
  const [rows, setRows] = useState<SalesReturnRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<SalesReturnRow[]>("/sales/returns", {
          params: { salesOrderId },
        });
        if (!cancelled) setRows(res.data ?? []);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [salesOrderId, refreshKey]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 text-sm text-slate-500 shadow-sm">
        Loading returns…
      </div>
    );
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
          <RotateCcw className="h-4 w-4 text-orange-600" />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-slate-800">
            Customer returns
          </h3>
          <p className="text-[12px] text-slate-500">
            Price adjustments and credit notes from returned items
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[13px] font-semibold text-slate-800">
                  {r.returnNumber ?? `#${r.id}`}
                </span>
                {r.status && <StatusBadge status={r.status} />}
                {r.creditNoteNumber && (
                  <span className="text-[12px] text-slate-600">
                    CN {r.creditNoteNumber}
                    {r.creditNoteStatus ? ` · ${r.creditNoteStatus}` : ""}
                  </span>
                )}
              </div>
              <div className="text-right text-[13px] font-semibold text-slate-800">
                {Number(r.totalAmount ?? 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            {r.reason && (
              <p className="mt-1 text-[12px] text-slate-500">{r.reason}</p>
            )}
            <p className="mt-1 text-[11px] text-slate-400">
              {(r.items ?? [])
                .map(
                  (i) =>
                    `${i.itemName ?? "Item"} × ${i.quantity ?? 0}${
                      r.restock ? " (restocked)" : ""
                    }`,
                )
                .join(" · ") || "—"}
              {r.createdAt
                ? ` · ${new Date(r.createdAt).toLocaleString()}`
                : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
