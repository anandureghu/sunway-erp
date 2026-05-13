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
  Landmark,
  Hash,
  CreditCard,
  User,
  X,
  CheckCircle2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { BankAccount } from "@/types/bank-account";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: number;
  bankAccount?: BankAccount;
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

export function BankAccountDialog({
  open,
  onOpenChange,
  companyId,
  bankAccount,
  onSuccess,
}: Props) {
  const isEdit = !!bankAccount;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    bankName: "",
    accountNumber: "",
    iban: "",
    ifscCode: "",
    branchName: "",
    accountHolderName: "",
    primaryAccount: false,
  });

  useEffect(() => {
    if (bankAccount && open) {
      setForm({
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        iban: bankAccount.iban || "",
        ifscCode: bankAccount.ifscCode || "",
        branchName: bankAccount.branchName || "",
        accountHolderName: bankAccount.accountHolderName,
        primaryAccount: bankAccount.primaryAccount,
      });
    } else if (!open) {
      resetForm();
    }
  }, [bankAccount, open]);

  const resetForm = () => {
    setForm({
      bankName: "",
      accountNumber: "",
      iban: "",
      ifscCode: "",
      branchName: "",
      accountHolderName: "",
      primaryAccount: false,
    });
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isEdit) {
        await apiClient.put(`/bank-accounts/${bankAccount!.id}`, {
          ...form,
          companyId,
        });
        toast.success("Bank account updated");
      } else {
        await apiClient.post("/bank-accounts", {
          ...form,
          companyId,
        });
        toast.success("Bank account added");
      }
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save bank account");
    } finally {
      setLoading(false);
    }
  };

  const patch = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

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
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                {isEdit ? "Edit bank account" : "Add bank account"}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {isEdit
                  ? "Update bank account details and preferences"
                  : "Enter your company's bank account information"}
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

            {/* ── Section: Account Details ── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
                  <Landmark className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  Account details
                </span>
              </div>
              <div className="p-5 space-y-5">
                <Field
                  label="Bank name"
                  required
                  hint="Name of the bank institution"
                  icon={<Landmark className="h-[15px] w-[15px]" />}
                >
                  <Input
                    placeholder="e.g. HDFC Bank"
                    value={form.bankName}
                    onChange={(e) => patch("bankName", e.target.value)}
                    className={fieldCls()}
                  />
                </Field>

                <Field
                  label="Account number"
                  required
                  icon={<Hash className="h-[15px] w-[15px]" />}
                >
                  <Input
                    placeholder="1234567890"
                    value={form.accountNumber}
                    onChange={(e) => patch("accountNumber", e.target.value)}
                    className={cn(fieldCls(), "font-mono")}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="IBAN"
                    hint="International Bank Account Number"
                    icon={<CreditCard className="h-[15px] w-[15px]" />}
                  >
                    <Input
                      placeholder="QA57QNBA000000000000"
                      value={form.iban}
                      onChange={(e) => patch("iban", e.target.value.toUpperCase())}
                      className={cn(fieldCls(), "font-mono")}
                    />
                  </Field>

                  <Field
                    label="IFSC code"
                    hint="Indian financial system code"
                    icon={<Hash className="h-[15px] w-[15px]" />}
                  >
                    <Input
                      placeholder="HDFC0000001"
                      value={form.ifscCode}
                      onChange={(e) => patch("ifscCode", e.target.value.toUpperCase())}
                      className={cn(fieldCls(), "font-mono")}
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* ── Section: Holder & Branch ── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                  <User className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  Holder & branch
                </span>
              </div>
              <div className="p-5 space-y-5">
                <Field
                  label="Account holder name"
                  required
                  icon={<User className="h-[15px] w-[15px]" />}
                >
                  <Input
                    placeholder="Sunway ERP Pvt. Ltd."
                    value={form.accountHolderName}
                    onChange={(e) => patch("accountHolderName", e.target.value)}
                    className={fieldCls()}
                  />
                </Field>

                <Field
                  label="Branch name"
                  hint="Optional — city or branch identifier"
                  icon={<Landmark className="h-[15px] w-[15px]" />}
                >
                  <Input
                    placeholder="Main Branch, Dubai"
                    value={form.branchName}
                    onChange={(e) => patch("branchName", e.target.value)}
                    className={fieldCls()}
                  />
                </Field>
              </div>
            </div>

            {/* ── Primary account toggle ── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                    <CheckCircle2 className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-700">
                      Set as primary account
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Use this as the default account for transactions
                    </p>
                  </div>
                </div>
                <Checkbox
                  id="primaryAccount"
                  checked={form.primaryAccount}
                  onCheckedChange={(checked) =>
                    patch("primaryAccount", Boolean(checked))
                  }
                />
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
                "Add account"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
