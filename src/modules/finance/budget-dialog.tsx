"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import type {
  BudgetCreateDTO,
  BudgetResponseDTO,
  BudgetType,
} from "@/types/budget";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SelectAccount from "@/components/select-account";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: BudgetResponseDTO | null;
  companyId: number;
  onSuccess?: () => void;
}

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

const fieldCls = (hasIcon = true) =>
  cn(
    "h-10 w-full rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300",
    "outline-none ring-0 transition-all duration-150",
    "focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]",
    hasIcon && "pl-9",
    !hasIcon && "px-3",
  );

const BUDGET_TYPE_OPTIONS: { value: BudgetType; label: string; hint: string }[] =
  [
    {
      value: "OPEX",
      label: "OPEX — Operational",
      hint: "Distributed to expense and cost accounts",
    },
    {
      value: "CAPEX",
      label: "CAPEX — Capital",
      hint: "Distributed to fixed asset accounts only",
    },
    {
      value: "PROJECT",
      label: "Project",
      hint: "Specific to a project; distributed to matching project accounts",
    },
  ];

export function BudgetDialog({
  open,
  onOpenChange,
  data,
  onSuccess,
}: Props) {
  const isRevise =
    !!data && data.status === "APPROVED" && data.isActive !== false;
  const lockHeaderFields = isRevise;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<BudgetCreateDTO>({
    budgetName: "",
    fiscalYear: "",
    startDate: "",
    endDate: "",
    amount: 0,
    budgetType: "OPEX",
    budgetAccountId: 0,
    projectId: "",
  });

  const update = (
    key: keyof BudgetCreateDTO,
    value: string | number,
  ) => setForm((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    if (data) {
      setForm({
        budgetName: data.budgetName,
        fiscalYear: data.fiscalYear,
        startDate: data.startDate ?? "",
        endDate: data.endDate ?? "",
        amount: data.amount ?? 0,
        budgetType: data.budgetType ?? "OPEX",
        budgetAccountId: data.budgetAccountId ?? 0,
        projectId: data.projectId ?? "",
      });
    } else {
      setForm({
        budgetName: "",
        fiscalYear: "",
        startDate: "",
        endDate: "",
        amount: 0,
        budgetType: "OPEX",
        budgetAccountId: 0,
        projectId: "",
      });
    }
  }, [data, open]);

  const saveBudget = async () => {
    if (!isRevise) {
      if (!form.budgetAccountId) {
        toast.error("Budget account is required");
        return;
      }
      if (form.budgetType === "PROJECT" && !form.projectId?.trim()) {
        toast.error("Project ID is required for project budgets");
        return;
      }
    }

    setLoading(true);
    try {
      if (isRevise && data) {
        await apiClient.put(`/finance/budgets/${data.id}`, {
          amount: form.amount || 0,
        });
        toast.success("Budget revised");
      } else {
        const payload = {
          budgetName: form.budgetName,
          fiscalYear: form.fiscalYear,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          amount: form.amount || 0,
          budgetType: form.budgetType,
          budgetAccountId: form.budgetAccountId,
          projectId:
            form.budgetType === "PROJECT" ? form.projectId?.trim() : null,
        };
        await apiClient.post("/finance/budgets", payload);
        toast.success("Budget created");
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
          ? String((err.response.data as { message?: string }).message)
          : undefined;
      toast.error(isRevise ? "Failed to revise budget" : "Failed to save budget", {
        description: message,
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
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20 bg-emerald-100 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                {isRevise ? "Revise budget" : "Create new budget"}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {isRevise
                  ? "Update the approved budget amount"
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

        <div
          className="overflow-y-auto bg-white px-6 py-5"
          style={{ maxHeight: "calc(92vh - 132px)" }}
        >
          <div className="space-y-5">
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
                <Field label="Budget type" required>
                  <Select
                    value={form.budgetType}
                    onValueChange={(v) => update("budgetType", v)}
                    disabled={lockHeaderFields}
                  >
                    <SelectTrigger className={fieldCls(false)}>
                      <SelectValue placeholder="Select budget type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUDGET_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {form.budgetType === "PROJECT" && (
                  <Field label="Project ID" required icon={<Hash className="h-[15px] w-[15px]" />}>
                    <Input
                      value={form.projectId || ""}
                      onChange={(e) => update("projectId", e.target.value)}
                      disabled={lockHeaderFields}
                      placeholder="Project code"
                      className={fieldCls()}
                    />
                  </Field>
                )}

                {!isRevise && (
                  <SelectAccount
                    useId
                    label="Budget account *"
                    value={
                      form.budgetAccountId
                        ? String(form.budgetAccountId)
                        : undefined
                    }
                    onChange={(v) => update("budgetAccountId", Number(v))}
                    allowedTypes={["BUDGET"]}
                    placeholder="Select budget COA account"
                  />
                )}

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
              ) : isRevise ? (
                "Revise budget"
              ) : (
                "Create budget"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
