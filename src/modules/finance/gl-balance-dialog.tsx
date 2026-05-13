"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import type { CreateGLBalanceDTO, GLAccountBalance } from "@/types/gl";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import {
  Scale,
  Hash,
  Calendar,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";

export function GLBalanceDialog({
  open,
  onOpenChange,
  data,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: GLAccountBalance | null;
  onSuccess: (updated: GLAccountBalance, mode: "add" | "edit") => void;
}) {
  const isEdit = !!data;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<CreateGLBalanceDTO>({
    accountId: 0,
    fiscalYear: "",
    accountingPeriodStart: null,
    accountingPeriodEnd: null,
    totalAssets: 0,
    totalLiabilities: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    asOfDate: null,
  });

  const update = (key: keyof CreateGLBalanceDTO, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (data) {
      setForm({
        accountId: data.accountId,
        fiscalYear: data.fiscalYear,
        accountingPeriodStart: data.accountingPeriodStart,
        accountingPeriodEnd: data.accountingPeriodEnd,
        totalAssets: data.totalAssets,
        totalLiabilities: data.totalLiabilities,
        totalRevenue: data.totalRevenue,
        totalExpenses: data.totalExpenses,
        asOfDate: data.asOfDate || "",
      });
    }
  }, [data]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = data
        ? await apiClient.put(`/finance/gl/balance/${data.id}`, form)
        : await apiClient.post(`/finance/gl/balance`, form);
      onSuccess(res.data, data ? "edit" : "add");
      toast.success("Saved successfully");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{ maxWidth: 620, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
      >
        {/* ── Top bar ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20 bg-violet-100 text-violet-600">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                {data ? "Edit GL balance" : "Add GL balance"}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {data
                  ? "Update general ledger account balance"
                  : "Record a new general ledger balance entry"}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div
          className="overflow-y-auto bg-white px-6 py-5"
          style={{ maxHeight: "calc(92vh - 132px)" }}
        >
          <div className="space-y-5">

            {/* ── Section: Account & Period ── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
                  <Hash className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  Account &amp; period
                </span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Account ID
                    </label>
                    <Input
                      type="number"
                      value={form.accountId || ""}
                      onChange={(e) => update("accountId", Number(e.target.value))}
                      placeholder="1"
                      className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Fiscal year
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                        <Hash className="h-[15px] w-[15px]" />
                      </span>
                      <Input
                        value={form.fiscalYear}
                        onChange={(e) => update("fiscalYear", e.target.value)}
                        placeholder="2026"
                        className="h-10 pl-9 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Period start
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                        <Calendar className="h-[15px] w-[15px]" />
                      </span>
                      <Input
                        type="date"
                        value={form.accountingPeriodStart ?? ""}
                        onChange={(e) => update("accountingPeriodStart", e.target.value)}
                        className="h-10 pl-9 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Period end
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                        <Calendar className="h-[15px] w-[15px]" />
                      </span>
                      <Input
                        type="date"
                        value={form.accountingPeriodEnd ?? ""}
                        onChange={(e) => update("accountingPeriodEnd", e.target.value)}
                        className="h-10 pl-9 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      As of date
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                        <Calendar className="h-[15px] w-[15px]" />
                      </span>
                      <Input
                        type="date"
                        value={form.asOfDate ?? ""}
                        onChange={(e) => update("asOfDate", e.target.value)}
                        className="h-10 pl-9 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section: Balance Amounts ── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                  <Scale className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  Balance amounts
                </span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "totalAssets" as const, label: "Total assets", icon: TrendingUp },
                    { key: "totalLiabilities" as const, label: "Total liabilities", icon: TrendingDown },
                    { key: "totalRevenue" as const, label: "Total revenue", icon: DollarSign },
                    { key: "totalExpenses" as const, label: "Total expenses", icon: DollarSign },
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                        {label}
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                          <Icon className="h-[15px] w-[15px]" />
                        </span>
                        <Input
                          type="number"
                          value={form[key] || 0}
                          onChange={(e) => update(key, Number(e.target.value))}
                          placeholder="0.00"
                          className="h-10 pl-9 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="text-[11px] text-slate-500">
            All balance fields must be filled before saving
          </p>
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-[13px] font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving…
                </span>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Add balance"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
