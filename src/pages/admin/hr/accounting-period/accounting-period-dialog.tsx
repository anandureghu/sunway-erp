"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiClient } from "@/service/apiClient";
import {
  Calendar,
  Hash,
  X,
  CalendarDays,
} from "lucide-react";
import type { AccountingPeriod as AccountingPeriodDTO } from "@/types/accounting-period";

interface AccountingPeriodFormValue {
  id?: number;
  periodName: string;
  startDate: string;
  endDate: string;
}

interface AccountPeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountPeriod?: AccountingPeriodFormValue | null;
  onSuccess: (dept: AccountingPeriodDTO, mode: "add" | "edit") => void;
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

export const AccountPeriodDialog = ({
  open,
  onOpenChange,
  accountPeriod,
  onSuccess,
}: AccountPeriodDialogProps) => {
  const isEdit = !!accountPeriod?.id;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    periodName: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (open) {
      if (accountPeriod) {
        setForm({
          periodName: accountPeriod.periodName ?? "",
          startDate: accountPeriod.startDate ?? "",
          endDate: accountPeriod.endDate ?? "",
        });
      } else {
        setForm({ periodName: "", startDate: "", endDate: "" });
      }
    }
  }, [open, accountPeriod]);

  const patch = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.periodName.trim()) {
      toast.error("Period name is required");
      return;
    }
    if (!form.startDate) {
      toast.error("Start date is required");
      return;
    }
    if (!form.endDate) {
      toast.error("End date is required");
      return;
    }

    setLoading(true);
    try {
      const res = isEdit
        ? await apiClient.put(`/accounting-periods/${accountPeriod!.id}`, form)
        : await apiClient.post("/accounting-periods", form);
      toast.success(
        isEdit
          ? "Accounting period updated successfully"
          : "Accounting period added successfully"
      );
      onSuccess(res.data, isEdit ? "edit" : "add");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save accounting period");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{ maxWidth: 540, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
      >
        {/* ── Top bar ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20 bg-amber-100 text-amber-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                {isEdit ? "Edit accounting period" : "Add accounting period"}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {isEdit
                  ? "Update the fiscal period dates and name"
                  : "Define a new fiscal reporting period"}
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

            {/* ── Section: Period Identity ── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
                  <Calendar className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  Period identity
                </span>
              </div>
              <div className="p-5 space-y-5">
                <Field
                  label="Period name"
                  required
                  hint="e.g. FY-2026, Q1-2026, January 2026"
                  icon={<Hash className="h-[15px] w-[15px]" />}
                >
                  <Input
                    placeholder="FY-2026"
                    value={form.periodName}
                    onChange={(e) => patch("periodName", e.target.value.toUpperCase())}
                    className={cn(fieldCls(), "font-mono")}
                  />
                </Field>
              </div>
            </div>

            {/* ── Section: Period Dates ── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                  <CalendarDays className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  Period dates
                </span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Start date"
                    required
                    icon={<Calendar className="h-[15px] w-[15px]" />}
                  >
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => patch("startDate", e.target.value)}
                      className={fieldCls(false)}
                    />
                  </Field>

                  <Field
                    label="End date"
                    required
                    icon={<Calendar className="h-[15px] w-[15px]" />}
                  >
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => patch("endDate", e.target.value)}
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
              onClick={handleSubmit}
              disabled={loading}
              className="h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-[13px] font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {isEdit ? "Saving…" : "Creating…"}
                </span>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create period"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
