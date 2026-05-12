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
import { COA, type ChartOfAccounts, type CreateAccountDTO } from "@/types/coa";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SelectAccount from "@/components/select-account";
import { useCompanyCurrency } from "@/hooks/use-company-currency";
import { cn } from "@/lib/utils";
import {
  Hash,
  FileText,
  X,
  Layers,
  DollarSign,
  Activity,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: ChartOfAccounts | null;
  onSuccess: (updated: ChartOfAccounts, mode: "add" | "edit") => void;
  companyId: number;
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

export function ChartOfAccountDialog({
  open,
  onOpenChange,
  account,
  onSuccess,
  companyId,
}: Props) {
  const isEdit = !!account;
  const [loading, setLoading] = useState(false);
  const { currencyCode: companyCurrencyCode } = useCompanyCurrency();

  const [form, setForm] = useState<CreateAccountDTO>({
    companyId,
    accountCode: "",
    accountName: "",
    description: "",
    type: "ASSET",
    parentId: null,
    currency: companyCurrencyCode ?? "",
    status: "active",
    glAccountClassTypeKey: "",
    glAccountType: "",
  });

  useEffect(() => {
    if (account) {
      setForm({
        companyId,
        accountCode: account.accountCode,
        accountName: account.accountName,
        description: account.description ?? "",
        type: account.type,
        parentId: Number(account.parentId),
        status: account.status,
        glAccountClassTypeKey: account.glAccountClassTypeKey ?? "",
        glAccountType: account.glAccountType ?? "",
      });
    }
  }, [account, companyId, companyCurrencyCode]);

  const update = (key: keyof CreateAccountDTO, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = account
        ? await apiClient.put(`/finance/chart-of-accounts/${account.id}`, form)
        : await apiClient.post(`/finance/chart-of-accounts`, form);
      onSuccess(res.data, account ? "edit" : "add");
      toast.success("Saved successfully");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{ maxWidth: 680, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
      >
        {/* ── Top bar ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20 bg-teal-100 text-teal-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                {account ? "Edit account" : "Add account"}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {account
                  ? "Update chart of accounts entry"
                  : "Create a new chart of accounts entry"}
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

            {/* ── Section: Core Info ── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
                  <Hash className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  Core information
                </span>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Account code"
                    required
                    icon={<Hash className="h-[15px] w-[15px]" />}
                  >
                    <Input
                      value={form.accountCode}
                      onChange={(e) => update("accountCode", e.target.value)}
                      placeholder="001.001.000001.000"
                      className={cn(fieldCls(), "font-mono")}
                    />
                  </Field>

                  <Field
                    label="Account name"
                    required
                    icon={<FileText className="h-[15px] w-[15px]" />}
                  >
                    <Input
                      value={form.accountName}
                      onChange={(e) => update("accountName", e.target.value)}
                      placeholder="Cash at Bank"
                      className={fieldCls()}
                    />
                  </Field>
                </div>

                <Field
                  label="Description"
                  icon={<FileText className="h-[15px] w-[15px]" />}
                >
                  <Input
                    value={form.description ?? ""}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Optional description for this account"
                    className={fieldCls()}
                  />
                </Field>
              </div>
            </div>

            {/* ── Section: Classification ── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                  <Layers className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  Classification
                </span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Account type
                    </label>
                    <Select
                      onValueChange={(val) => update("type", val)}
                      value={form.type}
                      defaultValue="ASSET"
                    >
                      <SelectTrigger className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                        {COA.map((r) => (
                          <SelectItem key={r.key} value={r.key}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Field
                    label="Parent account"
                    icon={<Layers className="h-[15px] w-[15px]" />}
                  >
                    <SelectAccount
                      value={form.parentId?.toString() || undefined}
                      onChange={(v) => update("parentId", v)}
                      label=""
                      placeholder="Select parent account"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* ── Section: Settings ── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
                  <Activity className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  Settings
                </span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Currency"
                    icon={<DollarSign className="h-[15px] w-[15px]" />}
                  >
                    <Input
                      value={form.currency ?? ""}
                      onChange={(e) => update("currency", e.target.value)}
                      placeholder="USD"
                      className={fieldCls()}
                    />
                  </Field>

                  <Field
                    label="Status"
                    icon={<Activity className="h-[15px] w-[15px]" />}
                  >
                    <Input
                      value={form.status}
                      onChange={(e) => update("status", e.target.value)}
                      placeholder="active"
                      className={fieldCls()}
                    />
                  </Field>

                  <Field
                    label="GL class type key"
                    icon={<Hash className="h-[15px] w-[15px]" />}
                  >
                    <Input
                      value={form.glAccountClassTypeKey ?? ""}
                      onChange={(e) => update("glAccountClassTypeKey", e.target.value)}
                      placeholder="ASSET"
                      className={fieldCls()}
                    />
                  </Field>

                  <Field
                    label="GL account type"
                    icon={<Layers className="h-[15px] w-[15px]" />}
                  >
                    <Input
                      value={form.glAccountType ?? ""}
                      onChange={(e) => update("glAccountType", e.target.value)}
                      placeholder="Current Asset"
                      className={fieldCls()}
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
                "Create account"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
