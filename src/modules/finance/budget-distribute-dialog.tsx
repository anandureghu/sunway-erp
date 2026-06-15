"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
import type {
  BudgetDistributeDTO,
  BudgetResponseDTO,
  BudgetType,
} from "@/types/budget";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Calendar, DollarSign, X, ArrowRightLeft } from "lucide-react";
import SelectAccount from "@/components/select-account";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: BudgetResponseDTO | null;
  onSuccess?: () => void;
}

function creditAccountTypesForBudget(type?: BudgetType): string[] | undefined {
  switch (type) {
    case "OPEX":
      return ["EXPENSE", "COST"];
    case "CAPEX":
      return ["ASSET"];
    case "PROJECT":
      return undefined;
    default:
      return ["EXPENSE", "COST"];
  }
}

export function BudgetDistributeDialog({
  open,
  onOpenChange,
  budget,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<BudgetDistributeDTO>({
    creditAccountId: 0,
    amount: 0,
    notes: "",
    postedDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (open) {
      setForm({
        creditAccountId: 0,
        amount: 0,
        notes: "",
        postedDate: new Date().toISOString().slice(0, 10),
      });
    }
  }, [open, budget?.id]);

  const remaining = useMemo(() => {
    if (!budget) return 0;
    return budget.remainingAmount ?? (budget.amount ?? 0) - (budget.distributedAmount ?? 0);
  }, [budget]);

  const allowedTypes = creditAccountTypesForBudget(budget?.budgetType);

  const save = async () => {
    if (!budget) return;
    if (!form.creditAccountId) {
      toast.error("Credit account is required");
      return;
    }
    if (!form.amount || form.amount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    if (form.amount > remaining) {
      toast.error(`Amount exceeds remaining budget (${remaining.toLocaleString()})`);
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(`/finance/budgets/${budget.id}/distribute`, {
        creditAccountId: form.creditAccountId,
        amount: form.amount,
        notes: form.notes || null,
        postedDate: form.postedDate || null,
      });
      toast.success("Budget distributed successfully");
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
      toast.error("Failed to distribute budget", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl [&>button]:hidden"
        style={{ maxWidth: 520, width: "calc(100vw - 32px)" }}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/20 bg-blue-100 text-blue-600">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold text-white">
                Distribute Budget
              </DialogTitle>
              <p className="text-[12px] text-slate-300">
                {budget?.budgetName} · Remaining{" "}
                {remaining.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 bg-white p-6">
          <SelectAccount
            useId
            label="Credit account *"
            value={
              form.creditAccountId ? String(form.creditAccountId) : undefined
            }
            onChange={(v) =>
              setForm((p) => ({ ...p, creditAccountId: Number(v) }))
            }
            allowedTypes={allowedTypes}
            projectCode={
              budget?.budgetType === "PROJECT"
                ? budget.projectId ?? undefined
                : undefined
            }
            placeholder="Select account to credit"
          />

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Amount <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.amount || ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    amount: Number(e.target.value),
                  }))
                }
                className={cn(
                  "h-10 rounded-xl border-slate-200 pl-9 text-[13px]",
                )}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Remarks / Notes
            </label>
            <Textarea
              value={form.notes || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Optional notes for this distribution"
              className="min-h-[80px] rounded-xl border-slate-200 text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Date posted
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
              <Input
                type="date"
                value={form.postedDate || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, postedDate: e.target.value }))
                }
                className="h-10 rounded-xl border-slate-200 pl-9 text-[13px]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={loading}>
            {loading ? "Saving…" : "Distribute"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
