"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import type { BudgetLineDTO } from "@/types/budget";
import SelectAccount from "@/components/select-account";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import SelectDepartment from "@/components/select-department";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  Wallet,
  Hash,
  Calendar,
  X,
  FileText,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  line: BudgetLineDTO | null;
  onSuccess: () => void;
  budgetId: number;
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

export function BudgetLineDialog({
  open,
  onOpenChange,
  budgetId,
  line,
  onSuccess,
}: Props) {
  const isEdit = !!line;
  const { company } = useAuth();

  const [form, setForm] = useState({
    accountId: "",
    departmentId: "",
    projectId: "",
    amount: "",
    notes: "",
    startDate: "",
    endDate: "",
  });

  const update = (key: string, value: any) =>
    setForm((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    if (!line) {
      setForm({
        accountId: "",
        departmentId: "",
        projectId: "",
        amount: "",
        notes: "",
        startDate: "",
        endDate: "",
      });
    } else {
      setForm({
        accountId: String(line.accountId),
        departmentId: line.departmentId?.toString() || "",
        projectId: line.projectId?.toString() || "",
        amount: line.amount.toString(),
        notes: line.notes ?? "",
        startDate: line.startDate ?? "",
        endDate: line.endDate ?? "",
      });
    }
  }, [line]);

  const save = async () => {
    try {
      const newLine: BudgetLineDTO = {
        accountId: Number(form.accountId),
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        projectId: form.projectId ? form.projectId : null,
        amount: Number(form.amount),
        notes: form.notes,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };

      if (isEdit) {
        await apiClient.put(`/finance/budgets/${budgetId}/lines/${line!.id}`, newLine);
        toast.success("Budget distribution updated");
      } else {
        await apiClient.post(`/finance/budgets/${budgetId}/lines`, newLine);
        toast.success("Budget distribution added");
      }

      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to save budget distribution", {
        description: e.response?.data?.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{ maxWidth: 600, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
      >
        {/* ── Top bar ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20 bg-blue-100 text-blue-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                {isEdit ? "Edit budget distribution" : "Add budget distribution"}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {isEdit
                  ? "Update budget line details"
                  : "Allocate budget across accounts and departments"}
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

            {/* ── Section: Account Assignment ── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
                  <Wallet className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  Account assignment
                </span>
              </div>
              <div className="p-5 space-y-5">
                <Field
                  label="Account"
                  required
                  icon={<Hash className="h-[15px] w-[15px]" />}
                >
                  <SelectAccount
                    value={form.accountId}
                    onChange={(v) => update("accountId", v)}
                    useId
                  />
                </Field>

                <div
                  className={cn(
                    "space-y-4 p-4 border border-dashed rounded-xl",
                    !form.departmentId && !form.projectId
                      ? "border-slate-300 bg-slate-50/50"
                      : "border-transparent bg-transparent",
                  )}
                >
                  {!form.projectId && (
                    <Field
                      label="Department"
                      icon={<FileText className="h-[15px] w-[15px]" />}
                    >
                      <SelectDepartment
                        value={form.departmentId?.toString()}
                        onChange={(v) => update("departmentId", v)}
                        companyId={company?.id || 0}
                      />
                    </Field>
                  )}

                  {(!form.departmentId && !form.projectId) && (
                    <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-slate-300">
                      OR
                    </p>
                  )}

                  {!form.departmentId && (
                    <Field
                      label="Project ID"
                      icon={<Hash className="h-[15px] w-[15px]" />}
                    >
                      <Input
                        value={form.projectId}
                        onChange={(e) => update("projectId", e.target.value)}
                        placeholder="2000"
                        className={fieldCls()}
                      />
                    </Field>
                  )}
                </div>
              </div>
            </div>

            {/* ── Section: Amount & Notes ── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                  <FileText className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  Allocation
                </span>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Start date"
                    icon={<Calendar className="h-[15px] w-[15px]" />}
                  >
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => update("startDate", e.target.value)}
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
                      className={fieldCls(false)}
                    />
                  </Field>
                </div>

                <Field
                  label="Amount"
                  required
                  icon={<Wallet className="h-[15px] w-[15px]" />}
                >
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={(e) => update("amount", e.target.value)}
                    placeholder="0.00"
                    className={fieldCls()}
                  />
                </Field>

                <Field
                  label="Notes"
                  hint="Optional notes or reference for this allocation"
                  icon={<FileText className="h-[15px] w-[15px]" />}
                >
                  <Input
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder="Marketing department allocation for Q2"
                    className={fieldCls()}
                  />
                </Field>
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
              onClick={save}
              className="h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-[13px] font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {isEdit ? "Update line" : "Add line"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
