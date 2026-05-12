"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import type { JournalLineDTO } from "@/types/journal";
import SelectAccount from "@/components/select-account";
import { cn } from "@/lib/utils";
import {
  Hash,
  FileText,
  X,
  ArrowRightLeft,
  DollarSign,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journalId: number;
  line: JournalLineDTO | null;
  onSuccess: () => void;
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

export function JournalLineDialog({
  open,
  onOpenChange,
  journalId,
  line,
  onSuccess,
}: Props) {
  const isEdit = !!line;

  const [form, setForm] = useState({
    debitAccount: "",
    creditAccount: "",
    debitAmount: "",
    creditAmount: "",
    departmentId: "",
    projectId: "",
    currencyCode: "USD",
    exchangeRate: "1",
    description: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (line) {
      setForm({
        debitAccount: String(line.debitAccount),
        creditAccount: String(line.creditAccount),
        debitAmount: line.debitAmount?.toString() ?? "",
        creditAmount: line.creditAmount?.toString() ?? "",
        departmentId: line.departmentId?.toString() ?? "",
        projectId: line.projectId?.toString() ?? "",
        currencyCode: line.currencyCode ?? "USD",
        exchangeRate: line.exchangeRate?.toString() ?? "1",
        description: line.description ?? "",
      });
    } else {
      setForm({
        debitAccount: "",
        creditAccount: "",
        debitAmount: "",
        creditAmount: "",
        departmentId: "",
        projectId: "",
        currencyCode: "USD",
        exchangeRate: "1",
        description: "",
      });
    }
  }, [line]);

  const handleSave = async () => {
    try {
      const payload = {
        debitAccount: Number(form.debitAccount || 0),
        creditAccount: Number(form.creditAccount || 0),
        debitAmount: Number(form.debitAmount || 0),
        creditAmount: Number(form.creditAmount || 0),
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        projectId: form.projectId ? Number(form.projectId) : null,
        currencyCode: form.currencyCode,
        exchangeRate: Number(form.exchangeRate || 1),
        description: form.description,
      };

      if (!payload.debitAccount && !payload.creditAccount) {
        toast.error("At least one account is required");
        return;
      }

      if (isEdit) {
        await apiClient.put(
          `/finance/journal-entries/${journalId}/lines/${line!.id}`,
          payload,
        );
        toast.success("Journal line updated");
      } else {
        await apiClient.post(
          `/finance/journal-entries/${journalId}/lines`,
          payload,
        );
        toast.success("Journal line added");
      }

      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to save journal line");
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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20 bg-indigo-100 text-indigo-600">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                {isEdit ? "Edit journal line" : "Add journal line"}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {isEdit
                  ? "Update a line in this journal entry"
                  : "Add a new debit/credit line"}
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

            {/* ── Section: Account Pair ── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
                  <ArrowRightLeft className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  Account pair
                </span>
              </div>
              <div className="p-5 space-y-5">
                <Field
                  label="Debit account"
                  required
                  icon={<Hash className="h-[15px] w-[15px]" />}
                >
                  <SelectAccount
                    label=""
                    value={form.debitAccount}
                    onChange={(v) => update("debitAccount", v)}
                    placeholder="Select debit account"
                    useId
                  />
                </Field>

                <Field
                  label="Credit account"
                  required
                  icon={<Hash className="h-[15px] w-[15px]" />}
                >
                  <SelectAccount
                    label=""
                    value={form.creditAccount}
                    onChange={(v) => update("creditAccount", v)}
                    placeholder="Select credit account"
                    useId
                  />
                </Field>
              </div>
            </div>

            {/* ── Section: Amount & Details ── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                  <DollarSign className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  Amount &amp; details
                </span>
              </div>
              <div className="p-5 space-y-5">
                <Field
                  label="Amount"
                  required
                  icon={<DollarSign className="h-[15px] w-[15px]" />}
                >
                  <Input
                    type="number"
                    value={form.debitAmount}
                    onChange={(e) => {
                      update("debitAmount", e.target.value);
                      update("creditAmount", e.target.value);
                    }}
                    placeholder="0.00"
                    className={fieldCls()}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
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

                  <Field
                    label="Department ID"
                    icon={<Hash className="h-[15px] w-[15px]" />}
                  >
                    <Input
                      value={form.departmentId}
                      onChange={(e) => update("departmentId", e.target.value)}
                      placeholder="1"
                      className={fieldCls()}
                    />
                  </Field>
                </div>

                <Field
                  label="Description"
                  hint="Optional description for this journal line"
                  icon={<FileText className="h-[15px] w-[15px]" />}
                >
                  <Input
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Office supplies, Dubai branch..."
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
              onClick={handleSave}
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
