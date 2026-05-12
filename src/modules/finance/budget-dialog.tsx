"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import type { BudgetCreateDTO, BudgetResponseDTO } from "@/types/budget";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  Hash,
  Calendar,
  X,
  TrendingUp,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: BudgetResponseDTO | null;
  companyId: number;
  onSuccess?: () => void;
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label,
  required,
  hint,
  icon,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="group space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
          {label}
          {required && <span className="ml-0.5 text-rose-400">*</span>}
        </label>
      </div>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
            {icon}
          </span>
        )}
        {children}
      </div>
      {hint && !error && (
        <p className="text-[11px] text-slate-400">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-rose-400">{error}</p>
      )}
    </div>
  );
}

// ── Styled input ──────────────────────────────────────────────────────────────
const fieldCls = (hasIcon = true) =>
  cn(
    "h-10 w-full rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300",
    "outline-none ring-0 transition-all duration-150",
    "focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]",
    hasIcon && "pl-9",
    !hasIcon && "px-3"
  );

export function BudgetDialog({
  open,
  onOpenChange,
  data,
  onSuccess,
}: Props) {
  const isEdit = !!data;
  const lockHeaderFields = isEdit && data?.status === "APPROVED";
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<BudgetCreateDTO>({
    budgetName: "",
    fiscalYear: "",
    startDate: "",
    endDate: "",
    amount: 0,
  });

  const update = (key: keyof BudgetCreateDTO, value: string | number) =>
    setForm((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    if (data) {
      setForm({
        budgetName: data.budgetName,
        fiscalYear: data.fiscalYear,
        startDate: data.startDate ?? "",
        endDate: data.endDate ?? "",
        amount: data.amount ?? 0,
      });
    } else {
      setForm({
        budgetName: "",
        fiscalYear: "",
        startDate: "",
        endDate: "",
        amount: 0,
      });
    }
  }, [data, open]);

  const saveBudget = async () => {
    setLoading(true);
    try {
      const payload = {
        budgetName: form.budgetName,
        fiscalYear: form.fiscalYear,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        amount: form.amount || 0,
      };

      if (data) {
        await apiClient.put(`/finance/budgets/${data.id}`, payload);
        if (data.status === "APPROVED") {
          toast.success("Budget revised");
        } else {
          toast.success("Saved as a new budget version");
        }
      } else {
        await apiClient.post("/finance/budgets", payload);
        toast.success("Budget created");
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error("Failed to save budget", {
        description: err.response?.data?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{ maxWidth: 580, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
      >
        {/* ── Top bar ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20 bg-emerald-100 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                {isEdit
                  ? data?.status === "APPROVED"
                    ? "Revise budget"
                    : "Edit budget (saves new version)"
                  : "Create new budget"}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {isEdit
                  ? "Update the fiscal year budget allocation"
                  : "Define a budget for a fiscal period"}
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

            {/* ── Section: Budget Info ── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
                  <TrendingUp className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  Budget details
                </span>
              </div>
              <div className="p-5 space-y-5">
                <Field
                  label="Budget name"
                  required
                  icon={<TrendingUp className="h-[15px] w-[15px]" />}
                >
                  <Input
                    value={form.budgetName}
                    onChange={(e) => update("budgetName", e.target.value)}
                    disabled={lockHeaderFields}
                    placeholder="e.g. Annual Marketing Budget"
                    className={fieldCls()}
                  />
                </Field>

                <Field
                  label="Fiscal year"
                  icon={<Hash className="h-[15px] w-[15px]" />}
                >
                  <Input
                    value={form.fiscalYear || ""}
                    onChange={(e) => update("fiscalYear", e.target.value)}
                    disabled={lockHeaderFields}
                    placeholder="2026"
                    className={cn(fieldCls(), "font-mono")}
                  />
                </Field>

                <Field
                  label="Total amount"
                  required
                  icon={<DollarSign className="h-[15px] w-[15px]" />}
                >
                  <Input
                    type="number"
                    value={form.amount || 0}
                    onChange={(e) => update("amount", Number(e.target.value))}
                    placeholder="0.00"
                    className={fieldCls()}
                  />
                </Field>
              </div>
            </div>

            {/* ── Section: Period Dates ── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                  <Calendar className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  Budget period
                </span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Start date"
                    icon={<Calendar className="h-[15px] w-[15px]" />}
                  >
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => update("startDate", e.target.value)}
                      disabled={lockHeaderFields}
                      className={fieldCls(false)}
                    />
                  </Field>

                  <Field
                    label="End date"
                    icon={<Calendar className="h-[15px] w-[15px]" />}
                  >
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => update("endDate", e.target.value)}
                      disabled={lockHeaderFields}
                      className={fieldCls(false)}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="text-[11px] text-slate-500">
            Fields marked <span className="text-rose-400">*</span> are required
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
              onClick={saveBudget}
              disabled={loading}
              className="h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-[13px] font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving…
                </span>
              ) : isEdit
                ? data?.status === "APPROVED"
                  ? "Revise budget"
                  : "Save new version"
                : "Create budget"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
