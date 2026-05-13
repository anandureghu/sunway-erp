// src/pages/admin/departments/DepartmentDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/service/apiClient";
import type { ChartOfAccounts } from "@/types/finance/chart-of-accounts";
import type { COAFormData } from "@/schema/finance/chart-of-account";
import { ChartOfAccountsForm } from "@/modules/finance/chart-of-accounts/coa-form";
import { X, Layers } from "lucide-react";

interface ChartOfAccountsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coa?: ChartOfAccounts | null;
  onSuccess: (dept: ChartOfAccounts, mode: "add" | "edit") => void;
}

export const ChartOfAccountsDialog = ({
  open,
  onOpenChange,
  coa,
  onSuccess,
}: ChartOfAccountsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const isEdit = !!coa;

  const handleSubmit = async (data: COAFormData) => {
    try {
      setLoading(true);
      const res = isEdit
        ? await apiClient.put(`/finance/chart-of-accounts/${coa!.id}`, data)
        : await apiClient.post("/finance/chart-of-accounts", data);
      toast.success(
        isEdit
          ? "Chart Of Account updated successfully"
          : "Chart Of Account added successfully",
      );
      onSuccess(res.data, isEdit ? "edit" : "add");
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to save coa", {
        description: error.response.data.message,
      });
      console.error(error);
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
                {isEdit ? "Edit Chart Of Account" : "Add Chart Of Account"}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {isEdit
                  ? "Update chart of account details below"
                  : "Enter chart of account details below"}
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

        {/* ── Body: embedded form ── */}
        <div
          className="overflow-y-auto bg-white px-6 py-5"
          style={{ maxHeight: "calc(92vh - 132px)" }}
        >
          <ChartOfAccountsForm
            onSubmit={handleSubmit}
            loading={loading}
            defaultValues={coa as COAFormData | null}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};